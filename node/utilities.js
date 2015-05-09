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
 * Check if a callback is indeed a function, and if so do the callback with
 * the default callback parameters (err, stdout, stderr)
 *
 * @param {function} callback
 * @param {object} param:
 *		err {boolean}
 *		stdout {mixed}
 *		stderr {mixed}
 * @param {boolean} debuglog
 * @return {boolean}
 */
exports.doCallback = function(callback, param, debuglog) {
	if (typeof callback !== "function") {
		return false;
	}
	
	var err = this.opt(param, 'err', false);
	var stdout = this.opt(param, 'stdout', null);
	var stderr = this.opt(param, 'stderr', null);
	
	try {
		callback(err, stdout, stderr);
		
		//Print to log
		if (debuglog && err) {
			log.debug(stderr);
		} else if (debuglog) {
			log.debug(stdout);
		}
		
		return true;
	} catch (e) {
		log.debug(prelog + ':doCallback) Failed a callback! error: ' + e);
		return false;
	}
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


/*
 * Check if the given plugin ID is registered on the remote server and check if
 * it's a developer plugin or a published plugin.
 *
 * @param {object} info
 *		id {string}
 * @param {function} callback
 * @return {callback} if no error:
 *		type: dev/prod
 */
exports.checkPluginID = function(info, callback) {
	
	if (info.id.indexOf('dev-') === 0) {
		util.doCallback(callback, {stdout: {type: 'dev'}});
		return;
	}
	
	//TODO: check online if the plugin is registered
	
	util.doCallback(callback, {stdout: {type: 'prod'}});
	
};

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
					log.debug(prelog + ':Delete) Can\'t remove from ' + path + ' already removed. Command: ' + command); 
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
			if (stderr.indexOf('Directory not empty') > 0) {
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
 *								File actions								  *
 *																			  *
\******************************************************************************/


/*
 * Get the content of a file
 *
 * @param {object} options
 *		file {string} abspath
 * @param {function} callback
 */
exports.getFileContent = function(options, callback) {
	var file = util.opt(options, 'file', false);
	
	var message;
	var prelogFunc = prelog + ':getFileContent) ';
	
	if (!file) {
		message = prelogFunc + 'Please give a file path!';
		util.doCallback(callback, {err: true, stderr: message}, true);
		return;
	}
	
	//Try to open and read the file
	fs.readFile(file, 'utf8', function (err,data) {
		if (err) {
			message = prelogFunc + 'Error with reading file: ' + err;
			util.doCallback(callback, {err: true, stderr: message}, true);
			return;
		}
		
		//Return the file content
		util.doCallback(callback, {stdout: data});
	});
	
};


/*
 * Set the file content
 *
 * @param {object} options
 *		file {string} abspath
 *		content {mixed} content to write to file
 *		json {boolean}
 * @param {function} callback
 */
exports.setFileContent = function(options, callback) {
	var file = util.opt(options, 'file', false);
	var content = util.opt(options, 'content', '');
	var json = util.opt(options, 'json', false);
	
	var message;
	var prelogFunc = prelog + ':setFileContent) ';
	
	if (!file) {
		message = prelogFunc + 'Please give a file path!';
		util.doCallback(callback, {err: true, stderr: message}, true);
		return;
	}
	
	//convert to json string if json is true
	if (json) {
		content = JSON.stringify(content);
	}
	
	//Write to the file
	fs.writeFile(file, content, function(err) {
		if (err) {
				message = prelogFunc + 'Error with saving file: ' + err;
				util.doCallback(callback, {err: true, stderr: message}, true);
				return;
			}

		//Return the file content
		util.doCallback(callback, {stdout: true});
		
		message = prelogFunc + 'succesfully saved to ' + file;
		log.debug(message);
		
	}); 
};


/*
 * Remove a file from the temp directory
 *
 * @param {string} file
 * @param {function} callback
 */
exports.removeTempFile = function(file, callback) {
	var fs = require('fs');
	var prelogFunc = prelog + ':removeTempFile) ';
	var message;
	
	var path = config.getTempPath() + file;
	
	log.debug(prelogFunc + 'Trying to remove ' + file + ' from tmp directory');
	
	fs.unlink(path, function (err) {
		if (err) {
			message = prelogFunc + 'Error with removing temp file: ' + err;
			log.debug(message);
			util.doCallback(callback, {err: true, stderr: message});
			return;
		}
		
		message = prelogFunc + 'Succesfully removed ' + file + ' from tmp directory';
		log.debug(message);
		util.doCallback(callback, {stdout: message});
	});
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
 * Run a specific function for each of the entries
 */
exports.runForEach = function(param, functionname, callback) {
	if (typeof functionname !== "function") {
		return;
	}
	
	for (var i in param) {
		functionname(param[i], callback);
		
		util.doCallback(callback, {stdout: 'called function'});
	}
};


/*
 * Parse the JSON and return the json content as object
 *
 * @param {mixed} json
 * @param {function} callback
 * @return {object}
 */
exports.parseJSON = function(json, callback) {
	var message, response;
	var prelogFunc = prelog + ':parseJSON) ';
	
	if (typeof json === 'undefined') {
		message = prelogFunc + 'no json given';
		response = {err: true, stderr: message};
		
		if (!util.doCallback(callback, response)) {
			return response;
		}
	}
	
	var data;
	
	try {
		data = JSON.parse(json);
	} catch(e) {
		message = prelogFunc + 'failed to parse JSON!';
		response = {err: true, stderr: message};
		
		log.debug(message + ' Error: ' + e);
		console.log(json);
		
		if (!util.doCallback(callback, response)) {
			return response;
		}
	}
	
	//If json is parsed, return
	if (!util.doCallback(callback, {stdout: data})) {
		return data;
	}
};


/*
 * Do a http request to a remote host
 *
 * @param {object} options:
 *		uri {string} (required)
 *		method {string}: get/post (default: postMessage)
 *		datatype {string}: (default: json)
 *		data {mixed}
 * 		return {string}: what to return? body or all (default: body)
 * @param {function} callback
 */
exports.httpRequest = function(options, callback) {
	var uri = util.opt(options, 'uri', null);
	
	if (uri === null) {
		callback(true, null, 'The given url is not correct, or no url is given at all!');
		return;
	}
	
	var method = util.opt(options, 'method', 'post');
	var datatype = util.opt(options, 'datatype', 'json');
	var data = util.opt(options, 'data', null);
	var returntype = util.opt(options, 'return', 'body');
	
	var request = require('request');
	
	//Put all the options in an object
	var reqOptions = {
		uri: uri,
		method: method,
	};
	
	reqOptions[datatype] = data;
	
	request(reqOptions, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			
			//if returntype is body only return body, else return response
			var returndata = (returntype === 'body' ? body : response);
			
			callback(error, returndata, null);
			return;
		}
		
		callback(true, null, error);
	});
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
 * From javascript object to array
 *
 * @param {object} input
 * @param {function} callback
 * @return {array}
 */
exports.objectToArray = function(obj, callback) {
	var array = [];
	for ( var data in obj ) {
    	array.push( obj[data] );
	}	
	
	util.doCallback(callback, {stdout: data});
	
	return array;
};


/*
 * Sort an array
 *
 * @param {array} array: sortable array
 * @param {object} options
 * 		todo...
 * @param {function} callback
 */
exports.sortArray = function(array, options, callback) {
	
	//TODO order on ASC/DESC and more
	
	array.sort(function(a, b) {
		var nameA=a.name.toLowerCase(), nameB=b.name.toLowerCase();
		
		if (nameA < nameB) //sort string ascending
			return -1;
		if (nameA > nameB)
			return 1;
		
		return 0; //default return value (no sorting)
	});
	
	if (!util.doCallback(callback, {stdout: array})) {
		return array;
	}
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