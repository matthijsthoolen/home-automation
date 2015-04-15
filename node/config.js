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
	this.getUniqueID = getUniqueID;
	this.setUniqueID = setUniqueID;
	
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
	
	for(var id in plugins) {
		var plugin = plugins[id];
		
		if (plugin.active) {
			tmp[id] = plugin;
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
 * @param {String} id
 */
removePlugin = function(id) {
	nconf.clear('plugins:' + id);	
	log.debug('(Config:RemovePlugin) Removed ' + id + ' from the config');
	saveConfiguration();
};


/*
 * Deactivate a plugin in the settings
 *
 * @param {string} id
 */
deactivatePlugin = function(id) {
	var configPlace = 'plugins:' + id;
	
	nconf.set(configPlace + ':active', false);
	
	saveConfiguration();
};


/*
 * Activate a plugin in the settings
 *
 * @param {string} id
 */
activatePlugin = function(id) {
	var configPlace = 'plugins:' + id;
	
	nconf.set(configPlace + ':active', true);
	
	saveConfiguration();
};


/*
 * Add a plugin to the configuration file
 *
 * @param {String} - Name of plugin
 * @param {Array} options:
 *		folder {String} (required)
 *		name {String} (required)
 *		version {String} (default: 0.0.1)
 * 		active {Boolean} (default: true)
 *		level {Number} (default: 1)
 * @param {function} callback
 */
addPlugin = function(id, options, callback) {
	
	//Check if id is given and is a valid id
	if (typeof id === 'undefined' || id === '' || id === null) {
		log.debug(prelog + ':addPlugin) Tried to add plugin without an id');
		return;
	}
	
	var folder = util.opt(options, 'folder', null);
	
	//Make sure a folder is given and is valid
	if (folder === '' || folder === null) {
		log.debug(prelog + ':addPlugin) Tried to add plugin without a folder');
		return;
	}
	
	if (typeof options === undefined) {
		options = {};
	}
	
	var name = util.opt(options, 'name', id);
	var version = util.opt(options, 'version', '0.0.1');
	var active = util.opt(options, 'active', true);
	var level = util.opt(options, 'level', '1');
	var description = util.opt(options, 'description', 'No description available');
	
	var configPlace = 'plugins:' + id;
	
	nconf.set(configPlace + ':name', name);
	nconf.set(configPlace + ':folder', folder);
	nconf.set(configPlace + ':version', version);
	nconf.set(configPlace + ':active', active);
	nconf.set(configPlace + ':level', level);
	nconf.set(configPlace + ':level', description);
	
	log.debug(prelog + ':AddPlugin) Added ' + name + ' ' + version + ' to the config');
	
	saveConfiguration(callback);
};


/*
 * Set the plugin info in the configuration file
 *
 * @param {string} id
 * @param {object} info 
 */
setPluginInfo = function(id, info) {
	var configPlace = 'plugins:' + id;
	nconf.set(configPlace, info);	
	log.debug('(Config:setPluginInfo) Changed configuration for plugin ' + id);
	
	saveConfiguration();
};


/*
 * Get all the info about a plugin
 *
 * @param {string} id
 * @returns {object} returns the plugin info
 */
getPluginInfo = function(id, type) {
	var data = nconf.get('plugins:' + id);
	
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
getUniqueID = function(options, callback) {
	
};


/*
 * Set the unique plugin identifier for a given plugin. 
 * Note that the unique identifier will only change when the current unique 
 * identifier starts with 'dev-'.
 *
 * @param {string} oldID
 * @param {string} newID
 * @param {function} callback
 * @return {boolean}
 */
setUniqueID = function(oldID, newID, callback) {
	if (oldID.indexOf('dev-') !== 0) {
		util.doCallback(callback, {err: true, stderr: 'This is not a dev plugin, can\'t change unique id!'});
		return;
	}
	
	var data = this.getPluginInfo(oldID);
	
	if (!data) {
		if (!util.doCallback(callback, {err: true, stderr: 'No plugin found with the oldID!'}))
			return false;
	}
	
	//Add the old data with the new plugin. Wait until the callback before continuing
	this.addPlugin(newID, data, function(err, stdout, stderr) {
		if (err) {
			log.error(prelog + ': setUniqueID) We can\'t save the unique id. Error: ' + err);
			util.doCallback(callback, {err: true, stderr: err});
		}
		
		//Now we can safely remove the old record
		this.removePlugin(oldID);
		
		util.doCallback(callback, {stdout: 'Succesfully changed the unique id!'});
	});
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
*
* @param {function} callback
*/
function saveConfiguration(callback) {
	var message;
	
	try {
		nconf.save(function (err) {
			if (err) {
				message = prelog + ':SaveConfiguration) Error with saving configuration file ' + err.message;
				callback(true, null, 'Error while saving!');
				try {
					log.error(message);
				} catch (e) {
					console.log(message);
				}
				return;
			}

			message = prelog + ':SaveConfiguration) Saved configuration without errors';
			callback(false, 'Configuration saved!');
			try {
				log.debug(message);
			} catch (e) {
				console.log(message);
			}
		});
	} catch (e) {
		message = prelog + ':SaveConfiguration) An error occured while saving!';
		callback(true, null, 'Error while saving!');
		try {
			log.error(message);
		} catch (e) {
			console.log(message);
		}
	}
}
