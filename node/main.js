config = require('./config');
util = require('./utilities');
plugin = require('./plugin');
logger = require('./log');
plugins = [];

logger.start('file', 'info');

//plugin.test();

plugin.startAll();