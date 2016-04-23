{
    "baseUrl": "../src",
    "paths": {
    	"jquery": "../node_modules/jquery/dist/jquery",
    	"lodash": "../node_modules/lodash/lodash",
    	"handlebars": "../node_modules/handlebars/dist/handlebars"
    },
    "include": ["../node_modules/almond/almond", "coreleo"],
    "exclude": ["jquery", "lodash", "handlebars"],
    "wrap": {
        "startFile": "wrap/start.js",
        "endFile": "wrap/end.js"
    }
}
