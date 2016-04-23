/** 
 * Utilities for handling JQuery UI and mobile tables.
 * @module table 
 */
define(function(require) {
    'use strict';

    var $ = require('$');
    var util = require('util');
    var mobile = require('ui/mobile');
    var ui = require('ui');

    return {

        /**
         * 
         * Initializes a table.  This call creates a JQuery table in mobile environment.
         * In non mobile browsers it does nothing and can be used without any side effects.
         * 
         * @param {String} id the id of the table
         * 
         */
        init: function(id) {
            mobile.initTable(id);
        },

        /**
         * 
         * Refreshes the table.  This call is only needed for
         * refreshing a JQuery table in mobile environment.
         * In non mobile browsers it does nothing and can be used without any side effects.
         * 
         * @param {String} id the id of the table
         * 
         */
        refresh: function(id) {
            mobile.refreshTable(id);
        },


        /**
         * Adds the table sorter feature to the table.  Requires the table sorter plug-in.
         * @param {String} id of the table
         * @param {Object} [options] an options object to pass to the table sorter plug-in
         * @param {Array} [widgets] a list of widget names to pass in.  By default the 'group' and 'filter' widget is always included
         * @param {Object} [widgetOptions] options for the widgets
         * @param {Function} [groupFormatter] a function to tell the table sorter how to display the group header title
         * @param {Function} [groupCallback] a function 
         *  
         */
        /*eslint max-params: 0 */
        initTableSorter: function(id, options, widgets, widgetOptions, groupFormatter, groupCallback) {
            if (!$.tablesorter || ui.isMobile()) {
                return;
            }

            // wrap the passed in group formatter
            var groupFormatterWrapper = function(txt, col, table, c, wo) {
                txt = (util.isEmpty(txt) ? 'Empty' : txt);
                if (!groupFormatter) {
                    return txt;
                }
                return groupFormatter(txt, col, table, c, wo);
            };

            // Since we have the groupCallback as optional, we need to always pass in one
            // so create a wrapper does nothing if one was not provided
            var groupCallbackWrapper = function($cell, $rows, column, table) {
                if (groupCallback) {
                    groupCallback($cell, $rows, column, table);
                }
            };

            /*eslint camelcase: 0 */
            var widgetOptionsObject = {
                group_collapsible: true, // make the group header clickable and collapse the rows below it.
                group_collapsed: false, // start with all groups collapsed (if true)
                group_saveGroups: false, // remember collapsed groups
                group_saveReset: '.group_reset', // element to clear saved collapsed groups
                group_count: ' ({num} items)', // if not false, the '{num}' string is replaced with the number of rows in the group
                group_formatter: groupFormatterWrapper,
                group_callback: groupCallbackWrapper,
                // event triggered on the table when the grouping widget has finished work
                group_complete: 'groupingComplete',
                filter_hideFilters: true
            };

            if (widgetOptions && $.isPlainObject(widgetOptions)) {
                $.extend(widgetOptionsObject, widgetOptions);
            }

            var widgetsArray = ['group', 'filter'];
            if (widgets && $.isArray(widgets)) {
                $.merge(widgetsArray, widgets);
            }

            var optionsObject = {
                theme: 'blue',
                widgets: widgetsArray,
                widgetOptions: widgetOptionsObject
            };

            if (options && $.isPlainObject(options)) {
                $.extend(optionsObject, options);
            }

            $(util.idAsSelector(id)).tablesorter(optionsObject);
        }

    };


});