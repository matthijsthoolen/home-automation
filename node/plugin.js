var fs = require('fs'),
	sys = require('sys'),
    exec = require('child_process').exec;

//checkPlugins();
//installPlugin('pushbullet', '1.0'); 
//removePlugin('pushbullet');

exports.test = function() {
	//getVersionList();
	//plugin.installPlugin('pushbullet', {'version':'1.0'}); 
	//log.info('hello there');
	//versioninfo = getVersionList({'force': false});
	//plugin.removePlugin('pushbullet');
/* 	plugin.updatePlugin('pushbullet', {'version':'1.0'}, function(err, stdout, stderr) {
		log.info(err + stdout + stderr);
	});  */
	
	//log.info('version 2.0 = ' + versioninfo.get('pushbullet'));
};

/*
* Check if all the plugins in the config file still exists, if not remove from config file
*/
exports.checkPlugins = function() {
	var plugins = config.getActivePlugins();
	var plugindir = config.getAbsolutePath() + 'plugins/';
	
	for(var plugin in plugins) {
		console.log(plugindir + plugins[plugin].folder);
		if (!fs.existsSync(plugindir + plugins[plugin].folder)) {
    		config.removePlugin(plugins[plugin].name);
			log.info('(CheckPlugins) Removed plugin from config file: ' + plugins[plugin].name); 
		}
	}
};

/*
* Remove a plugin from the plugin directory and from the config file
*/
exports.removePlugin = function(name) {
	var plugindir = config.getPluginFolder() + name; 
	
	util.delete({'path': plugindir, type: 2, 'root': true}, 
		function(err, stdout, stderr) 
	{
		if (!err) {
			log.info('(RemovePlugin) Folder removed'); console.log(err); 
			config.removePlugin(name);
		} else {
			log.error('(RemovePlugin) Not renoved ' + stderr);
		}
	});
};

/*
* Install a new plugin
*/
exports.installPlugin = function(name, options) {
	var version = util.opt(options, 'version', '1.0');
	var folder = name;
	var plugindir = config.getPluginFolder();
	
	downloadFile(folder, version, function(err, tempfolder, stderr) {
		exec('mv ' + tempfolder + ' ' + plugindir, function(err, stdout, stderr) {
			log.debug('(InstallPlugin) Moved from temp to plugins: ' + err + ' : ' + stdout);
		});
		
		config.addPlugin(name, name, {});
	});
	
};

/* 
 * Download updated plugin files and replace the old files, keep the old config. 
 */
exports.updatePlugin = function(name, options, callback) {
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
			log.debug('(UpdatePlugin) Backup plugin failed: ' + err);
			backup = 'error';
		}
		
		log.debug('(UpdatePlugin) Backup made before updating for: ' + name);
		
	});
	
	//Download the file from the server
	downloadFile(folder, version, function(err, tempfolder, stderr) {
		//var update = require(tempfolder);
		var update = require('/home/cabox/workspace/home-automation/plugins/pushbullet-production/update.js');
		
		//Wait until the backup is completed or there is an error with the backup
		while (backup !== true) {
			log.info('waiting');
			if (backup == 'error') {
				log.info('(UpdatePlugin) Stopped plugin update, error in backup!');
				callback(true, null, 'Problems with plugin backup');
				return;
			} 
		}
		
		//Start the plugin specific update process.
		update.start({'currentinfo': pluginconfig, 'newversion': version, 'tempfolder': tempfolder}, 
			function(err, stdout, stderr) 
		{
			if (!err) {
				log.debug('(UpdatePlugin) Plugin specific update completed.');
			} else {
				log.error('(UpdatePlugin) Error with plugin specific update ' + stderr);
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
	
	log.info(tempdir);
	
	exec('wget ' + downloadserver + folder + '/' + filename, {cwd: tempdir}, function(err, stdout, stderr) {
    	log.debug('Downloaded file from server: \n' + err + " : "  + stdout);
		
		exec('tar -zxvf ' + filename, {cwd: tempdir }, function(err, stdout, stderr) {
			log.debug('Unpacked plugin: ' + err + ' : ' + stdout);
			
			util.delete({'path':tempdir, 'type':1, 'filename': filename, 'root': true}, 
				function(err, stdout, stderr) 
			{	
				if (err) {
					log.debug('DownloadFile error with removed tar.gz ' + stderr);
				} else {
					log.debug('DownloadFile tar.gz removed');
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
				log.info('Downloaded version file');
				exec('touch version.json', {cwd: tempdir});
			});	
		} else {
			log.info('Version file is recent enough'); 
		}
		
	});
	
	nconf.file('versions', tempdir + 'version.json');
	nconf.load();
	
	return nconf;
	
}
