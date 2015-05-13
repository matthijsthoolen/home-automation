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
 
/*  	var options = {
		file: config.getPluginFolder({pluginname: '1000144Plugi'}) + '/config.json',
		set: {version: '2.0'}
	};
	
	changePluginConfig(options, function(err, stdout, stderr) {
		if (err) {
			console.log(stderr);
		} else {
			console.log(stdout);
		}
	}); */
	
	//plugin.newDevPlugin({name: 'tester'});
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
			
			//var pluginid = config.getConfiguration('packageconfig:id');
			
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

}


/*
 * Activate the given plugin
 *
 * @param {string} id
 * @return {boolean}
 */
exports.activate = function(id, callback) {
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
exports.deactivate = function(id, callback) {
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
exports.remove = function(id, callback) {
	var plugindir = config.getPluginFolder({pluginname: id}); 
	
	var message;
	var prelogFunc = prelog + ':remove) ';
	
	//Build a response message
	var response = {
		id: id,
		action: 'remove'
	};
	
	//If the plugin is unremovable only deactivate it
	if (!pluginRemovable(id)) {
		response.status = 'failed';
		response.message = 'Plugin can\'t be removed, plugin will be deactivated instead!';
		util.doCallback(callback, {err: true, stderr: response});
		return plugin.deactivate(id);
	}
	
	stopPlugin(id);	
	
	uninstall(id);
	
	util.delete({'path': plugindir, type: 2, 'root': true}, 
		function(err, stdout, stderr) 
	{
		console.log(stdout);
		if (!err) {
			config.removePlugin(id);
			log.info(prelogFunc + 'Plugin ' + id + ' removed from plugin directory');
			
			response.status = 'done';
			response.message = 'Succesfully removed this plugin!';
			util.doCallback(callback, {stdout: response});
			return true;
		}
		
		log.error(prelogFunc + 'Not removed plugin with id ' + id + '! Error: ' + stderr);
		
		response.status = 'failed';
		response.message = 'Plugin can\'t be removed, check the error log!';
		util.doCallback(callback, {err: true, stderr: response});
		
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
	
	var response = {
		id: id,
		action: 'update'
	};
	
	var message;
	var prelogFunc = prelog + ':update) ';
	
	if (!id) {
		response.message = prelogFunc + 'ID is required!';
		response.status = 'failed';
		
		util.doCallback(callback, {err: true, stderr: response});
		return;
	}
	
	var pluginconfig = config.getPluginInfo(id);
	
	//Check if the plugin is found in the config
	if (!pluginconfig) {
		response.message = prelogFunc + 'No plugin info could be found';
		response.status = 'failed';
		log.debug(response.message + 'for ' + id);
		
		if (!util.doCallback(callback, {err: true, stderr: response}))
			return false;
	}
	
	//stop the plugin
	stopPlugin(id);
	
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
			response.message = prelogFunc + 'Backup plugin failed!';
			response.status = 'failed';
			
			log.error(response.message + ' Error: ' + stderr);
			util.doCallback(callback, {err: true, stderr: response});
			backup = 'error';
			return;
		}
		
		message = prelogFunc + 'Backup made before updating for: ' + pluginconfig.name;
		log.debug(message);
		
	});
	
	var params = {folder: folder, version: version, id: id, currentversion: pluginconfig.version};
	
	//Download the file from the server
	downloadFile(params, function(err, opt, stderr) {
		var tempfolder = util.opt(opt, 'path', null);
		version = util.opt(opt, 'version', version);
		
		//Add the tempfolder to the endoptions if exists
		if (util.dirExists(tempfolder)) {
			endOptions.updatefile = tempfolder;
		}
		
		//Return if there is an error with the download
		if (err) {			
			response.message = prelogFunc + ' ' + stderr;
			response.status = 'failed';
			
			log.error(response.message);
			util.doCallback(callback, {err: true, stderr: response});
			restoreBackup(endOptions);
			return;
		}
		
		//var update = require(tempfolder);
		var update = require(config.getPluginFolder() + '/pushbullet-production/update.js');
		
		//Wait until the backup is completed or there is an error with the backup
		while (backup !== true) {
			if (backup == 'error') {
				response.message = prelogFunc + 'Stopped plugin update, error in backup!';
				response.status = 'failed';
				
				log.error(response.message);
				restoreBackup(endOptions);
				util.doCallback(callback, {err: true, stderr: response});
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
						response.message = prelogFunc + 'Can\'t remove old plugin folder for ' + pluginconfig.name + '. Abort.';
						response.status = 'failed';
						log.error(response.message);
						
						util.doCallback(callback, {err: true, stderr: response});
						restoreBackup(endOptions);
						return;
					}
					
					//Move the new plugin folder to the plugin directory
					util.move({'old': tempfolder, 'new': oldPlugin, 'type':2, 'root': true}, 
						function (err, stdout, stderr) 
					{
						if (err) {
							response.message = prelogFunc + 'Error with moving temp to plugin folder!';
							response.status = 'failed';
							
							log.debug(response.message + ' Error:' + stderr);
							util.doCallback(callback, {err: true, stderr: response});
							restoreBackup(endOptions);
							return;
						}
						
						response.message = prelogFunc + 'Plugin ' + pluginconfig.name + ' is now updated to ' + version;
						response.status = 'done';
						
						log.info(response.message);
						
						util.doCallback(callback, {stdout: response});
						
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
				response.message = prelogFunc + 'Error with plugin specific update!';
				response.status = 'failed';
				
				log.error(response.message + ' ' + stderr);
				
				util.doCallback(callback, {err: true, stderr: response});
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
		startPlugin(id);
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
			startPlugin(id);
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
 *		currentversion {string}
 * @param {function} callback
 */
function downloadFile(options, callback) {
	var id = util.opt(options, 'id', false);
	var folder = util.opt(options, 'folder', false);
	var version = util.opt(options, 'version', 'latest');
	var current = util.opt(options, 'currentversion', false);
	
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
		
		if (typeof version === 'undefined' || !version) {
			message = prelogConf + 'Can not find a version for plugin with id ' + id + '. Unable to update!';
			log.debug(message);
			util.doCallback(callback, {err: true, stderr: message});
			return;
		}
	}
	
	if (current >= version) {
		message = prelogConf + 'The requested version (' + version + ') is already installed or the requested version is older then the installed version (' + current + ') for id ' + id + '.';
		log.debug(message);
		util.doCallback(callback, {err: true, stderr: message});
		return;
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
			callback(null, {path: path, version: version}, null);
		});
	});
}


/* 
 * Get file with the most recent plugin versions from the server.
 * Returns nconf file with plugin versions.
 *
 * @param {object} options
 *		force {boolean} (default: false)
 * @param {function} callback
 */
function getVersionList(options, callback) {
	var tempdir = config.getTempPath();
	var server = config.getConfiguration('downloadserver');
	var force = util.opt(options, 'force', false);
	
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
				
				reloadVersionList();
			});	
		} else {
			log.debug(prelogFunc + 'Version file is recent enough'); 
		}
		
		//Load the version file into NCONF
		if (!reloadVersionList()) {
			util.doCallback(callback, {err: true, stderr: 'Couldn\'t load custom config!'});
			return;
		}
		
		util.doCallback(callback, {stdout: true});
		
	});
	
}


/*
 * Reload the version list into NCONF
 *
 * @param {object} options
 * @param {function} callback
 */
function reloadVersionList(options, callback) {
	var tempdir = config.getTempPath();
	
	if (!config.loadCustomConfig({abspath: tempdir + 'version.json', name: 'versions'})) {
		util.doCallback(callback, {err: true, stderr: 'Couldn\'t load custom config!'});
		return false;
	}
	
	util.doCallback(callback, {stdout: true});
	return true;

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
	
	getVersionList();
	
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
		if (tmp.newversion !== false && tmp.newversion > tmp.version) {
			tmp.update = true;
		}
		
		info.push(tmp);
	}
	
	return info;
};


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


/******************************************************************************\
 *																			  *
 *								Plugin store								  *
 *																			  *
\******************************************************************************/


/*
 * Get a list of all the online plugins, flag the plugins which are installed already
 *
 * @param {object} options
 *		order {string} asc/desc (default asc)
 *		perRow {int} number of items per row (default 4)
 *		dev {boolean} add a 'add new dev-plugin' button
 * @param {function} callback
 * @return {object} pluginlist
 */
exports.getPluginList = function(options, callback) {
	var data = config.getConfiguration('server');
	
	var order = util.opt(options, 'order', 'asc');
	var perRow = util.opt(options, 'perRow', 4);
	var dev = util.opt(options, 'dev', false);
	
	var plugin;
	var i = 0;
	
	var list = [];
	var tmpRow = [];
	
	//From object to array for easy sorting
	var array = util.objectToArray(data);
	
	//Sort the array
	array = util.sortArray(array, {});
	
	//Add a dev item to the first row. 
	if (dev) {
		var devItem = {
			'name': 'Dev-plugin template',
			'description': 'Generate a new developer plugin template',
			'stars': false,
			'dev': true,
			'button': 'Add',
			'buttonTitle': 'Add a new developer plugin template!'
		};
		
		tmpRow.push(devItem);
		i++;
	}
	
	//For each plugin check if it's installed.
	array.forEach(function(plugin) {
	//for (var id in data) {
		
		//If the row is full, push the row to the list
		if (i % perRow === 0 && i !== 0) {
			list.push(tmpRow);
			tmpRow = [];
		}
		
		plugin.installed = exports.checkInstalled(plugin.id);
		
		tmpRow.push(plugin);
		i++;
	});
	
	//Check if the tmpRow contains partly filled rows, and push them to the list.
	if (tmpRow.length > 0) {
		list.push(tmpRow);
	}
	
	util.doCallback(callback, {stdout: list});
	return list;
};


/******************************************************************************\
 *																			  *
 *								Plugin production							  *
 *																			  *
\******************************************************************************/


/*
 * Create a new folder inside plugin directory for a new development plugin.
 *
 * @param {object} options:
 *		name {string} (required)
 *		description {string}
 *		version {int} (default: 0.0.1)
 * @param {function} callback
 */
exports.newDevPlugin = function(options, callback) {
	var name = util.opt(options, 'name', false);
	var description = util.opt(options, 'description', 'No description available');
	var version = util.opt(options, 'version', '0.0.1');
	
	var prelogFunc = prelog + ':newDevPlugin) ';
	var message, response;
	
	//Name is required
	if (!name) {
		message = prelogFunc + 'you have to give a name for the plugin!';
		response = {err: true, stderr: message};
		util.doCallback(callback, response);
		return response;
	}
	
	var ncp = require('ncp').ncp;
	
	var id, folder = name + '-production';
	var developer = config.getDeveloperInfo();
	
	var destination = config.getPluginFolder() + folder;
	var source = config.getPluginFolder() + 'plugin-default';
	
	//Copy the default plugin template to a new folder
	ncp(source, destination, function(err) {
		if (err) {
			return log.error(err);
		}
		
		message = prelogFunc + 'Succesfully created a new developer template plugin inside ' + folder;
		log.debug(message);
		
		var data = {name: name,
					folder: folder,
					developer: developer.name,
					version: version,
					description: description,
					production: true
				   };
		
		//Add the new plugin to the global config file
		config.addPlugin(id, data);
		
		var configfile = destination + 'config.json';
		
		//Some more data for the plugin config file
		data.id = id;
		data.main = 'main.js';
		data.updatescript = 'update.js';
		
		//Set the plugin config file
		changePluginConfig({file: configfile, set: data});
	});
	
	var pluginDir = config.getPluginFolder();
};


/*
 * Get a list with plugins and check for each if the current device is the developer
 * of that plugin. The key 'me' will be added, if the device is the developer it
 * will be true else false.
 *
 * @param {object} plugins
 * @param {function} callback
 * @return {object} plugininfo with a .me added
 */
exports.checkDevPlugins = function(plugins, callback) {
	var message, response;
	var prelogFunc = prelog + ':checkDeveloper) ';
	
	var developer = false;
	
	if (typeof plugins !== 'object') {
		message = prelogFunc + 'Plugininfo must be an object!';
		response = {err: true, stderr: message};
		log.debug(message);
		if (!util.doCallback(callback, response)) {
			return response;
		}
		return;
	}
	
	//Get developer info from config
	var developerinfo = config.getDeveloperInfo();
	
	//First check, if no info given.
	if (typeof developerinfo === 'undefined') {
		developer = false;
		
	//Send check, do a online check for the developer info
	} else if (checkDeveloper(developerinfo)) {
		developer = true;
	}
	
	//Check each plugin if the current device has a valid developer key
	if (developer) {
		var devID = developerinfo.id;
		
		var id, dev;
		
		for (var i in plugins) {
			id = plugins[i].id;
			dev = plugins[i].developer;

			if (dev === devID) {
				plugins[i].me = true;
			}
		}
	}
	
	
	message = {data: {plugins: plugins, developer: true}};
	response = {stdout: message};
	if (!util.doCallback(callback, response)) {
		return response;
	}
		
	
};


/*
 * Check with the online server if the developer is valid. 
 *
 * @param {object} options
 *		name {string}
 *		key {string}
 * @param {function} callback
 * @return {boolean}
 */
function checkDeveloper(options, callback) {
	var id = util.opt(options, 'id', false);
	var name = util.opt(options, 'name', false);
	var key = util.opt(options, 'key', false);
	
	if (!id || !name || !key) {
		return false;
	}
	
	//TODO: do a real check!
	return true;
}


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
	
	var message;
	var prelogFunc = prelog + ':publish) ';
	
	var response = {
		id: id,
		action: 'publish',
	};
	
	//Check if the plugin is already registered and if it's still valid
	util.checkPluginID({id: id}, function(err, stdout, stderr) {
		
		if (err) {
			message = prelogFunc + ' An error occurred while publishing the plugin: ' + stderr;
			log.debug(message);
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
					message = prelogFunc + 'Problem with registration. Error: ' + stderr;
					log.debug(message);
					util.doCallback(callback, {err: true, stderr: stderr});
					return;
				}
				info.plugin.id = stdout.id;
				
				//If ID is changed send back a in process callback
				response.status = 'newid';
				response.message = stdout.id;
				response.oldid = id;
				response.id = stdout.id;

				util.doCallback(callback, {stdout: response});
				
				packPlugin(info, callback);
			});
		} else if (stdout.type === 'prod') {
			packPlugin(info, callback);
		}
		
	});
};


/*
 * Publish a plugin with a given version number
 * 
 * @param {object} options
 *		id {string} (required)
 *		version {string} (required)
 * @param{function} callback
 */
exports.publishVersion = function(options, callback) {
	var id = util.opt(options, 'id', false);
	var version = util.opt(options, 'version', false);
	version = version.trim();
	
	var message;
	var prelogFunc = prelog + ':publishVersion) ';
	var response = {
		id: id,
		action: 'publish'
	};
	
	if (!id || !version || version === '') {
		response.message = 'ID or version is not provided';
		response.status = 'failed';
		
		log.debug(response.message + ' Received: ' + options);
		util.doCallback(callback, {err: true, stderr: response});
		return;
	}
	
	var curVersion = config.getPluginInfo(id, {type: 'version'});
	
	//The new version must be bigger then the current version
	if (curVersion > version) {
		response.message = prelogFunc + 'New version (' + version + ') must be newer then the current version (' + curVersion + ') for id: "' + id + '"';
		response.status = 'failed';
		
		log.info(response.message);
		util.doCallback(callback, {err: true, stderr: response});
		return;
	}

	//Set the plugin version in the configuration file
	config.setPluginVersion(id, {version: version});
	
	//Publish the plugin (version)
	plugin.publish(id, function(err, stdout, stderr) {
		
		if (err) {
			response.message = prelogFunc + 'Error while publishing plugin (' + id + ')!';
			log.debug(response.message + ' Error: ' + stderr);
			util.doCallback(callback, {err: true, stderr: response});
			return;
		} 
		
		//Only do something if stdout is a object. Else we don't have to handle it here
		if (typeof stdout === 'object') {

			//If status is newid, the plugin id has changed. Do a callback so the gui can be updated
			if (stdout.status === 'newid') {
				response.id = id;
				response.newid = stdout.message;
				response.status = 'newid';
				util.doCallback(callback, {stdout: response});
				
				//Set for next response
				response.id = stdout.message;
				return;
			}

			response.message = prelogFunc + 'Succesfully published version ' + version + ' of the plugin!';
			response.version = version;
			response.status = 'done';

			util.doCallback(callback, {stdout: response});
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
	var prelogFunc = prelog + ':registerPlugin) ';
	
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
			
			var folder = config.getPluginFolder({pluginname: oldID});
			
			//Set the new id in the global config
			config.setUniqueID(oldID, newID);
			
			var configfile = folder + '/config.json';
	
			//Set the new ID in the plugin config file!
			var options = {file: configfile, set: {id: newID}};

			//change the config file inside the pluginfolder
			changePluginConfig(options, function(err, stdout, stderr) {
				if (err) {
					log.debug(prelogFunc + 'Error with setting ID in plugin config file for ' + newID + ' inside folder: ' + folder);
				}
				
				log.debug (prelogFunc + 'Succesfully changed ID from ' + oldID + ' to ' + newID + ' inside folder: ' + folder);
			});
			
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
	var prelogFunc = prelog + ':packPlugin) ';
	
	if (id === null || version === null) {
		message = prelogFunc + 'packPlugin both id and version must be given!';
		util.doCallback(callback, {err: true, stderr: message});
		return;
	}
	
	var targz = require('tar.gz');
	
	var filename = id + '-' + version + '.tar.gz';
	
	var folder = config.getPluginFolder({pluginname: id});
	var temp = config.getTempPath() + filename;
	
	//Check if the folder or temp path are incorrect
	if (!folder || !temp) {
		message = prelogFunc + 'PackPlugin folder or temppath are incorrect';
		log.debug(message);
		util.doCallback(callback, {err: true, stderr: message});
		return;
	}
	
	var configfile = folder + '/config.json';
	
	var options = {file: configfile, set: {version: version}};
	
	//change the config file inside the pluginfolder
	changePluginConfig(options, function(err, stdout, stderr) {
		
		if (err) {
			message = prelogFunc + 'Plugin config file update failed! Error: ' + stderr;
			log.debug(message);
			util.doCallback(callback, {err: true, stderr: message});
			return;
		}
		
		//Do the actual file compression
		var compress = new targz().compress(folder, temp, function(err){
			if(err) {
				message = prelogFunc + err;
				log.error(message);
				util.doCallback(callback, {err: true, stderr: message});
				return;
			}

			log.debug(prelogFunc + 'Successfully packed the plugin to tempfolder/' + filename);

			info.plugin.tarpath = temp;
			info.plugin.filename = filename;

			//Continue to the upload step
			uploadPlugin(info, callback);
		});
		
	});
	
}


/*
 * Change the configuration file inside the pluginfolder
 *
 * @param {object} options
 *		file {string} abs path to file (required)
 *		set {object} object with data to set example: {version: 1.0} (required)
 * @param {function} callback
 */
function changePluginConfig(options, callback) {
	var filepath = util.opt(options, 'file', false);
	var set = util.opt(options, 'set', false);
	
	var message;
	var prelogFunc = prelog + ':changePluginConfig) ';
	
	if (!filepath || !set) {
		message = prelogFunc + 'file or data set is not given!';
		util.doCallback(callback, {err: true, stderr: message}, true);
		return;
	}
	
	//Check if the file exists
	if (!util.fileExists(filepath)) {
			message = prelogFunc + 'The file (' + filepath + ') does not exist!';
			util.doCallback(callback, {err: true, stderr: message}, true);
			return;
	}
	
	util.getFileContent({file: filepath, lock: true, keeplock: true}, function(err, stdout, stderr) {
		if (err) {
			message = prelogFunc + 'Error while receiving file content!';
			util.doCallback(callback, {err: true, stderr: message}, true);
			return;
		}
		
		var data = util.parseJSON(stdout.content);
		
		if (data.err) {
			message = prelogFunc + 'Error with parsing plugin config file. Error: ' + data.stderr;
			util.doCallback(callback, {err: true, stderr: message}, true);
			return;
		}
		
		//Check if in the file packageconfig is available
		if (data.packageconfig === 'undefined') {
			message = prelogFunc + 'Couldn\'t find the correct config data!';
			
			log.debug(message + ' Checking at path: ' + filepath);
			util.doCallback(callback, {err: true, stderr: message});
			return;
		}
		
		var config = data.packageconfig;
		
		//For each field in 'set' change the config file
		for(var name in set) {
			config[name] = set[name];
		}
		
		//Write to the config file
		util.setFileContent({fd: stdout.fd, content: data, json: true, lock: true}, function(err, stdout, stderr) {
			if (err) {
				message = prelogFunc + 'Error while writing to plugin configfile!';
			
				log.debug(message + ' Error: ' + stderr);
				util.doCallback(callback, {err: true, stderr: message});
				return;
			}
			
			util.doCallback(callback, {stdout: true});
		});
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
	
	var response = {
		id: info.plugin.id,
		action: 'publish'
	};
	
	var request = require('request');
	
	var req = request.post(url, function (err, resp, body) {
		
		//Check for errors in request module
		if (err) {
			message = prelogFunc + 'Error with file upload!';
			log.error(message + err);
			util.doCallback(callback, {err: true, stderr: message});
			
			util.removeTempFile(filename);
			return;
		} else {
			var content;
			
			//Parse the JSON response from the server
			try {
				content = util.parseJSON(body);
			} catch (e) {
				message = prelogFunc + 'Error while parsing JSON response from server!';
				log.error(message + ' Error: ' + e);
				util.doCallback(callback, {err: true, stderr: message});
				util.removeTempFile(filename);
				return;
			}
			
			//If no errors, the return value is an object
			body = content;
			
			//Check for errors on the remote server
			if (body.err) {
				message = prelogFunc + 'Error on remote server: ' + body.stderr;
				log.error(message);
				util.doCallback(callback, {err: true, stderr: message});
				util.removeTempFile(filename);
				return;
			}
			
			//If the upload was succesfull
			response.message = prelogFunc + body.stdout;
			response.status = 'done';
			
			log.info(response.message);
			util.doCallback(callback, {stdout: response});
			
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
