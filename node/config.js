var nconf = require('nconf');

nconf.file({ file: '/home/cabox/workspace/home-automation/config.json' });
 
nconf.load();
//nconf.set('name', 'Home-automation');

//nconf.set('plugins:pushbullet:folder', 'pushbullet');
//console.log(nconf.get('plugins'));

/**
* Get a JSON list with all the active plugins
*/
exports.getActivePlugins = function() {
	return nconf.get('plugins');

};

/**
* Remove a plugin from the configuration
*/
exports.removePlugin = function(name) {
	nconf.clear(configPlace);	
	console.log("Removing plugin");
	this.saveConfiguration();
};

/**
* Add a plugin to the configuration file
*/
exports.addPlugin = function(name, folder, options) {
	if (typeof options === undefined) {
		options = {};
	}
	
	var version = options.version !== undefined ? options.version : "0.0.1";
	var active = options.active !== undefined ? options.active : "true";
	var level = options.level !== undefined ? options.level : "1";
	
	var configPlace = 'plugins:' + name;
	
	nconf.set(configPlace + ':name', name);
	nconf.set(configPlace + ':folder', folder);
	nconf.set(configPlace + ':version', version);
	nconf.set(configPlace + ':active', active);
	nconf.set(configPlace + ':level', level);
	
	console.log("Added plugin");
	
	this.saveConfiguration();
};


/**
* Get the absolute path to the base directory
*/
exports.getAbsolutePath = function() {
	return nconf.get('abspath');
};

/**
* Save the changes to the configuration in a file
*/
exports.saveConfiguration = function() {
	nconf.save(function (err) {
		if (err) {
			console.error(err.message);
			return;
		}
		console.log('Configuration saved successfully.');
	});	
};
