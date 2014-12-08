var config = require('./config'),
	fs = require('fs'),
	sys = require('sys'),
    exec = require('child_process').exec;

checkPlugins();
installPlugin('pushbullet', '1.0'); 

/**
* Check if all the plugins in the config file still exists, if not remove from config file
*/
function checkPlugins() {
	var plugins = config.getActivePlugins();
	var plugindir = config.getAbsolutePath() + 'plugins/';
	
	for(var plugin in plugins) {
		console.log(plugindir + plugins[plugin].folder);
		if (!fs.existsSync(plugindir + plugins[plugin].folder)) {
    		config.removePlugin(plugins[plugin].name);
			console.log("Removed plugin from config file: " + plugins[plugin].name); 
		}
	}
}

/**
* Remove a plugin from the plugin directory and from the config file
*/
function removePlugin(name) {
	config.removePlugin(name);
}

/**
* Install a new plugin
*/
function installPlugin(name, version) {
	var filename = name + '-' + version + '.tar.gz';
	var foldername = 'pushbullet';
	var tempdir = config.getTempPath();
	var plugindir = config.getPluginPath();
	
	exec('wget http://loginweb.nl/hometest/' + filename, {cwd: tempdir}, function(err, stdout, stderr) {
    	console.log("git status returned:\n " + err + " : "  + stdout);
		
		exec('tar -zxvf ' + filename, {cwd: tempdir }, function(err, stdout, stderr) {
			console.log('pwd: ' + err + ' : ' + stdout);
			
			exec('rm '  + filename, {cwd: tempdir }, function(err, stdout, stderr) {
				console.log('rm status returned ' ); console.log(err); 
			});
			
			exec('mv ' + tempdir + foldername + ' ' + plugindir + foldername, function(err, stdout, stderr) {
				console.log('Moved from temp to plugins: ' + err + ' : ' + stdout);
			});
    	});
	});
	
	config.addPlugin(name, name, {});
}
