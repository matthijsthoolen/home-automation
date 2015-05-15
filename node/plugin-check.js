/******************************************************************************\
 *																			  *
 *							Config actions									  *
 *																			  *
\******************************************************************************/


/*
 * Check if a plugin is removable (production apps are not removable). 
 *
 * @param {string} name
 * @return {boolean}
 */
function pluginRemovable(name, callback) {
	var info = config.getPluginInfo(name);
	
	if (!info) {
		if (!util.doCallback(callback, {err: true, stderr: 'No plugin info could be found'}))
			return false;
	}
	
	if (info.production) {
		if (!util.doCallback(callback, {err: true, stderr: 'Production plugin can\'t be removed'}))
			return false;
	}
	
	if (!util.doCallback(callback, {stdout: true}))
		return true;
}


/*
 * Check if a plugin is installed
 * 
 * @param {string} id
 * @param {object} options
 * @param {function} callback
 * @return {boolean}
 */
exports.checkInstalled = function(id, options, callback) {
	
	//If the plugin name is not available, we assume that the plugin is not installed
	if (!config.getPluginName(id)) {
		util.doCallback(callback, {stdout: false});
		return false;
	}
	
	//Else the plugin is installed
	util.doCallback(callback, {stdout: true});
	return true;
	
};


/*
* Check if all the plugins in the config file still exists, if not remove from config file
*/
exports.checkConfig = function() {
	var plugins = config.getActivePlugins();
	var plugindir = config.getPluginFolder();
	
	for(var plugin in plugins) {
		if (!fs.existsSync(plugindir + plugins[plugin].folder)) {
    		config.removePlugin(plugins[plugin].name);
			log.info(prelog + ':checkConfig) Removed plugin from config file: ' + plugins[plugin].name); 
		}
	}
};


/*
 * Check the plugin folder for plugins who are not added to the config file. Add the plugins to
 * the config file, but do not activate them.
 */
exports.checkFolder = function(callback) {
	var foldersDir = util.listDirectory({abspath: config.getPluginFolder(), folders: true, files: false});
	
	var message;
	var prelogFunc = prelog + ':checkFolder) ';
	
	if (typeof foldersDir === 'undefined') return;
	
	var foldersConf = [];
	var info = config.getPlugins();
	
	for (var name in info) {
		foldersConf.push(info[name].folder);
	}
	
	var dif = util.arrayDif(foldersDir, foldersConf);
	var pluginsfolder = config.getPluginFolder();
	var confName;
	
	for (var folder in dif) {
		//confName = config.loadCustomConfig({abspath: pluginsfolder + dif[folder] + '/config.json'});
		var file = pluginsfolder + dif[folder] + '/config.json';
		
		util.getFileContent({file: file, json: true}, function (err, stdout, stderr) {
			if (err) {
				log.debug(prelogFunc + 'problem with receiving content from plugin config file.');
				util.doCallback(callback, {err: true, stderr: stderr});
				return;
			}
			
			//If packageconfig is not defined
			if (!stdout.content.hasOwnProperty("packageconfig")) {
				message = prelogFunc + 'getFileContent returned wrong data, cant find plugin info!';
				util.doCallback(callback, {err: true, stderr: message});
				log.debug(message);
				return;
			}
			
			var data = stdout.content.packageconfig;
			
			var pluginid = data.id;
		
			if (pluginid === undefined || pluginid === '') {
				log.debug(prelog + ':checkFolder) The pluginfolder "' + dif[folder] + '" does not contain a pluginid. Plugin can\'t be added!');
				util.doCallback(callback, {err: true, stderr: 'pluginid is not available'});
				return;
			}

			var options = {
				folder: dif[folder],
				name: data.name,
				version: data.version,
				level: data.level,
				description: data.description,
				active: false
			};

			config.addPlugin(pluginid, options);
			log.info(prelog + ':checkFolder) Found a new plugin inside the plugin directory. Added to config: ' + pluginid);
			
			
		});
	}
	
	config.removeCustomConfig({name: confName});

};