define(function(require) {
    'use strict';

    var $ = require('$');
    var _ = require('lodash');
    var log = require('log');


    // Workaround for "this" being undefined when used in the object literal "module" below
    var getThis = function() {
        return module;
    };

    var isIdSelector = function(id) {
        if (getThis().isEmpty(id)) {
            return false;
        }

        return getThis().startsWith(id, '#');
    };

    var isClassSelector = function(cssClass) {
        if (getThis().isEmpty(cssClass)) {
            return false;
        }
        return getThis().startsWith(cssClass, '.');
    };


    /** 
     * Generic utilities for dealing with strings, objects, etc.  It is built on top of the lodash libary. 
     * @see the [lodash API] @link https://lodash.com/docs for additional functions that you have access to via this class
     * @exports util 
     */
    var module = {

        /**
         * Checks if the string is a valid JQuery selector
         * 
         * @param {string}  selector - the selector to check.
         * @return {boolean} true if a valid selector false otherwise.
         */

        isValidSelector: function(selector) {
            try {
                $(selector);
            }
            catch (error) {
                return false;
            }
            return true;
        },

        deprecated: function() {
            log.warn('This function has been deprecated and will not be supported in future releases.  See documentation.');
        },

        /**
         * Checks to see if the argument is empty.  Empty is considered null, undefined, the string 'null', an empty string or
         * an array of length zero.
         * 
         * @param {(string|Array|Object)} item the item to check
         * @return true if empty, false otherwise.
         */
        /*jshint eqnull:true */
        /* eslint eqeqeq:0 no-eq-null:0 */
        isEmpty: function(item) {
            return (
                item == null || item === null ||
                item === undefined ||
                typeof item === 'undefined' ||
                $.trim(item) === 'null' ||
                $.trim(item) === '' ||
                ($.isArray(item) && item.length === 0)
            );
        },

        isNotEmpty: function(item) {
            return !getThis().isEmpty(item);
        },

        startsWith: function(str, ch, position) {
            if (!position) {
                position = 0;
            }
            return _.startsWith(str, ch, position);
        },

        replaceCharAt: function(str, index, chr) {
            if (index > str.length - 1) {
                return str;
            }
            return str.substr(0, index) + chr + str.substr(index + 1);
        },

        formatPhone: function(phone) {
            if (getThis().isEmpty(phone)) {
                return '';
            }
            return '(' + phone.substr(0, 3) + ') ' + phone.substr(3, 3) + '-' + phone.substr(6, 4);
        },


        formatCurrency: function(amount) {
            var i = parseFloat(amount);
            if (isNaN(i)) {
                i = 0.00;
            }
            var minus = '';
            if (i < 0) {
                minus = '-';
            }
            i = Math.abs(i);
            i = parseInt((i + 0.005) * 100, 10);
            i = i / 100;
            var s = i.toString();
            if (s.indexOf('.') < 0) {
                s += '.00';
            }
            if (s.indexOf('.') === (s.length - 2)) {
                s += '0';
            }
            s = minus + s;
            return s;
        },


        /**
         * If the string is null it returns a empty string otherwise returns the string
         * 
         * @param {String} string the string to check
         * @return {String} A empty string if the parameter was null or undefined otherwise the parameter
         */
        blankNull: function(string) {
            if (getThis().isEmpty(string)) {
                return '';
            }
            else {
                return string;
            }
        },


        toBoolean: function(str) {
            if (getThis().isEmpty(str)) {
                return false;
            }

            str = str.trim().toLowerCase();
            if (str === 'true' || str === 't' || str === '1' || str === 'y' || str === 'yes' || str === 1 || str === true) {
                return true;
            }

            return false;
        },


        isTrue: function(str) {
            return getThis().toBoolean(str);
        },

        isFalse: function(str) {
            return !getThis().isTrue(str);
        },

        /**
         * Left pads the given string with zeros to fill the size specified
         * 
         * @param {String} string the String to pad
         * @param {Integer} size the number of zeros to pad
         * 
         * @return {String} the string with padded zeros
         * 
         */
        zeroFill: function(string, size) {
            if (getThis().isEmpty(string)) {
                return '';
            }

            string = _.toString(string);
            return _.padStart(string, (size - string.length), '0');
        },


        idAsSelector: function(id) {
            if (getThis().isEmpty(id)) {
                return '';
            }

            id = id.trim();
            if (isIdSelector(id) || isClassSelector(id)) {
                return id;
            }
            return '#' + id;
        },

        classAsSelector: function(cssClass) {
            if (getThis().isEmpty(cssClass)) {
                return '';
            }

            cssClass = cssClass.trim();
            if (isIdSelector(cssClass) || isClassSelector(cssClass)) {
                return cssClass;
            }
            return '.' + cssClass;
        },

        contains: function(str, subString) {
            if (getThis().isEmpty(str)) {
                return false;
            }

            if (getThis().isEmpty(subString)) {
                return false;
            }

            return str.indexOf(subString) !== -1;
        },

        containsIgnoreCase: function(str, subString) {
            if (getThis().isEmpty(str)) {
                return false;
            }

            if (getThis().isEmpty(subString)) {
                return false;
            }

            return getThis().contains(str.toLowerCase(), str.toLowerCase());
        },

        trimNewLineChar: function(str) {
            if (getThis().isEmpty(str)) {
                return '';
            }
            return str.replace(/(\r\n|\n|\r)/gm, '');
        },


        trimWhiteSpaceChar: function(str) {
            if (getThis().isEmpty(str)) {
                return '';
            }
            return str.replace(/(\s)/gm, '');
        },


        redirectAsHttpPost: function(location, args, target) {
            if (!target) {
                target = '_getThis()';
            }

            var form = '';
            if ($.isArray(args)) {
                $.each(args, function(index, obj) {
                    form += '<input type="hidden" name="' + obj.name + '" value="' + obj.value + '">';
                });
            }
            else {
                $.each(args, function(key, value) {
                    form += '<input type="hidden" name="' + key + '" value="' + value + '">';
                });
            }

            var dynamicForm = '<form data-ajax="false" target="' + target + '" action="' + location + '" method="POST">' + form + '</form>';
            $(dynamicForm).appendTo($(document.body)).submit();
        },


        hasWhiteSpace: function(s) {
            return (/\s/g.test(s));
        },


        /**
         * Converts the provided string to proper case
         * @param {String} str the string to convert
         * @return {String} the string in proper case
         */
        properCase: function(str) {
            if (getThis().isEmpty(str)) {
                return '';
            }
            str = str.toLowerCase();
            return str.replace(/\b[a-z]/g, function(f) {
                return f.toUpperCase();
            });
        },


        /**
         * Adds a parameter and value to an existing URL.
         * 
         * @param {String} url the URL to append to
         * @param {String} name the name of the parameter
         * @param {String} value the value of the parameter
         * @return {String} the url with the given parameter appended
         * 
         */
        addParameterToUrl: function(url, name, value) {
            if (getThis().isEmpty(name) || getThis().isEmpty(value)) {
                return url;
            }

            var seperator = url.indexOf('?') === -1 ? '?' : '&';
            return url + seperator + encodeURIComponent(name) + '=' + encodeURIComponent(value);
        },


        getParameterFromUrl: function(urlString, name) {
            return (urlString.split('' + name + '=')[1] || '').split('&')[0];
        },


        toKeyValueHash: function(key, value) {
            return {
                'key': key,
                'value': value
            };
        }


    };

    return _.assign({}, _, module);
});