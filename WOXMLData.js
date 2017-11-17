var moment = require("moment");
var util = require("./util");

module.exports = class WOXMLData {
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
        this.Header.Advertiser.Name = "CHANGE THIS";
        this.Header.Advertiser.Advertiser = data.extras.advertiser ? data.extras.advertiser : "!PLACEHOLDER!";
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
        this.Quarters.Quarter = {};
        this.Quarters.Quarter.Start = data.extras.quarter.start;
        this.Quarters.Quarter.End = data.extras.quarter.end;

        this.Quarters.Line = {};
        this.Quarters.Line.SellingName = data.extras.sellingName;
        this.Quarters.Line.InventoryDesc = data.extras.inventoryDesc;
        this.Quarters.Line.Start = data.campaign.flightStartDate;
        this.Quarters.Line.End = data.campaign.flightEndDate;
        this.Quarters.Line.RateCard = data.extras.rateCard;    //Like "RateCard" in Header->Advertiser
        this.Quarters.Line.RatecardRate = 0;    //Excel says "not sure if 0"
        this.Quarters.Line.PriorityCode = "MassEx";
        this.Quarters.Line.SellingElement = "ME - MassEx";
        this.Quarters.Line.BreakCode = "National";
        this.Quarters.Line.Length = data.extras.adSize.value * 1000;
        this.Quarters.Line.Rate = data.extras.rate;
        this.Quarters.Line.Weekdays = data.extras.weekdays;
        this.Quarters.Line.UnitCount = data.match.amount;

        this.Quarters.Estimates = {};
        this.Quarters.Estimates.Estimate = {};
        this.Quarters.Estimates.Estimate.RatingStream = "C3";
        this.Quarters.Estimates.Estimate.Marketbreak = "General";
        this.Quarters.Estimates.Estimate.Demo = "HH";
        this.Quarters.Estimates.Estimate.Imps = 0;

        this.Quarters.Weeks = [];
        const week = {
            Start: data.extras.firstMonday,
            UnitCount: data.match.amount,
            Weekdays: data.extras.weekdays,
            RestrictStart: data.extras.restrictions.start,
            RestrictEnd: data.extras.restrictions.end,
        }
        this.Quarters.Weeks.push(week);
    }

    addWeekday(rhs) {
        //Remove "h" from Th to make life simpler
        const lhs = this.Quarters.Line.Weekdays.replace("h", "");
        rhs = rhs.replace("h", "");
        var result = "";

        for(let i = 0; i < 5; i++)
        {
            if(i != 3) //Th takes up 2 indices
                result += lhs[i] == "-" ? rhs[i] : lhs[i];
            else if(i == 3 && (lhs[i] == "T" || rhs[i] == "T"))
                result += "Th";
        }
        
        this.Quarters.Line.Weekdays = result;
    };

};
