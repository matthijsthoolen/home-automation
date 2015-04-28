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
	this.setPluginVersion = setPluginVersion;
	this.getPluginInfo = getPluginInfo;
	this.getPluginName = getPluginName;
	this.getAbsolutePath = getAbsolutePath;
	this.getTempPath = getTempPath;
	this.getPluginFolder = getPluginFolder;
	this.getConfiguration = getConfiguration;
	this.setConfiguration = setConfiguration;
	this.loadCustomConfig = loadCustomConfig;
	this.removeCustomConfig = removeCustomConfig;
	this.getUniqueID = getUniqueID;
	this.setUniqueID = setUniqueID;
	this.getDeveloperInfo = getDeveloperInfo;
	this.getLatestVersion = getLatestVersion;
	
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
var getActivePlugins = function getActivePlugins() {
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
var getPlugins = function() {
	return nconf.get('plugins');
};


/*
 * Remove a plugin from the configuration
 *
 * @param {String} id
 */
var removePlugin = function(id) {
	nconf.clear('plugins:' + id);	
	log.debug('(Config:RemovePlugin) Removed ' + id + ' from the config');
	saveConfiguration();
};


/*
 * Deactivate a plugin in the settings
 *
 * @param {string} id
 */
var deactivatePlugin = function(id) {
	var configPlace = 'plugins:' + id;
	
	nconf.set(configPlace + ':active', false);
	
	saveConfiguration();
};


/*
 * Activate a plugin in the settings
 *
 * @param {string} id
 */
var activatePlugin = function(id) {
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
 *		developer {String}
 *		description {String}
 *		version {String} (default: 0.0.1)
 * 		active {Boolean} (default: true)
 *		level {Number} (default: 1)
 *		production {boolean} false
 * @param {function} callback
 */
var addPlugin = function(id, options, callback) {
	
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
	var developer = util.opt(options, 'developer', developer);
	var version = util.opt(options, 'version', '0.0.1');
	var active = util.opt(options, 'active', true);
	var level = util.opt(options, 'level', '1');
	var description = util.opt(options, 'description', 'No description available');
	var production = util.opt(options, 'production', false);
	
	var configPlace = 'plugins:' + id;
	
	nconf.set(configPlace + ':id', id);
	nconf.set(configPlace + ':name', name);
	nconf.set(configPlace + ':developer', developer);
	nconf.set(configPlace + ':folder', folder);
	nconf.set(configPlace + ':version', version);
	nconf.set(configPlace + ':active', active);
	nconf.set(configPlace + ':level', level);
	nconf.set(configPlace + ':description', description);
	nconf.set(configPlace + ':production', production);
	
	log.debug(prelog + ':AddPlugin) Added ' + name + ' ' + version + ' to the config');
	
	saveConfiguration(callback);
};


/*
 * Set the plugin info in the configuration file
 *
 * @param {string} id
 * @param {object} info 
 */
var setPluginInfo = function(id, info) {
	var configPlace = 'plugins:' + id;
	nconf.set(configPlace, info);	
	log.debug('(Config:setPluginInfo) Changed configuration for plugin ' + id);
	
	saveConfiguration();
};


/*
 * Set the plugin version
 *
 * @param {string} id
 * @param {object} options
 *		version {string}
 *		check {boolean} check if version is newer (default: true)
 */
var setPluginVersion = function(id, options) {
	var version = util.opt(options, 'version', false);
	var check = util.opt(options, 'check', true);
	
	var prelogFunc = prelog + ':setPluginVersion) ';
	
	if (typeof id === undefined || !version) {
		log.debug(prelogFunc + 'id or version is not given!');
		return false;
	}
	
	//Check if the new version is higher then the current version
	if (check) {
		var curVersion = getPluginInfo(id, {type: 'version'});
		
		if (!curVersion) {
			var tmp = getPluginInfo(id);
			
			if (!tmp) {
				log.debug(prelogFunc + 'The plugin with ID "' + id + '" couldn\'t be found!');
				return;
			}
			
			log.debug(prelogFunc + 'No version is currently set. Set the new version!');
		} else {
			if (curVersion >= version) {
				log.debug(prelogFunc + 'Tried to set version: ' + version + ' for id: ' + id + ' while current version is ' + curVersion);
				return false;
			}
		}
	}
	
	//Save the new version to the config file
	var configPlace = 'plugins:' + id + ':version';
	nconf.set(configPlace, version);
	saveConfiguration();
	
	log.debug(prelogFunc + 'Version for id: ' + id + ' set to ' + version);
	
	return true;
};


/*
 * Get all the info about a plugin
 *
 * @param {string} id
 * @param {object} options
 *		type {string} type of data (name, version etc)
 * @return {object} returns the plugin info
 */
var getPluginInfo = function(id, options) {
	var type = util.opt(options, 'type', false);
	
	//query or location
	var q = 'plugins:' + id;
	
	//If type is set, add the type to the end of the query
	if (type) {
		q += ':' + type;
	}
	
	var data = nconf.get(q);
	
	if (data === undefined) {
		data = false;
	}
	
	return data;
};


/*
 * Get the plugin name with the id
 *
 * @param {string} id
 * @return {string} name
 */
var getPluginName = function(id) {
	var name = nconf.get('plugins:' + id + ':name');
	
	return name;
};


/*
* Get the absolute path to the base directory
*
* @return {string} returns path
*/
var getAbsolutePath = function() {
	return nconf.get('abspath');
};


/*
 * Get the path of the temp folder
 * 
 * @return {string} returns the path to the temp folder
 */
var getTempPath = function() {
	return nconf.get('abspath') + nconf.get('tempfolder') + '/';
};


/*
 * Get the plugin (root) folder.
 *
 * @param {Array} options
 * 		abs {Boolean} Absolute path, default = true
 *		pluginname {string} pluginid (optional)
 * @return {string} returns the path to plugin folder or false on error
 */
var getPluginFolder = function(options) {
	var abs = util.opt(options, 'abs', true);
	var pluginname = util.opt(options, 'pluginname', null);
	var path = '';
	
	if (abs) {
		path = nconf.get('abspath');
	}
	
	path += nconf.get('pluginfolder') + '/';
	
	//If a plugin name is given, get the plugin specific folder
	if (pluginname !== null) {
		var folder = nconf.get('plugins:' + pluginname + ':folder');
		if (typeof folder === 'undefined') {
			return false;
		}
		path += folder;
	}
	
	return path;
	
	//return nconf.get('abspath') + nconf.get('pluginfolder') + '/';
};


/*
 * Get the latest version from the version.json file
 *
 * @param {object} options
 *		id {string} (required)
 * @param {function} callback
 */
var getLatestVersion = function(options, callback) {
	var id = util.opt(options, 'id', false);
	
	var message;
	var prelogFunc = prelog + ':getLatestVersion) ';
	
	if (!id) {
		message = prelogFunc + 'ID is required!';
		if (!util.doCallback(callback, {err: true, stderr: message})) {
			return false;
		}
		
	}
	
	message = nconf.get('server:' + id + ':version');
	
	if (typeof message === 'undefined') {
		message = false;
	}
	
	if (!util.doCallback(callback, {stdout: message})) {
		return message;
	}
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
var getUniqueID = function(options, callback) {
	
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
var setUniqueID = function(oldID, newID, callback) {
	if (oldID.indexOf('dev-') !== 0) {
		util.doCallback(callback, {err: true, stderr: 'This is not a dev plugin, can\'t change unique id!'});
		return;
	}
	
	var data = config.getPluginInfo(oldID);
	
	if (!data) {
		if (!util.doCallback(callback, {err: true, stderr: 'No plugin found with the oldID!'}))
			return false;
	}
	
	data.id = newID;
	
	//Add the old data with the new plugin. Wait until the callback before continuing
	this.addPlugin(newID, data, function(err, stdout, stderr) {
		if (err) {
			log.error(prelog + ': setUniqueID) We can\'t save the unique id. Error: ' + err);
			util.doCallback(callback, {err: true, stderr: err});
		}
		
		//Now we can safely remove the old record
		config.removePlugin(oldID);
		
		saveConfiguration();
		
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
var getConfiguration = function(name) {
	return nconf.get(name);
};


/*
 * Set configuration in the file for the given configuration settings. Can be
 * multiple settings at once in a object.
 *
 * @param {object} options:
 *		setting {mixed}
 *		location {string}
 * @return {boolean}
 */
var setConfiguration = function(options, callback) {
	var setting = util.opt(options, 'setting', null);
	var location = util.opt(options, 'location', null);
	
	console.log(options);
	
	var message;
	var prelogConf = prelog + ':setConfiguration) ';
	
	if (!setting || !location) {
		message = prelogConf + 'setting or location is not given!';
		log.debug(message);
		
		if (!util.doCallback(callback, {err: true, stderr: message})) {
			return message;
		}
	}
	
	log.info('setting = ' + setting + ' and location = ' + location);
	
	nconf.set(location, setting);
	
/* 	for(var name in options) {
		var setting = options[name];
		
		log.info('setting = ' + setting + ' and name = ' + name);
		
		nconf.set(location, setting);
	} */
	
	saveConfiguration();
	
	util.doCallback(callback, {stdout: 'Set configuration succesfull'});
};


/*
 * Load a seperate nconf file
 *
 * @param {object} options
 * 		abspath {string}
 *		name {string} Do not use 'file'! (default: temp)
 * @return {string} name
 */
var loadCustomConfig = function(options) {
	var abspath = util.opt(options, 'abspath', null);
	var name = util.opt(options, 'name', 'temp');
	
	var message;
	var prelogFunc = prelog + 'loadCustomConfig) ';
	
	//Make sure not to overwrite
	if (name === 'file') name = 'temp';
	
	//Make sure the file exists, else just return
	if (!util.fileExists(abspath)) return;

	try {
		nconf.use(name, { type: 'file', file: abspath });
	} catch (e) {
		message = prelogFunc + 'Error with loading custom config. ' + e;
		log.debug(message);
		return false;
	}
	
	return name;
};


/*
 * Remove custom loaded config
 *
 * @param {object} options
 *		name {string} Do not use 'file'!
 * @return {boolean}
 */
var removeCustomConfig = function(options) {
	var name = util.opt(options, 'name', null);
	
	//Make sure not to remove default
	if (name === 'file' || name === null) return;
	
	nconf.remove(name);
	
	return true;
};


/*
 * Get the info about the developer
 */
var getDeveloperInfo = function() {
	return nconf.get('developer');
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
				util.doCallback(callback, {err: true, stderr: message});
				try {
					log.error(message);
				} catch (e) {
					console.log(message);
				}
				return;
			}

			message = prelog + ':SaveConfiguration) Saved configuration without errors';
			util.doCallback(callback, {stdout: message});
			try {
				log.debug(message);
			} catch (e) {
				console.log(message);
			}
		});
	} catch (e) {
		message = prelog + ':SaveConfiguration) An error occured while saving!';
		util.doCallback(callback, {err: true, stderr: message});
		try {
			log.error(message);
		} catch (e) {
			console.log(message);
		}
	}
}
