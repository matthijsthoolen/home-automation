(function() {
	var app = angular.module('store', []);
	
	app.controller('StoreController', function() {
		
	});
	
	app.directive('pluginnewItem', function() {
		return {
			restrict: 'E',
			templateUrl: '/assets/html/pluginnew-item.html',
			scope: {
				details: '=details'
			}
		};
	});
	
	this.selectTab = function (setTab) {
		this.tab = setTab;
	};
	
})();