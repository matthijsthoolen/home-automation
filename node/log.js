var bunyan = require('bunyan');


exports.start = function(mode) {
	
	if (mode == 'file') {
		log = bunyan.createLogger({
			name: 'homeautomation',
			streams: [
				{
					level: 'info',
					stream: process.stdout            // log INFO and above to stdout
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