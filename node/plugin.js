module.exports = function(callback) {
	
	prelog = '(Pluginmodule';
	parentCallback = callback;
	
	var ext = [];
	int = {};
	
	//Export other files
 	var general			= require('./plugin-general.js')(parentCallback);
	ext					= merge_options(ext, general.ext);
	int 				= merge_options(int, general.int);
	
	var action			= require('./plugin-action.js')(parentCallback);
	ext					= merge_options(ext, action.ext);
	int 				= merge_options(int, action.int);
	
	var check			= require('./plugin-check.js')(parentCallback);
	ext					= merge_options(ext, check.ext);
	int 				= merge_options(int, check.int);
	
	var install			= require('./plugin-install.js')(parentCallback);
	ext					= merge_options(ext, install.ext);
	int 				= merge_options(int, install.int);
	
	var production			= require('./plugin-production.js')(parentCallback);
	ext					= merge_options(ext, production.ext);
	int 				= merge_options(int, production.int);
	
	var store			= require('./plugin-store.js')(parentCallback);
	ext					= merge_options(ext, store.ext);
	int 				= merge_options(int, store.int);
	
	//Export functions in this file
	ext.start = start;
	ext.stop = stop;
	ext.test = test;
	
	return ext;
	
	//@Me when you have more energy, try to find a way to have private functions inside the mother module.\
	//Something like this.p(rivate).general and this.g(lobal).general and then return this.g(lobal)
	
};

function merge_options(obj1,obj2){
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
}

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
	int.checkConfig();
	int.checkFolder();
	int.getVersionList();
	log.info(prelog + ':start) Pluginmodule started!');
};


/*
 * On exit
 */
var stop = function stop() {
	this.stopAll();
};
