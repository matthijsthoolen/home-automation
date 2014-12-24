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
 * If callback is not given, this function is used.
 */
 
exports.noop = function (err, stdout, stderr) {	
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
 */
exports.delete = function(options, callback) {
	var type = util.opt(options, 'type', '1');
	var path = util.opt(options, 'path', null);
	var root = util.opt(options, 'root', false);
	var command = null;
	callback = callback || util.noop;
	
	//Add absolute path to path if root is false
	if (!root) {
		path = config.getAbsolutePath() + path;
	}
	
	if (type == 1) {
		var filename = util.opt(options, 'filename', null);
		
		command = 'rm ' + path + filename;
		
	} else if(type == 2) {
		
		command = 'rm -r ' + path;
		
	} else {
		callback(true, null, 'Type not supported');
		return;
	}
	
	exec(command, {cwd: path}, function(err, stdout, stderr) {
		
		if (!err) {
			callback(null, true, null);
			log.debug('(Utilities:Delete) "' + command + '" executed. ')
		} else {
			
			if (stderr.indexOf('No such file or directory')) {
				callback(null, 'File or directory already removed', null);
				log.debug('(Utilities:Delete) Can\'t remove from ' + path + ' already removed' + command); 
			} else {				
				callback(true, null, stderr);		
				log.debug('(Utilities:Delete) Problem with removing ' + stderr);
			}
			
		}
	});
};

/*
 * Move a file or folder to another directory
 * @param {Array} options:
 *		oldpath {String},
 *		newpath {String},
 *		type {Number} 1 for file 2 for directory,
 *		filename {String} for type 1 only (optional),
 * 		root {Boolean} given path starting from root (Default: false)
 * @param {Function} callback
 */
exports.move = function (options, callback) {
	var oldpath = util.opt(options, 'old', null);
	var newpath = util.opt(options, 'new', null);
	var type = util.opt(options, 'type', null);
	var root = util.opt(options, 'root', false);
	var command = null;
	callback = callback || util.noop;
	
	if (!oldpath || !newpath || !type) {
		callback(true, null, 'Not all options are given!');
		return;
	}
	
	//Add absolute path to path if root is false
	if (!root) {
		oldpath = config.getAbsolutePath() + oldpath;
		newpath = config.getAbsolutePath() + newpath;
	}
	
	//Make the command for each type
	if (type == 1) {
		var filename = util.opt(options, 'filename', null);
		command = 'mv ' + oldpath + filename + ' ' + newpath + filename;		
	} else if (type == 2) {
		command = 'mv ' + oldpath + ' ' + newpath;
	} else {
		callback(true, null, 'Type not supported');
		return;
	}
	
	//Execute the command
	exec(command, function(err, stdout, stderr) {
		if (err) {
			if (stderr.indexOf('Directory not empty')) {
				callback(true, null, 'The destination directory is not empty. Abort.');
			} else {
				callback(true, null, stderr);
			}
		} else {
			callback(null, 'Move succesfull', null);
		}
	});
	
};
