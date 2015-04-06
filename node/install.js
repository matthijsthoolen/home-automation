var exec = require('child_process').exec;
var path = require('path');
var prelog = '(installer:';
var prompt;
var callback;

//try if prompt is already available, if not install prompt. 
exports.start = function (callbackLocal) {
	callback = callbackLocal;
	try { 
		prompt = require('prompt');
		askData(loadFiles);
	} catch (e) {
		installDependency({'name': 'prompt'}, function(err, stdout, stderr) {
			if (!err) {
				prompt = require('prompt');
				askData(loadFiles);
			} else {
				console.log(stderr);
			}
		});
	}
};


/*
 * Install the dependency with npm 
 *
 * @param {object} options:
 *		name {string}
 * 		version {string} version of the package (default: latest)
 * @param {function} callback
 */
function installDependency(options, callback) {
	var version = opt(options, 'version', 'latest');
	var name = opt(options, 'name', null);
	
	if (name === null) return;
	
	var command = 'npm install ' + name + '@"' + version + '"';
	
	console.log(prelog + 'promptInstall) Installing prompt');
	
	exec(command, function(err, stdout, stderr) {
		if (err) {
			console.log(prelog + ':promptInstall) Error with installing: ' + stderr);
			callback(true, null, 'failed install of ' + name);
		} else {
			callback(false, 'completed install of ' + name, null);
		}
	});
}
 

/*
 * Install the default package.json
 *
 * @param {object} options:
 *		abspath {string}
 */
function installPackageJSON(options, callback) {
	var abspath = opt(options, 'abspath', null);
	
	if (abspath === null) return;
	
	var command = 'npm install';
	
	exec(command, {cwd: abspath}, function(err, stdout, stderr) {
		if (err) {
			console.log(prelog + ':promptInstall) Error with installing: ' + stderr);
			callback(true, null, 'Failed to install package.json');
		} else {
			callback(false, 'Installed package.json', null);
		}
	});
}

/*
 *
 */
function askData(callback) {
	
	console.log('Welcome to the installation of your home automation system. \n');
	console.log('Please fill in the next few configuration settings. Type \'yes\' if the default is correct. If the default is not correct fill in the correct setting.\n');
	
	  var schema = {
		  properties: {
			  abspath: {
				  description: 'Basepath of the application',
				  default: path.join(__dirname, '../'),
				  required: true
			  },
			  publicfolder: {
				  description: 'Public folder',
				  default: 'public'
			  },
			  pluginfolder: {
				  description: 'plugin folder',
				  default: 'plugins'
			  },
			  tempfolder: {
				  description: 'Temp folder',
				  default: 'tmp'
			  },
			  downloadserver: {
				  description: 'Update server',
				  default: 'http://loginweb.nl/hometest/'
			  },
			  port: {
				  description: 'GUI port',
				  default: '3000'
			  }
			  
		  }
	  };
	
	prompt.message = 'Config';
	
	// Start the prompt 
	prompt.start();

	// Get two properties from the user: username and email 
	prompt.get(schema, function (err, result) {
		console.log('\n You are done now! Please wait while we apply the new settings');
		var abspath = '';
		
		if (result.abspath == 'yes') {
			abspath = path.join(__dirname, '../');
		} else {
			abspath = result.abspath;
		}
		
		installPackageJSON({abspath: abspath}, function(err, stdout, stderr) {
			
			if (err) {
				callback(true, null, 'Problem with automatic installing. ' + stderr);
				return;
			} 
			
			callback(false, result, null);
			
		});
	});
}


/*
 * 
 */
function loadFiles(err, stdout, stderr) {
	callback(false, 'load', null, function() {
		
		//Buggy way to make sure we will only continue when config has been loaded
		var timeout = setInterval(function() {
			try {
				config.getAbsolutePath();
				clearInterval(timeout);
				saveConfig();
			} catch (e) {
				console.log(e);
			}
		}, 1000);
	});
}


/*
 *
 */
function saveConfig() {
	
}


/*
 * Return the value of an options field, if not available return the default.
 * This is a duplicate from utilities.js because all the functions in install.js should
 * only depend on basic node.js functions. By including utilities.js there is a change
 * that a npm package is required.
 *
 * @param {Array} options - array with the input options
 * @param {String} name - name of the option to return
 * @param {Mixed} - if option is not given, default value
 * @return the value of the option field
 */
function opt(options, name, def) {
     return options && options[name] !== undefined ? options[name] : def;
}