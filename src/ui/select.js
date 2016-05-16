define(function(require) {
    'use strict';

    var $ = require('$');
    var util = require('util');
    var mobile = require('ui/mobile');


    /*
     * Fix to allow Select2 dropdown to work properly in jquery UI dialog
     * This should only be called once
     */
    var select2DialogFixLoaded = false;

    /* eslint no-underscore-dangle: 0 */
    var select2DialogFix = function() {
        if (!select2DialogFixLoaded && $.ui && $.ui.dialog && $.ui.dialog.prototype._allowInteraction) {
            var uiDialogInteraction = $.ui.dialog.prototype._allowInteraction;
            $.ui.dialog.prototype._allowInteraction = function(e) {
                if ($(e.target).closest('.select2-dropdown').length) {
                    return true;
                }
                return uiDialogInteraction.apply(this, arguments);
            };

            select2DialogFixLoaded = true;
        }
    };

    var isSelect2 = function(selector) {
        var $el = util.idAsSelector(selector);
        return !mobile.isMobile() && $el.select2;
    };

    /** 
     * Utilities for handling JQuery mobile and select2 select.
     * @exports select 
     */
    var module = {

        /**
         * Resets the select drop down to the first item
         * 
         * @param {String} selector the selector of the drop down element
         * 
         */
        reset: function(selector) {
            var $el = $(util.idAsSelector(selector));
            if (isSelect2($el)) {
                $el.select2('data', $el.find('option')[0]);
                $el.trigger('change.select2');
            }
            else {
                $el.prop('selectedIndex', 0);
            }
        },

        /**
         * Refreshes the select drop down after items have been added and removed.
         * For mobile select items it assumes JQuery mobile is being used.
         * 
         * @param {String} selector the selector of the drop down element
         * 
         */
        refresh: function(selector) {
            mobile.refreshSelect(selector);
            var $el = $(util.idAsSelector(selector));
            if (isSelect2($el)) {
                $el.trigger('change.select2');
            }
        },


        /**
         * Initializes a select2 drop down for non-mobile browsers if select2 is available.
         * Can be safely called on mobile browser as it will have no effect.
         * 
         * @param {string} selector - the selector of the element
         * @param {object} options a set of options to pass to the select2 drop down
         */
        initSelect2: function(selector, options) {
            var $el = $(util.idAsSelector(selector));
            if (isSelect2($el)) {
                select2DialogFix();
                $el.select2(options);
            }
        },

        /**
         * Sets or gets the value of the select
         * @param {string} selector - the selector of the element
         * @param {string} [value] - the value to set
         * @return {string} the value of the select
         */
        val: function(selector, value) {
            var $el = $(util.idAsSelector(selector));
            if (typeof value !== 'undefined') {
                $el.val(value);
                if (isSelect2($el)) {
                    $el.trigger('change.select2');
                }
            }
            return $el.val();
        }
    };


    return module;


});