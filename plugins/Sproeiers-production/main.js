var prelog = '(Plugin:***';
var pluginname = '';


/*
 * Gets called when the server is starting
 *
 * @param {string} name: the plugin name used
 */
exports.start = function(name) {
	pluginname = name;
};


/*
 * Gets called when the server is going to shutdown
 */
exports.stop = function() {
};


/*
 * Register to events after everything has loaded
 */
exports.register = function() {
};
