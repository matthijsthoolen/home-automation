config = require('./config');
util = require('./utilities');
plugin = require('./plugin');
logger = require('./log');
homestream = require('./stream');

plugins = [];

logger.start('file', 'info');
homestream.start();

//plugin.test();

plugin.startAll();