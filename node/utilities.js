var exec = require('child_process').exec;

var prelog = '(utitilites';

/*
 * Return the value of an options field, if not available return the default.
 *
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
 * Check if the path is within the allowed path
 *
 * @param {String} path to check
 * @param {Function} Callback function
 * @return {Boolean} 
 */
exports.checkPath = function (path, callback) {

	//Check if it is a substring of plugin or path
	if (path.indexOf(config.getPluginFolder()) > -1) {
		 callback(null, true, null);
	 } else if (path.indexOf(config.getTempPath()) > -1) {
		 callback(null, true, null);
	 } else {
		 callback(null, false, null);
	 }
};

/*
 * Remove all files and folders from the tmp directory
 *
 * @return Nothing
 */
exports.cleanTmp = function () {
	var tmp = config.getTempPath();
	exec('rm -rf ' + tmp + '*');
};

/*
 * Remove a file or folder. 
 *
 * @param {Array} options - 
 *		path {string}, 
 * 		type {Number} 1 for file 2 for directory,
 *		filename {String} for type 1 only (optional),
 * 		root {Boolean} given path starting from root (Default: false)
 * @param {Function} callback - Callback function
 */
exports.delete = function (options, callback) {
	var type = util.opt(options, 'type', '1');
	var path = util.opt(options, 'path', null);
	var root = util.opt(options, 'root', false);
	var command = null;
	var fullpath = null;
	callback = callback || util.noop;
	
	//Add absolute path to path if root is false
	if (!root) {
		path = config.getAbsolutePath() + path;
	}
	
	if (type == 1) {
		var filename = util.opt(options, 'filename', null);		
		command = 'rm ' + path + filename;
		fullpath = path + filename;
		
	} else if(type == 2) {
		
		command = 'rm -r ' + path;
		fullpath = path;
		
	} else {
		callback(true, null, 'Type not supported');
		return;
	}
	
	util.checkPath(fullpath, function(err, stdout, stderr) {
		
		if (stdout === false) {
			log.error(prelog + ':Delete) Path not allowed. Abort.');
			callback(true, null, 'Path not allowed!');
			return;
		}
		
		exec(command, {cwd: path}, function (err, stdout, stderr) {

			if (!err) {
				callback(null, true, null);
				log.debug(prelog + ':Delete) "' + command + '" executed. ');
			} else {

				if (stderr.indexOf('No such file or directory')) {
					callback(null, 'File or directory already removed', null);
					log.debug(prelog + ':Delete) Can\'t remove from ' + path + ' already removed' + command); 
				} else {				
					callback(true, null, stderr);		
					log.debug(prelog + ':Delete) Problem with removing ' + stderr);
				}

			}
		});
	});
};

/*
 * Move a file or folder to another directory
 *
 * @param {object} options:
 *		old {String} oldpath,
 *		new {String} newpath,
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


/*
 * Install the dependencies with npm from package.json
 *
 * @param {object} options:
 *		pluginname {string}
 * 		folder {string} folder of the plugin (default: pluginfolder)
 *		package {string} package.json file (default package.json in pluginfolder)
 * @param {function} callback
 */
exports.installDependencies = function(options, callback) {
	
	//If name is not given, return false
	if (!options.hasOwnProperty('pluginname')) {
		log.error(prelog + ':installDependencies) Pluginname not given');
		return false;
	}
	
	var name = options.pluginname;
	var folder = util.opt(options, 'folder', config.getPluginFolder({'pluginname': name}));
	var package = util.opt(options, 'package', 'package.json');
	callback = callback || util.noop;
	var command;
	
	var nconf = require('nconf');
	
	//load package.json dependencies
	nconf.file({ file: folder + '/' + package});
	nconf.load();
	
	var dependencies = nconf.get('dependencies');
	var abspath = config.getAbsolutePath();
	
	for(var depname in dependencies) {
		var version = dependencies[depname];
		
		command = 'npm install ' + depname + '@"' + version + '"';
		
		//Execute the command
		exec(command, {cwd: abspath}, function(err, stdout, stderr) {
			if (err) {
				log.error(prelog + ':installDependencies) Error with installing: ' + err);
			} else {
				callback(null, 'Dependency install succesfull of ' + depname + '(' + version + ')', null);
			}
		});
	}
	
};