config = require('./config');
util = require('./utilities');
plugin = require('./plugin');
logger = require('./log');

event = require('./event');
eventstream = require('./eventstream');

plugins = [];
events = [];
actions = [];

logger.start('file', 'info');
event.start();
eventstream.start();

//plugin.test();

plugin.startAll();

event.askForRegistration();

log.info(events);