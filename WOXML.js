var moment = require("moment");
var util = require("./util");
var builder = require("xmlbuilder");

module.exports = class WOXML {
    constructor(data, agencyMap) {
        this.root = builder.create("WONetworkDeal");
        this.data = data;
        this.agencyMap = agencyMap;
    }

    getXML() {
        return this.root;
    }

    buildHeader() {
        var header = this.root.ele("Header")
            .ele("ChangeStatus", "New Deal").up()
            .ele("Property", "AMC").up() //Network?
            .ele("DealStatusIncomplete", "Planning Costs").up() //blind copy from example
            .ele("DealStatusWorking", "Working").up()           //blind copy from example
            .ele("TotalAmount", this.data.extras.headerTotalAmount).up()
            .ele("TotalEQUnits", this.data.extras.adSize.value / 30).up() //Equiv 30s
            .ele("TotalImps", 0).up();

        var headerAdvertiser = header.ele("Advertiser")
            .ele("Name", this.data.campaign.name).up()
            .ele("Advertiser", "!PLACEHOLDER!").up()
            .ele("DealType", "MassEx").up()
            .ele("DealYear", this.data.extras.dealYear).up()
            .ele("Transaction", "Cash").up()    //blind copy from example
            .ele("Marketplace", "Scatter").up() //blind copy from example
            .ele("RateCard", "AMC Mass Ex").up()
            .ele("RatingStream", "C3").up()     //blind copy from example

        var headerAdvertiserDemos = headerAdvertiser.ele("Demos")
            .ele("Demo")
            .ele("Name", "HH").up()             //blind copy from example (excel says "HH for now")
            .ele("Primary", "Yes").up()         //blind copy from example
            .ele("PostingExport", "Yes").up()   //blind copy from example
            
        headerAdvertiser.ele("Guaranteed", "No").up()
            .ele("PriorityCode", "MassEx").up()
            .ele("ExternalID", this.data.match.id).up() //"There is an ExternalID tag that can be used for [our matched order ID]"
            .ele("PriorityCode", "MassEx").up()
            .ele("Equivalized", "Yes").up()

        var agency = header.ele("Agency")
            .ele("Primary", `${this.data.match.buy.mp.name} (${this.agencyMap[this.data.match.buy.mp.name]})`);

        var sales = header.ele("Sales")
            .ele("AccountExecutives")
            .ele("AccountExecutive")
            .ele("Name", "Mass Exchange").up()  //Excel says "AE" in "AMC Master List"
            .ele("Primary", "Yes").up()         //blind copy from example
            .ele("Percent", 100);               //blind copy from example

        return this;
    };

    buildFlights() {
        var flights = this.root.ele("Flights")
            .ele("Flight")
            .ele("Start", this.data.extras.quarter.start).up()
            .ele("End", this.data.extras.quarter.end);
            //.ele("Active", "Yes");

        return this;
    }

    buildAdvBrands() {
        /*
        var advBrands = this.root.ele("AdvertiserBrands")
            .ele("AdvertiserBrand")
            .ele("Name", data.campaign.advertiser).up()
            .ele("Flights")
            .ele("Flight")
            .ele("Start", data.campaign.flightStartDate).up()
            .ele("End", data.campaign.flightEndDate).up()
            .ele("Active", "Yes");
        */

        return this;
    }

    buildGuarantees() {
        var guarantees = this.root.ele("Guarantees")
            .ele("Guarantee")
            .ele("Start", this.data.extras.quarter.start).up()
            .ele("End", this.data.extras.quarter.end).up()
            .ele("Imps", "0").up()
            .ele("TotalAmount", this.data.extras.guaranteesTotalAmount).up()
            .ele("HHImps", "0");

        return this;
    };

    buildTargets() {
        var targets = this.root.ele("Targets");
        return this;
    };

    buildQuarters() {
        var quarters = this.root.ele("Quarters")
            .ele("Quarter")
            .ele("Start", this.data.extras.quarter.start).up()
            .ele("End", this.data.extras.quarter.end).up();

        var line = quarters.ele("Line")
            .ele("SellingName", this.data.extras.sellingName).up()
            .ele("InventoryDesc", this.data.extras.sellingName).up()
            .ele("Start", this.data.campaign.flightStartDate).up()
            .ele("End", this.data.campaign.flightEndDate).up()
            .ele("RateCard", "AMC Mass Ex").up() //Assuming "Ratecard" tab of AMC Master List
            .ele("RatecardRate", 0).up()         //Excel says "not sure if 0"
            .ele("PriorityCode", "MassEx").up()
            .ele("SellingElement", "ME - MassEX").up()
            .ele("BreakCode", "National").up()
            .ele("Length", this.data.extras.adSize.value * 1000).up()
            .ele("Rate", this.data.extras.rate).up()
            .ele("Weekdays", this.data.extras.weekdays).up()
            .ele("UnitCount", this.data.match.amount).up();

        var lineEstimates = line.ele("Estimates")
            .ele("Estimate")
            .ele("RatingStream", "C3").up()
            .ele("Marketbreak", "General").up()
            .ele("Demo", "HH").up()
            .ele("Imps", 0);
        
        var lineWeeks = line.ele("Weeks")
            .ele("Week")
            .ele("Start", this.data.extras.firstMonday).up()
            //.ele("AdvertiserBrand", "WORK IN PROGRESS. CAMPAIGN'S UPCOMING 'BRAND' FIELD").up()
            .ele("UnitCount", this.data.match.amount).up()
            .ele("Weekdays", this.data.extras.weekdays).up()
            .ele("RestrictStart", this.data.extras.restrictions.start).up()
            .ele("RestrictEnd", this.data.extras.restrictions.end);

        return this;
    }
};
