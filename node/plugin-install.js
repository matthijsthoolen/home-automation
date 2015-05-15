/******************************************************************************\
 *																			  *
 *							(un)install/update plugin						  *
 *																			  *
\******************************************************************************/

prelog = 'PluginModule:install';


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
exports.getVersionList = function(options, callback) {
	var tempdir = config.getTempPath();
	var server = config.getConfiguration('downloadserver');
	var force = util.opt(options, 'force', false);
	
	var exec = require('child_process').exec;
	
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
	
};


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