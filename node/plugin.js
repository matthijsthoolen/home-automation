var fs = require('fs'),
	sys = require('sys'),
    exec = require('child_process').exec;

exports.test = function() {
	plugin.check();
	//plugin.getVersionList();
	//plugin.install('pushbullet', {'version':'0.1'}); 
	//log.info('hello there');
	//versioninfo = getVersionList({'force': false});
	//plugin.remove('pushbullet');
/* 	plugin.update('pushbullet', {'version':'1.0'}, function(err, stdout, stderr) {
		log.info(err + stdout + stderr);
	});  */
	
	//log.info('version 2.0 = ' + versioninfo.get('pushbullet'));
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
* Remove a plugin from the plugin directory and from the config file
*/
exports.remove = function(name) {
	var plugindir = config.getPluginFolder() + name; 
	
	util.delete({'path': plugindir, type: 2, 'root': true}, 
		function(err, stdout, stderr) 
	{
		if (!err) {
			log.info('Plugin ' + name + ' removed from plugin directory');
			config.removePlugin(name);
		} else {
			log.error('(Plugin:Remove) Not removed ' + stderr);
		}
	});
};

/*
* Install a new plugin
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
				util.delete({'path':tempfolder, 'type':2, 'root':true}, null);
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
	
	//Backup folder to temp folder
	exec('cp -r ' + plugindir + pluginconfig.folder + ' ' + tempdir + '/backup', 
		function(err, stdout, stderr) 
	{
		if (!err) {
			backup = true;
		} else {
			log.debug('(Plugin:Update) Backup plugin failed: ' + err);
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
		var update = require('/home/cabox/workspace/home-automation/plugins/pushbullet-production/update.js');
		
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
				
				util.delete({'path': '', 'type':2}, function(err, stdout, stderr) {
						
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
 */

function downloadFile(folder, version, callback) {
	var tempdir = config.getTempPath();
	var filename = version + '.tar.gz';
	var downloadserver = config.getConfiguration('downloadserver');
	var path;
	
	exec('wget ' + downloadserver + folder + '/' + filename, {cwd: tempdir}, function(err, stdout, stderr) {
    	log.debug('(Plugin:DownloadFile) Downloaded file from server: \n' + err + " : "  + stdout);
		
		exec('tar -zxvf ' + filename, {cwd: tempdir }, function(err, stdout, stderr) {
			log.debug('(Plugin:DownloadFile) Unpacked plugin: ' + err + ' : ' + stdout);
			
			//If there is an error, abort and exit function
			if (err) {
				log.error('(Plugin:DownloadFile) Problem with downloaden file ' + stderr);
				callback(true, null, 'Can\'t download plugin file from server. Abort!');
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
			log.debug('(Plugin:GetVersionList) Version file is recent enough'); 
		}
		
	});
	
	nconf.file('versions', tempdir + 'version.json');
	nconf.load();
	
	return nconf;
	
}
