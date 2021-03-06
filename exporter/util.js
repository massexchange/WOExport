var moment = require("moment");

exports.getDealYear = (flightDate) => {
    var date = moment(flightDate);
    var dateYear = date.year();
    var nextYear = date.add(1, "year").year();

    return `${dateYear}-${nextYear}`;
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
    /*  2017 Example
        const QUARTER_ONE_START = moment.utc("2017-01-01");
        const QUARTER_ONE_END = moment.utc("2017-03-26");
        const QUARTER_TWO_START = moment.utc("2017-03-27");
        const QUARTER_TWO_END = moment.utc("2017-06-25");
        const QUARTER_THREE_START = moment.utc("2017-06-26");
        const QUARTER_THREE_END = moment.utc("2017-09-24");
        const QUARTER_FOUR_START = moment.utc("2017-09-25");
        const QUARTER_FOUR_END = moment.utc("2017-12-31");
    */

    var date = moment.utc(flightDate);
    const QUARTER_ONE_START = date.clone().startOf("year");
    const QUARTER_ONE_END = QUARTER_ONE_START.clone().add(2, "months").endOf("month").startOf("isoweek").subtract(1, "days"); //Last Sunday of the month

    const QUARTER_TWO_START = QUARTER_ONE_END.clone().add(1, "days"); //Last monday of the 3rd month
    const QUARTER_TWO_END = QUARTER_TWO_START.clone().add(3, "months").endOf("month").startOf("isoweek").subtract(1, "days");

    const QUARTER_THREE_START = QUARTER_TWO_END.clone().add(1, "days");
    const QUARTER_THREE_END = QUARTER_THREE_START.clone().add(3, "months").endOf("month").startOf("isoweek").subtract(1, "days");

    const QUARTER_FOUR_START = QUARTER_THREE_END.clone().add(1, "days");
    const QUARTER_FOUR_END = QUARTER_FOUR_START.clone().endOf("year");

    if(date.isBetween(QUARTER_ONE_START, QUARTER_ONE_END) || date.isSame(QUARTER_ONE_START) || date.isSame(QUARTER_ONE_END))
        return {start: QUARTER_ONE_START, end: QUARTER_ONE_END};
    else if(date.isBetween(QUARTER_TWO_START, QUARTER_TWO_END) || date.isSame(QUARTER_TWO_START) || date.isSame(QUARTER_TWO_END))
        return {start: QUARTER_TWO_START, end: QUARTER_TWO_END};
    else if(date.isBetween(QUARTER_THREE_START, QUARTER_THREE_END) || date.isSame(QUARTER_THREE_START) || date.isSame(QUARTER_THREE_END))
        return {start: QUARTER_THREE_START, end: QUARTER_THREE_END};
    else if(date.isBetween(QUARTER_FOUR_START, QUARTER_FOUR_END) || date.isSame(QUARTER_FOUR_START) || date.isSame(QUARTER_FOUR_END))
        return {start: QUARTER_FOUR_START, end: QUARTER_FOUR_END};
};

exports.getNielsenQuarter = (flightDate) => {
    const QUARTER_ONE_START = moment.utc("2018-01-01");
    const QUARTER_ONE_END = moment.utc("2018-04-01");
    const QUARTER_TWO_START = moment.utc("2018-04-02");
    const QUARTER_TWO_END = moment.utc("2018-07-01");
    const QUARTER_THREE_START = moment.utc("2018-07-02");
    const QUARTER_THREE_END = moment.utc("2018-10-01");
    const QUARTER_FOUR_START = moment.utc("2018-10-02");
    const QUARTER_FOUR_END = moment.utc("2018-12-31");

    const date = moment.utc(flightDate);

    if(date.isBetween(QUARTER_ONE_START, QUARTER_ONE_END) || date.isSame(QUARTER_ONE_START) || date.isSame(QUARTER_ONE_END))
        return {start: QUARTER_ONE_START, end: QUARTER_ONE_END};
    else if(date.isBetween(QUARTER_TWO_START, QUARTER_TWO_END) || date.isSame(QUARTER_TWO_START) || date.isSame(QUARTER_TWO_END))
        return {start: QUARTER_TWO_START, end: QUARTER_TWO_END};
    else if(date.isBetween(QUARTER_THREE_START, QUARTER_THREE_END) || date.isSame(QUARTER_THREE_START) || date.isSame(QUARTER_THREE_END))
        return {start: QUARTER_THREE_START, end: QUARTER_THREE_END};
    else if(date.isBetween(QUARTER_FOUR_START, QUARTER_FOUR_END) || date.isSame(QUARTER_FOUR_START) || date.isSame(QUARTER_FOUR_END))
        return {start: QUARTER_FOUR_START, end: QUARTER_FOUR_END};
};


exports.roundToTwoDecimals = (number) => parseInt(number).toFixed(2);

//in milliseconds
exports.getRestrictions = (restrictions) => {
    var getDaypartRestrictions = (dayPart) => {
        if(dayPart.value == "Daytime")  //6 AM - 2 PM
            return { start: 21600000, end: 50400000};
        else if(dayPart.value == "Early Fringe") //2 PM - 6 PM
            return { start: 50400000, end: 64800000};
        else if(dayPart.value == "Prime") //6 PM - 1 AM
            return { start: 64800000, end: 90000000};
        else if(dayPart.value == "Late Night") //1 AM - 6 AM
            return { start: 3600000, end: 21600000};
        else if(dayPart.value == "Weekend") //6 AM - 6 PM
            return { start: 21600000, end: 64800000};
    };
    
    const MILLIS_IN_HOUR = 3600000;
    var getHourRestrictions = (hour) => {
        var start = hour.value * MILLIS_IN_HOUR;
        var end = start + MILLIS_IN_HOUR;

        return { start: start, end: end };
    };

    if(restrictions.hour)
        return getHourRestrictions(restrictions.hour);
    else if(restrictions.dayPart)
        return getDaypartRestrictions(restrictions.dayPart);
    else
        return { start: 0, end: 24 * MILLIS_IN_HOUR };
};

exports.addWeekday = (lhs, rhs) => {
    //Remove "h" from Th to make life simpler
    var lhs = lhs.replace("h", "");
    rhs = rhs.replace("h", "");
    var result = "";

    for(let i = 0; i < 5; i++)
    {
        if(i != 3) //Th takes up 2 indices
            result += lhs[i] == "-" ? rhs[i] : lhs[i];
        else if(i == 3 && (lhs[i] == "T" || rhs[i] == "T"))
            result += "Th";
        else
            result += "-";
    }
    
    return result;
};
