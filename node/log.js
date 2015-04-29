var bunyan,
	prelog,
	parentCallback;

module.exports = function(callback) {
	parentCallback = callback;
	prelog = '(log';
	
	bunyan = require('bunyan');
	
	this.start = start;
	
	return this;
};

var start = function start(mode, lvl) {
	
	if (mode == 'file') {
		log = bunyan.createLogger({
			name: 'homeautomation',
			streams: [
				{
					level: lvl,
					stream: process.stdout // log INFO and above to stdout
				},
				{
					level: 'error',
					path: 'error.log'  // log ERROR and above to a file
				}
			]
		});
	} else {
		log = bunyan.createLogger({name: 'homeautomation'});	
	}
};