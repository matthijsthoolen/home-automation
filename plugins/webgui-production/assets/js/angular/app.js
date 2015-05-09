(function() {
	var app = angular.module('store', []);
	
	
	/*
	 * On click of the add or install button, start the functions needed for the action
	 */
	app.controller('InstallController', ['$scope', function($scope) {
		var details = $scope.$parent.details;
		
		$scope.click = function(action) {
			details.disabled = true;
			details.working = true;
			var data = {
				id: details.id,
				action: action
			};
			
			//Send socket request to server, and after response change button or reeanble
			socket.emit('pluginStoreButton', data, function(data) {
				
				if (action === 'install') {
					details.installed = true;
				}
				
				details.disabled = false;
				details.working = false;
				
				$scope.$apply();
			});
		};
	}]);
	
	
	/*
	 * Add the grid-blocks for the plugins
	 */
	app.directive('pluginnewItem', ['$timeout', function($timeout) {		
		return {
			restrict: 'E',
			templateUrl: '/assets/html/pluginnew-item.html',
			scope: {
				details: '=details'
			},
			link: function (scope, element, attrs) {
				var details = scope.details;
				
				//ADD rating stars to the box after everything is loaded
				function addRating(tries) {
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
								$('[data-toggle="tooltip"]').tooltip();
							} else {
								addRating(tries - 1);
							}
						}, attrs.msDelay || 100);
					} else {
						// if we got here, we've exhausted our tries, so we probably
						// want to log or warn or throw here.
					}
				}

				addRating(attrs.maxTries);
        	}
		};
	}]);
	
})();