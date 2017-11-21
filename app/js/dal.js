define(["jquery", "app/util", "jsog", "app/noty"],
function($, util, JSOG, Noty) {
    const dal = function() { return dal; };

    const root = "api";
    const host = "http://localhost";

    const call = async (url, type, data, token) => {
        const options = {
            url: `${host}/${root}/${url}`,
            type,
            data,
            contentType: "application/json",
            dataType: "text",
            dataFilter: rawData => rawData
                ? JSOG.parse(rawData)
                : null
        };

        const tokenHeader = tokenValue => ({ "X-Auth-Token": tokenValue });
        if(token)
            options.headers = tokenHeader(token);
        else if(MX.session.getCreds())
            options.headers = tokenHeader(MX.session.getCreds().token);

        const isMultipart = data instanceof FormData;

        if(!isMultipart && options.type != "GET" && data)
            options.data = JSOG.stringify(data);
        else if(options.type == "GET")
            options.traditional = true;

        if(isMultipart)
            Object.assign(options, {
                contentType: false,
                processData: false,
                dataType: "json"
            });

        try {
            const response = await new Promise((resolve, reject) =>
                $.ajax(options)
                    .then(resolve)
                    .fail(reject));

            return response;
        } catch(err) {
            const { status, responseText } = err;

            if(!util.isDefined(responseText))
                throw new Error(err);

            const response = JSON.parse(responseText);
            //only handle server errors here
            if(status < 500)
                throw new MXError({
                    errors: util.wrapIfNeeded(response.message)
                });

            Noty.error(MX.message.error.query);

            const { exception, error, message } = response;
            throw new MXError({
                errors: [`${status} ${message || `${error}: ${exception}`}`],
                show: false
            });
        }
    };

    const verbs = ["GET", "POST", "PUT", "DELETE"];
    verbs.forEach(verb => dal[verb.toLowerCase()] =
        (url, ...rest) => call(url, verb, ...rest));

    return dal;
});
