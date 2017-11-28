define.amd.dust = true;
window.nodeRequire = require;
window.require = requirejs;
delete window.exports;
delete window.module;
//console.log(process.cwd());
require.config({
    baseUrl: process.cwd(),
    paths: {
        app: "app/js",
        html: "app/html",
        css: "lib/js/require-css/css",
        jquery: "lib/js/jquery/dist/jquery",
        "dustjs-linkedin": "lib/js/dustjs-linkedin/dist/dust-full",
        "dustjs-helpers": "lib/js/dustjs-helpers/dist/dust-helpers",
        requirejs: "lib/js/requirejs/require",
        text: "lib/js/text/text",
        underscore: "lib/js/underscore/underscore",
        moment: "lib/js/moment/moment",
        "moment-timezone": "lib/js/moment-timezone/moment-timezone",
        async: "lib/js/requirejs-plugins/src/async",
        depend: "lib/js/requirejs-plugins/src/depend",
        font: "lib/js/requirejs-plugins/src/font",
        goog: "lib/js/requirejs-plugins/src/goog",
        image: "lib/js/requirejs-plugins/src/image",
        json: "lib/js/requirejs-plugins/src/json",
        mdown: "lib/js/requirejs-plugins/src/mdown",
        noext: "lib/js/requirejs-plugins/src/noext",
        propertyParser: "lib/js/requirejs-plugins/src/propertyParser",
        "Markdown.Converter": "lib/js/requirejs-plugins/lib/Markdown.Converter",
        dropzone: "lib/js/dropzone/dist/dropzone",
        jsog: "lib/js/jsog/lib/JSOG",
        "css-builder": "lib/js/require-css/css-builder",
        normalize: "lib/js/require-css/normalize",
        d3: "lib/js/d3/d3",
        c3: "lib/js/c3/c3",
        "dust-helper-intl": "lib/js/dust-helper-intl/dist/dust-intl",
        "cookies-js": "lib/js/cookies-js/dist/cookies",
        "d3-parsets": "lib/js/d3-parsets/d3.parsets",
        Intl: "lib/js/intl/Intl.min",
        "font-awesome": "lib/js/font-awesome/fonts/*",
        "c3js-chart": "lib/js/c3js-chart/c3",
        "location-bar": "lib/js/location-bar/location-bar",
        vex: "lib/js/vex/dist/js/vex.combined",
        FileSaver: "lib/js/FileSaver.js/FileSaver",
        floatThead: "lib/js/jquery.floatThead/dist/jquery.floatThead-slim",
        Rx: "lib/js/@reactivex/rxjs/dist/global/Rx.min",
        Noty: "lib/js/noty/lib/noty",
        tippy: "lib/js/tippyjs/dist/tippy.min"
    },
    shim: {
        jsog: {
            exports: "JSOG"
        },
        "dustjs-helpers": {
            deps: [
                "dustjs-linkedin"
            ]
        },
        c3: {
            deps: ["d3"]
        },
        floatThead: ["underscore"]
    },
    config: {
        moment: {
            noGlobal: true
        }
    },
    packages: [

    ]
});

require(["app/app"]);
