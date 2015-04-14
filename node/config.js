var	nconf, 
	prelog, 
	parentCallback;

module.exports = function(callback) {
	parentCallback = callback;
	
	nconf = require('nconf');

	prelog = '(config';

	try {
		//nconf.add('default', {type: 'file', file: '../config.json' });
		nconf.file({ file: '../config.json' });

		nconf.load(function(err, stdout, stderr) {
			parentCallback(false, 2, null);
		});
	} catch (e) {
		console.log(prelog + ') There is an error with the config.json file');
		parentCallback(true, null, 1);
	}
	
	this.getActivePlugins = getActivePlugins;
	this.getPlugins = getPlugins;
	this.removePlugin = removePlugin;
	this.deactivatePlugin = deactivatePlugin;
	this.activatePlugin = activatePlugin;
	this.addPlugin = addPlugin;
	this.setPluginInfo = setPluginInfo;
	this.getPluginInfo = getPluginInfo;
	this.getAbsolutePath = getAbsolutePath;
	this.getTempPath = getTempPath;
	this.getPluginFolder = getPluginFolder;
	this.getConfiguration = getConfiguration;
	this.setConfiguration = setConfiguration;
	this.loadCustomConfig = loadCustomConfig;
	
	return this;
};


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
getActivePlugins = function getActivePlugins() {
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
getPlugins = function() {
	return nconf.get('plugins');
};


/*
 * Remove a plugin from the configuration
 *
 * @param {String} - name of the plugin
 */
removePlugin = function(name) {
	nconf.clear('plugins:' + name);	
	log.debug('(Config:RemovePlugin) Removed ' + name + ' from the config');
	saveConfiguration();
};


/*
 * Deactivate a plugin in the settings
 *
 * @param {string} name
 */
deactivatePlugin = function(name) {
	var configPlace = 'plugins:' + name;
	
	nconf.set(configPlace + ':active', false);
	
	saveConfiguration();
};


/*
 * Activate a plugin in the settings
 *
 * @param {string} name
 */
activatePlugin = function(name) {
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
addPlugin = function(name, folder, options) {
	
	//Check if name is given and is a valid name
	if (typeof name === 'undefined' || name === '' || name === null) {
		log.debug(prelog + ':addPlugin) Tried to add plugin without a name');
		return;
	}
	
	//Make sure a folder is given and is valid
	if (typeof folder === 'undefined' || folder === '' || folder === null) {
		log.debug(prelog + ':addPlugin) Tried to add plugin without a folder');
		return;
	}
	
	if (typeof options === undefined) {
		options = {};
	}
	
	var version = util.opt(options, 'version', '0.0.1');
	var active = util.opt(options, 'active', true);
	var level = util.opt(options, 'level', '1');
	var description = util.opt(options, 'description', 'No description available');
	
	var configPlace = 'plugins:' + name;
	
	nconf.set(configPlace + ':name', name);
	nconf.set(configPlace + ':folder', folder);
	nconf.set(configPlace + ':version', version);
	nconf.set(configPlace + ':active', active);
	nconf.set(configPlace + ':level', level);
	nconf.set(configPlace + ':level', description);
	
	log.debug(prelog + ':AddPlugin) Added ' + name + ' ' + version + ' to the config');
	
	saveConfiguration();
};


/*
 * Set the plugin info in the configuration file
 *
 * @param {string} name
 * @param {object} info 
 */
setPluginInfo = function(name, info) {
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
getPluginInfo = function(name, type) {
	var data = nconf.get('plugins:' + name);
	
	if (data === undefined) {
		data = false;
	}
	
	return data;
};


/*
* Get the absolute path to the base directory
*
* @return {string} returns path
*/
getAbsolutePath = function() {
	return nconf.get('abspath');
};


/*
 * Get the path of the temp folder
 * 
 * @return {string} returns the path to the temp folder
 */
getTempPath = function() {
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
getPluginFolder = function(options) {
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


/*
 * Get the unique plugin identifier with the plugin name and/or the pluginfolder
 *
 * @param {object} options:
 *		name {string} the pluginname
 *		folder {string} the pluginfolder
 * @param {function} callback
 * @return {callback}
 */
exports.getUniqueID = function() {
	
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
getConfiguration = function(name) {
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
setConfiguration = function(options, callback) {
	
	for(var name in options) {
		var setting = options[name];
		
		nconf.set(name, setting);
	}
	
	saveConfiguration();
	
	callback(false, 'Set configuration succesfull', null);
};


/*
 * Load a seperate nconf file
 *
 * @param {object} options
 * 		abspath {string}
 *		name {string} Do not use 'file'! (default: temp)
 * @return {string} name
 */
loadCustomConfig = function(options) {
	var abspath = util.opt(options, 'abspath', null);
	var name = util.opt(options, 'name', 'temp');
	
	//Make sure not to overwrite
	if (name === 'file') name = 'temp';
	
	//Make sure the file exists, else just return
	if (!util.fileExists(abspath)) return;

	nconf.use(name, { type: 'file', file: abspath });
	
	return name;
};


/*
 * Remove custom loaded config
 *
 * @param {object} options
 *		name {string} Do not use 'file'!
 * @return {boolean}
 */
removeCustomConfig = function(options) {
	var name = util.opt(options, 'name', null);
	
	//Make sure not to remove default
	if (name === 'file' || name === null) return;
	
	nconf.remove(name);
	
	return true;
};


/*
* Save the changes to the configuration in a file
*/
function saveConfiguration() {
	var message;
	
	try {
		nconf.save(function (err) {
			if (err) {
				message = prelog + ':SaveConfiguration) Error with saving configuration file ' + err.message;
				try {
					log.error(message);
				} catch (e) {
					console.log(message);
				}
				return;
			}

			message = prelog + ':SaveConfiguration) Saved configuration without errors';
			try {
				log.debug(message);
			} catch (e) {
				console.log(message);
			}
		});
	} catch (e) {
		message = prelog + ':SaveConfiguration) An error occured while saving!';
		try {
			log.error(message);
		} catch (e) {
			console.log(message);
		}
	}
}
