const fs = require("fs");
const builder = require("xmlbuilder");
const request = require("request");
const moment = require("moment");
const util = require("./util");
const cmdArgs = require("command-line-args");
const JSOG = require("jsog");
const WOXML = require("./WOXML");
const AMCExcel = require("./AMCExcelProcessor");
const Networks = require("./networks");

const argDefs = [
    { name: "auth", alias: "a", type: String },
    { name: "match", alias: "m", type: Number },
    { name: "advertiserName", alias: "n", type: String }
];
const options = cmdArgs(argDefs);

if(!options.auth)
{
    console.log("Please enter an auth token");
    process.exit(1);
}
if(!options.match)
{
    console.log("Please enter a Match id to export");
    process.exit(1);   
}
if(!options.advertiserName)
    console.log("Advertiser not found. Defaulting to placeholder.");

const AUTH_TOKEN = options.auth;
const MATCH_ID = options.match;
const writer = builder.streamWriter(fs.createWriteStream(`match_${MATCH_ID}.xml`));

process.on("unhandledRejection", (reason, promise) => console.log(reason));

const getMatches = () => {
    const options = {
        url: `http://localhost/api/match/${MATCH_ID}/export`,
        headers: {
            "X-Auth-Token": AUTH_TOKEN
        }
    };
    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if(error)
                reject();
            else
                resolve(body);
        }).on("error", (err) => console.log(err));
    });
};

const processResponse = (resp) => {
    const data = JSOG.parse(resp);
    data.campaign.flightStartDate = moment(data.campaign.flightStartDate).format("MM/DD/YYYY");
    data.campaign.flightEndDate = moment(data.campaign.flightEndDate).format("MM/DD/YYYY");

    const sellShardAttrs = data.match.sell.catRec.shard.inst.attributes;
    const hiddenAttrs = data.match.sell.catRec.shard.hiddenAttrIds;
    ambiguatedSellShardAttrs = sellShardAttrs.filter((attr) => !hiddenAttrs.includes(attr.id));
    const adSize = ambiguatedSellShardAttrs.find((attr) => attr.type.name == "AdSize");
    const dayPart = ambiguatedSellShardAttrs.find((attr) => attr.type.name == "Daypart");
    const hour = ambiguatedSellShardAttrs.find((attr) => attr.type.name == "Hour");

    const extras = {};
    extras.advertiser = options.advertiserName;
    extras.adSize = adSize;
    extras.firstMonday = moment(data.match.buy.flightDate).weekday(1).format("MM/DD/YYYY");
    extras.headerTotalAmount = util.roundToTwoDecimals(data.match.amount * data.match.matchedAparPrice);
    extras.dealYear = util.getDealYear(data.match.buy.flightDate);
    extras.guaranteesTotalAmount = util.roundToTwoDecimals(data.match.matchedAparPrice);
    extras.rate = util.roundToTwoDecimals(data.match.buy.aparPrice);
    extras.weekdays = util.getWeekString(data.match.buy.flightDate);

    //Quarter
    const quarter = util.getQuarter(data.match.buy.flightDate);
    quarter.start = quarter.start.format("MM/DD/YYYY");
    quarter.end = quarter.end.format("MM/DD/YYYY");

    extras.quarter = quarter;

    //Restrictions
    //Use hour attribute. If not exist, use daypart. If not exist, use 24 hours.
    var restrictions = util.getRestrictions({hour: hour, dayPart: dayPart});
    extras.restrictions = restrictions;

    //Selling Name may need the Daypart, which may have been ambiguated away
    const inventoryAttrs = data.match.sell.catRec.inventory.instrument.attributes;
    const unambiguatedDayPart = inventoryAttrs.find((attr) => attr.type.name == "Daypart");

    //Network (Property) mapping
    const networkName = sellShardAttrs.find((attr) => attr.type.name == "Network").value;
    const network = Networks[networkName];
    extras.sellingName = network.getSellingName(unambiguatedDayPart.value);
    extras.rateCard = network.rateCard;
    extras.inventoryDesc = network.inventoryDesc;
    
    data.extras = extras;

    return data;
};

const buildXML = (data, agencyMap) => {
    const wideOrbit = new WOXML(data, agencyMap);

    wideOrbit.buildHeader()
        .buildFlights()
        .buildGuarantees()
        .buildTargets()
        .buildQuarters();

    return wideOrbit.getXML();
};

getMatches()
.then((response) => {
    const data = processResponse(response);
    const xml = buildXML(data, AMCExcel.initAgencyMap());
    //console.log(xml);
    xml.end(writer);
});
