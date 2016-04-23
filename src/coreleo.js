/*global define */

/**
 * The main module (sometimes called main.js) which defines the public 
 * interface for the coreleo library
 */
define(function(require) {
    'use strict';

    var ui = require('ui');
    ui.dialog = require('ui/dialog');
    ui.form = require('ui/form');
    ui.tabs = require('ui/tabs');
    ui.select = require('ui/select');
    ui.text = require('ui/text');
    ui.table = require('ui/table');

    //Return the module value.
    var coreleo = {
        version: '0.0.1',
        $: require('$'),
        constants: require('constants'),
        log: require('log'),
        poller: require('poller'),
        template: require('template'),
        ui: ui,
        util: require('util')
    };

    return coreleo;
});
