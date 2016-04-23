define(function(require) {
    'use strict';

    var $ = require('$');
    var util = require('util');


    // Workaround for "this" being undefined when used in the object literal "module" below
    var getThis = function() {
        return module;
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
            var li = $(tabTemplate.replace('{id}', tabId).replace('{href}', tabId).replace('{tabTitle}', tabTitle));
            tabs.find('.ui-tabs-nav').first().append(li);
            tabs.append('<div id="' + tabId + '"><p>' + tabContent + '</p></div>');
            getThis().refresh(tabContainerId);
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
            var li = $(tabTemplate.replace('{id}', tabId).replace('{href}', href).replace('{tabTitle}', tabTitle));
            tabs.find('.ui-tabs-nav').first().append(li);
            getThis().refresh(tabContainerId);
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

        addCloseFunctionToCloseIcon: function(tabContainerId) {
            tabContainerId = util.idAsSelector(tabContainerId);
            var tabs = $(tabContainerId).tabs();

            // close icon: removing the tab on click
            tabs.delegate('span.ui-icon-close', 'click', function() {
                var panelId = $(this).closest('li').remove().attr('aria-controls');
                $(util.idAsSelector(panelId)).remove();
                getThis().refresh(tabContainerId);
            });
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
