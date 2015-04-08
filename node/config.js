var nconf = require('nconf');

nconf.file({ file: '../config.json' });
 
nconf.load();
//nconf.set('name', 'Home-automation');

//nconf.set('plugins:pushbullet:folder', 'pushbullet');
//console.log(nconf.get('plugins'));

/******************************************************************************\
 *																			  *
 *							Plugin Functions								  *
 *																			  *
\******************************************************************************/


/*
 * Get a JSON list with all the active plugins
 *
 * @return {JSON} list of all active plugins
 */
exports.getActivePlugins = function() {
	var plugins = nconf.get('plugins');
	var tmp = {};
	
	for(var name in plugins) {
		var plugin = plugins[name];
		
		if (plugin.active) {
			tmp[name] = plugin;
		}
	}
	
	return tmp;
};


/*
 * Get a list of all plugins
 *
 * @return {JSON}
 */
exports.getPlugins = function() {
	return nconf.get('plugins');
};


/*
 * Remove a plugin from the configuration
 *
 * @param {String} - name of the plugin
 */
exports.removePlugin = function(name) {
	nconf.clear('plugins:' + name);	
	log.debug('(Config:RemovePlugin) Removed ' + name + ' from the config');
	saveConfiguration();
};


/*
 * Deactivate a plugin in the settings
 *
 * @param {string} name
 */
exports.deactivatePlugin = function(name) {
	var configPlace = 'plugins:' + name;
	
	nconf.set(configPlace + ':active', false);
	
	saveConfiguration();
};


/*
 * Activate a plugin in the settings
 *
 * @param {string} name
 */
exports.activatePlugin = function(name) {
	var configPlace = 'plugins:' + name;
	
	nconf.set(configPlace + ':active', true);
	
	saveConfiguration();
};


/*
 * Add a plugin to the configuration file
 *
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
	
	saveConfiguration();
};


/*
 * Set the plugin info in the configuration file
 *
 * @param {string} name
 * @param {object} info 
 */
exports.setPluginInfo = function(name, info) {
	var configPlace = 'plugins:' + name;
	nconf.set(configPlace, info);	
	log.debug('(Config:setPluginInfo) Changed configuration for plugin ' + name);
	
	saveConfiguration();
};


/*
 * Get all the info about a plugin
 *
 * @returns {object} returns the plugin info
 */
exports.getPluginInfo = function(name, type) {
	return nconf.get('plugins:' + name);
};


/*
* Get the absolute path to the base directory
*
* @return {string} returns path
*/
exports.getAbsolutePath = function() {
	return nconf.get('abspath');
};


/*
 * Get the path of the temp folder
 * 
 * @return {string} returns the path to the temp folder
 */
exports.getTempPath = function() {
	return nconf.get('abspath') + nconf.get('tempfolder') + '/';
};


/*
 * Get the plugin (root) folder.
 *
 * @param {Array} options
 * 		abs {Boolean} Absolute path, default = true
 *		pluginname {string} pluginname (optional)
 * @return {string} returns the path to plugin folder
 */
exports.getPluginFolder = function(options) {
	var abs = util.opt(options, 'abs', true);
	var pluginname = util.opt(options, 'pluginname', null);
	var path = '';
	
	if (abs) {
		path = nconf.get('abspath');
	}
	
	path += nconf.get('pluginfolder') + '/';
	
	//If a plugin name is given, get the plugin specific folder
	if (pluginname !== null) {
		path += nconf.get('plugins:' + pluginname + ':folder');
	}
	
	return path;
	
	//return nconf.get('abspath') + nconf.get('pluginfolder') + '/';
};


/******************************************************************************\
 *																			  *
 *							General Functions								  *
 *																			  *
\******************************************************************************/


/*
 * Return the requested configuration name
 *
 * @return {mixed} returns the requested configuration
 */
exports.getConfiguration = function(name) {
	return nconf.get(name);
};


/*
 * Set configuration in the file for the given configuration settings. Can be
 * multiple settings at once in a object.
 *
 * @param {object} options:
 *		name: setting {mixed}
 * @return {boolean}
 */
exports.setConfiguration = function(options, callback) {
	
	for(var name in options) {
		var setting = options[name];
		
		nconf.set(name, setting);
	}
	
	saveConfiguration();
	
	callback(false, 'Set configuration succesfull', null);
};


/*
 * Load a seperate nconf file and get back 
 *
 * @param {object} options
 * 		abspath {string}
 * @return {nconf}
 */
exports.loadSeperateConfig = function(options) {
	var abspath = util.opt(options, 'abspath', null);
	
	//Make sure the file exists, else just return
	
	var customnconf = require('nconf');

	customnconf.file({ file: abspath });
 
	customnconf.load();
	
	return customnconf;
};

/*
* Save the changes to the configuration in a file
*/
function saveConfiguration() {
	var message;
	
	nconf.save(function (err) {
		if (err) {
			message = '(Config:SaveConfiguration) Error with saving configuration file ' + err.message;
			try {
				log.error(message);
			} catch (e) {
				console.log(message);
			}
			return;
		}
		
		message = '(Config:SaveConfiguration) Saved configuration without errors';
		try {
			log.error(message);
		} catch (e) {
			console.log(message);
		}
	});	
}
