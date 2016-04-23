/** 
 * Utilities for handling text inputs.
 * @module text 
 */
define(function(require) {
    'use strict';

    var form = require('ui/form');
    var mobile = require('ui/mobile');

    return {

        /**
         * Enables a text input.
         * @param {String} id the id of the text input 
         */
        enable: function(id) {
            form.enable(id);
            mobile.enableTextField(id);
        },

        /**
         * Disables a text input.
         * @param {String} id the id of the text input 
         */
        disable: function(id) {
            form.disable(id);
            mobile.disableTextField(id);
        }
    };


});