define(function(require) {
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