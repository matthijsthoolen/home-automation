var fs = require('fs'),
	sys = require('sys'),
    exec = require('child_process').exec;

//checkPlugins();
//installPlugin('pushbullet', '1.0'); 
//getVersionList();
//removePlugin('pushbullet');

exports.test = function() {
	getVersionList();
	log.info('hello there');
};

/**
* Check if all the plugins in the config file still exists, if not remove from config file
*/
exports.checkPlugins = function() {
	var plugins = config.getActivePlugins();
	var plugindir = config.getAbsolutePath() + 'plugins/';
	
	for(var plugin in plugins) {
		console.log(plugindir + plugins[plugin].folder);
		if (!fs.existsSync(plugindir + plugins[plugin].folder)) {
    		config.removePlugin(plugins[plugin].name);
			log.info('Removed plugin from config file: ' + plugins[plugin].name); 
		}
	}
};

/**
* Remove a plugin from the plugin directory and from the config file
*/
exports.removePlugin = function(name) {
	config.removePlugin(name);
	var filename = name;
	var plugindir = config.getPluginPath(); 
	
	exec('rm -r '  + filename, {cwd: plugindir }, function(err, stdout, stderr) {
		log.info('Folder removed'); console.log(err); 
	});
};

/**
* Install a new plugin
*/
exports.installPlugin = function(name, version) {
	var filename = name + '-' + version + '.tar.gz';
	var foldername = 'pushbullet';
	var tempdir = config.getTempPath();
	var plugindir = config.getPluginPath();
	
	exec('wget http://loginweb.nl/hometest/' + filename, {cwd: tempdir}, function(err, stdout, stderr) {
    	log.info('Downloaded file from server: \n' + err + " : "  + stdout);
		
		exec('tar -zxvf ' + filename, {cwd: tempdir }, function(err, stdout, stderr) {
			log.info('Unpacked plugin: ' + err + ' : ' + stdout);
			
			exec('rm '  + filename, {cwd: tempdir }, function(err, stdout, stderr) {
				log.info('rm status returned ' ); console.log(err); 
			});
			
			exec('mv ' + tempdir + foldername + ' ' + plugindir + foldername, function(err, stdout, stderr) {
				log.info('Moved from temp to plugins: ' + err + ' : ' + stdout);
			});
    	});
	});
	
	config.addPlugin(name, name, {});
};

/** 
 * Get file with the most recent plugin versions from the server
 */
function getVersionList() {
	var tempdir = config.getTempPath();
	var server = config.getConfiguration('downloadserver');
	
	exec('wget ' + server + 'version.json', {cwd: tempdir}, function(err, stdout, stderr) {
		log.info('Downloaded version file');
	});
}
