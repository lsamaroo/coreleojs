(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD.
        define(['jquery', 'lodash', 'handlebars'], factory);
    } 
 	else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('jquery'), require('lodash'), require('handlebars'));
    }    
    else {
        // Browser globals
        root.coreleo = factory(root.$, root._, root.Handlebars);
    }
}(this, function ($, _, Handlebars) {
/**
 * @license almond 0.3.2 Copyright jQuery Foundation and other contributors.
 * Released under MIT license, http://github.com/requirejs/almond/LICENSE
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part, normalizedBaseParts,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name) {
            name = name.split('/');
            lastIndex = name.length - 1;

            // If wanting node ID compatibility, strip .js from end
            // of IDs. Have to do this here, and not in nameToUrl
            // because node allows either .js or non .js to map
            // to same file.
            if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
            }

            // Starts with a '.' so need the baseName
            if (name[0].charAt(0) === '.' && baseParts) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that 'directory' and not name of the baseName's
                //module. For instance, baseName of 'one/two/three', maps to
                //'one/two/three.js', but we want the directory, 'one/two' for
                //this normalization.
                normalizedBaseParts = baseParts.slice(0, baseParts.length - 1);
                name = normalizedBaseParts.concat(name);
            }

            //start trimDots
            for (i = 0; i < name.length; i++) {
                part = name[i];
                if (part === '.') {
                    name.splice(i, 1);
                    i -= 1;
                } else if (part === '..') {
                    // If at the start, or previous value is still ..,
                    // keep them so that when converted to a path it may
                    // still work when converted to a path, even though
                    // as an ID it is less than ideal. In larger point
                    // releases, may be better to just kick out an error.
                    if (i === 0 || (i === 1 && name[2] === '..') || name[i - 1] === '..') {
                        continue;
                    } else if (i > 0) {
                        name.splice(i - 1, 2);
                        i -= 2;
                    }
                }
            }
            //end trimDots

            name = name.join('/');
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            var args = aps.call(arguments, 0);

            //If first arg is not require('string'), and there is only
            //one arg, it is the array form without a callback. Insert
            //a null so that the following concat is correct.
            if (typeof args[0] !== 'string' && args.length === 1) {
                args.push(null);
            }
            return req.apply(undef, args.concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {
        if (typeof name !== 'string') {
            throw new Error('See almond README: incorrect module build, no module name');
        }

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("../node_modules/almond/almond", function(){});

/** 
 * A delegate class for JQuery
 * @module $ 
 */
define('$',['require','jquery'],function(require) {
    'use strict';
    return require('jquery');
});
/** 
 * A delegate (wrapper) for window.console.
 * @module log 
 */

/* eslint no-console:0 */
define('log',['require'],function(require) {
    'use strict';
    if (!(window.console && console.log)) {
        return {
            log: function() {},
            debug: function() {},
            info: function() {},
            warn: function() {},
            error: function() {}
        };
    }
    else {
        return window.console;
    }

});
define('util',['require','$','lodash','log'],function(require) {
    'use strict';

    var $ = require('$');
    var _ = require('lodash');
    var log = require('log');

    // Workaround for "this" being undefined when used in the object literal
    // "module" below
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
     * Checks if the string is a valid JQuery selector
     * 
     * @param {string}
     *            selector - the selector to check.
     * @return {boolean} true if a valid selector false otherwise.
     */

    var isValidSelector = function(selector) {
        try {
            $(selector);
        }
        catch (error) {
            return false;
        }
        return true;
    };

    /**
     * Generic utilities for dealing with strings, objects, etc. It is built on
     * top of the lodash libary.
     * 
     * @see the [lodash API]
     * @link https://lodash.com/docs for additional functions that you have
     *       access to via this class
     * @exports util
     */
    var module = {


        /**
         * Prints a deprecated message to the console. Used to warn the user
         * that a function is deprecated
         */
        deprecated: function() {
            log.warn('This function has been deprecated and will not be supported in future releases.  See documentation.');
        },

        /**
         * Checks to see if the item is empty. Empty is considered null,
         * undefined, the string 'null', an empty string or an array of length
         * zero.
         * 
         * @param {(string|Array|Object)}
         *            item - the item to check
         * @return true if empty, false otherwise.
         */
        /* jshint eqnull:true */
        /* eslint eqeqeq:0 no-eq-null:0 */
        isEmpty: function(item) {
            return (item == null || item === null || item === undefined || typeof item === 'undefined' || $.trim(item) === 'null' || $.trim(item) === '' || ($.isArray(item) && item.length === 0));
        },

        /**
         * Checks to see if the item is not empty.
         * 
         * @param {(string|Array|Object)}
         *            item - the item to check
         * @return {boolean} true if not empty, false otherwise.
         */
        isNotEmpty: function(item) {
            return !getThis().isEmpty(item);
        },

        /**
         * Checks if string starts with the given target string.
         * 
         * @param {string}
         *            string - The string to search
         * @param {string}
         *            target - The string to search for
         * @param {number}
         *            [position=0] - The position to search from
         * @return {boolean} true if string starts with target, false otherwise.
         */
        startsWith: function(string, target, position) {
            if (!position) {
                position = 0;
            }
            return _.startsWith(string, target, position);
        },

        replaceCharAt: function(string, index, char) {
            if (index > string.length - 1) {
                return string;
            }
            return string.substr(0, index) + char + string.substr(index + 1);
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
         * If the string is null it returns a empty string otherwise returns the
         * string
         * 
         * @param {String}
         *            string the string to check
         * @return {String} A empty string if the parameter was null or
         *         undefined otherwise the parameter
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
         * @param {String}
         *            string the String to pad
         * @param {Integer}
         *            size the number of zeros to pad
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
            if (id && id.jquery) {
                return id;
            }

            if (getThis().isEmpty(id)) {
                return '';
            }

            id = id.trim();
            if (isValidSelector(id) && (isIdSelector(id) || isClassSelector(id))) {
                return id;
            }
            return '#' + id;
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
         * 
         * @param {String}
         *            string - the string to convert
         * @return {String} the string in proper case
         */
        properCase: function(string) {
            if (getThis().isEmpty(string)) {
                return '';
            }
            string = string.toLowerCase();
            return string.replace(/\b[a-z]/g, function(f) {
                return f.toUpperCase();
            });
        },

        /**
         * Adds a parameter and value to an existing URL.
         * 
         * @param {String}
         *            url - the URL to append to
         * @param {String}
         *            name the name of the parameter
         * @param {String}
         *            value the value of the parameter
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

        getParameterFromUrl: function(url, name) {
            return (url.split('' + name + '=')[1] || '').split('&')[0];
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
/** 
 * A class of generic constants
 * @module constants 
 */
define('constants',['require'],function(require) {
    'use strict';

    return {
        /** 
         * One second in milliseconds
         * @constant {number}
         */
        ONE_SECOND: 1000,


        /** 
         * One minute in milliseconds
         * @constant {number}
         */
        ONE_MINUTE: 60000
    };

});
/**
 * This object contains functions dealing with JQuery mobile and is never exposed as a public API.
 * Instead these functions are called in the various public UI API to handle JQuery mobile elements in
 * the appropriate fashion behind the scenes. 
 * 
 */
define('ui/mobile',['require','$','util'],function(require) {
    'use strict';

    var $ = require('$');
    var util = require('util');


    // Workaround for "this" being undefined when used in the object literal "module" below
    var getThis = function() {
        return module;
    };


    var module = {

        /*
         * Refreshes a JQuery mobile select item when options are changed.
         * 
         * @param {String} id the id of the select item
         * 
         */
        refreshSelect: function(id) {
            var item = $(util.idAsSelector(id));
            if (getThis().isMobile() && item.selectmenu) {
                item.selectmenu('refresh');
            }
        },

        /*
         * Initializes a table to be a JQuery table for mobile displays
         * 
         * @param {String} id the id of the select item
         * 
         */
        initTable: function(id) {
            var item = $(util.idAsSelector(id));
            if (getThis().isMobile() && item.table) {
                item.table();
            }
        },

        refreshTable: function(id) {
            var item = $(util.idAsSelector(id));
            if (getThis().isMobile() && item.table) {
                item.table('rebuild');
            }
        },


        enableTextField: function(id) {
            var item = $(util.idAsSelector(id));
            if (getThis().isMobile() && item.textinput) {
                item.textinput('enable');
            }
        },

        disableTextField: function(id) {
            var item = $(util.idAsSelector(id));
            if (getThis().isMobile() && item.textinput) {
                item.textinput('disable');
            }
        },

        isMobile: function() {
            return $.mobile ? true : false;
        }
    };
    return module;
});
/** 
 * A class of css constants for use in UI elements
 * @module cssConstants 
 */
define('ui/cssConstants',['require'],function(require) {
    'use strict';

    return {
        /** 
         * Class to add to disabled ui elements
         * @constant {string}
         */
        DISABLED_CLASS: 'cljs-disabled',

        /** 
         * Class to attach a loading image to
         * @constant {string}
         */
        LOADING_DIALOG_IMAGE_CLASS: 'cljs-loading-image',



        //-------------------------------------------------------------------------------------------------------
        //--------------------- Image data URLS -----------------------------------------------------------------
        //-------------------------------------------------------------------------------------------------------

        /** 
         * Class to attach a loading image to
         * @constant {string}
         */
        SPINNER_DATA_IMAGE: 'data:image/gif;base64,R0lGODlhEAAQAPQAAL2/twAAALK0rGZnY6aooTQ0MlpbVwAAAEFCPxobGX+Be42OiA4PDnR1cAIDAigoJk1OSgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAAFdyAgAgIJIeWoAkRCCMdBkKtIHIngyMKsErPBYbADpkSCwhDmQCBethRB6Vj4kFCkQPG4IlWDgrNRIwnO4UKBXDufzQvDMaoSDBgFb886MiQadgNABAokfCwzBA8LCg0Egl8jAggGAA1kBIA1BAYzlyILczULC2UhACH5BAkKAAAALAAAAAAQABAAAAV2ICACAmlAZTmOREEIyUEQjLKKxPHADhEvqxlgcGgkGI1DYSVAIAWMx+lwSKkICJ0QsHi9RgKBwnVTiRQQgwF4I4UFDQQEwi6/3YSGWRRmjhEETAJfIgMFCnAKM0KDV4EEEAQLiF18TAYNXDaSe3x6mjidN1s3IQAh+QQJCgAAACwAAAAAEAAQAAAFeCAgAgLZDGU5jgRECEUiCI+yioSDwDJyLKsXoHFQxBSHAoAAFBhqtMJg8DgQBgfrEsJAEAg4YhZIEiwgKtHiMBgtpg3wbUZXGO7kOb1MUKRFMysCChAoggJCIg0GC2aNe4gqQldfL4l/Ag1AXySJgn5LcoE3QXI3IQAh+QQJCgAAACwAAAAAEAAQAAAFdiAgAgLZNGU5joQhCEjxIssqEo8bC9BRjy9Ag7GILQ4QEoE0gBAEBcOpcBA0DoxSK/e8LRIHn+i1cK0IyKdg0VAoljYIg+GgnRrwVS/8IAkICyosBIQpBAMoKy9dImxPhS+GKkFrkX+TigtLlIyKXUF+NjagNiEAIfkECQoAAAAsAAAAABAAEAAABWwgIAICaRhlOY4EIgjH8R7LKhKHGwsMvb4AAy3WODBIBBKCsYA9TjuhDNDKEVSERezQEL0WrhXucRUQGuik7bFlngzqVW9LMl9XWvLdjFaJtDFqZ1cEZUB0dUgvL3dgP4WJZn4jkomWNpSTIyEAIfkECQoAAAAsAAAAABAAEAAABX4gIAICuSxlOY6CIgiD8RrEKgqGOwxwUrMlAoSwIzAGpJpgoSDAGifDY5kopBYDlEpAQBwevxfBtRIUGi8xwWkDNBCIwmC9Vq0aiQQDQuK+VgQPDXV9hCJjBwcFYU5pLwwHXQcMKSmNLQcIAExlbH8JBwttaX0ABAcNbWVbKyEAIfkECQoAAAAsAAAAABAAEAAABXkgIAICSRBlOY7CIghN8zbEKsKoIjdFzZaEgUBHKChMJtRwcWpAWoWnifm6ESAMhO8lQK0EEAV3rFopIBCEcGwDKAqPh4HUrY4ICHH1dSoTFgcHUiZjBhAJB2AHDykpKAwHAwdzf19KkASIPl9cDgcnDkdtNwiMJCshACH5BAkKAAAALAAAAAAQABAAAAV3ICACAkkQZTmOAiosiyAoxCq+KPxCNVsSMRgBsiClWrLTSWFoIQZHl6pleBh6suxKMIhlvzbAwkBWfFWrBQTxNLq2RG2yhSUkDs2b63AYDAoJXAcFRwADeAkJDX0AQCsEfAQMDAIPBz0rCgcxky0JRWE1AmwpKyEAIfkECQoAAAAsAAAAABAAEAAABXkgIAICKZzkqJ4nQZxLqZKv4NqNLKK2/Q4Ek4lFXChsg5ypJjs1II3gEDUSRInEGYAw6B6zM4JhrDAtEosVkLUtHA7RHaHAGJQEjsODcEg0FBAFVgkQJQ1pAwcDDw8KcFtSInwJAowCCA6RIwqZAgkPNgVpWndjdyohACH5BAkKAAAALAAAAAAQABAAAAV5ICACAimc5KieLEuUKvm2xAKLqDCfC2GaO9eL0LABWTiBYmA06W6kHgvCqEJiAIJiu3gcvgUsscHUERm+kaCxyxa+zRPk0SgJEgfIvbAdIAQLCAYlCj4DBw0IBQsMCjIqBAcPAooCBg9pKgsJLwUFOhCZKyQDA3YqIQAh+QQJCgAAACwAAAAAEAAQAAAFdSAgAgIpnOSonmxbqiThCrJKEHFbo8JxDDOZYFFb+A41E4H4OhkOipXwBElYITDAckFEOBgMQ3arkMkUBdxIUGZpEb7kaQBRlASPg0FQQHAbEEMGDSVEAA1QBhAED1E0NgwFAooCDWljaQIQCE5qMHcNhCkjIQAh+QQJCgAAACwAAAAAEAAQAAAFeSAgAgIpnOSoLgxxvqgKLEcCC65KEAByKK8cSpA4DAiHQ/DkKhGKh4ZCtCyZGo6F6iYYPAqFgYy02xkSaLEMV34tELyRYNEsCQyHlvWkGCzsPgMCEAY7Cg04Uk48LAsDhRA8MVQPEF0GAgqYYwSRlycNcWskCkApIyEAOwAAAAAAAAAAAA=='



    };

});
define('ui/form',['require','$','util','ui/cssConstants'],function(require) {
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
/** 
 * Utilities for handling generic UI elements.
 * @module ui 
 */
define('ui',['require','$','util','constants','ui/mobile','ui/form','ui/cssConstants'],function(require) {
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
define('ui/dialog',['require','$','ui','util','ui/cssConstants'],function(require) {
    'use strict';

    var $ = require('$');
    var ui = require('ui');
    var util = require('util');
    var cssConstants = require('ui/cssConstants');

    var CONFIRM_DIALOG_TMPL = '<div data-role="popup" data-shadow="false" data-dismissible="false"';
    CONFIRM_DIALOG_TMPL = CONFIRM_DIALOG_TMPL + 'id="my-confirm-dialog" ';
    CONFIRM_DIALOG_TMPL = CONFIRM_DIALOG_TMPL + 'class="ui-dialog dialog confirm-dialog ui-corner-all" ';
    CONFIRM_DIALOG_TMPL = CONFIRM_DIALOG_TMPL + 'title="{title}">';
    CONFIRM_DIALOG_TMPL = CONFIRM_DIALOG_TMPL + '{header}<div class="icon-content {iconClass}"/><div class="ui-dialog-content text-content">{text}</div>';
    CONFIRM_DIALOG_TMPL = CONFIRM_DIALOG_TMPL + '<div class="dialog-footer">';
    CONFIRM_DIALOG_TMPL = CONFIRM_DIALOG_TMPL + '<button class="save" type="button">Ok</button>';
    CONFIRM_DIALOG_TMPL = CONFIRM_DIALOG_TMPL + '<button class="cancel" type="button">Cancel</button>';
    CONFIRM_DIALOG_TMPL = CONFIRM_DIALOG_TMPL + '</div>';
    CONFIRM_DIALOG_TMPL = CONFIRM_DIALOG_TMPL + '</div>';

    var CONFIRM_DIALOG_HEADER_TMPL = '<div class="header ui-dialog-titlebar ui-widget-header ui-corner-all" data-role="header">{title}</div>';

    var LOADING_DIALOG_TMPL = '<div data-role="popup" data-shadow="false" data-dismissible="false" ';
    LOADING_DIALOG_TMPL = LOADING_DIALOG_TMPL + ' class="ui-dialog dialog loading-dialog ui-corner-all" ';
    LOADING_DIALOG_TMPL = LOADING_DIALOG_TMPL + 'id="my-loading-dialog" title="{title}">';
    LOADING_DIALOG_TMPL = LOADING_DIALOG_TMPL + '<div class="{loadingImageClass}"></div>{text}</div>';

    var ALERT_DIALOG_TMPL = '<div data-role="popup" data-shadow="false" data-dismissible="false" title="{title}"';
    ALERT_DIALOG_TMPL = ALERT_DIALOG_TMPL + 'class="ui-dialog dialog alert-dialog ui-corner-all">{header}';
    ALERT_DIALOG_TMPL = ALERT_DIALOG_TMPL + '<div class="icon-content {iconClass}"/><div class="text-content">{text}</div></div>';

    var CLOSE_BUTTON_TMPL = '<button class="ui-button ui-widget ui-state-default ui-corner-all ui-button-icon-only ui-dialog-titlebar-close" ';
    CLOSE_BUTTON_TMPL = CLOSE_BUTTON_TMPL + 'role="button" aria-disabled="false" title="close"><span class="ui-button-icon-primary ui-icon ui-icon-closethick">';
    CLOSE_BUTTON_TMPL = CLOSE_BUTTON_TMPL + '</span><span class="ui-button-text">close</span></button>';

    var ALERT_DIALOG_HEADER_TMPL = '<div class="header ui-dialog-titlebar ui-widget-header ui-corner-all" data-role="header"><span class="ui-dialog-title">{title}</span>{close}</div>';

    var LOADING_IMAGE_TEXT_TEXT = 'Loading, please wait...';

    var showConfirmPopup = function(title, text, successFunction, iconClass) {
        var template = CONFIRM_DIALOG_TMPL;
        template = template.replace('{title}', title);
        template = template.replace('{text}', text);
        var header = CONFIRM_DIALOG_HEADER_TMPL.replace('{title}', title);
        template = template.replace('{header}', header);
        template = template.replace('{iconClass}', iconClass);

        var $el = $(template);
        $('.save', $el).click(function() {
            successFunction($el);
            closeDialogOrPopup('#my-confirm-dialog');
            destroyDialogOrPopup('#my-confirm-dialog');
        });

        $('.cancel', $el).click(function(eventObject) {
            closeDialogOrPopup('#my-confirm-dialog');
            destroyDialogOrPopup('#my-confirm-dialog');
        });

        $el.popup();
        $el.popup('open');
    };


    var showConfirmDialog = function(title, text, successFunction, iconClass) {
        var template = CONFIRM_DIALOG_TMPL;
        template = template.replace('{title}', title);
        template = template.replace('{text}', text);
        template = template.replace('{header}', '');
        template = template.replace('{iconClass}', iconClass);

        var $el = $(template);
        $('.save', $el).click(function(eventObject) {
            successFunction($el);
            closeDialogOrPopup('#my-confirm-dialog');
            destroyDialogOrPopup('#my-confirm-dialog');
        });

        $('.cancel', $el).click(function(eventObject) {
            closeDialogOrPopup('#my-confirm-dialog');
            destroyDialogOrPopup('#my-confirm-dialog');
        });

        $el.dialog({
            autoOpen: false,
            resizable: true,
            modal: true
        });

        $el.dialog('open');
    };


    var destroyDialogOrPopup = function(id) {
        var $el = null;
        if (typeof id === 'string') {
            var itemId = util.idAsSelector(id);
            $el = $(itemId);
        }
        else {
            $el = id;
        }

        if ($el.popup) {
            $el.popup('destroy').remove();
        }
        else {
            $el.dialog('destroy').remove();
        }
    };

    var closeDialogOrPopup = function(id) {
        var $el = null;
        if (typeof id === 'string') {
            var itemId = util.idAsSelector(id);
            $el = $(itemId);
        }
        else {
            $el = id;
        }

        if ($el.popup) {
            $el.popup('close');
        }
        else {
            $el.dialog('close');
        }
    };


    var initDialog = function(id, width, height, modal) {
        var options = {
            autoOpen: false,
            modal: modal
        };
        if (width) {
            options.width = width;
        }
        if (height) {
            options.height = height;
        }
        $(util.idAsSelector(id)).dialog(options);

    };


    /** 
     * Utilities for dealing with JQuery dialogs, mobile pop-ups and mobile panels.
     * @exports dialog 
     */
    var module = {
        /**
         * Opens a dialog on desktop browser or a side panel on mobile browsers.
         * Note: For dialogs it will initialize the dialog if it was never initialized before.
         * 
         * @param {String} id the id of the dialog or panel
         * @param {number} [width] a width to display the dialog
         * @param {number} [height] a height to display the dialog
         * @param {boolean} [modal=true] true if the dialog should be modal, false otherwise.  
         * Defaults to true for the first time the dialog is opened if not specified.
         * 
         */
        open: function(id, width, height, modal) {
            var itemId = util.idAsSelector(id);
            var $el = $(itemId);
            if ($el.panel) {
                $el.css('display', 'inherit');
                $el.panel('open');
            }
            else {
                var dialogInstance = $el.dialog('instance');
                if (!dialogInstance) {
                    initDialog(itemId, width, height, (!modal ? true : modal));
                }
                else {
                    if (width) {
                        $el.dialog('option', 'width', width);
                    }
                    if (height) {
                        $el.dialog('option', 'height', height);
                    }
                    if (util.isNotEmpty(modal)) {
                        $el.dialog('option', 'modal', modal);
                    }
                }
                $el.dialog('open');
            }
        },

        /**
         * Closes the dialog or side panel on mobile browsers
         * @param {String} id the id of the dialog or panel
         * 
         */
        close: function(id) {
            var itemId = util.idAsSelector(id);
            if ($(itemId).panel) {
                $(itemId).panel('close');
            }
            else {
                $(itemId).dialog('close');
            }
        },


        confirm: function(title, text, successFunction, iconClass) {
            if (util.isEmpty(iconClass)) {
                iconClass = '';
            }

            if (ui.isMobile()) {
                showConfirmPopup(title, text, successFunction, iconClass);
            }
            else {
                showConfirmDialog(title, text, successFunction, iconClass);
            }
        },



        showLoadingDialog: function(title, text, loadingImageClass) {
            if (util.isEmpty(text)) {
                text = LOADING_IMAGE_TEXT_TEXT;
            }

            if (util.isEmpty(loadingImageClass)) {
                loadingImageClass = cssConstants.LOADING_DIALOG_IMAGE_CLASS;
            }

            var template = LOADING_DIALOG_TMPL;
            template = template.replace('{loadingImageClass}', loadingImageClass);
            template = template.replace('{title}', title);
            template = template.replace('{text}', text);

            var $el = $(template);
            if (ui.isMobile()) {
                $el.popup();
                $el.popup('open');
            }
            else {
                $el.dialog({
                    autoOpen: false,
                    closeOnEscape: false,
                    modal: true,
                    dialogClass: 'loading-dialog-contentpane',
                    height: 70,
                    open: function(event) {
                        $('.loading-dialog-contentpane .ui-dialog-titlebar-close').hide();
                        if (!title) {
                            $('.loading-dialog-contentpane .ui-dialog-titlebar').hide();
                        }
                    }
                });
                $el.dialog('open');
            }
        },


        hideLoadingDialog: function() {
            closeDialogOrPopup('#my-loading-dialog');
            destroyDialogOrPopup('#my-loading-dialog');
        },


        alert: function(title, text, iconClass) {
            if (util.isEmpty(iconClass)) {
                iconClass = '';
            }

            var template = ALERT_DIALOG_TMPL;
            template = template.replace('{title}', title);
            template = template.replace('{text}', text);
            template = template.replace('{iconClass}', iconClass);

            if (ui.isMobile()) {
                var header = ALERT_DIALOG_HEADER_TMPL.replace('{title}', title);
                header = header.replace('{close}', CLOSE_BUTTON_TMPL);
                template = template.replace('{header}', header);

                var $el = $(template);

                $('.header', $el).click(function(eventObject) {
                    closeDialogOrPopup($el);
                    destroyDialogOrPopup($el);
                });

                $el.popup();
                $el.popup('open');
            }
            else {
                template = template.replace('{header}', '');
                template = template.replace('{close}', '');
                $(template).dialog();
            }
        }

    };


    return module;


});
define('ui/tabs',['require','$','util'],function(require) {
    'use strict';

    var $ = require('$');
    var util = require('util');


    // Workaround for "this" being undefined when used in the object literal "module" below
    var getThis = function() {
        return module;
    };


    var addCloseListener = function(tabContainerId, $el) {
        $('span.ui-icon-close', $el).on('click', function() {
            var panelId = $(this).closest('li').remove().attr('aria-controls');
            $(util.idAsSelector(panelId)).remove();
            getThis().refresh(tabContainerId);
        });
    };

    /** 
     * Utilities for handling JQuery tabs.
     * @exports tabs 
     */
    var module = {

        /**
         * Add a new tab to an existing tab container.
         * 
         * @param {object}  options - a list of options required for this function
         * @param {string}  options.tabContainerId - the id of the tab container to add the new tab to
         * @param {string}  options.tabId - an id to give the new tab.  Has to be unique
         * @param {string}  options.tabTitle - the text to display as the title of the tab
         * @param {string}  options.tabContent - the content to display in the tab
         * @param {boolean} [options.showCloseIcon] - true to show a "x" close icon.
         * @param {string}  [options.closeTabText] - Text to display if there is a close icon
         */
        addTab: function(options) {
            var tabContainerId = options.tabContainerId,
                tabId = options.tabId,
                tabTitle = options.tabTitle,
                tabContent = options.tabContent,
                showCloseIcon = options.showCloseIcon,
                closeTabText = options.closeTabText;

            var tabTemplate = '<li><a id="tab-anchor-{id}" href="#{href}">{tabTitle}</a>{closeIcon}</li>';
            var closeIconTemplate = '<span tabIndex="0" class="ui-icon ui-icon-close">{closeText}</span>';

            if (showCloseIcon) {
                closeIconTemplate = closeIconTemplate.replace('{closeText}', closeTabText + ' ' + tabTitle);
                tabTemplate = tabTemplate.replace('{closeIcon}', closeIconTemplate);
            }
            else {
                tabTemplate = tabTemplate.replace('{closeIcon}', '');
            }

            var tabs = $(util.idAsSelector(tabContainerId));
            var $li = $(tabTemplate.replace('{id}', tabId).replace('{href}', tabId).replace('{tabTitle}', tabTitle));
            tabs.find('.ui-tabs-nav').first().append($li);
            tabs.append('<div id="' + tabId + '"><p>' + tabContent + '</p></div>');
            getThis().refresh(tabContainerId);

            if (showCloseIcon) {
                addCloseListener(tabContainerId, $li);
            }
        },

        /**
         * Add a new tab to an existing tab container using an AJAX call to get the content.
         * 
         * @param {object}  options - a list of options required for this function
         * @param {string}  options.tabContainerId - the id of the tab container to add the new tab to
         * @param {string}  options.tabId - an id to give the new tab.  Has to be unique
         * @param {string}  options.tabTitle - the text to display as the title of the tab
         * @param {string}  options.href - the URL to get the tab content from.
         * @param {boolean} [options.showCloseIcon] - true to show a "x" close icon.
         * @param {string}  [options.closeTabText] - Text to display if there is a close icon
         */
        addAjaxTab: function(options) {
            var tabContainerId = options.tabContainerId,
                tabId = options.tabId,
                tabTitle = options.tabTitle,
                href = options.href,
                showCloseIcon = options.showCloseIcon,
                closeTabText = options.closeTabText;

            var tabTemplate = '<li><a id="tab-anchor-{id}" href="{href}">{tabTitle}</a>{closeIcon}</li>';
            var closeIconTemplate = '<span tabIndex="0" class="ui-icon ui-icon-close">{closeText}</span>';

            if (showCloseIcon) {
                closeIconTemplate = closeIconTemplate.replace('{closeText}', closeTabText + ' ' + tabTitle);
                tabTemplate = tabTemplate.replace('{closeIcon}', closeIconTemplate);
            }
            else {
                tabTemplate = tabTemplate.replace('{closeIcon}', '');
            }

            var tabs = $(util.idAsSelector(tabContainerId));
            var $li = $(tabTemplate.replace('{id}', tabId).replace('{href}', href).replace('{tabTitle}', tabTitle));
            tabs.find('.ui-tabs-nav').first().append($li);
            getThis().refresh(tabContainerId);

            if (showCloseIcon) {
                addCloseListener(tabContainerId, $li);
            }
        },


        renameTab: function(tabContainerId, tabId, title) {
            tabContainerId = util.idAsSelector(tabContainerId);
            var tabAnchor = $(tabContainerId + ' a[id="tab-anchor-' + tabId + '"]');
            tabAnchor.html(title);
        },

        refresh: function(tabContainerId) {
            tabContainerId = util.idAsSelector(tabContainerId);
            var tabs = $(tabContainerId).tabs();
            tabs.tabs('refresh');
        },

        getTabIndexById: function(tabContainerId, tabId) {
            tabContainerId = util.idAsSelector(tabContainerId);
            var tabAnchor = $(tabContainerId + ' a[id="tab-anchor-' + tabId + '"]');
            if (tabAnchor.length === 0) {
                return -1;
            }

            return tabAnchor.parent().index();
        },

        focusTab: function(tabContainerId, tabId) {
            tabContainerId = util.idAsSelector(tabContainerId);
            var tabAnchor = $(tabContainerId + ' a[id="tab-anchor-' + tabId + '"]');
            tabAnchor.focus();
        },

        selectTab: function(tabContainerId, tabId) {
            tabContainerId = util.idAsSelector(tabContainerId);
            var tabIndex = getThis().getTabIndexById(tabContainerId, tabId);
            var tabs = $(tabContainerId).tabs();
            tabs.tabs('option', 'active', tabIndex);
        },

        closeTab: function(tabContainerId, tabId) {
            var panelId = $(tabContainerId + ' a[id="tab-anchor-' + tabId + '"]').closest('li').remove().attr('aria-controls');
            $('#' + panelId).remove();
            getThis().refresh(tabContainerId);
        },


        getSelectedTabIndex: function(tabContainerId) {
            tabContainerId = util.idAsSelector(tabContainerId);
            return $(tabContainerId).tabs('option', 'active');
        },

        getSelectedTabId: function(tabContainerId) {
            tabContainerId = util.idAsSelector(tabContainerId);
            var index = getThis().getSelectedTabIndex(tabContainerId);
            var id = ($(tabContainerId + ' ul>li a').eq(index).attr('href'));
            return util.startsWith(id, '#') ? id.substring(1, id.lenght) : id;
        }

    };

    return module;
});
define('ui/select',['require','$','util','ui/mobile'],function(require) {
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

        val: function(selector, value) {
            var $el = $(util.idAsSelector(selector));
            if (!value) {
                return $el.val();
            }
            else {
                $el.val(value);
                if (isSelect2($el)) {
                    $el.trigger('change.select2');
                }
            }

        }
    };


    return module;


});
/** 
 * Utilities for handling text inputs.
 * @module text 
 */
define('ui/text',['require','ui/form','ui/mobile'],function(require) {
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
/** 
 * Utilities for handling JQuery UI and mobile tables.
 * @module table 
 */
define('ui/table',['require','$','util','ui/mobile','ui'],function(require) {
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
define('poller',['require','$','log'],function(require) {
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
define('template',['require','$','handlebars'],function(require) {
    'use strict';


    var $ = require('$');
    var handlebars = require('handlebars');
    /** 
     * Utilities for rendering handlebar templates.
     * @exports template 
     */
    var module = {
        cache: {
            get: function(selector) {
                if (!this.templates) {
                    this.templates = {};
                }

                var template = this.templates[selector];
                if (!template) {
                    // pre compile the template
                    template = handlebars.compile($(selector).html());
                    this.templates[selector] = template;
                }
                return template;
            }
        },

        /**
         * This function will find the template using the selector
         * and compile and cache it for future use.
         * 
         * @param {string} selector - the selector to the template html
         * @param {object} data - the data values to use for the template
         * @return {string} the rendered template and data string
         * 
         */
        renderAndCache: function(selector, data) {
            var renderer = this.cache.get(selector);
            return renderer(data);
        },

        /**
         * Combines the template and data to create a rendered String
         * @param {string} templateString - the template to render
         * @param {object} data - the data values to use for the template
         * @return {string} the rendered template and data
         */
        render: function(templateString, data) {
            var renderer = handlebars.compile(templateString);
            return renderer(data);
        }

    };
    return module;
});
/*global define */

/**
 * The main module (sometimes called main.js) which defines the public 
 * interface for the coreleo library
 */
define('coreleo',['require','ui','ui/dialog','ui/form','ui/tabs','ui/select','ui/text','ui/table','$','constants','log','poller','template','util'],function(require) {
    'use strict';

    var ui = require('ui');
    ui.dialog = require('ui/dialog');
    ui.form = require('ui/form');
    ui.tabs = require('ui/tabs');
    ui.select = require('ui/select');
    ui.text = require('ui/text');
    ui.table = require('ui/table');

    //Return the module value.
    var coreleo = {
        version: '0.0.1',
        $: require('$'),
        constants: require('constants'),
        log: require('log'),
        poller: require('poller'),
        template: require('template'),
        ui: ui,
        util: require('util')
    };

    return coreleo;
});
    //Register in the values from the outer closure for common dependencies
    //as local almond modules
    define('jquery', function () {
        return $;
    });
    define('lodash', function () {
        return _;
    });
    define('handlebars', function () {
        return Handlebars;
    });    
    

    //Use almond's special top-level, synchronous require to trigger factory
    //functions, get the final module value, and export it as the public
    //value.
    return require('coreleo');
}));
