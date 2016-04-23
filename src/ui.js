/** 
 * Utilities for handling generic UI elements.
 * @module ui 
 */
define(function(require) {
    'use strict';


    var $ = require('$');
    var util = require('util');
    var constants = require('constants');
    var mobile = require('ui/mobile');
    var form = require('ui/form');

    var SPINNER_IMAGE_DATA_URL = 'data:image/gif;base64,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';


    return {

        /**
         * @return {boolean} true if running in a mobile browser
         */
        isMobile: function() {
            return mobile.isMobile();
        },


        /**
         * Disable a button for a specified amount of time
         * @param {string} id the id of the element
         * @param {number} [time=2000] time in milliseconds
         */
        timeoutButton: function(id, time) {
            if (!time) {
                time = constants.ONE_SECOND * 2;
            }
            form.disable(id, time);
        },


        /**
         * Displays a loading spinner in the element which matches the provided id.  
         * By default it replaces the content of the element.
         * 
         * @param {string} id the id of the element.
         * @param {boolean} [append=false] set to true to append the spinner to the element instead
         * of replacing it's content.
         *    
         */
        startSpinner: function(id, append) {
            var el = $(util.idAsSelector(id));

            if (util.isTrue(append)) {
                el.append('<image id="coreleo-spinner-image" src="' + SPINNER_IMAGE_DATA_URL + '" />');
            }
            else {
                el.empty();
                el.html('<image id="coreleo-spinner-image" src="' + SPINNER_IMAGE_DATA_URL + '" />');
            }
        },

        /**
         * Hides the loading spinner in the element which matches the provided id.  
         * 
         * @param {string} id the id of the element.
         *    
         */
        stopSpinner: function(id) {
            var div = $(util.idAsSelector(id));
            $('#coreleo-spinner-image', div).remove();
        },

        /**
         * Toggles (hide/show) the element with the matching id
         * 
         * @param {string} id the id of the element.
         * @param {function} [onShow] a callback function when the element is shown
         * @param {function} [onHide] a callback function when the element is hidden
         * @param {boolean} [animate] true to animate the toggle, false otherwise
         *    
         */
        toggle: function(id, onShow, onHide, animate) {
            var el = $(util.idAsSelector(id));
            var open = !el.is(':hidden');
            if (open) {
                if (animate) {
                    el.slideUp(400, onHide);
                }
                else {
                    el.hide(400, onHide);
                }
            }
            else {
                if (animate) {
                    el.slideDown(400, onShow);
                }
                else {
                    el.show(400, onShow);
                }
            }
        }

    };


});