
	// Global variables

    var scriptVersion = "Version 193 on Mar 17, 12:05 PM"

    var spreadsheetId

    var secSht = {}

    var currUser = {}

    var shtHdrs
    var shtVals
    var shtTitle
    var shtId
    var shtEnc 
    var shtIdxArr
    
    var arrOptions
    var optionsIdx
  
    var timerStart

    var signin

    var enhancer = null;   // used to capture photos
    var cropImg = []        // used to crop images in sheets-js

    
    // var newShtHdrs = ['Document','Expiry','Favorite','Notes','Img Front','Img Back', 'File Id', 'Last Change']

    var newShtHdrs = ['Document','Expiry','Favorite','Notes','File Id', 'Last Change']

    var strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
    var invalidPwdMsg = 
    `Passwords must contain at least<br>
    1 lowercase alphabetical character<br>
    1 uppercase alphabetical character<br>
    1 numeric character<br>
    1 special character<br>
    8 characters
    `

/*global jQuery */
jQuery(function ($) {
	// 'use strict';

	var App = {

		init: function () {

			this.serviceWorker()
                console.log('serviceworker')

                authorize()
                console.log('authorize')

			this.bindEvents();
                console.log('bindEvents')

		},

        serviceWorker: function () {

            if ("serviceWorker" in navigator) {
                if (navigator.serviceWorker.controller) {
                  console.log("[PWA Builder] active service worker found, no need to register");
                } else {
                  // Register the service worker
                  navigator.serviceWorker
                    .register("pwabuilder-sw.js", {
                      scope: "./"
                    })
                    .then(function (reg) {
                      console.log("[PWA Builder] Service worker has been registered for scope: " + reg.scope);
                    })
                    .catch(function (err) {
                      console.log("[PWA Builder] Service worker registration failed: ", err)
                    });
                }
              }


        },

		bindEvents: function () {

            // Home tab

            // $('#hmSelectDropDown').on('show.bs.dropdown', function () {
            //     btnHMMoreVertHtml()
            // })

            $('#btnHMChangePwd')   .click(btnHMChangePwdHtml);
            $('#btnSignout')                .button().click(btnSignoutHtml);
            $('#btnNewSheet')                .button().click(btnNewSheetHtml);

            

          
            // Sheets
            $('#btnShtSelect')            .click(btnShtSelectHtml);
            
            $('#shtSelectDropDown')        .on('show.bs.dropdown', function () {
                btnShtMoreVertHtml()
            })

            $('#btnShtAddDocument')   .click(btnAddSheetHtml);
            // $('#btnShtAddPDocument

            $('#btnShtmSubmit')       .button().click(btnShtmSubmitSheetHtml);
            $('#btnShtmDelete')       .click(btnDeleteSheetHtml);
            // $('#btnShtmDelete')       .click(enc);
            // $('#btnShtmSubmit')       .click(dec);

            $("#shtSearch").on("input", function() {
                var value = $(this).val().toLowerCase();

                $("#shtContainer #shtDocument").filter(function() {
                  $(this).parent().parent().parent().toggle($(this).text().toLowerCase().indexOf(value) > -1)
                });
                
            });

            // clear form of unencrypted data after closing
            $('#editDocument').on('hidden.bs.modal', function(e) {
                $(this).find('#sheet-form')[0].reset();
                enhancerClose();
            });

            
            // Show Sheet
            // $('#btnSSNext')       .click({dir: "Next"}, btnSSBrowseSheetHtml);
            // $('#btnSSPrev')       .click({dir: "Prev"}, btnSSBrowseSheetHtml);



            // All tabs
            // $('.divfullscreen').click(function(){
            //   document.documentElement.requestFullscreen();
            // });
          
            // var whiteList = $.fn.tooltip.Constructor.Default.allowList
          
            //     whiteList.table = []
            //     whiteList.td = []
            //     whiteList.th = []
            //     whiteList.thead = []
            //     whiteList.tr = []
            //     whiteList.tbody = []
            //     whiteList.button = []
          
            setupFormValidation()
          
          
            // $("#myToast").on("show.bs.toast", function() {
            //   $(this).removeClass("d-none");
            //       })
          
            // $("#myToast").on("hidden.bs.toast", function() {
            //   $(this).addClass("d-none");
            //       })

            

            
            $('.modal').on('shown.bs.modal', function () {
                $(this).find('[autofocus]').focus();
            });
            $('.modal').on('show.bs.modal', function (e) {
                var activeElement = document.activeElement;
                $(this).on('hidden.bs.modal', function () {
                    activeElement.focus();
                    $(this).off('hidden.bs.modal');
                });
            });
          
            Date.prototype.toLocaleISOString = function() {
                const zOffsetMs = this.getTimezoneOffset() * 60 * 1000;
                const localTimeMs = this - zOffsetMs;
                const date = new Date(localTimeMs);
                const utcOffsetHr = this.getTimezoneOffset() / 60;
                const utcOffsetSign = utcOffsetHr <= 0 ? '+' : '-';
                const utcOffsetString = utcOffsetSign + (utcOffsetHr.toString.length == 1 ? `0${utcOffsetHr}` : `${utcOffsetHr}`) + ':00';
                return date.toISOString().replace('Z', utcOffsetString);
            };    
            

		}
	};

    App.init();

    console.log('version 2')

});
