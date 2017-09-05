var fs = require("fs");
var builder = require("xmlbuilder");
var request = require("request");
var BigNumber = require("bignumber.js");
var moment = require("moment");
var util = require("./util");
var WOXML = require("./WOXML");
var AMCExcel = require("./AMCExcelProcessor");

var args = process.argv.slice(2);
if(args.length < 1)
{
    console.log("Please enter an auth token");
    process.exit(1);
}
const AUTH_TOKEN = args[0];
var writer = builder.streamWriter(fs.createWriteStream("match14_test_export.xml"));

var getMatches = () => {
    var options = {
        url: "http://localhost/api/match/export/14",
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

    var extras = {}
    extras.adSize = data.match.buy.selectedAttrs.attributes.find((attr) => attr.type.name == "AdSize");
    extras.dayPart = data.match.buy.selectedAttrs.attributes.find((attr) => attr.type.name == "Daypart");
    extras.firstMonday = moment(data.match.buy.flightDate).weekday(1).format("MM/DD/YYYY");

    var quarter = util.getQuarter(data.match.buy.flightDate);
    quarter.start = quarter.start.format("MM/DD/YYYY");
    quarter.end = quarter.end.format("MM/DD/YYYY");

    //For now just use daypart
    var dayPart = data.match.buy.selectedAttrs.attributes.find((attr) => attr.type.name == "Daypart");
    var restrictions = util.getRestrictions(dayPart);

    extras.quarter = quarter;
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
