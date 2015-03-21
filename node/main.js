config = require('./config');
util = require('./utilities');
plugin = require('./plugin');
logger = require('./log');

event = require('./event');
eventstream = require('./eventstream');

plugins = [];
events = [];
actions = [];

//Start the logger, set the log level and location
logger.start('file', 'info');

//Start the event and eventstream
event.start();
eventstream.start();

//plugin.test();

plugin.startAll();

//Ask all the plugins to registrate for events
event.askForRegistration();