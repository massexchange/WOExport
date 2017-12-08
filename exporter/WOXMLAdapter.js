var moment = require("moment");
var util = require("./util");

module.exports = class WOXMLAdapter {
    constructor(data, agencyMap) {
        //Header
        this.Header = {};
        this.Header.ChangeStatus = "New Deal";
        this.Header.Property = data.extras.networkName; //Network?
        this.Header.DealStatusIncomplete = "Planning Costs"; //blind copy from example
        this.Header.DealStatusWorking = "Working";           //blind copy from example
        this.Header.TotalAmount = parseFloat(data.extras.headerTotalAmount);
        this.Header.TotalEQUnits = parseFloat(data.extras.adSize.value / 30); //Equiv 30s
        this.Header.TotalImps = 0;

        this.Header.Advertiser = {};
        this.Header.Advertiser.Name = data.extras.dealName;
        this.Header.Advertiser.Advertiser = data.extras.advertiser;
        this.Header.Advertiser.DealType = "MassEx";
        this.Header.Advertiser.DealYear = data.extras.dealYear;
        this.Header.Advertiser.Transaction = "Cash";        //blind copy from example
        this.Header.Advertiser.Marketplace = "Scatter";     //blind copy from example
        this.Header.Advertiser.RateCard = data.extras.rateCard; //Example: AMC Mass Ex
        this.Header.Advertiser.RatingStream = "C3"          //blind copy from example

        this.Header.Advertiser.Demos = {};
        this.Header.Advertiser.Demos.Demo = {};
        this.Header.Advertiser.Demos.Demo.Name = "HH";              //blind copy from example (excel says "HH for now")
        this.Header.Advertiser.Demos.Demo.Primary = "Yes";          //blind copy from example
        this.Header.Advertiser.Demos.Demo.PostingExport = "Yes";    //blind copy from example

        this.Header.Advertiser.Guaranteed = "No";
        this.Header.Advertiser.PriorityCode = "MassEx";
        this.Header.Advertiser.ExternalID = data.match.id;     //"There is an ExternalID tag that can be used for [our matched order ID]"
        this.Header.Advertiser.Equivalized = "Yes";

        this.Header.Agency = {};
        this.Header.Agency.Primary = `${data.match.buy.mp.name} (${agencyMap[data.match.buy.mp.name]})`;

        this.Header.Sales = {};
        this.Header.Sales.AccountExecutives = {};
        this.Header.Sales.AccountExecutives.AccountExecutive = {};
        this.Header.Sales.AccountExecutives.AccountExecutive.Name = "Mass Exchange"; //Excel says "AE" in "AMC Master List"
        this.Header.Sales.AccountExecutives.AccountExecutive.Primary = "Yes";
        this.Header.Sales.AccountExecutives.AccountExecutive.Percent = 100;

        //Flights
        this.Flights = {};
        this.Flights.Flight = {};
        this.Flights.Flight.Start = data.extras.quarter.start;
        this.Flights.Flight.End = data.extras.quarter.end;

        //Guarantees
        this.Guarantees = {};
        this.Guarantees.Guarantee = {};
        this.Guarantees.Guarantee.Start = data.extras.quarter.start;
        this.Guarantees.Guarantee.End = data.extras.quarter.end;
        this.Guarantees.Guarantee.Imps = 0;
        this.Guarantees.Guarantee.TotalAmount = parseFloat(data.extras.guaranteesTotalAmount);
        this.Guarantees.Guarantee.HHImps = 0;

        //Targets
        this.Targets = {};

        //Quarters
        this.Quarters = {};
        this.Quarters.Quarter = {}; //Assuming only one quarter for now
        this.Quarters.Quarter.Start = data.extras.quarter.start;
        this.Quarters.Quarter.End = data.extras.quarter.end;

        this.Quarters.Lines = []; //Quarters can have multiple lines for each SellingName
        const line = {
            SellingName: data.extras.sellingName,
            InventoryDesc: data.extras.inventoryDesc,
            Start: data.orderGroup.flightStartDate,
            End: data.orderGroup.flightEndDate,
            RateCard: data.extras.rateCard,
            RatecardRate: 0,
            PriorityCode: "MassEx",
            SellingElement: "ME - MassEX",
            BreakCode: "National",
            Length: data.extras.adSize.value * 1000,
            Rate: data.extras.rate,
            Weekdays: data.extras.weekdays,
            UnitCount: data.match.amount
        };

        line.Estimates = {};
        line.Estimates.Estimate = {};
        line.Estimates.Estimate.RatingStream = "C3";
        line.Estimates.Estimate.Marketbreak = "General";
        line.Estimates.Estimate.Demo = "HH";
        line.Estimates.Estimate.Imps = 0;

        //Store the line's weeks, will all be merged later
        line.Weeks = [];
        const week = {
            Start: data.extras.firstMonday,
            UnitCount: data.match.amount,
            Weekdays: data.extras.weekdays,
            RestrictStart: data.extras.restrictions.start,
            RestrictEnd: data.extras.restrictions.end,
        }
        line.Weeks.push(week);

        this.Quarters.Lines.push(line);
    }

};
