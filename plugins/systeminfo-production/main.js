var prelog = '(Plugin:systeminfo';
var pluginname = '';
var njds = require('nodejs-disks');
var os = require('os');


/*
 * Gets called when the server is starting
 *
 * @param {string} name: the pluginname
 */
exports.start = function(name) {
	pluginname = name;
	
	getDiskUsage(function(response) {
		//log.info(response);
	});
	
	getMemoryUsage(function(response) {
		//log.info(response);
	});
};


/*
 * Gets called when the server is going to shutdown
 */
exports.stop = function() {
};


/*
 * Register to events after everything has loaded
 */
exports.register = function() {
};


/*
 * Get the current disk usage
 *
 * @param {function} callback
 * @return {boolean}/{object} object with multilevel. 
 * 			available keys: mountpoint, total, used, available
 *			drive, usedPer, freePer
 */
function getDiskUsage(callback) {
	njds.drives(
        function (err, drives) {
			
			if (err) {
				log.error(prelog + ':getDiskUsage) Error with drives ' + err);
				callback(false);
			}
			
            njds.drivesDetail(
                drives,
                function (err, data) {
					
					if (!err) return callback(data);
					
					log.error(prelog + ':getDiskUsage) Error with drivesDetail ' + err);
					
					callback(false);
                }
            );
        }
    );
}


/*
 * Get the current memory usage
 *
 * @param {function} callback
 * @return {boolean}/{object} 
 */
function getMemoryUsage(callback) {
	var spawn = require("child_process").spawn;
	var prc = spawn("free", []);

	prc.stdout.setEncoding("utf8");
	prc.stdout.on("data", function (data) {
		var lines = data.toString().split(/\n/g),
			line = lines[1].split(/\s+/),
			total = parseInt(line[1], 10),
			free = parseInt(line[3], 10),
			buffers = parseInt(line[5], 10),
			cached = parseInt(line[6], 10),
			actualFree = free + buffers + cached,
			memory = {
				total: total,
				used: parseInt(line[2], 10),
				free: free,
				shared: parseInt(line[4], 10),
				buffers: buffers,
				cached: cached,
				actualFree: actualFree,
				percentUsed: parseFloat(((1 - (actualFree / total)) * 100).toFixed(2)),
				comparePercentUsed: ((1 - (os.freemem() / os.totalmem())) * 100).toFixed(2)
			};
		callback(memory);
	});

	prc.on("error", function (error) {
		log.error(prelog + ':getMemoryUsage) Free memory process' + error);
		callback(false);
	});
}
