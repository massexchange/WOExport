var fs = require("fs");
var builder = require("xmlbuilder");
var request = require("request");
var BigNumber = require("bignumber.js");
var moment = require("moment");
var util = require("./util");
var cmdArgs = require("command-line-args");
var WOXML = require("./WOXML");
var AMCExcel = require("./AMCExcelProcessor");

const argDefs = [
    { name: "auth", alias: "a", type: String },
    { name: "match", alias: "m", type: Number }
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
const AUTH_TOKEN = options.auth;
const MATCH_ID = options.match;
var writer = builder.streamWriter(fs.createWriteStream(`match_${MATCH_ID}.xml`));

process.on("unhandledRejection", (reason, promise) => console.log(reason));

var getMatches = () => {
    var options = {
        url: `http://localhost/api/match/export/${MATCH_ID}`,
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

var processResponse = (resp) => {
    var data = JSON.parse(resp);
    data.campaign.flightStartDate = moment(data.campaign.flightStartDate).format("MM/DD/YYYY");
    data.campaign.flightEndDate = moment(data.campaign.flightEndDate).format("MM/DD/YYYY");

    var extras = {};
    extras.adSize = data.match.buy.selectedAttrs.attributes.find((attr) => attr.type.name == "AdSize");
    extras.dayPart = data.match.buy.selectedAttrs.attributes.find((attr) => attr.type.name == "Daypart");
    extras.firstMonday = moment(data.match.buy.flightDate).weekday(1).format("MM/DD/YYYY");
    extras.headerTotalAmount = util.roundToTwoDecimals(data.match.amount * data.match.matchedAparPrice);
    extras.dealYear = util.getDealYear(data.match.buy.flightDate);
    extras.guaranteesTotalAmount = util.roundToTwoDecimals(data.match.matchedAparPrice);
    extras.sellingName = util.getSellingName(data.extras.dayPart.value);
    extras.rate = util.roundToTwoDecimals(data.match.buy.aparPrice);
    extras.weekdays = util.getWeekString(data.match.buy.flightDate);

    //Quarter
    var quarter = util.getQuarter(data.match.buy.flightDate);
    quarter.start = quarter.start.format("MM/DD/YYYY");
    quarter.end = quarter.end.format("MM/DD/YYYY");

    extras.quarter = quarter;

    //Restrictions
    //For now just use daypart
    var dayPart = data.match.buy.selectedAttrs.attributes.find((attr) => attr.type.name == "Daypart");
    var restrictions = util.getRestrictions(dayPart);
    extras.restrictions = restrictions;
    
    data.extras = extras;

    return data;
};

var buildXML = (data, agencyMap) => {
    var wideOrbit = new WOXML(data, agencyMap);

    wideOrbit.buildHeader()
        .buildFlights()
        .buildGuarantees()
        .buildTargets()
        .buildQuarters();

    return wideOrbit.getXML();
};

getMatches()
.then((response) => {
    var data = processResponse(response);
    var xml = buildXML(data, AMCExcel.initAgencyMap());
    //console.log(xml);
    xml.end(writer);
});
