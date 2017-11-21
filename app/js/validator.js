define(["jquery"], function($) {
    var validator = {};

    validator.isEmail = function(email) {
        if(email.length == 0) return false;

        var emailExp = /^[\w\-\.\+]+\@[a-zA-Z0-9\.\-]+\.[a-zA-z0-9]{2,4}$/;

        return email.match(emailExp) != null;
    };

    //Checks if a phone number is valid
    //Strips (, ), -, and spaces and converts the input to contain just numbers
    validator.isPhone = function(phone) {
        var stripped = phone.replace(/[\(\)\.\-\ ]/g, '');
        if(stripped.length == 0) return false;

        var parsed = parseInt(stripped);
        return (!isNaN(stripped) && isFinite(stripped) && stripped.toString().length == 10);
    };

    //Checks if the url is valid. 
    //Accepts http://example.com, sub.example.com, example.com, example.com/subdir etc.
    validator.isURL = function(url) {
        if(url.length == 0) return false;

        var urlExp = /^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/;
        return urlExp.test(url);
    };

    //Checks if the end date is later than the start date
    validator.isDateRange = function(start, end) {
        if(start == null || end == null) return false;

        var startDate = new Date(start);
        var endDate = new Date(end);

        return endDate > startDate;
    };

    //Checks if the start date is later than today
    validator.isValidStartDate = function(start) {
        if(start == null) return false;

        return new Date(start) >= new Date();
    };

    //Checks if a date is a valid Moment date.
    validator.isValidMomentDate = function(date) {
        return date._isAMomentObject && date.isValid();
    };

    return validator;
});
