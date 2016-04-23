define(function(require) {
    'use strict';

    var $ = require('$');
    var log = require('log');

    /** 
     * Utilities for polling a function and URLs.
     * @exports poller 
     */
    var module = {

        /**
         * Executes a function at a given interval
         * 
         * @param {integer} interval - the interval in milliseconds
         * @param {Function} theFunction - the function to call
         * 
         */
        pollFunction: function(interval, theFunction) {
            if (!$.isFunction(theFunction)) {
                return;
            }
            (function loopsiloop() {
                setTimeout(function() {
                    theFunction();
                    // recurse
                    loopsiloop();
                }, interval);
            }());
        },

        /**
         * Sends a request to the provided URL on a set interval.
         * 
         * @param {Object}  options a list of options required for this function.
         * @param {integer} options.interval - the interval in milliseconds.
         * @param {String}  options.url - A string containing the URL to which the request is sent.
         * @param {Object}  options.data - Either a function to be called to get data, a plain object or string to 
         * send to the server with the request
         * @param {Function} options.success - A callback function which is executed if the request succeeds.
         * @param {Function} options.error - A callback function which is executed if the request fails.
         * @param {String} options.dataType - he type of data expected from the server. Default: json
         */
        pollUrl: function(options) {
            var interval = options.interval,
                url = options.url,
                data = options.data,
                success = options.success,
                error = options.error,
                dataType = options.dataType;

            if (!data) {
                data = {};
            }

            if (!dataType) {
                dataType = 'json';
            }
            (function loopsiloop() {
                setTimeout(function() {
                    var postData = {};
                    if ($.isFunction(data)) {
                        postData = data();
                    }
                    else {
                        postData = data;
                    }

                    $.ajax({
                        type: 'POST',
                        url: url,
                        dataType: dataType,
                        data: postData,
                        success: function(response) {
                            if ($.isFunction(success)) {
                                success(response);
                            }
                            // recurse
                            loopsiloop();
                        },
                        error: function(jqXHR, textStatus, errorThrown) {
                            if ($.isFunction(error)) {
                                error(jqXHR, textStatus, errorThrown);
                            }
                            // recurse
                            loopsiloop();
                            log.error('poll: errorThrown=' + errorThrown + 'textStatus=' + textStatus);
                        }
                    });
                }, interval);
            }());
        }
    };

    return module;


});
