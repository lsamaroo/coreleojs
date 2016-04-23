(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD.
        define(['jquery', 'lodash', 'handlebars'], factory);
    } 
 	else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('jquery'), require('lodash'), require('handlebars'));
    }    
    else {
        // Browser globals
        root.coreleo = factory(root.$, root._, root.Handlebars);
    }
}(this, function ($, _, Handlebars) {
