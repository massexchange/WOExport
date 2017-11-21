var moment = require("moment");
var util = require("./util");
var builder = require("xmlbuilder");

module.exports = class WOXML {
    constructor(data) {
        this.root = builder.create("WONetworkDeal");
        this.data = data;
    }

    getXML() {
        return this.root;
    }

    buildHeader() {
        var header = this.root.ele("Header")
            .ele("ChangeStatus", this.data.Header.ChangeStatus).up()
            .ele("Property", this.data.Header.Property).up() //Network?
            .ele("DealStatusIncomplete", this.data.Header.DealStatusIncomplete).up() //blind copy from example
            .ele("DealStatusWorking", this.data.Header.DealStatusWorking).up()           //blind copy from example
            .ele("TotalAmount", this.data.Header.TotalAmount).up()
            .ele("TotalEQUnits", this.data.Header.TotalEQUnits).up() //Equiv 30s
            .ele("TotalImps", this.data.Header.TotalImps).up();

        var headerAdvertiser = header.ele("Advertiser")
            .ele("Name", this.data.Header.Advertiser.Name).up()
            .ele("Advertiser", this.data.Header.Advertiser.Advertiser).up()
            .ele("DealType", this.data.Header.Advertiser.DealType).up()
            .ele("DealYear", this.data.Header.Advertiser.DealYear).up()
            .ele("Transaction", this.data.Header.Advertiser.Transaction).up()    //blind copy from example
            .ele("Marketplace", this.data.Header.Advertiser.Marketplace).up() //blind copy from example
            .ele("RateCard", this.data.Header.Advertiser.RateCard).up() //Example: AMC Mass Ex
            .ele("RatingStream", this.data.Header.Advertiser.RatingStream).up()     //blind copy from example

        var headerAdvertiserDemos = headerAdvertiser.ele("Demos")
            .ele("Demo")
            .ele("Name", this.data.Header.Advertiser.Demos.Demo.Name).up()             //blind copy from example (excel says "HH for now")
            .ele("Primary", this.data.Header.Advertiser.Demos.Demo.Primary).up()         //blind copy from example
            .ele("PostingExport", this.data.Header.Advertiser.Demos.Demo.PostingExport).up()   //blind copy from example
            
        headerAdvertiser.ele("Guaranteed", this.data.Header.Advertiser.Guaranteed).up()
            .ele("PriorityCode", this.data.Header.Advertiser.PriorityCode).up()
            .ele("ExternalID", this.data.Header.Advertiser.ExternalID).up() //"There is an ExternalID tag that can be used for [our matched order ID]"
            .ele("Equivalized", this.data.Header.Advertiser.Equivalized).up()

        var agency = header.ele("Agency")
            .ele("Primary", this.data.Header.Agency.Primary);

        var sales = header.ele("Sales")
            .ele("AccountExecutives")
            .ele("AccountExecutive")
            .ele("Name", this.data.Header.Sales.AccountExecutives.AccountExecutive.Name).up()  //Excel says "AE" in "AMC Master List"
            .ele("Primary", this.data.Header.Sales.AccountExecutives.AccountExecutive.Primary).up()         //blind copy from example
            .ele("Percent", this.data.Header.Sales.AccountExecutives.AccountExecutive.Percent);               //blind copy from example

        return this;
    };

    buildFlights() {
        var flights = this.root.ele("Flights")
            .ele("Flight")
            .ele("Start", this.data.Flights.Flight.Start).up()
            .ele("End", this.data.Flights.Flight.End);
            //.ele("Active", "Yes");

        return this;
    }

    buildAdvBrands() {
        /*
        var advBrands = this.root.ele("AdvertiserBrands")
            .ele("AdvertiserBrand")
            .ele("Name", this.data.campaign.advertiser).up()
            .ele("Flights")
            .ele("Flight")
            .ele("Start", this.data.campaign.flightStartDate).up()
            .ele("End", this.data.campaign.flightEndDate).up()
            .ele("Active", "Yes");
        */

        return this;
    }

    buildGuarantees() {
        var guarantees = this.root.ele("Guarantees")
            .ele("Guarantee")
            .ele("Start", this.data.Guarantees.Guarantee.Start).up()
            .ele("End", this.data.Guarantees.Guarantee.End).up()
            .ele("Imps", this.data.Guarantees.Guarantee.Imps).up()
            .ele("TotalAmount", this.data.Guarantees.Guarantee.TotalAmount).up()
            .ele("HHImps", this.data.Guarantees.Guarantee.HHImps);

        return this;
    };

    buildTargets() {
        var targets = this.root.ele("Targets");
        return this;
    };

    buildQuarters() {
        var quarters = this.root.ele("Quarters")
            .ele("Quarter")
            .ele("Start", this.data.Quarters.Quarter.Start).up()
            .ele("End", this.data.Quarters.Quarter.End).up();

        var line = quarters.ele("Line")
            .ele("SellingName", this.data.Quarters.Line.SellingName).up()
            .ele("InventoryDesc", this.data.Quarters.Line.InventoryDesc).up()
            .ele("Start", this.data.Quarters.Line.Start).up()
            .ele("End", this.data.Quarters.Line.End).up()
            .ele("RateCard", this.data.Quarters.Line.RateCard).up() //like "RateCard" in Header->Advertiser
            .ele("RatecardRate", this.data.Quarters.Line.RatecardRate).up()         //Excel says "not sure if 0"
            .ele("PriorityCode", this.data.Quarters.Line.PriorityCode).up()
            .ele("SellingElement", this.data.Quarters.Line.SellingElement).up()
            .ele("BreakCode", this.data.Quarters.Line.BreakCode).up()
            .ele("Length", this.data.Quarters.Line.Length).up()
            .ele("Rate", this.data.Quarters.Line.Rate).up()
            .ele("Weekdays", this.data.Quarters.Line.Weekdays).up()
            .ele("UnitCount", this.data.Quarters.Line.UnitCount).up();

        var lineEstimates = line.ele("Estimates")
            .ele("Estimate")
            .ele("RatingStream", this.data.Quarters.Estimates.Estimate.RatingStream).up()
            .ele("Marketbreak", this.data.Quarters.Estimates.Estimate.Marketbreak).up()
            .ele("Demo", this.data.Quarters.Estimates.Estimate.Demo).up()
            .ele("Imps", this.data.Quarters.Estimates.Estimate.Imps);
        
        var lineWeeks = line.ele("Weeks");

        this.data.Quarters.Weeks.forEach((week) => {
            lineWeeks.ele("Week")
            .ele("Start", week.Start).up()
            //.ele("AdvertiserBrand", "WORK IN PROGRESS. CAMPAIGN'S UPCOMING 'BRAND' FIELD").up()
            .ele("UnitCount", week.UnitCount).up()
            .ele("Weekdays", week.Weekdays).up()
            .ele("RestrictStart", week.RestrictStart).up()
            .ele("RestrictEnd", week.RestrictEnd);
        });

        return this;
    }
};
