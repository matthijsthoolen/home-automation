var exec = require('child_process').exec;

/*
 * Return the value of an options field, if not available return the default.
 * @param {Array} options - array with the input options
 * @param {String} name - name of the option to return
 * @param {Mixed} - if option is not given, default value
 * @return the value of the option field
 */
exports.opt = function (options, name, def) {
     return options && options[name] !== undefined ? options[name] : def;
};

/*
 * Remove all files and folders from the tmp directory
 * @return Nothing
 */
exports.cleanTmp = function () {
	var tmp = config.getTempPath();
	exec('rm -rf ' + tmp + '*');
};

/*
 * Remove a file or folder. 
 * @param {Array} options - 
 *		path {string}, 
 * 		type {Number} 1 for file 2 for directory,
 *		filename {String} for type 1 only (optional),
 * 		root {Boolean} given path starting from root (Default: false)
 * @param {Function} callback - Callback function
 * @return {Boolean} - succesfull or not (in callback)
 */
exports.delete = function(options, callback) {
	var type = util.opt(options, 'type', '1');
	var path = util.opt(options, 'path', null);
	var root = util.opt(options, 'root', false);
	
	//Add absolute path to path if root is false
	if (!root) {
		path = config.getAbsolutePath() + path;
	}
	
	if (type == 1) {
		var filename = util.opt(options, 'filename', null);
		
		exec('rm ' + filename, {cwd: path}, function(err, stdout, stderr) {
			if (!err) {
				callback(null, true, null);
			} else {
				callback(true, null, stderr);
			}
		});
		
	} else if(type == 2) {
		
		exec('rm -r ' + path, function(err, stdout, stderr) {
			if (!err) {
				callback(null, true, null);
			} else {
				callback(true, null, stderr);
			}
		});
		
	} else {
		callback(true, null, 'Type not supported');
	}
};
