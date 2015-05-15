module.exports = function(callback) {
	
	prelog = '(Pluginmodule';
	parentCallback = callback;
	
	//Export functions in this file
	this.start = start;
	this.stop = stop;
	
	//Export other files
 	this.general 		= require('./plugin-general.js');
	this.action 		= require('./plugin-action.js');
	this.check			= require('./plugin-check.js');
	this.install 		= require('./plugin-install.js');
	this.production 	= require('./plugin-production.js');
	this.store			= require('./plugin-store.js');
	
	return this;
	
	//@Me when you have more energy, try to find a way to have private functions inside the mother module.\
	//Something like this.p(rivate).general and this.g(lobal).general and then return this.g(lobal)
	
};

var test = function() {
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
var start = function start() {
	checkConfig();
	checkFolder();
	this.install.getVersionList();
};


/*
 * On exit
 */
var stop = function stop() {
	stopAll();
};
