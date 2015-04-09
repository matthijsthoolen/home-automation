var exec = require('child_process').exec;
var fs = require('fs'),
    path = require('path');

var prelog = '(utitilites';


/******************************************************************************\
 *																			  *
 *							Control functions								  *
 *																			  *
\******************************************************************************/


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
 * Check if a parameter has been set, returns default if undefined
 *
 * @param {mixed} param
 * @param {mixed} default
 *
 * @return {mixed} param if defined else default
 */
exports.checkParam = function(param, def) {
	if ( typeof param !== 'undefined' && param ) {
		return param;
	} 
	
	return def;
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
 * Check if file exists
 * 
 * @param {string} abspath
 */
exports.fileExists = function(abspath) {
	return checkExists(abspath, 2);
};


/*
 * Check if directory exists
 *
 * @param {string} abspath
 */
exports.dirExists = function(abspath) {
	return checkExists(abspath, 1);
};


/* 
 * Function to check if a directory or file exists
 *
 * @param {string} abspath
 * @param {int} type: 
 *		1: folder
 *		2: file (default)
 *
 * @return {boolean}
 */
function checkExists(abspath, type) {
	abspath = util.checkParam(abspath, null);
	
	if (abspath === null) return false;
	
	type = util.checkParam(type, 2);
	
	try {
		var check = fs.lstatSync(abspath);
		
		//First check is for testing if its a file or not, second for directory
		if (type === 2 && !check.isFile()) {
			return false;
		} else if (type === 1 && !check.isDirectory()) {
			return false;
		}
	}
	//If nothing found (no dir or file), catch the error and return false
	catch (e) {
		return false;
	}
	
	return true;
	
}


/******************************************************************************\
 *																			  *
 *							Folder actions									  *
 *																			  *
\******************************************************************************/


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
 * Get a complete list of all files and/or folders inside a directory
 *
 * @param {object} options:
 *		abspath {string} (required)
 *		folders {boolean} show folders, (default: true)
 *		files {boolean} show files (default: true)
 *		sync {boolean} (default: true)
 * @param {function} callback: only if sync = false
 * @return {array}
 */
exports.listDirectory = function(options, callback) {
	var srcpath = this.opt(options, 'abspath', null);
	
	if (!this.dirExists(srcpath)) return;
	
	var folders = this.opt(options, 'folders', true);
	var files = this.opt(options, 'files', true);
	var sync = this.opt(options, 'sync', true);
	
	return fs.readdirSync(srcpath).filter(function(file) {
		if (folders && files ) {
    		return fs.statSync(path.join(srcpath, file));
		} else if (folders) {
			return fs.statSync(path.join(srcpath, file)).isDirectory();
		} else if (files) {
			return fs.statSync(path.join(srcpath, file)).isFile();
		}
  	});
	
	//TODO: async version
};


/******************************************************************************\
 *																			  *
 *							Diverse Functions								  *
 *																			  *
\******************************************************************************/


/* 
 * If callback is not given, this function is used.
 */ 
exports.noop = function (err, stdout, stderr) {	
};


/*
 * Get an array with the items available in arr1 but not in arr2. 
 * if bothsides is true, check both ways. 
 *
 * @param {array} arr1
 * @param {array} arr2 
 * @param {object} options
 * 		bothsides {boolean} (default: false)
 *		dif {array}: the dif array to start with (default: [])
 */
exports.arrayDif = function(arr1, arr2, options) {
	var bothsides = this.opt(options, 'bothsides', true);
	var dif = this.opt(options, 'dif', []);

	arr1.forEach(function(key) {
		if (arr2.indexOf(key) === -1) {
			dif.push(key);
		}
	}, this);
	
	//also check from arr2 to arr2 if bothsides is true
	if (bothsides) {
		this.arrayDif(arr2, arr1, {bothsides: false, dif: dif});
	}
	
	return dif;
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