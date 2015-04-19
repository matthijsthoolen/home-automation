var fs = require('fs'),
	sys = require('sys'),
    exec = require('child_process').exec;

var prelog = '(Pluginmodule';

exports.test = function() {
	//plugin.check();
	//checkFolder();
	//plugin.getVersionList();
	//plugin.install('pushbullet', {'version':'0.1'}); 
	//log.info('hello there');
	//versioninfo = getVersionList({'force': false});
	//plugin.remove('pushbullet');
/* 	plugin.update('pushbullet', {'version':'1.0'}, function(err, stdout, stderr) {
		log.info(err + stdout + stderr);
	});  */
	
	//log.info('version 2.0 = ' + versioninfo.get('pushbullet'));
	
/* 	this.publish('dev-plug', function(err, stdout, stderr) {
		if (err) {
			console.log('lol, error...' + stderr);
		}
		
		console.log('output: ' + stdout);
	}); */
};


/*
 * Start the plugin script, and set some variables.
 */
exports.start = function() {
	checkConfig();
	checkFolder();
	getVersionList();
};


/*
 * On exit
 */
exports.stop = function() {
	stopAll();
};


/******************************************************************************\
 *																			  *
 *							Change plugin state								  *
 *																			  *
\******************************************************************************/


/*
 * Start the plugin.
 *
 * @param {string} id
 */
function startPlugin(id, callback) {
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
}


/*
 * Start the plugin.
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
exports.startAll = function() {
	var plugins = config.getActivePlugins();
	
	log.info(prelog + ':startAll) Starting all plugins');
	
	for(var name in plugins) {
		startPlugin(name);
	}
};


/*
 * Start all the active plugins
 */
function stopAll() {
	var plugins = config.getActivePlugins();
	
	log.info(prelog + ':stopAll) Stopping all plugins');
	
	for(var name in plugins) {
		stopPlugin(name);
	}
}


/******************************************************************************\
 *																			  *
 *							Config actions									  *
 *																			  *
\******************************************************************************/


/*
* Check if all the plugins in the config file still exists, if not remove from config file
*/
function checkConfig() {
	var plugins = config.getActivePlugins();
	var plugindir = config.getPluginFolder();
	
	for(var plugin in plugins) {
		if (!fs.existsSync(plugindir + plugins[plugin].folder)) {
    		config.removePlugin(plugins[plugin].name);
			log.info(prelog + ':checkConfig) Removed plugin from config file: ' + plugins[plugin].name); 
		}
	}
}


/*
 * Check the plugin folder for plugins who are not added to the config file. Add the plugins to
 * the config file, but do not activate them.
 */
function checkFolder(callback) {
	var foldersDir = util.listDirectory({abspath: config.getPluginFolder(), folders: true, files: false});
	
	if (typeof foldersDir === 'undefined') return;
	
	var foldersConf = [];
	var info = config.getPlugins();
	
	for (var name in info) {
		foldersConf.push(info[name].folder);
	}
	
	var dif = util.arrayDif(foldersDir, foldersConf);
	var pluginsfolder = config.getPluginFolder();
	
	for (var folder in dif) {
		var confName = config.loadCustomConfig({abspath: pluginsfolder + dif[folder] + '/config.json'});
		
		var pluginid = config.getConfiguration('packageconfig:id');
		
		if (pluginid === undefined || pluginid === '') {
			log.debug(prelog + ':checkFolder) The pluginfolder does not contain a pluginid. Plugin can\'t be added!');
			util.doCallback(callback, {err: true, stderr: 'pluginid is not available'});
			return;
		}
		
		var options = {
			folder: dif[folder],
			name: config.getConfiguration('packageconfig:name'),
			version: config.getConfiguration('packageconfig:version'),
			level: config.getConfiguration('packageconfig:level'),
			description: config.getConfiguration('packageconfig:description'),
			active: false
		};
		
		config.addPlugin(pluginid, options);
		log.info(prelog + ':checkFolder) Found a new plugin inside the plugin directory. Added to config: ' + pluginid);
	}
	
	config.removeCustomConfig({name: confName});

}


/*
 * Activate the given plugin
 *
 * @param {string} id
 * @return {boolean}
 */
exports.activate = function(id, callback) {
	var info = config.getPluginInfo(id);
	
	if (!info) {
		if (!util.doCallback(callback, {err: true, stderr: 'No plugin info found'}))
			return false;
	}
	
	if (info.active) {
		log.info(prelog + ':activate) Plugin already activated: ' + info.name);
		
		if (!util.doCallback(callback, {stdout: true}))
			return true;
	}
	
	config.activatePlugin(id);
	
	log.info(prelog + ':activate) Activated the plugin: ' + info.name);
	
	startPlugin(id);
	
	if (!util.doCallback(callback, {stdout: true}))
		return true;
};


/*
 * Deactivate a given plugin
 *
 * @param {string} name
 * @return {boolean}
 */
exports.deactivate = function(name, callback) {
	var info = config.getPluginInfo(name);
	
	if (!info) {
		log.debug(prelog + ':deactivate) Requested the information of ' + name + ' but nothing found');
		if (!util.doCallback(callback, {err: true, stderr: 'No plugin info could be found'}))
			return;
	}
	
	if (!info.active) {
		log.info(prelog + ':deactivate) Plugin already deactivated: ' + name);
		if (!util.doCallback(callback, {stdout: true}))
			return true;
	}
	
	stopPlugin(name);

	config.deactivatePlugin(name);
	
	log.info(prelog + ':deactivate) Deactivated the plugin: ' + name);
	
	if (!util.doCallback(callback, {stdout: true}))
		return true;
};


/******************************************************************************\
 *																			  *
 *							(un)install/update plugin						  *
 *																			  *
\******************************************************************************/


/*
 * Remove a plugin from the plugin directory and from the config file
 *
 * @param {string} name: plugin name
 * @return {boolean}
 */
exports.remove = function(name) {
	var plugindir = config.getPluginFolder({pluginname: name}); 
	
	//If the plugin is unremovable only deactivate it
	if (!pluginRemovable(name)) {
		return plugin.deactivate(name);
	}
	
	stopPlugin(name);	
	
	uninstall(name);
	
	util.delete({'path': plugindir, type: 2, 'root': true}, 
		function(err, stdout, stderr) 
	{
		console.log(stdout);
		if (!err) {
			config.removePlugin(name);
			log.info(prelog + ':remove) Plugin ' + name + ' removed from plugin directory');
			return true;
		}
		
		log.error(prelog + ':Remove) Not removed ' + stderr);
		return false;
		
	});
};


/*
 * Run the app specific uninstall procedure
 *
 * @param {string} name
 * @return {boolean}
 */
function uninstall(name) {
	//Check if the plugin is already started and if so if it has a stop function
	if (plugins.hasOwnProperty(name) && typeof plugins[name].uninstall === "function") { 
		if (!plugins[name].uninstall()) {
			log.debug(prelog + ':uninstall) There was a problem running the app specific uninstall procedure for ' + name);
			return false;
		}
		
		log.info(prelog + ':uninstall) App specific uninstall procedure completed for "' + name + '"');
	}
	
	return true;
}


/*
 * Install a new plugin
 *
 * @param {string} id
 * @param {object} options:
 *		name {string}
 *		version {string}
 * @param {function} callback
 */
exports.install = function(id, options, callback) {
	var name = util.opt(options, 'name', id);
	var version = util.opt(options, 'version', '0.0.1');
	var folder = id;
	var plugindir = config.getPluginFolder();
	
	downloadFile(folder, version, function(err, tempfolder, stderr) {
		util.move({'old': tempfolder, 'new': plugindir, 'type': 2, 'root': true}, 
			function(err, stdout, stderr) 
		{
			if (err) {
				util.delete({'path':tempfolder+folder, 'type':2, 'root':true}, null);
				log.error(prelog + ':install) Can\'t move file! ' + stderr);
			} else {
				log.debug('(Plugin:Install) Moved pluginfolder from temp to plugin folder');
				config.addPlugin(id, {'version':version, 'name': name, 'folder': folder});
				
				//install plugin dependencies
				util.installDependencies({'pluginname': name});
				
				log.info(prelog + ':install) Plugin ' + name + ' installed!');
			}
		});
	});
	
};


/* 
 * Download updated plugin files and replace the old files, keep the old config. 
 *
 * @param {Array} options
 *		id {String}
 * 		New version {String} 
 * @param {Function} Callback
 */
exports.update = function(options, callback) {	
	var id = util.opt(options, 'id', false);
	var version = util.opt(options, 'version', 'latest');
	var endOptions = {id: id, 
					  backupfolder: null, 
					  pluginfolder: null,
					  updatefile: null,
					  backup: false,
					  active: false,
					  changed: false};
	
	var message;
	var prelogFunc = prelog + ':update) ';
	
	if (!id) {
		message = prelogFunc + 'ID is required!';
		util.doCallback(callback, {err: true, stderr: message});
		return;
	}
	
	var pluginconfig = config.getPluginInfo(id);
	
	//Check if the plugin is found in the config
	if (!pluginconfig) {
		message = prelogFunc + 'No plugin info could be found';
		log.debug(message + 'for ' + id);
		
		if (!util.doCallback(callback, {err: true, stderr: message}))
			return false;
	}
	
	//deactivate the plugin
	plugin.deactivate(id);
	
	var folder = id;
	var tempdir = config.getTempPath();
	var plugindir = config.getPluginFolder({pluginname: id});
	endOptions.pluginfolder = plugindir;
	var backup = false;
	var backupfolder = tempdir + 'backup/';
	endOptions.backupfolder = backupfolder + pluginconfig.folder;
	endOptions.active = pluginconfig.active;
	
	if (!util.dirExists(backupfolder)) {
		fs.mkdirSync(backupfolder);
		message = prelogFunc + 'created backup folder in tmp directory.';
		log.debug(message);
	}
	
	//Backup folder to temp folder
	exec('cp -r ' + plugindir + ' ' + backupfolder, 
		function(err, stdout, stderr) 
	{
		if (!err) {
			backup = true;
			endOptions.backup = true;
		} else {
			message = prelogFunc + 'Backup plugin failed: ' + err;
			log.error(message);
			util.doCallback(callback, {err: true, stderr: message});
			backup = 'error';
			return;
		}
		
		message = prelogFunc + 'Backup made before updating for: ' + pluginconfig.name;
		log.debug(message);
		
	});
	
	var params = {folder: folder, version: version, id: id};
	
	//Download the file from the server
	downloadFile(params, function(err, tempfolder, stderr) {
		
		//Add the tempfolder to the endoptions if exists
		if (util.dirExists(tempfolder)) {
			endOptions.updatefile = tempfolder;
		}
		
		//Return if there is an error with the download
		if (err) {
			message = prelogFunc + 'Problem with downloading update file';
			log.debug(message);
			util.doCallback(callback, {stdout: message});
			restoreBackup(endOptions);
			return;
		}
		
		//var update = require(tempfolder);
		var update = require(config.getPluginFolder() + '/pushbullet-production/update.js');
		
		//Wait until the backup is completed or there is an error with the backup
		while (backup !== true) {
			if (backup == 'error') {
				log.info(prelogFunc + 'Stopped plugin update, error in backup!');
				callback(true, null, 'Problems with plugin backup');
				restoreBackup(endOptions);
				return;
			} 
		}
		
		//The update process is going to start here. There is a change that it will lead to changes.
		endOptions.changed = true;
		
		//Start the plugin specific update process.
		update.start({'currentinfo': pluginconfig, 'newversion': version, 'tempfolder': tempfolder}, 
			function(err, stdout, stderr) 
		{
			if (!err) {
				log.debug(prelogFunc + 'Plugin specific update completed.');
				
				var oldPlugin = plugindir;
				var tempPlugin = tempfolder + folder;
				
				//Delete the old plugin folder
				util.delete({'path': oldPlugin, 'type':2, 'root':true}, function(err, stdout, stderr) {
					
					if (err) {
						message = prelogFunc + 'Can\'t remove old plugin folder for ' + pluginconfig.name + '. Abort.';
						log.error(message);
						util.doCallback(callback, {err: true, stderr: message});
						restoreBackup(endOptions);
						return;
					}
					
					//Move the new plugin folder to the plugin directory
					util.move({'old': tempfolder, 'new': oldPlugin, 'type':2, 'root': true}, 
						function (err, stdout, stderr) 
					{
						if (err) {
							log.debug(prelog + ':update) Error with moving temp to plugin folder. Error:' + stderr);
							callback(true, null, 'can\'t move folder to plugin directory');
							restoreBackup(endOptions);
							return;
						}
						
						log.info(prelogFunc + 'Plugin ' + pluginconfig.name + ' is now updated to ' + version);
						util.doCallback(callback, {stdout: 'Plugin updated'});
						
						//Set configuration file to new version
						pluginconfig.version = version;	
						config.setPluginInfo(id, pluginconfig);
						
						//If the plugin was active, now start it again.
						if (pluginconfig.active) {
							startPlugin(id);
							util.doCallback(callback, {stdout: 'Plugin restarted'});
						}
						
						//delete the backup file
						util.delete({'path': endOptions.backupfolder, 'type':2, 'root':true});
					});
				});
				
			} else {
				log.error(prelog + ':update) Error with plugin specific update ' + stderr);
				callback(true, null, 'Error with plugin specific update see log for more details');
				restoreBackup(endOptions);
				return;
			}
			
		});
		
	});
};


/*
 * On error restore a backup of the plugin and remove all temp files. Set backup option
 * to false and the function will only clean up and don't put the backup back.
 *
 * @param {object} options:
 *		id {string}
 *		backupfolder {string}
 *		pluginfolder {string}
 *		updatefile {string}
 *		backup {boolean} restore the backup (default: true)
 *		active {boolean} (default: false)
 *		changed {boolean} changes to original files(default: false)
 * @param {function} callback
 */
function restoreBackup(options, callback) {
	var id = util.opt(options, 'id', null);
	var backupfolder = util.opt(options, 'backupfolder', null);
	var pluginfolder = util.opt(options, 'pluginfolder', null);
	var updatefile = util.opt(options, 'updatefile', null);
	var backup = util.opt(options, 'backup', true);
	var active = util.opt(options, 'active', false);
	var changed = util.opt(options, 'changed', false);
	
	var message;
	var prelogFunc = prelog + ':restoreBackup) ';
	
	//If the backup has to be restored to plugin folder
	if (backup && backupfolder !== null && pluginfolder !== null && changed) {
		
		//Check if there is still a folder at the plugin location, if so remove it before moving
		if (util.dirExists(pluginfolder)) {
			util.delete({path: pluginfolder, type: 2, root: true}, function (err, stdout, stderr) {
				if (err) {
					message = prelogFunc + 'Unable to remove the plugin folder. Please try to restore manually.';
					log.error(message + ' Error: ' + stderr);
					util.doCallback(callback, {err: true, stderr: message});
					return;
				}
				
				moveBackup(options, callback);
			});
		} else {
			moveBackup(options, callback);
		}
		
	} else if (backupfolder !== null) {
		util.delete({path: backupfolder, type: 2, root: true}, function (err, stdout, stderr) {
			if (err) {
				message = prelogFunc + 'Unable to automatically remove backup';
				log.error(message + ' Error: ' + stderr);
				util.doCallback(callback, {err: true, stderr: message});
				return;
			}
			
			message = prelogFunc + 'Successfully removed backup!';
			log.debug(message);
			util.doCallback(callback, {stdout: message});
		});
	}
	
	log.info('updatefile = ' + updatefile);
	
	//Remove update directory if not null
	if (updatefile !== null) {
		util.delete({path: updatefile, type: 2, root: true}, function (err, stdout, stderr) {
			if (err) {
				message = prelogFunc + 'Unable to remove the update directory.';
				log.error(message + ' Error: ' + stderr);
				util.doCallback(callback, {err: true, stderr: message});
				return;
			}
			
			message = prelogFunc + 'Successfully removed the update directory for id: ' + id;
			log.debug(message);
			util.doCallback(callback, {stdout: message});
		});
	}
	
	//Reactivate plugin if no backup and plugin was active before
	if (!backup && active) {
		plugin.start(id);
	}
}


/*
 * Second step for restoreBackup. Do not use seperately from restoreBackup!
  * @param {object} options:
 *		id {string}
 *		backupfolder {string}
 *		pluginfolder {string}
 *		active {boolean} (default: false)
 * @param {function} callback
 */
function moveBackup(options, callback) {
	var id = util.opt(options, 'id', null);
	var backupfolder = util.opt(options, 'backupfolder', null);
	var pluginfolder = util.opt(options, 'pluginfolder', null);
	var active = util.opt(options, 'active', false);
	
	var message;
	var prelogFunc = prelog + ':moveBackup) ';
	
	util.move({old: backupfolder, new: pluginfolder, type: 2, root: true}, function (err, stdout, stderr) {
		if (err) {
			message = prelogFunc + 'Unable to move the backupfolder to the plugin folder automatically!';
			log.error(message + ' Error: ' + stderr);
			util.doCallback(callback, {err: true, stderr: message});
			return;
		}
		
		message = prelogFunc + 'The backup has been restored to the original folder for id: ' + id + '!';
		log.info(message);
		util.doCallback(callback, {stdout: message});
		
		//Try to restart if the plugin is active
		if (active) {
			plugin.start(id);
		}
	});	
}


/*
 * Async function to download a tar file from the server, unpack and remove tar.gz file
 * returns the folder name.
 *
 * @param {object} options
 *		id {string} required
 *		folder {string} required
 *		version {string} (default: latest)
 * @param {function} callback
 */
function downloadFile(options, callback) {
	var id = util.opt(options, 'id', false);
	var folder = util.opt(options, 'folder', false);
	var version = util.opt(options, 'version', 'latest');
	
	var message;
	var prelogConf = prelog + ':downloadFile) ';
	
	if (!id || !folder) {
		message = prelogConf + 'ID and folder are required!';
		log.debug(message);
		util.doCallback(callback, {err: true, stderr: message});
		return;
	}
	
	if (version === 'latest' || typeof version === 'undefined') {
		version = config.getLatestVersion({id: id});
		
		if (typeof version === 'undefined') {
			message = prelogConf + 'Can not find a version for plugin with id ' + id + '. Unable to update!';
			log.debug(message);
			util.doCallback(callback, {err: true, stderr: message});
			return;
		}
	}
	
	var tempdir = config.getTempPath();
	var filename = version + '.tar.gz';
	var downloadserver = config.getConfiguration('downloadserver');
	
	var path;
	var downloadpath = downloadserver + folder + '/' + filename;
	
	exec('wget ' + downloadpath, {cwd: tempdir}, function(err, stdout, stderr) {
    	log.debug(prelogConf + 'Downloaded file from server: \n' + err + " : "  + stdout);
		
		if (err) {
			log.error(prelogConf + 'Problem with downloading file (' + downloadpath + ') ' + err);
			callback(true, null, 'Can\'t download plugin file from server. Abort!');
			return;
		}
		
		exec('tar -zxvf ' + filename, {cwd: tempdir}, function(err, stdout, stderr) {
			log.debug(prelogConf + 'Unpacked plugin: ' + stdout);
			
			//If there is an error, abort and exit function
			if (err) {
				log.error(prelogConf + 'Problem with unpacking file (' + filename + ') ' + stderr);
				callback(true, null, 'Can\'t unpack plugin file from server. Abort!');
				return;
			}
			
			//Get the actual unpackdir name
			var unpackDir = stdout.toString().split('/')[0];
			
			util.delete({'path':tempdir, 'type':1, 'filename': filename, 'root': true}, 
				function(err, stdout, stderr) 
			{	
				if (err) {
					log.debug(prelogConf + 'DownloadFile error with removed tar.gz ' + stderr);
				} else {
					log.debug(prelogConf + 'DownloadFile tar.gz removed');
				}
			});
			
			path = tempdir + unpackDir;
			callback(null, path, null);
		});
	});
}


/* 
 * Get file with the most recent plugin versions from the server.
 * Returns nconf file with plugin versions.
 *
 * @param {object} options
 * @param {function} callback
 */
function getVersionList(options, callback) {
	var tempdir = config.getTempPath();
	var server = config.getConfiguration('downloadserver');
	var force = util.opt(options, 'force', false);
	var nconf = require('nconf');
	
	var prelogFunc = prelog + ':getVersionList) ';
	var message;
	
	exec('expr $(date +%s) - $(date +%s -r version.json)', {cwd:tempdir}, function(err, stdout, stderr) {
		
		if (err) {
			message = prelogFunc + 'Error with checking version file. Error: ' + stderr;
			log.debug(message);
		}
		
		/*
		Download new version file if:
		- current file is older then 30 minutes
		- An error occured (File not available)
		- If new file download is forced
		*/		
		if (stdout > 1800 || err || force === true) {
			exec('wget -N ' + server + 'version.json', {cwd: tempdir}, function(err, stdout, stderr) {
				if (err) {
					message = prelogFunc + 'Error downloading version file: ' + stderr;
					log.error(message);
					util.doCallback(callback, {err: true, stderrr: message});
					return;
				}
				
				log.info(prelogFunc + 'Downloaded version file');
				exec('touch version.json', {cwd: tempdir});
			});	
		} else {
			log.debug(prelogFunc + 'Version file is recent enough'); 
		}
		
		nconf.file('versions', tempdir + 'version.json');
		nconf.load();
		
		util.doCallback(callback, {stdout: nconf});
		
	});
	
}


/******************************************************************************\
 *																			  *
 *								Plugin actions								  *
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
 * Call a plugin with the given function and parameters
 *
 * @param {string} plugin: name of the plugin
 * @param {string} functionname
 * @param {string} parameters
 * @param {object} info
 * @return {boolean}
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
	
	log.debug(prelog + ':callPlugin) The function "' + functionname + '" is not valid for the plugin: ' + plugin);
	
	return false;
};


/*
 * Get a object with all plugins. Can be filtered
 *
 * @param {object} filter
 * @return {object} 
 */
exports.getPluginInfo = function(filter) {
	//TODO filter
	var plugins = config.getPlugins();
	var info = [];
	var tmp = {};
	
	//var versions = getVersionList();
	
	//console.log(versions);
	
	for(var name in plugins) {
		tmp = {};
		tmp.id = plugins[name].id;
		tmp.name = plugins[name].name;
		tmp.active = plugins[name].active;
		tmp.description = plugins[name].description;
		
		if (typeof tmp.description == 'undefined') {
			tmp.description = 'No description available';
		}
		
		tmp.version = plugins[name].version;
		tmp.update = true;
		
		info.push(tmp);
	}
	
	return info;
};


/******************************************************************************\
 *																			  *
 *								Plugin production							  *
 *																			  *
\******************************************************************************/


/*
 * For developers only, an option to publish a plugin to the central server. The 
 * pluginfolder will first be tarred and then uploaded to the server. The server
 * will place it in the correct folder and update the references. 
 *
 * @param {string} id
 * @param {function} callback
 * @return {callback} default callback
 */
exports.publish = function(id, callback) {
	var folder = config.getPluginFolder({pluginname: id});
	var info = {};
	
	//Check if the plugin is already registered and if it's still valid
	util.checkPluginID({id: id}, function(err, stdout, stderr) {
		
		if (err) {
			var message = prelog + ':publish) An error occurred while publishing the plugin: ' + stderr;
			util.doCallback(callback, {err: true, stderr: message});
			return;
		}
		
		//Get all the plugin info and the developer info
		info.plugin = config.getPluginInfo(id);
		info.plugin.id = id;
		info.developer = config.getDeveloperInfo();
		
		//If it's a developer plugin it still has to be registered. Else we can continue to packPlugin
		if (stdout.type === 'dev') {
			registerPlugin(info, function(err, stdout, stderr) {
				if (err) {
					util.doCallback(callback, {err: true, stderr: stderr});
					return;
				}
				info.plugin.id = stdout.id;
				packPlugin(info, callback);
			});
		} else if (stdout.type === 'prod') {
			packPlugin(info, callback);
		}
		
	});
};


/*
 * Register a plugin in the pluginstore, plugindata will be send to the central 
 * server, the central server will generate a unique key for the plugin.$
 *
 * @param {object} info (required)
 *		plugin.id {string} (required)
 *		plugin.name {string} (required)
 *		plugin.description {string}
 *		plugin.version {string}
 *		developer.name {string} (required)
 *		developer.key {string} (required)
 * @param {function} callback
 * @return {callback}
 */
function registerPlugin(info, callback) {
	var message;
	
	//Make sure that info is available
	if (info === undefined) {
		message = prelog + 'registerPlugin) The info parameter is required!';
		util.doCallback(callback, {err: true, stderr: message});
		return;
	}
	
	//Make sure that info has the properties plugin and developer
	if (!info.hasOwnProperty('plugin') || !info.hasOwnProperty('developer')) {
		message = prelog + 'registerPlugin) Not all info is given'; 
		util.doCallback(callback, {err: true, stderr: message});
		return;
	}
	
	//The register URI on the server 
	var portal = 'http://preview.32urhzqdibxa8aorbk51fcdkq3zestt9us699c13dv64unmi.box.codeanywhere.com/home-automation-server/registerplugin.php';
	
	//Get all the needed info from the input, check if it is required
	var oldID = util.opt(info.plugin, 'id', null);
	var pluginname = util.opt(info.plugin, 'name', null);
	
	if (pluginname === null || oldID === null) {
		message = prelog + ':registerPlugin) Plugin name and old ID are required!';
		util.doCallback(callback, {err: true, stderr: message});
		return;
	}
	
	//Check if the ID is really a development ID.
	util.checkPluginID({id: oldID}, function(err, stdout, stderr) {
		
		if (err || stdout.type !== 'dev') {
			message = prelog + ':registerPlugin) Plugin is already registered';
			util.doCallback(callback, {err: true, stderr: message});
			return;
		}
	
		var plugindescription = util.opt(info.plugin, 'description', null);
		var pluginversion = util.opt(info.plugin, 'version', '0.1');

		var developer = util.opt(info.developer, 'name', null);
		var developerkey = util.opt(info.developer, 'key', null);

		if (developer === null || developerkey === null) {
			message = prelog + ':registerPlugin) No developer name or key is specified, both are required!';
			util.doCallback(callback, {err: true, stderr: message});
			return;
		}

		//Put all the data in a options object
		var options = {
			uri: portal,
			method: 'POST',
			datatype: 'json',
			data: {
				plugin: {
					name: pluginname,
					description: plugindescription,
					version: pluginversion
				},
				developer: {
					name: developer,
					key: developerkey
				}
			}
		};

		//Do the actual http request
		util.httpRequest(options, function(err, stdout, stderr) {
			if (err) {
				util.doCallback(callback, {err: true, stderr: stderr});
				return;
			}

			//If the server returns an error, do not continue
			if (stdout.err) {
				message = prelog + ':registerPlugin) Unable to register plugin to central server.';
				log.error(message + ' Error: ' + stdout.stderr);
				util.doCallback(callback, {err: true, stderr: message});
				return;
			}

			if (!(stdout.hasOwnProperty('stdout') && stdout.stdout.hasOwnProperty('id'))) {
				message = prelog + ':registerPlugin) Unable to register plugin to central server. The server response was not correct.';
				log.error(message + ' Response: (see next error log)');
				log.error(stdout);
				util.doCallback(callback, {err: true, stderr: message});
				return;
			}
			var newID = stdout.stdout.id;
			
			config.setUniqueID(oldID, newID);
			
			util.doCallback(callback, {stdout: {id: newID}});
		});
		
	});
}


/*
 * This function will generate a tar file from the given plugin. This plugin can be
 * used for distribution of the app through the plugin store. The folder is checked
 * for all the necessary files. 
 *
 * @param {object} info:
 *		id {string}
 *		folder {string} folder inside plugindirectory
 *		version {string}
 * @param {function} callback
 * @return {callback}
 */
function packPlugin(info, callback) {
	var id = util.opt(info.plugin, 'id', null);
	var version = util.opt(info.plugin, 'version', null);
	var message;
	
	if (id === null || version === null) {
		message = prelog + ':packPlugin) packPlugin both id and version must be given!';
		util.doCallback(callback, {err: true, stderr: message});
		return;
	}
	
	var targz = require('tar.gz');
	
	var filename = id + '-' + version + '.tar.gz';
	
	var folder = config.getPluginFolder({pluginname: id});
	var temp = config.getTempPath() + filename;
	
	//Check if the folder or temp path are incorrect
	if (!folder || !temp) {
		message = prelog + ':packPlugin) PackPlugin folder or temppath are incorrect';
		util.doCallback(callback, {err: true, stderr: message});
		return;
	}
	
	log.debug(prelog + 'Compressing: ' + folder + ' to: ' + temp);
	
	//Do the actual file compression
	var compress = new targz().compress(folder, temp, function(err){
		if(err) {
			var message = prelog + ':packPlugin)' + err;
			log.error(message);
			util.doCallback(callback, {err: true, stderr: message});
			return;
		}
		
		log.debug(prelog + ':packPlugin) Successfully packed the plugin to tempfolder/' + filename);
		
		info.plugin.tarpath = temp;
		info.plugin.filename = filename;
		
		//Continue to the upload step
		uploadPlugin(info, callback);
	});
	
}


/*
 * Upload the plugin to the central server.
 *
 * @param {object} info:
 *		id {string}
 *		folder {string} folder inside plugindirectory
 *		version {string}
 * @param {function} callback
 * @return {callback}
 */
function uploadPlugin(info, callback) {
	var filepath = info.plugin.tarpath;
	var filename = info.plugin.filename;
	
	var url = 'http://preview.32urhzqdibxa8aorbk51fcdkq3zestt9us699c13dv64unmi.box.codeanywhere.com/home-automation-server/uploadplugin.php';
	var message;
	var prelogFunc = prelog + ':uploadPlugin) ';
	
	var request = require('request');
	
	var req = request.post(url, function (err, resp, body) {
		
		body = JSON.parse(body);
		
		//Check for errors in request module
		if (err) {
			message = prelogFunc + 'Error with file upload!';
			log.error(message + ' Error' + error);
			util.doCallback(callback, {err: true, stderr: message});
			
			util.removeTempFile(filename);
			return;
		} else {
			if (body.err) {
				message = prelogFunc + 'Error on remote server: ' + body.stderr;
				log.error(message);
				util.doCallback(callback, {err: true, stderr: message});
				util.removeTempFile(filename);
				return;
			}
			
			//If the upload was succesfull
			message = prelogFunc + body.stdout;
			log.info(message);
			util.doCallback(callback, {stdout: message});
			
			//Remove the local tar.gz file
			util.removeTempFile(filename);
			
		}
	});
	
	var form = req.form();
	
	//Add plugin info
	form.append('pluginid', info.plugin.id);
	form.append('pluginname', info.plugin.name);
	form.append('pluginversion', info.plugin.version);
	form.append('developername', info.developer.name);
	form.append('developerkey', info.developer.key);
	
	//Add the actual pluginfile
	form.append('plugin', fs.createReadStream(filepath));
}
