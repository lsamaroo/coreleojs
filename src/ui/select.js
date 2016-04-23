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

    /** 
     * Utilities for handling JQuery mobile and select2 select.
     * @exports select 
     */
    var module = {

        /**
         * Refreshes the select drop down after items have been added and removed.
         * For mobile select items it assumes JQuery mobile is being used.
         * 
         * @param {String} id the id of the select item
         * 
         */
        refresh: function(id) {
            mobile.refreshSelect(id);
        },


        /**
         * Initializes a select2 drop down for non-mobile browsers if select2 is available.
         * Can be safely called on mobile browser as it will have no effect.
         * 
         * @param {string} id the id of the element
         * @param {object} options a set of options to pass to the select2 drop down
         */
        initSelect2: function(id, options) {
            var $el = $(util.idAsSelector(id));
            if (!mobile.isMobile() && $el.select2) {
                select2DialogFix();
                $el.select2(options);
            }
        }
    };


    return module;


});
