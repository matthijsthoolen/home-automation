(function() {
	var app = angular.module('store', []);
	
	app.controller('StoreController', function() {
		
	});
	
	app.directive('pluginnewItem', ['$timeout', function($timeout) {		
		return {
			restrict: 'E',
			templateUrl: '/assets/html/pluginnew-item.html',
			scope: {
				details: '=details'
			},
			link: function (scope, element, attrs) {
				var details = scope.details;
				
				function doDomStuff(tries) {
					// a sanity check, just in case we reuse this function as a handler, 
					// e.g. for `orientationchange`
					if (isNaN(+tries)) {
						tries = attrs.maxTries || 10;
					}

					if (tries > 0) {
						$timeout(function() {
							//Check if the element is already available, else wait and try again
 							if ($('#input-id-' + details.id).length !== 0) {
								$('#input-id-' + details.id).rating({
									clearElement: "#kv-clear", 
    								captionElement: "#kv-caption",
									size: "xs",
									readonly: true,
									showClear: false,
									showCaption: false
								});
							} else {
								doDomStuff(tries - 1);
							}
						}, attrs.msDelay || 100);
					} else {
						// if we got here, we've exhausted our tries, so we probably
						// want to log or warn or throw here.
					}
				}

				doDomStuff(attrs.maxTries);
        	}
		};
	}]);
	
	function stuffController($scope) {
    	$scope.$on('$viewContentLoaded', test);
	}
	
	function test() {
		alert('hello!');
	}
	
	this.selectTab = function (setTab) {
		this.tab = setTab;
	};
	
})();