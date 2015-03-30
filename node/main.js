config = require('./config');
util = require('./utilities');
plugin = require('./plugin');
logger = require('./log');

event = require('./event');
eventstream = require('./eventstream');

i18nclass = require('./i18n');

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

process.on('SIGINT', function() {
	log.info('(Main) SIGINT received, stopping plugins.');
  	plugin.stop();
  	process.exit();
});