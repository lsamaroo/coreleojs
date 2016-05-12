define(function(require) {
    'use strict';

    var $ = require('$');
    var util = require('util');
    var cssConstants = require('ui/cssConstants');

    /** 
     * Utilities for handling form and form inputs.
     * @exports form 
     */
    var module = {
        /**
         * @param {string} id - the id or selector of the element to disable
         */
        enable: function(id) {
            var item = $(util.idAsSelector(id));
            item.removeClass(cssConstants.DISABLED_CLASS);
            item.prop('disabled', false);
        },

        /**
         * 
         * Disable the element and optionally re-enables it after a specific number of milliseconds.
         * 
         * @param {string} id - the id or selector of the element to disable
         * @param {int} [milliseconds] - an optional time in milliseconds before re-enabling it 
         * before re-enabling it.
         * 
         */
        disable: function(id, milliseconds) {
            var item = $(util.idAsSelector(id));
            item.prop('disabled', true);
            item.addClass(cssConstants.DISABLED_CLASS);

            if (util.isNotEmpty(milliseconds)) {
                setTimeout(function() {
                    module.enable(id);
                }, milliseconds);
            }
        }
    };

    return module;


});