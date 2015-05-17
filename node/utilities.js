var exec = require('child_process').exec;
var fs = require('fs-ext'),
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

exports.test = function() {
	var file = config.getAbsolutePath() + 'test.html';
	
/*   	util.getFileContent({file: file, lock: true}, function(err, stdout, stderr) {
		util.getFileContent({file: file, lock: true}, function(err, stdout, stderr) {
		
		});
	});  */
	
/* 	util.checkFileLock({file: file}, function(err, stdout, stderr) {
		if (err) {
			console.log(stderr);
			return;
		}
		
		console.log(stdout);
	}); */
	
/* 	util.getFileContent({file: file, lock: false, keeplock: true}, function(err, stdout, stderr) {
	});
	
 	util.getFileContent({file: file, keeplock: true, openmode: 'w'}, function(err, stdout, stderr) {
		if (!err) {
			var fd = stdout.fd;
			var content = 'This is a good test! I think so at least!';
			
			console.log(stdout);
			
			util.setFileContent({fd: fd, content: content}, function(err, stdout, stderr) {
				if (err) {
					console.log(stderr);
					return;
				}
				console.log(stdout);
			});
			return;
		}
		
		console.log(stderr);
	}); */
};

/*
 * Get the content of a file
 *
 * @param {object} options
 *		file {string} abspath
 *		lock {boolean} (default: true)
 * 		keeplock {boolean} do not unlock, return fs object (default: false)
 *		openmode {string} r, a, rw etc. (default r (read))
 *		json {boolean} convert json to object (default: false)
 * @param {function} callback
 * @callback {object}
 *		content {mixed} the file content
 *		fd {object} fs object
 */
exports.getFileContent = function(options, callback) {
	var file = util.opt(options, 'file', false);
	var lock = util.opt(options, 'lock', true);
	var keeplock = util.opt(options, 'keeplock', false);
	var openmode = util.opt(options, 'openmode', 'r');
	
	var message;
	var response = [];
	var prelogFunc = prelog + ':getFileContent) ';
	
	if (!file) {
		message = prelogFunc + 'Please give a file path!';
		util.doCallback(callback, {err: true, stderr: message}, true);
		return;
	}
	
	//If lock: first lock the file
	if (lock) {
		
		//Lock the file
		util.lockFile({filename: file, openmode: openmode}, function(err, stdout, stderr) {
			
			if (err) {
				log.debug(prelogFunc + 'Error with locking file "' + file + '": ' + stderr);
				util.callback(callback, {err: true, stderr: stderr});
				return;
			}
			
			var fd = stdout.fd;
			
			//Read content from the file
			readFromFile(file, function(err, stdout, stderr) {
				
				if (err) {
					message = prelogFunc + 'Error while reading from file "' + file + '"!';
					log.debug(message);
					util.doCallback(callback, {err: true, stderr: message});
					return;
				}
				
				var json = util.opt(options, 'json', false);
				
				//If json is true, convert json string to object
				if (json) {
					try {
						var temp = JSON.parse(stdout.content);
						response.content = temp;
					} catch (e) {
						log.debug(prelogFunc + 'Error with parsing JSON!');
						response = stdout;
					}
				} else {
					//Add the content to the response
					response = stdout;	
				}
			
				//Unlock the file 
				if (!keeplock) {
					flockFile({file: file, fd: false, action: 'un'}, function(err, stdout, stderr) {
						util.doCallback(callback, {stdout: response});
						
						//Close the file object
						fs.closeSync(fd);
					});
					return;
				}
				
				response.fd = fd;
				
				//If file has to keep locked, return content and fd
				util.doCallback(callback, {stdout: response});
		
			});
			//TODO: if keeplock, also automatically unlock after X seconds to prevent that a failed
			//function can keep blocking a file. ????
		});
		
	} else {
	
		//Try to open and read the file. Send parent callback
		readFromFile(file, callback);
		
	}
};


/*
 * Lock a file
 *
 * @param {object} options:
 *		filename {string}
 *		fd {object} fs.open() object 
 * 		openmode {string} r, a, rw etc. (default r (read))
 * @param {function} callback
 * @callback {object}:
 *		fd {object} fs.open() object
 */
exports.lockFile = function(options, callback) {
	var fd = util.opt(options, 'fd', false);
	var file, openmode;
	
	var message;
	var response= [];
	var prelogFunc = prelog + ':lockFile) ';
	
	if (!fd) {
		file = util.opt(options, 'filename', false);
		openmode = util.opt(options, 'openmode', 'r');
		
		if (!file) {
			return;
		}
		
		fd = fs.openSync(file, openmode);
	}
	
	response.fd = fd;
	
	flockFile({file: file, fd: fd, action: 'exnb'}, function(err, stdout, stderr) {
		response.status = stdout;
		util.doCallback(callback, {stdout: response});
	});
};


/*
 * Unlock a locked file
 *
 * @param {object} options:
 *		fd {object} fs.open() object (required)
 * @param {function} callback
 * @callback {boolean}
 */
exports.unlockFile = function(options, callback) {
	var fd = util.opt(options, 'fd', false);
	
	var message = '';
	var response= [];
	var prelogFunc = prelog + ':unlockFile) ';
	
	if (!fd) {
		message = prelogFunc + 'Please give a file object!';
		util.doCallback(callback, {err: true, stderr: message}, true);
		return;
	}
	
	flockFile({fd: fd, action: 'un'}, function(err, stdout, stderr) {
		util.doCallback(callback, {stdout: true});
		
		//Close the file object
		fs.close(fd, function(err) {
			if (err) {
				log.debug(prelogFunc + 'Error with closing file. Error: ' + err);
			}
		});
	});	
};


/*
 * Check if a file is locked
 *
 * @param {object} options:
 *		fd {object} fs.open() object
 *		file {string} filename
 *		wait {boolean} wait until lock released (default: true)
 *		keepopen {boolean} keep fd open (default true if fd given, else close);
 * @param {function} callback
 * @callback {object}:
 *		status {boolean}
 *		fd {object} if keeplock is true
 */
exports.checkFileLock = function(options, callback) {
	var fd = util.opt(options, 'fd', false);
	var keepopen = util.opt(options, 'keepopen', null);
	
	var message;
	var response= [];
	var prelogFunc = prelog + ':checkFileLock) ';
	
	//If fd is not given, try to open the file. 
	if (!fd) {
		var file = util.opt(options, 'file', false);
		
		if (!file) {
			message = prelogFunc + 'No fd object or filename given, at least one is required';
		}
		
		//Open file in readmode
		fd = fs.openSync(file, 'r');
		
		//Close the keep lock if no preference is given
		if (keepopen === null) {
			keepopen = false;
		}
	} else {
		//If the fd is already open, and if keeplock = null we have to keep the lock open
		if (keepopen === null) {
			keepopen = true;
		}
	}
	
	var wait = util.opt(options, 'wait', true);
	
	flockFile({fd: fd, wait: wait, action: 'exnb'}, function(err, stdout, stderr) {
	
		if (err) {
			util.doCallback(callback, {err: true, stderr: stderr});
			log.debug(prelogFunc + 'Error while checking for file lock');
			response.status = false;
		} else {
			response.status = true;
		}
		
		if (keepopen) {
			response.fd = fd;
			util.doCallback(callback, {stdout: response});
			return;
		}

		util.doCallback(callback, {stdout: response});
		
	});
	
};


/*
 * Do a flock action on a file
 *
 * @param {object} options:
 * 		fd {object} fn.opensync() object
 *		file {string} path to file
 *		wait {boolean} wait on already locked? (default: true)
 *		action {string} 'exnb', 'ex', or 'un' (default: unnb)
 * @param {function} callback
 * @callback {boolean}
 */
function flockFile(options, callback) {
	var fd = util.opt(options, 'fd', false);
	var wait = util.opt(options, 'wait', true);
	var action = util.opt(options, 'action', 'unnb');
	var file;
	
	var message = '';
	var prelogFunc = prelog + ':lockFile) ';
	
	if (!fd) {
		file = util.opt(options, 'file', false);
	
		//If filename is not specified
		if (!file) {
			message = prelogFunc + 'filename not specified!';
			util.doCallback(callback, {err: true, stderr: message});

			return log.debug(message);
		}
		
		//If no file link is specified, get one with the filename
		fd = fs.openSync(file, 'r');
	}
	
	//Do do flock action
 	flockFileDo({fd: fd, action: action}, callback);
}


/*
 * Execute the actual flock action. Do not use this function, use flockFile() instead!!
 *
 * @param {object} options:
 * 		fd {object} fn.opensync()/fs.open() object
 *		file {string} path to file
 *		wait {boolean} wait on already locked? (default: true)
 *		action {string} 'exnb', 'ex', or 'un' (default: unnb)
 *		i {int} #try
 *		timeout {int} (default: 50)
 *		wait {boolean} (default: true)
 *		justcheck {boolean} (default: true)
 * @param {function} callback
 */
function flockFileDo(options, callback) {
	var fd = util.opt(options, 'fd', false);
	var action = util.opt(options, 'action', false);
	
	var prelogFunc = prelog + ':flockFileDo) ';
	var message;
	
	fs.flock(fd, action, function(err) {
		if (err) {
			
			var timeout = util.opt(options, 'timeout', 50);
			var i = util.opt(options, 'i', 0);
			
			//Retry until file can be blocked. Max of i = 10
			setTimeout(function() {
				i++;
				
				//If i is max, no longer try and fail
				if (i >= 10) {
					var message = prelogFunc + 'Flock operation "' + action + '" failed!';
					util.doCallback(callback, {stdout: false});
					return log.debug(message);
				}
				
				//Wait longer every step
				options.timeout = timeout * 1.2;
				options.i = i;
				
				flockFileDo(options , callback);
			}, timeout);
			
			return;
		}
		
		var justcheck = util.opt(options, 'justcheck', false);
		
		//If justcheck, directly unlock the file and return true
		if (justcheck) {
			util.unlockFile({fd: fd});
			util.doCallback(callback, {stdout: true});
			return;
		}
		
		//If no errors return the fd so we can use it to unlock again
		util.doCallback(callback, {stdout: fd});
		
		log.trace(prelogFunc + 'Flock operation "' + action + '" succeeded!');
	});
}


/*
 * Get the content of the file. Only for internal use.
 *
 * @param {string} file
 * @param {function} callback
 */
function readFromFile(file, callback) {
	var message;
	var prelogFunc = prelog + ':readFromFile) ';
	
	fs.readFile(file, 'utf8', function (err,data) {
		if (err) {
			message = prelogFunc + 'Error with reading file: ' + err;
			util.doCallback(callback, {err: true, stderr: message}, true);
			return;
		}
		
		//Return the file content
		util.doCallback(callback, {stdout: {content: data}});
	});
}


/*
 * Write to a file. Only for internal use, use setFileContent() instead
 * 
 * @param {object} options:
 * 		fd {object} fn.opensync() object
 *		content {string} file content to set
 * @param {function} callback
 */
function writeToFile(options, callback) {
	var fd = util.opt(options, 'fd', false);
	var content = util.opt(options, 'content', false);
	
	var prelogFunc = prelog + ':writeToFile) ';
	var message;
	
	if (!fd) {
		message = prelogFunc + 'no fd object given!';
		util.doCallback(callback, message);
		log.debug(message);
		return;
	}
	
	//We can only write to the file if it's not locked. So check first.
	util.checkFileLock({fd: fd}, function(err, stdout, stderr) {
	
		if (err || !stdout.status) {
			message = prelogFunc + 'we can only write to file if not locked!';
			log.debug(message);
			return;
		}
		
		//Do the actual writing to the file
		fs.write(fd, content, 0, 0, 1, function(err, written, string) {

			if (err) {
				message = prelogFunc + 'Error with saving file: ' + err;
				log.debug(message);
				util.doCallback(callback, {err: true, stderr: message}, true);
				return;
			}

			//Return the file content
			util.doCallback(callback, {stdout: written});

			message = prelogFunc + 'succesfully saved ' + written + ' characters to file';
			log.debug(message);
		}); 
		
	});
}

/*
 * Set the file content
 *
 * @param {object} options
 *		fd {object} fs.open() object
 *		file {string} abspath
 *		content {mixed} content to write to file
 *		json {boolean}
 *		lock {boolean} if not locked lock, and after write unlock (default: true)
 *		keeplock {boolean} keep the lock after finished? (default: false)
 *		openmode {string} r, a, rw, w etc. (default w (write/replace))
 * @param {function} callback
 * @callback {object}:
 *		fd {object} fs.open() object (if keeplock = true)
 */
exports.setFileContent = function(options, callback) {
	var content = util.opt(options, 'content', '');
	var json = util.opt(options, 'json', false);
	var fd = util.opt(options, 'fd', false);
	var lock = util.opt(options, 'lock', true);
	
	var message;
	var response= [];
	var prelogFunc = prelog + ':setFileContent) ';
	
	//If no fd is given, open a file with the file name
	if (!fd) {
		
		var file = util.opt(options, 'file', false);
		var openmode = util.opt(options, 'openmode', 'w');
		
		if (!file) {
			message = prelogFunc + 'Please give a file path or fd object!';
			util.doCallback(callback, {err: true, stderr: message}, true);
			return;
		}
		
		//Open file in sync with the requested openmode
		fd = fs.openSync(file, openmode);
	}
	
	//convert to json string if json is true
	if (json) {
		content = JSON.stringify(content);
	}
	
	//If the file must be locked first
	if (lock) {
		util.lockFile({fd: fd}, function(err, stdout, stderr) {
			//If error or the file couldn't be locked (within time)
			if (err || !stdout.status) {
				if (!stdout.status) {
					message = prelogFunc + 'Unable to save to file! Couldnt lock the file in time!';
				} else {
					message = prelogFunc + 'Unable to save to file! Error with locking file. Error: ' + err;
				}
				
				log.debug(message);
				util.doCallback(callback, {err: true, stderr: stderr});
				fs.close(fd);
				return;
			}
			
			//Do the actual writing to the file.
			writeToFile({fd: fd, content: content}, function(err, stdout, stderr) {
				if (err) {
					util.doCallback(callback, {err: true, stderr: stderr});
					util.unlockFile({fd: fd});
					
					log.debug(prelogFunc + 'Error with writing to file, file is unlocked!');
					return;
				}
				
				response.written = stdout;
				
				var keeplock = util.opt(options, 'keeplock', false);
				
				//If keeplocked, return the fd with the callback
				if (keeplock) {
					response.fd = fd;
					
					util.doCallback(callback, {stdout: response});
					return;
				}
				
				//Else we can do a callback and unlock the file
				util.doCallback(callback, {stdout: response});
				util.unlockFile({fd: fd});
			});
		});
	} else {
		writeToFile({fd: fd, content: content}, callback);
	}
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