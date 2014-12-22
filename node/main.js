config = require('./config');
util = require('./utilities');
plugin = require('./plugin');
logger = require('./log');

logger.start('file');

log.error('wowie');

plugin.test(); 