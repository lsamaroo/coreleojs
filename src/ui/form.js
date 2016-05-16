define(function(require) {
    'use strict';

    var $ = require('$');
    var util = require('util');
    var select = require('ui/select');
    var cssConstants = require('ui/cssConstants');

    /** 
     * Utilities for handling form and form inputs.
     * @exports form 
     */
    var module = {

        /**
         * Resets a form 
         * 
         * @param {string} selector - the id or selector of the element to disable
         */
        reset: function(selector) {
            var $el = $(util.idAsSelector(selector));
            $('select', $el).each(function() {
                select.val($(this), '');
            });
            $el[0].reset();
        },

        /**
         * Enables a form element if disabled
         * 
         * @param {string} selector - the id or selector of the element to disable
         */
        enable: function(selector) {
            var $el = $(util.idAsSelector(selector));
            $el.removeClass(cssConstants.DISABLED_CLASS);
            $el.prop('disabled', false);
        },

        /**
         * 
         * Disable the element and optionally re-enables it after a specific number of milliseconds.
         * 
         * @param {string} selector - the id or selector of the element to disable
         * @param {int} [milliseconds] - an optional time in milliseconds before re-enabling it 
         * before re-enabling it.
         * 
         */
        disable: function(selector, milliseconds) {
            var $el = $(util.idAsSelector(selector));
            $el.prop('disabled', true);
            $el.addClass(cssConstants.DISABLED_CLASS);

            if (util.isNotEmpty(milliseconds)) {
                setTimeout(function() {
                    module.enable(selector);
                }, milliseconds);
            }
        }
    };

    return module;


});