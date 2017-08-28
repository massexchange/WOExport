var fs = require("fs");
var builder = require("xmlbuilder");
var request = require("request");
var moment = require("moment");
var AMCExcel = require("./AMCExcelProcessor");

var args = process.argv.slice(2);
if(args.length < 1)
{
    console.log("Please enter an auth token");
    process.exit(1);
}
const AUTH_TOKEN = args[0];
var writer = builder.streamWriter(fs.createWriteStream("test.xml"));

var getSellingName = (dayPart) => {
    const SELLING_NAME = {
        "Daytime": "Cool Days With AMC",
        "Early Fringe": "Afternoons With AMC",
        "Prime": "Primetime on AMC",
        "Late Night": "Late Night at the Movies",
        "Weekend": "Weekends Away On AMC"
    };

    return SELLING_NAME[dayPart];
};

var getDealYear = (flightDate) => {
    const DEAL_YEAR = {
        "2017": "2017-2018",
        "2018": "2018-2019",
        "2019": "2019-2020"
    };

    return DEAL_YEAR[moment(flightDate).year()];
};

var getWeekString = (flightDate) => {
    //MTWThF
    var weekString = "";
    var stringPos = moment.utc(flightDate).weekday() - 1;

    var days = {
        0: "M",
        1: "T",
        2: "W",
        3: "Th",
        4: "F"
    };

    for(let i = 0; i < 5; i++)
        weekString += i == stringPos ? days[stringPos] : "-";

    return weekString;
};

var getQuarter = (flightDate) => {
    var date = moment.utc(flightDate);
    const QUARTER_ONE_START = moment.utc("2017-01-01");
    const QUARTER_ONE_END = moment.utc("2017-03-26");
    const QUARTER_TWO_START = moment.utc("2017-03-27");
    const QUARTER_TWO_END = moment.utc("2017-06-25");
    const QUARTER_THREE_START = moment.utc("2017-06-26");
    const QUARTER_THREE_END = moment.utc("2017-09-24");
    const QUARTER_FOUR_START = moment.utc("2017-09-25");
    const QUARTER_FOUR_END = moment.utc("2017-12-31");

    if(date.isBetween(QUARTER_ONE_START, QUARTER_ONE_END) || date.isSame(QUARTER_ONE_START || date.isSame(QUARTER_ONE_END)))
        return {start: QUARTER_ONE_START, end: QUARTER_ONE_END};
    else if(date.isBetween(QUARTER_TWO_START, QUARTER_TWO_END) || date.isSame(QUARTER_TWO_START || date.isSame(QUARTER_TWO_END)))
        return {start: QUARTER_TWO_START, end: QUARTER_TWO_END};
    else if(date.isBetween(QUARTER_THREE_START, QUARTER_THREE_END) || date.isSame(QUARTER_THREE_START || date.isSame(QUARTER_THREE_END)))
        return {start: QUARTER_THREE_START, end: QUARTER_THREE_END};
    else if(date.isBetween(QUARTER_FOUR_START, QUARTER_FOUR_END) || date.isSame(QUARTER_FOUR_START || date.isSame(QUARTER_FOUR_END)))
        return {start: QUARTER_FOUR_START, end: QUARTER_FOUR_END};
};

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
    return new Promise((resolve, reject) => {
        var data = JSON.parse(resp);
        data.campaign.flightStartDate = moment(data.campaign.flightStartDate).format("MM/DD/YYYY");
        data.campaign.flightEndDate = moment(data.campaign.flightEndDate).format("MM/DD/YYYY");

        var extras = {}
        extras.adSize = data.match.buy.selectedAttrs.attributes.find((attr) => attr.type.name == "AdSize");
        extras.dayPart = data.match.buy.selectedAttrs.attributes.find((attr) => attr.type.name == "Daypart");
        extras.firstMonday = moment(data.match.buy.flightDate).weekday(1).format("MM/DD/YYYY");

        var quarter = getQuarter(data.match.buy.flightDate);
        quarter.start = quarter.start.format("MM/DD/YYYY");
        quarter.end = quarter.end.format("MM/DD/YYYY");

        extras.quarter = quarter;
        
        data.extras = extras;

        resolve(data);
    });
};

var buildXML = (data, agencyMap) => {
    var root = builder.create("WONetworkDeal");

    var header = root.ele("Header")
        .ele("ChangeStatus", "Matched").up()
        .ele("Property", "AMC").up() //Network?
        .ele("DealStatusIncomplete", "Planning Costs").up()
        .ele("DealStatusWorking", "Working").up()
        .ele("TotalAmount", data.match.amount * data.match.matchedAparPrice).up()
        .ele("TotalEQUnits", data.extras.adSize.value / 30).up() //Equiv 30s
        .ele("Advertiser")
        .ele("Name", data.campaign.advertiser).up()
        .ele("DealType", "MassEx").up()
        .ele("DealYear", getDealYear(data.match.buy.flightDate)).up()
        .ele("RateCard", "AMC Mass Ex").up()
        .ele("PriorityCode", "MassEx").up()
        .ele("ExternalID", data.match.id).up() //"There is an ExternalID tag that can be used for [our matched order ID]"
        .ele("PriorityCode", "MassEx").up()
        .ele("Equivalized", "Yes").up()
        .ele("Agency")
        .ele("Primary", `${data.match.buy.mp.name} (${agencyMap[data.match.buy.mp.name]})`);

    var flights = root.ele("Flights")
        .ele("Flight")
        .ele("Start", data.campaign.flightStartDate).up()
        .ele("End", data.campaign.flightEndDate).up()
        .ele("Active", "Yes");

    var advBrands = root.ele("AdvertiserBrands")
        .ele("AdvertiserBrand")
        .ele("Name", data.campaign.advertiser).up()
        .ele("Flights")
        .ele("Flight")
        .ele("Start", data.campaign.flightStartDate).up()
        .ele("End", data.campaign.flightEndDate).up()
        .ele("Active", "Yes");
/*
    var guarantees = root.ele("Guarantees")
        .ele("Guarantee")
        .ele("Start", data.campaign.flightStartDate).up()
        .ele("End", data.campaign.flightEndDate).up()
        .ele("Imps", "0").up()
        .ele("TotalAmount", data.match.matchedAparPrice).up()
        .ele("HHImps", "0");
*/
    var targets = root.ele("Targets");

    var quarters = root.ele("Quarters")
        .ele("Quarter")
        .ele("Start", data.extras.quarter.start).up()
        .ele("End", data.extras.quarter.end).up()
        .ele("Line")
        .ele("SellingName", getSellingName(data.extras.dayPart.value)).up()
        .ele("InventoryDesc", getSellingName(data.extras.dayPart.value)).up()
        .ele("Start", data.campaign.flightStartDate).up()
        .ele("End", data.campaign.flightEndDate).up()
        .ele("PriorityCode", "MassEx").up()
        .ele("SellingElement", "ME - MassEX").up()
        .ele("BreakCode", "National").up()
        .ele("Length", data.extras.adSize.value * 1000).up()
        .ele("Rate", data.match.buy.aparPrice).up()
        .ele("Weekdays", getWeekString(data.match.buy.flightDate)).up()
        .ele("UnitCount", data.match.amount).up()
        .ele("Estimates").up()
        .ele("Weeks")
        .ele("Week")
        .ele("Start", data.extras.firstMonday).up()
        //.ele("AdvertiserBrand", "WORK IN PROGRESS. CAMPAIGN'S UPCOMING 'BRAND' FIELD").up()
        .ele("UnitCount", data.match.amount);

    return root; //root.end({ pretty: true});
};

getMatches()
.then(processResponse)
.then((res) => {
    var xml = buildXML(res, AMCExcel.initAgencyMap());
    //console.log(xml);
    xml.end(writer);
});