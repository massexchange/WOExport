const fs = require("fs");
const builder = require("xmlbuilder");
const request = require("request");
const moment = require("moment-timezone");
const util = require("./util");
const cmdArgs = require("command-line-args");
const JSOG = require("jsog");
const WOXMLAdapter = require("./WOXMLAdapter");
const WOXML = require("./WOXML");
const AMCExcel = require("./AMCExcelProcessor");
const Networks = require("./networks");

const LOCALHOST = "http://localhost";
moment.tz.setDefault("UTC");

process.on("unhandledRejection", (reason, promise) => console.log(reason));

const getMatch = (id, host, authToken) => {
    const appHost = host ? host : LOCALHOST;
    const options = {
        url: `${appHost}/api/match/${id}/export`,
        headers: {
            "X-Auth-Token": authToken
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

const getMatches = (ids, host, authToken) => {
    const matchPs = ids.map((id) => getMatch(id, host, authToken));

    return Promise.all(matchPs);
};

//Aka groupByNetworkName
const groupByProperty = (processedData) => {
    const groupedData = {};

    processedData.forEach((data) => {
        const networkName = data.extras.networkName;
        if(!groupedData[networkName])
        {
            groupedData[networkName] = [];
            groupedData[networkName].push(data);
        }
        else
            groupedData[networkName].push(data);
    });

    return groupedData;
};

const processResponse = (resp, dealName, advertiserName) => {
    const data = JSOG.parse(resp);
    data.orderGroup.flightStartDate = moment(data.orderGroup.flightStartDate).format("MM/DD/YYYY");
    data.orderGroup.flightEndDate = moment(data.orderGroup.flightEndDate).format("MM/DD/YYYY");

    const sellShardAttrs = data.match.sell.catRec.shard.inst.attributes;
    const hiddenAttrs = data.match.sell.catRec.shard.hiddenAttrIds;
    ambiguatedSellShardAttrs = sellShardAttrs.filter((attr) => !hiddenAttrs.includes(attr.id));
    const adSize = ambiguatedSellShardAttrs.find((attr) => attr.type.name == "AdSize");
    const dayPart = ambiguatedSellShardAttrs.find((attr) => attr.type.name == "Daypart");
    const hour = ambiguatedSellShardAttrs.find((attr) => attr.type.name == "Hour");

    const extras = {};
    extras.dealName = dealName ? dealName : data.campaign.name;
    extras.advertiser = advertiserName ? advertiserName : "!PLACEHOLDER!";
    extras.adSize = adSize;
    extras.firstMonday = moment(data.match.buy.flightDate).weekday(1).format("MM/DD/YYYY");
    extras.headerTotalAmount = util.roundToTwoDecimals(data.match.amount * data.match.matchedAparPrice);
    extras.dealYear = util.getDealYear(data.match.buy.flightDate);
    extras.guaranteesTotalAmount = util.roundToTwoDecimals(data.match.matchedAparPrice);
    extras.rate = util.roundToTwoDecimals(data.match.buy.aparPrice);
    extras.weekdays = util.getWeekString(data.match.buy.flightDate);

    //Quarter
    const quarter = util.getNielsenQuarter(data.match.buy.flightDate);
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
    extras.networkName = networkName == "SUND" ? "SUN" : networkName; //temporary hardcode because name weirdness
    extras.sellingName = network.getSellingName(unambiguatedDayPart.value);
    extras.rateCard = network.rateCard;
    extras.inventoryDesc = network.getInventoryDesc(unambiguatedDayPart.value);

    data.extras = extras;

    return data;
};

const combineGroups = (group, agencyMap) => {
    const matchData = group.map((match) => new WOXMLAdapter(match, agencyMap));
    const base = matchData[0];
    const baseLineElement = base.Quarters.Lines[0];
    const groupedLines = {};
    groupedLines[baseLineElement.SellingName] = [baseLineElement];

    //Combine groups
    for(let i = 1; i < matchData.length; i++)
    {
        let xmlData = matchData[i];
        base.Header.TotalAmount += xmlData.Header.TotalAmount;
        base.Header.TotalEQUnits += xmlData.Header.TotalEQUnits;

        base.Guarantees.Guarantee.TotalAmount += xmlData.Guarantees.Guarantee.TotalAmount

        base.Header.Advertiser.ExternalID += `,${xmlData.Header.Advertiser.ExternalID}`;
        
        //Group lines while combining groups
        const lineElement = xmlData.Quarters.Lines[0];
        const lineSellingName = lineElement.SellingName;
        if(groupedLines[lineSellingName] != null)
            groupedLines[lineSellingName].push(lineElement);
        else
            groupedLines[lineSellingName] = [lineElement];
    }

    base.Header.TotalAmount = base.Header.TotalAmount.toFixed(2);
    base.Guarantees.Guarantee.TotalAmount = base.Guarantees.Guarantee.TotalAmount.toFixed(2);

    base.Quarters.Lines = []; //clear this out, base's line stored in groupedLines

    //Combine the grouped Line elements
    for(var sellingName in groupedLines)
    {
        const lines = groupedLines[sellingName];
        const combinedLine = lines.reduce((result, line) => {
            result.UnitCount += line.UnitCount;
            result.Weekdays = util.addWeekday(result.Weekdays, line.Weekdays);
            result.Weeks = result.Weeks.concat(line.Weeks);

            return result;
        });

        base.Quarters.Lines.push(combinedLine);
    }

    return base;
};

exports.exportMatches = (matchIds, options) => {
    const { host, auth, dealName, advertiserName, advertiserBrand } = options;
    getMatches(matchIds, host, auth)
    .then((matches) => {
        const agencyMap = AMCExcel.initAgencyMap();
        const processedMatches = matches.map((match) => processResponse(match, dealName, advertiserName));
        const groupedMatches = groupByProperty(processedMatches);

        const combinedGroups = Object.keys(groupedMatches).map((key) => combineGroups(groupedMatches[key], agencyMap));

        const writeXml = (group, stream) => {
            const writer = builder.streamWriter(stream);
            const wideOrbit = new WOXML(group, agencyMap);

            wideOrbit.buildHeader()
                .buildFlights()
                .buildGuarantees()
                .buildTargets()
                .buildAdvertiserBrand(advertiserBrand)
                .buildQuarters();

            const xml = wideOrbit.getXML();
            xml.end(writer);
        };

        combinedGroups.forEach((group) => {
            var writeStream = fs.createWriteStream(`exports/${group.Header.Property}_matches.xml`);
            writeStream.on("error", () => {
                writeStream = fs.createWriteStream(`../exports/${group.Header.Property}_matches.xml`);
                writeXml(group, writeStream);
            });
            
            writeXml(group, writeStream);
        });
    });  
}

//For terminal usage
const args = process.argv.slice(2);
if(args.length > 1) {
    const argDefs = [
        { name: "host", alias: "h", type: String },
        { name: "auth", alias: "a", type: String },
        { name: "match", alias: "m", type: String },
        { name: "dealName", alias: "d", type: String },
        { name: "advertiserName", alias: "n", type: String },
        { name: "advertiserBrand", alias: "b", type: String}
    ];
    const options = cmdArgs(argDefs);

    if(!options.auth)
    {
        console.log("Please enter an auth token");
        process.exit(1);
    }
    if(!options.match)
    {
        console.log("Please enter Match id(s) to export");
        process.exit(1);   
    }
    if(!options.host)
    {
        console.log("Host not found. Defaulting to localhost.");
        options.host = LOCALHOST;
    }
    if(!options.dealName)
        console.log("Deal name not found. Defaulting to Campaign name.");
    if(!options.advertiserName)
        console.log("Advertiser not found. Defaulting to placeholder.");

    if(!options.advertiserBrand)
        console.log("Advertiser Brand missing. Skipping in XML.");

    const MATCH_IDS = options.match.split(",");

    exports.exportMatches(MATCH_IDS, options);
};
