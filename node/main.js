if (!checkInstalled('../config.json')) {
	var install = require('./install');
	
	install.start(function(err, stdout, stderr, callback) {
		if (!err) {
			if (stdout === 'load') {
				console.log('Will load files now');
				requireFiles(callback);
				return true;
			} else if (stdout === 'run') {
				startApplication();
			}
			
		}
	});
	
} else {
	requireFiles(function(err, stdout, stderr) {
		startApplication();
	});
}


/* 
 * Load all the required files. But do not start yet. 
 */
function requireFiles(callback) {
	config = require('./config')(childCallback);
	
	util = require('./utilities');
	plugin = require('./plugin');
	logger = require('./log');

	event = require('./event');
	eventstream = require('./eventstream');

	i18nclass = require('./i18n');

	if (typeof callback === "function") {
		callback(false, 'Loaded', null);
	}
}

function startApplication() {

	plugins = [];
	events = [];
	actions = [];

	//Start the logger, set the log level and location
	logger.start('file', 'info');

	//log.info(i18n.__('Hello %s, how are you today?', 'Marcus'));

	//Start the plugin handler
	plugin.start();

	//Start the event and eventstream
	event.start();
	eventstream.start();

	//plugin.test();

	plugin.startAll();

	//Ask all the plugins to registrate for events
	event.askForRegistration();

	plugin.test();

	process.on('SIGINT', function() {
		log.info('(Main) SIGINT received, stopping plugins.');
		plugin.stop();
		process.exit();
	});
}


/*
 * Callback function for childs
 */
function childCallback(err, stdout, stderr) {
	if (err && stderr === 1) {
		console.log('Critical error, will shutdown now!');
		process.exit();
	}
}


/*
 * Check if the application has already been installed, by checking if the config
 * file is available. 
 *
 * @return {boolean}
 */
function checkInstalled(configfile) {
	var fs = require('fs');

	try {
		// Query the entry
		stats = fs.lstatSync(configfile);

		// Is it a directory?
		if (stats.isFile()) {
			return true;
		}
		
		return false;
	}
	catch (e) {
		return false;
	}
}