/*=============================================================
    Authour URI: www.binarycart.com
    License: Commons Attribution 3.0

    http://creativecommons.org/licenses/by/3.0/

    100% To use For Personal And Commercial Use.
    IN EXCHANGE JUST GIVE US CREDITS AND TELL YOUR FRIENDS ABOUT US
   
    ========================================================  */

//Start the socket
var socket = io();

(function ($) {
    "use strict";
    var mainApp = {

        main_fun: function () {
            /*====================================
            METIS MENU 
            ======================================*/
            $('#main-menu').metisMenu();

            /*====================================
              LOAD APPROPRIATE MENU BAR
           ======================================*/
            $(window).bind("load resize", function () {
                if ($(this).width() < 768) {
                    $('div.sidebar-collapse').addClass('collapse');
                } else {
                    $('div.sidebar-collapse').removeClass('collapse');
                }
            });           
     
        },

        initialization: function () {
            mainApp.main_fun();

        }

    };
    // Initializing ///

    $(document).ready(function () {
        mainApp.main_fun();
		$('[data-toggle="tooltip"]').tooltip();
		
		//Set default toastr settings
		toastr.options = {
			closeButton: true,
			progressBar: true,
			//positionClass: 'toast-top-center'
			positionClass: 'toast-bottom-right'
		};
    });

}(jQuery));
