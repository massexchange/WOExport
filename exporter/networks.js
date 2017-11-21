const networks = {
    "AMC": {
        rateCard: "AMC Mass Ex",
        inventoryDesc: "Afternoons With AMC",
        getSellingName: (dayPart) => {
            const SELLING_NAME = {
                "Daytime": "Cool Days With AMC",
                "Early Fringe": "Afternoons With AMC",
                "Prime": "Primetime on AMC",
                "Late Night": "Late Night at the Movies",
                "Weekend": "Weekends Away On AMC"
            };

            return SELLING_NAME[dayPart];
        }
    },
    "IFC": {
        rateCard: "IFC Mass Ex",
        inventoryDesc: "IFC Prime",
        getSellingName: () => "IFC Prime"
    },
    "SUND": {
        rateCard: "SUN Mass Ex",
        inventoryDesc: "SUN Day",
        getSellingName: () => "SUN Day"
    }
};

module.exports = networks;
