(function() {
	var storeApp = angular.module('store', []);
	
	
	/*
	 * On click of the add or install button, start the functions needed for the action
	 */
	storeApp.controller('InstallController', ['$scope', function($scope) {
		var details = $scope.$parent.details;
		
		$scope.click = function(action) {
			//Disable the button and add a spinner
			details.disabled = true;
			details.working = true;
			
			//Reset any errors and successes
			details.error = false;
			details.done = false;
			
			var data = {
				id: details.id,
				action: action
			};
			
			//Message for the bootstrap dialog
			var message = '' +
				'Please give the name for the new plugin, other options can be set later!' +
				'<div class="form-horizontal">' +
					'<div class="form-group"> '+
						'<label for="add-dev" class="col-sm-4 control-label">New plugin name</label>' +
						'<div class="col-sm-6">' +
							'<input type="text" class="form-control name" placeholder="Name for plugin">' + 
						'</div>' +
					'</div>' +
				'</div>';
			
			//Show the bootstrap dialog window
			BootstrapDialog.show({
				title: 'Create new dev plugin',
				message: message,
				closable: true,
				closeByBackdrop: false,
				onhide: function() {
					details.disabled = false;
					details.working = false;
					
					$scope.$apply();
				},
				buttons: [
					{
						label: 'Add',
						hotkey: 13,
						action: function(dialogRef) {
							var row;

							var versions = dialogRef.getModalBody().find('input.name').each(function() {
								row = jQuery(this);
								data.name = row.val();
							});

							//Send socket request to server, and after response change button or reeanble
							socket.emit('pluginStoreButton', data, function(err, stdout, stderr) {

								//If error set the error and message object.
								if (err) {
									details.error = true;
									details.message = stderr;
									toastr.warning(stderr);
								} else {
									details.done = true;
									details.message = stdout;
									toastr.info(stdout);
								}
								
								if (action === 'install') {
									details.installed = true;
								}

								details.disabled = false;
								details.working = false;

								$scope.$apply();
							});
							
							dialogRef.close();
						}
					},
					{
						label: 'Cancel',
						action: function(dialogRef) {
							
							//Reenable the button
							details.disabled = false;
							details.working = false;
							
							$scope.$apply();
							
							dialogRef.close();
						}
					}
				]
			});
		};
	}]);
	
	
	/*
	 * Add the grid-blocks for the plugins
	 */
	storeApp.directive('pluginnewItem', ['$timeout', function($timeout) {		
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