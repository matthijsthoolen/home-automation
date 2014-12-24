var nconf = require('nconf');

nconf.file({ file: '/home/cabox/workspace/home-automation/config.json' });
 
nconf.load();
//nconf.set('name', 'Home-automation');

//nconf.set('plugins:pushbullet:folder', 'pushbullet');
//console.log(nconf.get('plugins'));

/*
 * Get a JSON list with all the active plugins
 * @return {JSON} list of all plugins
 */
exports.getActivePlugins = function() {
	return nconf.get('plugins');
};

/*
 * Remove a plugin from the configuration
 * @param {String} - name of the plugin
 */
exports.removePlugin = function(name) {
	nconf.clear('plugins:' + name);	
	log.debug('(Config:RemovePlugin) Removed ' + name + ' from the config');
	config.saveConfiguration();
};

/*
 * Add a plugin to the configuration file
 * @param {String} - Name of plugin
 * @param {Folder} - Home folder of the plugin
 * @param {Array} options:
 *		version {String} (default: 0.0.1)
 * 		active {Boolean} (default: true)
 *		level {Number} (default: 1)
 */
exports.addPlugin = function(name, folder, options) {
	if (typeof options === undefined) {
		options = {};
	}
	
	var version = util.opt(options, 'version', '0.0.1');
	var active = util.opt(options, 'active', true);
	var level = util.opt(options, 'level', '1');
	
	var configPlace = 'plugins:' + name;
	
	nconf.set(configPlace + ':name', name);
	nconf.set(configPlace + ':folder', folder);
	nconf.set(configPlace + ':version', version);
	nconf.set(configPlace + ':active', active);
	nconf.set(configPlace + ':level', level);
	
	log.debug('(Config:AddPlugin) Added ' + name + ' ' + version + ' to the config');
	
	this.saveConfiguration();
};

exports.getPluginInfo = function(name, type) {
	return nconf.get('plugins:' + name);
};

/**
* Get the absolute path to the base directory
*/
exports.getAbsolutePath = function() {
	return nconf.get('abspath');
};

/*
 * Get the path of the temp folder
 */
exports.getTempPath = function() {
	return nconf.get('abspath') + nconf.get('tempfolder') + '/';
};

/*
 * Get the plugin (root) folder.
 */
exports.getPluginFolder = function() {
	return nconf.get('abspath') + nconf.get('pluginfolder') + '/';
};

/**
 * Return the requested configuration name
 */
exports.getConfiguration = function(name) {
	return nconf.get(name);
};

/**
* Save the changes to the configuration in a file
*/
exports.saveConfiguration = function() {
	nconf.save(function (err) {
		if (err) {
			log.error('(Config:SaveConfiguration) Error with saving configuration file ' + err.message);
			return;
		}
		log.debug('(Config:SaveConfiguration) Saved configuration without errors');
	});	
};
