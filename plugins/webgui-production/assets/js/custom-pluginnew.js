$( document ).ready(function() {
	initializeRating();
});

function initializeRating() {
	$('#input-id-PluginName').rating({
		min: 0,
		max: 5,
		step: 1,
		size: 'md',
		showClear: false
	});
}