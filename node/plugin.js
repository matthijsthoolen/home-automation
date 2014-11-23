var config = require('./config');
var fs = require('fs');

checkPlugins();
//installPlugin(); 

/**
* Check if all the plugins in the config file still exists, if not remove from config file
*/
function checkPlugins() {
	var plugins = config.getActivePlugins();
	var plugindir = config.getAbsolutePath() + 'plugins/';
	
	for(var plugin in plugins) {
		console.log(plugindir + plugins[plugin].folder);
		if (!fs.existsSync(plugindir + plugins[plugin].folder)) {
    		config.removePlugin(plugins[plugin].name);
			console.log("Removed plugin from config file: " + plugins[plugin].name); 
		}
	}
}

/**
* Remove a plugin from the plugin directory and from the config file
*/
function removePlugin() {
	
}

/**
* Install a new plugin
*/
function installPlugin() {
	config.addPlugin("Hue", "Hue", {});
}
