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
    var cssConstants = require('ui/cssConstants');

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
                el.append('<image id="coreleo-spinner-image" src="' + cssConstants.SPINNER_DATA_IMAGE + '" />');
            }
            else {
                el.empty();
                el.html('<image id="coreleo-spinner-image" src="' + cssConstants.SPINNER_DATA_IMAGE + '" />');
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