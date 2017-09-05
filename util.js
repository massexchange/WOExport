var moment = require("moment");

exports.getSellingName = (dayPart) => {
    const SELLING_NAME = {
        "Daytime": "Cool Days With AMC",
        "Early Fringe": "Afternoons With AMC",
        "Prime": "Primetime on AMC",
        "Late Night": "Late Night at the Movies",
        "Weekend": "Weekends Away On AMC"
    };

    return SELLING_NAME[dayPart];
};

exports.getDealYear = (flightDate) => {
    const DEAL_YEAR = {
        "2017": "2017-2018",
        "2018": "2018-2019",
        "2019": "2019-2020"
    };

    return DEAL_YEAR[moment(flightDate).year()];
};

exports.getWeekString = (flightDate) => {
    //MTWThF
    var weekString = "";
    var stringPos = moment.utc(flightDate).weekday() - 1;

    const DAYS = {
        0: "M",
        1: "T",
        2: "W",
        3: "Th",
        4: "F"
    };

    for(let i = 0; i < 5; i++)
        weekString += i == stringPos ? DAYS[stringPos] : "-";

    return weekString;
};

exports.getQuarter = (flightDate) => {
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

exports.roundToTwoDecimals = (number) => parseInt(number).toFixed(2);

//in milliseconds
exports.getRestrictions = (dayPart) => {
    if(dayPart.value == "Daytime")  //Hours 6-14
    {
        return { start: 21600000, end: 50400000};
    }
    else if(dayPart.value == "Early Fringe") //Hours 14-17
    {
        return { start: 50400000, end: 61200000};
    }
    else if(dayPart.value == "Prime") //Hours 18-24
    {
        return { start: 64800000, end: 86400000};
    }
    else if(dayPart.value == "Late Night") //Hours 1-5
    {
        return { start: 3600000, end: 18000000};
    }
    else if(dayPart.value == "Weekend") //Hours 6-17 
    {
        return { start: 21600000, end: 61200000};
    }
};