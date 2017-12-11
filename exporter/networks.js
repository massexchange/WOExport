const AMC_SELLING_NAMES = {
    "Daytime": "Cool Days With AMC",
    "Early Fringe": "Afternoons With AMC",
    "Prime": "Primetime on AMC",
    "Late Night": "Late Night at the Movies",
    "Weekend": "Weekends Away On AMC"
};

const networks = {
    "AMC": {
        rateCard: "AMC Mass Ex",
        getInventoryDesc: (dayPart) => AMC_SELLING_NAMES[dayPart],
        getSellingName: (dayPart) => AMC_SELLING_NAMES[dayPart]
    },
    "IFC": {
        rateCard: "IFC Mass Ex",
        getInventoryDesc: () => "IFC Prime",
        getSellingName: () => "IFC Prime"
    },
    "SUND": {
        rateCard: "SUN Mass Ex",
        getInventoryDesc: () => "SUN Day",
        getSellingName: () => "SUN Day"
    }
};

module.exports = networks;
