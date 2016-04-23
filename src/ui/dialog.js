define(function(require) {
    'use strict';

    var $ = require('$');
    var ui = require('ui');
    var util = require('util');

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
        $('.save', $el).click(function(eventObject) {
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
                loadingImageClass = 'loading-image';
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
