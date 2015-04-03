var fs = require('fs'),
	sys = require('sys'),
    exec = require('child_process').exec;

var prelog = '(Pluginmodule:';

exports.test = function() {
	plugin.check();
	//plugin.getVersionList();
	//plugin.install('pushbullet', {'version':'0.1'}); 
	//log.info('hello there');
	//versioninfo = getVersionList({'force': false});
	plugin.remove('pushbullet');
/* 	plugin.update('pushbullet', {'version':'1.0'}, function(err, stdout, stderr) {
		log.info(err + stdout + stderr);
	});  */
	
	//log.info('version 2.0 = ' + versioninfo.get('pushbullet'));
};


/*
 * Start the plugin script, and set some variables.
 */
exports.start = function() {
	
};


/*
 * On exit
 */
exports.stop = function() {
	stopAll();
};


/*
* Check if all the plugins in the config file still exists, if not remove from config file
*/
exports.check = function() {
	var plugins = config.getActivePlugins();
	var plugindir = config.getAbsolutePath() + 'plugins/';
	
	for(var plugin in plugins) {
		if (!fs.existsSync(plugindir + plugins[plugin].folder)) {
    		config.removePlugin(plugins[plugin].name);
			log.info('(Plugins:Check) Removed plugin from config file: ' + plugins[plugin].name); 
		}
	}
};


/*
 * Start the plugin.
 *
 * @param {string} plugin: name of the plugin
 */
function startPlugin(plugin) {
	var pluginfolder = config.getPluginFolder({'abs': true});
	var plugininfo = config.getPluginInfo(plugin);
	var pluginmainfile = plugininfo.folder + '/main.js';
	
	plugins[plugin] = require(pluginfolder + pluginmainfile);
	
	log.info('(Plugins:start) Started plugin "' + plugin + '"');
	
	//Start the plugin and send the name as a parameter
	plugins[plugin].start(plugin);
}


/*
 * Start the plugin.
 *
 * @param {string} plugin: name of the plugin
 * @return {boolean}
 */
function stopPlugin(plugin) {	
	log.info('(Plugins:stop) Stopped plugin "' + plugin + '"');
	
	//Check if the plugin is already started and if so if it has a stop function
	if (plugins.hasOwnProperty(plugin) && typeof plugins[plugin].stop === "function") { 
		plugins[plugin].stop();
		return true;
	}

	return false;
}


/*
 * Start all the active plugins
 */
exports.startAll = function() {
	var plugins = config.getActivePlugins();
	
	log.info('(Plugins:startAll) Starting all plugins');
	
	for(var name in plugins) {
		startPlugin(name);
	}
};


/*
 * Start all the active plugins
 */
function stopAll() {
	var plugins = config.getActivePlugins();
	
	log.info('(Plugins:stopAll) Stopping all plugins');
	
	for(var name in plugins) {
		stopPlugin(name);
	}
}


/*
 * Remove a plugin from the plugin directory and from the config file
 *
 * @param {string} name: plugin name
 * @return {boolean}
 */
exports.remove = function(name) {
	var plugindir = config.getPluginFolder() + name; 
	
	stopPlugin(name);
	
	//If the plugin is unremovable only deactivate it
	if (!pluginRemovable(name)) {
		config.deactivatePlugin(name);
		return true;
	}
	
	util.delete({'path': plugindir, type: 2, 'root': true}, 
		function(err, stdout, stderr) 
	{
		if (!err) {
			log.info('Plugin ' + name + ' removed from plugin directory');
			config.removePlugin(name);
			return true;
		}
		
		log.error('(Plugin:Remove) Not removed ' + stderr);
		return false;
		
	});
};


/*
 *
 */
function pluginRemovable(name) {
	var info = config.getPluginInfo(name);
	
	if (info.production) {
		return false;
	}
	
	return true;
}


/*
 * Install a new plugin
 *
 * @param {string} name: name of the plugin
 * @param {object} options
 */
exports.install = function(name, options) {
	var version = util.opt(options, 'version', '0.0.1');
	var folder = name;
	var plugindir = config.getPluginFolder();
	
	downloadFile(folder, version, function(err, tempfolder, stderr) {
		util.move({'old': tempfolder, 'new': plugindir, 'type': 2, 'root': true}, 
			function(err, stdout, stderr) 
		{
			if (err) {
				util.delete({'path':tempfolder+folder, 'type':2, 'root':true}, null);
				log.error('(Plugin:Install) Can\'t move file! ' + stderr);
			} else {
				log.debug('(Plugin:Install) Moved pluginfolder from temp to plugin folder');
				config.addPlugin(name, name, {'version':version});
				log.info('Plugin ' + name + ' installed!');
			}
		});
	});
	
};


/* 
 * Download updated plugin files and replace the old files, keep the old config. 
 *
 * @param {String} name
 * @param {Array} options
 * 		New version {String} 
 * @param {Function} Callback
 */
exports.update = function(name, options, callback) {
	var version = util.opt(options, 'version', '1.0');
	var folder = name;
	var tempdir = config.getTempPath();
	var plugindir = config.getPluginFolder();
	var pluginconfig = config.getPluginInfo('pushbullet', 'test');
	var backup = false;
	var backupfolder = tempdir + 'backup/';
	
	exec('mkdir ' + backupfolder);
	
	//Backup folder to temp folder
	exec('cp -r ' + plugindir + pluginconfig.folder + ' ' + backupfolder, 
		function(err, stdout, stderr) 
	{
		if (!err) {
			backup = true;
		} else {
			log.error('(Plugin:Update) Backup plugin failed: ' + err);
			backup = 'error';
		}
		
		log.debug('(Plugin:Update) Backup made before updating for: ' + name);
		
	});
	
	//Download the file from the server
	downloadFile(folder, version, function(err, tempfolder, stderr) {
		
		//Return if there is an error with the download
		if (err) {
			log.debug('(Plugin:Update) Problem with downloading file');
			callback(true, null, 'Can\'t download plugin file, please try again later.');
			return;
		}
		
		//var update = require(tempfolder);
		var update = require(config.getAbsolutePath() + 'plugins/pushbullet-production/update.js');
		
		//Wait until the backup is completed or there is an error with the backup
		while (backup !== true) {
			log.info('waiting');
			if (backup == 'error') {
				log.info('(Plugin:Update) Stopped plugin update, error in backup!');
				callback(true, null, 'Problems with plugin backup');
				return;
			} 
		}
		
		//Start the plugin specific update process.
		update.start({'currentinfo': pluginconfig, 'newversion': version, 'tempfolder': tempfolder}, 
			function(err, stdout, stderr) 
		{
			if (!err) {
				log.debug('(Plugin:Update) Plugin specific update completed.');
				
				var oldPlugin = config.getPluginFolder() + pluginconfig.folder;
				var tempPlugin = tempfolder + folder;
				
				//Delete the old plugin folder
				util.delete({'path': oldPlugin, 'type':2, 'root':true}, function(err, stdout, stderr) {
					if (err) {
						log.error('(Plugin:Update) Can\'t remove old plugin folder ' + name + '. Abort.');
						callback(true, null, 'Can\'t remove old plugin folder');
						return;
					}	
					
					//Move the new plugin folder to the plugin directory
					util.move({'old': tempfolder, 'new': oldPlugin, 'type':2, 'root': true}, 
						function (err, stdout, stderr) 
					{
						if (err) {
							log.debug('(Plugin:UpdatePlugin) Error with moving temp to plugin folder' + stderr);
							callback(true, null, 'can\'t move folder to plugin directory');
							return;
						}
						
						log.info('Plugin ' + name + ' is now updated to ' + version);
						callback(null, 'Plugin updated', null);
						
						//Set configuration file to new version
						pluginconfig.version = version;	
						config.setPluginInfo(name, pluginconfig);
						
						//delete the backup file
						util.delete({'path': backupfolder + name, 'type':2, 'root':true});
					});
				});
				
			} else {
				log.error('(Plugin:Update) Error with plugin specific update ' + stderr);
				callback(true, null, 'Error with plugin specific update see log for more details');
				return;
			}
			
		});
		
	});
};


/*
 * Async function to download a tar file from the server, unpack and remove tar.gz file
 * returns the folder name.
 *
 * @param {string} folder
 * @param {int} version
 * @param {function} callback
 */

function downloadFile(folder, version, callback) {
	var tempdir = config.getTempPath();
	var filename = version + '.tar.gz';
	var downloadserver = config.getConfiguration('downloadserver');
	var path;
	var downloadpath = downloadserver + folder + '/' + filename;
	
	exec('wget ' + downloadpath, {cwd: tempdir}, function(err, stdout, stderr) {
    	log.debug('(Plugin:DownloadFile) Downloaded file from server: \n' + err + " : "  + stdout);
		
		if (err) {
			log.error('(Plugin:DownloadFile) Problem with downloading file (' + downloadpath + ') ' + err);
			callback(true, null, 'Can\'t download plugin file from server. Abort!');
			return;
		}
		
		exec('tar -zxvf ' + filename, {cwd: tempdir }, function(err, stdout, stderr) {
			log.debug('(Plugin:DownloadFile) Unpacked plugin: ' + err + ' : ' + stdout);
			
			//If there is an error, abort and exit function
			if (err) {
				log.error('(Plugin:DownloadFile) Problem with unpacking file (' + filename + ') ' + stderr);
				callback(true, null, 'Can\'t unpack plugin file from server. Abort!');
				return;
			} 
			
			util.delete({'path':tempdir, 'type':1, 'filename': filename, 'root': true}, 
				function(err, stdout, stderr) 
			{	
				if (err) {
					log.debug('(Plugin:DownloadFile) DownloadFile error with removed tar.gz ' + stderr);
				} else {
					log.debug('(Plugin:DownloadFile) DownloadFile tar.gz removed');
				}
			});
			
			path = tempdir + folder;
			callback(null, path, null);
		});
	});
}


/* 
 * Get file with the most recent plugin versions from the server.
 * Returns nconf file with plugin versions.
 *
 * @param {object} options
 */
function getVersionList(options) {
	var tempdir = config.getTempPath();
	var server = config.getConfiguration('downloadserver');
	var force = util.opt(options, 'force', false);
	var nconf = require('nconf');
	
	exec('expr $(date +%s) - $(date +%s -r version.json)', {cwd:tempdir}, function(err, stdout, stderr) {
		log.info(err + ', stdout = ' + stdout + ' ,stderr = ' + stderr);
		
		/*
		Download new version file if:
		- current file is older then 30 minutes
		- An error occured (File not available)
		- If new file download is forced
		*/
		if (stdout > 1800 || err || force === true) {
			exec('wget ' + server + 'version.json', {cwd: tempdir}, function(err, stdout, stderr) {
				log.info('(Plugin:GetVersionList) Downloaded version file');
				exec('touch version.json', {cwd: tempdir});
			});	
		} else {
			log.debug(prelog + ':GetVersionList) Version file is recent enough'); 
		}
		
	});
	
	nconf.file('versions', tempdir + 'version.json');
	nconf.load();
	
	return nconf;
	
}


/*
 * Call a plugin with the given function and parameters
 *
 * @param {string} plugin: name of the plugin
 * @param {string} functionname
 * @param {string} parameters
 * @param {object} info
 */
exports.callFunction = function(plugin, functionname, parameters, info) {
	//TODO: Check if parameters and info can be combined	
	
	//return false if the plugin is not loaded (doesn't exist in the array)
	if (!(plugin in plugins)) return false;
	
	//check if the given function is indeed a function
	if (typeof plugins[plugin][functionname] === "function") { 
		plugins[plugin][functionname](parameters, info);
		return true;
	}
	
	log.info(prelog + 'callPlugin) The function "' + functionname + '" is not valid for the plugin: ' + plugin);
	
	return false;
};


/*
 * Get a object with all plugins. Can be filtered
 *
 * @param {object} filter
 * @return {object} 
 */
exports.getPluginInfo = function(filter) {
	var plugins = config.getActivePlugins();
	var info = [];
	var tmp = {};
	
	//var versions = getVersionList();
	
	//console.log(versions);
	
	for(var name in plugins) {
		tmp = {};
		tmp.name = plugins[name].name;
		tmp.active = plugins[name].active;
		tmp.description = 'No description available';
		tmp.version = plugins[name].version;
		tmp.update = true;
		
		info.push(tmp);
	}
	
	return info;
};