/******************************************************************************\
 *																			  *
 *								Plugin actions								  *
 *																			  *
\******************************************************************************/

var prelog = '(Pluginmodule:action';

module.exports = function(callback) {
	
	parentCallback = callback;
	
	var ext = [];
	var int = [];
	
	ext.startAll = startAll;
	ext.stopAll = stopAll;
	ext.callFunction = callFunction;
	ext.getPluginInfo = getPluginInfo;
	ext.activate = activate;
	ext.deactivate = deactivate;
	
	int.startPlugin = startPlugin;
	int.stopPlugin = stopPlugin;
	
	return {ext: ext, int: int};
};

/*
 * Start the plugin.
 *
 * @param {string} id
 */
var startPlugin = function startPlugin(id, callback) {
	var pluginfolder = config.getPluginFolder({'abs': true});
	var plugininfo = config.getPluginInfo(id);
	
	if (!plugininfo) {
		if (!util.doCallback(callback, {err: true, stderr: 'No plugin info found'}))
			return false;
	}
	
	var pluginmainfile = plugininfo.folder + '/main.js';
	
	try {
		plugins[id] = require(pluginfolder + pluginmainfile);
	} catch (e) {
		log.info('Plugin not found: ' + plugininfo.name);
		return;
	}
	
	log.info(prelog + ':startPlugin) Started plugin "' + plugininfo.name + '"');
	
	//Start the plugin and send the name as a parameter
	plugins[id].start(id);
};


/*
 * Stop the plugin.
 *
 * @param {string} plugin: name of the plugin
 * @return {boolean}
 */
function stopPlugin(plugin) {	
	
	//Check if the plugin is already started and if so if it has a stop function
	if (plugins.hasOwnProperty(plugin) && typeof plugins[plugin].stop === "function") { 
		plugins[plugin].stop();
		log.info(prelog + ':stopPlugin) Stopped plugin "' + plugin + '"');
		return true;
	}

	return false;
}


/*
 * Start all the active plugins
 */
var startAll = function startAll() {	
	var plugins = config.getActivePlugins();
	
	log.info(prelog + ':startAll) Starting all plugins');
	
	for(var name in plugins) {
		startPlugin(name);
	}
};


/*
 * Start all the active plugins
 */
var stopAll = function stopAll() {
	var plugins = config.getActivePlugins();
	
	log.info(prelog + ':stopAll) Stopping all plugins');
	
	for(var name in plugins) {
		stopPlugin(name);
	}
};


/*
 * Call a plugin with the given function and parameters
 *
 * @param {string} plugin: name of the plugin
 * @param {string} functionname
 * @param {string} parameters
 * @param {object} info
 * @return {boolean}
 */
var callFunction = function callFunction(plugin, functionname, parameters, info) {
	//TODO: Check if parameters and info can be combined	
	
	//return false if the plugin is not loaded (doesn't exist in the array)
	if (!(plugin in plugins)) return false;
	
	//check if the given function is indeed a function
	if (typeof plugins[plugin][functionname] === "function") { 
		plugins[plugin][functionname](parameters, info);
		return true;
	}
	
	log.debug(prelog + ':callPlugin) The function "' + functionname + '" is not valid for the plugin: ' + plugin);
	
	return false;
};


/*
 * Get a object with all plugins. Can be filtered
 *
 * @param {object} filter
 * @return {object} 
 */
var getPluginInfo = function getPluginInfo(filter) {
	//TODO filter
	var plugins = config.getPlugins();
	var info = [];
	var tmp = {};
	
	int.getVersionList();
	
	//var versions = getVersionList();
	
	//console.log(versions);
	
	for(var name in plugins) {
		tmp = {};
		tmp.id = plugins[name].id;
		tmp.developer = plugins[name].developer;
		tmp.name = plugins[name].name;
		tmp.active = plugins[name].active;
		tmp.description = plugins[name].description;
		
		if (typeof tmp.description == 'undefined') {
			tmp.description = 'No description available';
		}
		
		tmp.version = plugins[name].version;
		tmp.newversion = config.getLatestVersion({id: tmp.id});
		tmp.update = false;
		
		//Check if there is a new version available
		if (tmp.newversion !== false && util.versionCompare(tmp.newversion, tmp.version) > 0) {
			tmp.update = true;
		}
		
		info.push(tmp);
	}
	
	return info;
};


/*
 * Activate the given plugin
 *
 * @param {string} id
 * @return {boolean}
 */
var activate = function activate(id, callback) {
	var info = config.getPluginInfo(id);
	
	//Build a response message
	var response = {
		id: id,
		action: 'activate'
	};
	
	if (!info) {
		response.status = 'failed';
		response.message = 'No plugin could be found!';
		if (!util.doCallback(callback, {err: true, stderr: response}))
			return false;
		
		return;
	}
	
	if (info.active) {
		log.info(prelog + ':activate) Plugin already activated: ' + info.name);
		
		response.status = 'done';
		response.message = 'Plugin was already activated!';
		
		if (!util.doCallback(callback, {stdout: response}))
			return true;
		
		return;
	}
	
	config.activatePlugin(id);
	
	log.info(prelog + ':activate) Activated the plugin: ' + info.name);
	
	startPlugin(id);
	
	response.status = 'done';
	response.message = 'Succesfully Activated plugin!';
	
	if (!util.doCallback(callback, {stdout: response}))
		return true;
};


/*
 * Deactivate a given plugin
 *
 * @param {string} name
 * @return {boolean}
 */
var deactivate = function deactivate(id, callback) {
	var info = config.getPluginInfo(id);
	
	//Build a response message
	var response = {
		id: id,
		action: 'deactivate'
	};
	
	if (!info) {
		log.debug(prelog + ':deactivate) Requested the information of ' + id + ' but nothing found');
		
		response.message = 'No plugin info could be found';
		response.status = 'failed';
		
		util.doCallback(callback, {err: true, stderr: response});
		
		return;
	}
	
	if (!info.active) {
		log.info(prelog + ':deactivate) Plugin already deactivated: ' + info.name);
		
		response.message = 'Plugin already deactivated';
		response.status = 'done';
		
		if (!util.doCallback(callback, {stdout: response}))
			return true;
		
		return;
	}
	
	stopPlugin(id);

	config.deactivatePlugin(id);
	
	log.info(prelog + ':deactivate) Deactivated the plugin: ' + id);
	
	response.message = 'Succesfully deactivated the plugin!';
	response.status = 'done';
	
	if (!util.doCallback(callback, {stdout: response}))
		return true;
};