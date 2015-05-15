/******************************************************************************\
 *																			  *
 *								Plugin production							  *
 *																			  *
\******************************************************************************/

prelog = 'PluginModule:production';

/*
 * Create a new folder inside plugin directory for a new development plugin.
 *
 * @param {object} options:
 *		name {string} (required)
 *		description {string}
 *		version {int} (default: 0.0.1)
 * @param {function} callback
 */
exports.newDevPlugin = function(options, callback) {
	var name = util.opt(options, 'name', false);
	var description = util.opt(options, 'description', 'No description available');
	var version = util.opt(options, 'version', '0.0.1');
	
	var prelogFunc = prelog + ':newDevPlugin) ';
	var message, response;
	
	//Name is required
	if (!name) {
		message = prelogFunc + 'you have to give a name for the plugin!';
		response = {err: true, stderr: message};
		util.doCallback(callback, response);
		return response;
	}
	
	var ncp = require('ncp').ncp;
	
	var id, folder = name + '-production';
	var developer = config.getDeveloperInfo();
	
	var destination = config.getPluginFolder() + folder;
	var source = config.getPluginFolder() + 'plugin-default';
	
	//Copy the default plugin template to a new folder
	ncp(source, destination, function(err) {
		if (err) {
			return log.error(err);
		}
		
		message = prelogFunc + 'Succesfully created a new developer template plugin inside ' + folder;
		log.debug(message);
		
		var data = {name: name,
					folder: folder,
					developer: developer.name,
					version: version,
					description: description,
					production: true
				   };
		
		//Add the new plugin to the global config file
		config.addPlugin(id, data);
		
		var configfile = destination + 'config.json';
		
		//Some more data for the plugin config file
		data.id = id;
		data.main = 'main.js';
		data.updatescript = 'update.js';
		
		//Set the plugin config file
		changePluginConfig({file: configfile, set: data});
	});
	
	var pluginDir = config.getPluginFolder();
};


/*
 * Get a list with plugins and check for each if the current device is the developer
 * of that plugin. The key 'me' will be added, if the device is the developer it
 * will be true else false.
 *
 * @param {object} plugins
 * @param {function} callback
 * @return {object} plugininfo with a .me added
 */
exports.checkDevPlugins = function(plugins, callback) {
	var message, response;
	var prelogFunc = prelog + ':checkDeveloper) ';
	
	var developer = false;
	
	if (typeof plugins !== 'object') {
		message = prelogFunc + 'Plugininfo must be an object!';
		response = {err: true, stderr: message};
		log.debug(message);
		if (!util.doCallback(callback, response)) {
			return response;
		}
		return;
	}
	
	//Get developer info from config
	var developerinfo = config.getDeveloperInfo();
	
	//First check, if no info given.
	if (typeof developerinfo === 'undefined') {
		developer = false;
		
	//Send check, do a online check for the developer info
	} else if (checkDeveloper(developerinfo)) {
		developer = true;
	}
	
	//Check each plugin if the current device has a valid developer key
	if (developer) {
		var devID = developerinfo.id;
		
		var id, dev;
		
		for (var i in plugins) {
			id = plugins[i].id;
			dev = plugins[i].developer;

			if (dev === devID) {
				plugins[i].me = true;
			}
		}
	}
	
	
	message = {data: {plugins: plugins, developer: true}};
	response = {stdout: message};
	if (!util.doCallback(callback, response)) {
		return response;
	}
		
	
};


/*
 * Check with the online server if the developer is valid. 
 *
 * @param {object} options
 *		name {string}
 *		key {string}
 * @param {function} callback
 * @return {boolean}
 */
function checkDeveloper(options, callback) {
	var id = util.opt(options, 'id', false);
	var name = util.opt(options, 'name', false);
	var key = util.opt(options, 'key', false);
	
	if (!id || !name || !key) {
		return false;
	}
	
	//TODO: do a real check!
	return true;
}


/*
 * For developers only, an option to publish a plugin to the central server. The 
 * pluginfolder will first be tarred and then uploaded to the server. The server
 * will place it in the correct folder and update the references. 
 *
 * @param {string} id
 * @param {function} callback
 * @return {callback} default callback
 */
exports.publish = function(id, callback) {
	
	var folder = config.getPluginFolder({pluginname: id});
	var info = {};
	
	var message;
	var prelogFunc = prelog + ':publish) ';
	
	var response = {
		id: id,
		action: 'publish',
	};
	
	//Check if the plugin is already registered and if it's still valid
	util.checkPluginID({id: id}, function(err, stdout, stderr) {
		
		if (err) {
			message = prelogFunc + ' An error occurred while publishing the plugin: ' + stderr;
			log.debug(message);
			util.doCallback(callback, {err: true, stderr: message});
			return;
		}
		
		//Get all the plugin info and the developer info
		info.plugin = config.getPluginInfo(id);
		info.plugin.id = id;
		info.developer = config.getDeveloperInfo();
		
		//If it's a developer plugin it still has to be registered. Else we can continue to packPlugin
		if (stdout.type === 'dev') {
			registerPlugin(info, function(err, stdout, stderr) {
				if (err) {
					message = prelogFunc + 'Problem with registration. Error: ' + stderr;
					log.debug(message);
					util.doCallback(callback, {err: true, stderr: stderr});
					return;
				}
				info.plugin.id = stdout.id;
				
				//If ID is changed send back a in process callback
				response.status = 'newid';
				response.message = stdout.id;
				response.oldid = id;
				response.id = stdout.id;

				util.doCallback(callback, {stdout: response});
				
				packPlugin(info, callback);
			});
		} else if (stdout.type === 'prod') {
			packPlugin(info, callback);
		}
		
	});
};


/*
 * Publish a plugin with a given version number
 * 
 * @param {object} options
 *		id {string} (required)
 *		version {string} (required)
 * @param{function} callback
 */
exports.publishVersion = function(options, callback) {
	var id = util.opt(options, 'id', false);
	var version = util.opt(options, 'version', false);
	version = version.trim();
	
	var message;
	var prelogFunc = prelog + ':publishVersion) ';
	var response = {
		id: id,
		action: 'publish'
	};
	
	if (!id || !version || version === '') {
		response.message = 'ID or version is not provided';
		response.status = 'failed';
		
		log.debug(response.message + ' Received: ' + options);
		util.doCallback(callback, {err: true, stderr: response});
		return;
	}
	
	var curVersion = config.getPluginInfo(id, {type: 'version'});
	
	//The new version must be bigger then the current version
	if (curVersion > version) {
		response.message = prelogFunc + 'New version (' + version + ') must be newer then the current version (' + curVersion + ') for id: "' + id + '"';
		response.status = 'failed';
		
		log.info(response.message);
		util.doCallback(callback, {err: true, stderr: response});
		return;
	}

	//Set the plugin version in the configuration file
	config.setPluginVersion(id, {version: version});
	
	//Publish the plugin (version)
	plugin.publish(id, function(err, stdout, stderr) {
		
		if (err) {
			response.message = prelogFunc + 'Error while publishing plugin (' + id + ')!';
			log.debug(response.message + ' Error: ' + stderr);
			util.doCallback(callback, {err: true, stderr: response});
			return;
		} 
		
		//Only do something if stdout is a object. Else we don't have to handle it here
		if (typeof stdout === 'object') {

			//If status is newid, the plugin id has changed. Do a callback so the gui can be updated
			if (stdout.status === 'newid') {
				response.id = id;
				response.newid = stdout.message;
				response.status = 'newid';
				util.doCallback(callback, {stdout: response});
				
				//Set for next response
				response.id = stdout.message;
				return;
			}

			response.message = prelogFunc + 'Succesfully published version ' + version + ' of the plugin!';
			response.version = version;
			response.status = 'done';

			util.doCallback(callback, {stdout: response});
		}
	});
};


/*
 * Register a plugin in the pluginstore, plugindata will be send to the central 
 * server, the central server will generate a unique key for the plugin.$
 *
 * @param {object} info (required)
 *		plugin.id {string} (required)
 *		plugin.name {string} (required)
 *		plugin.description {string}
 *		plugin.version {string}
 *		developer.name {string} (required)
 *		developer.key {string} (required)
 * @param {function} callback
 * @return {callback}
 */
function registerPlugin(info, callback) {
	var message;
	var prelogFunc = prelog + ':registerPlugin) ';
	
	//Make sure that info is available
	if (info === undefined) {
		message = prelog + 'registerPlugin) The info parameter is required!';
		util.doCallback(callback, {err: true, stderr: message});
		return;
	}
	
	//Make sure that info has the properties plugin and developer
	if (!info.hasOwnProperty('plugin') || !info.hasOwnProperty('developer')) {
		message = prelog + 'registerPlugin) Not all info is given'; 
		util.doCallback(callback, {err: true, stderr: message});
		return;
	}
	
	//The register URI on the server 
	var portal = 'http://preview.32urhzqdibxa8aorbk51fcdkq3zestt9us699c13dv64unmi.box.codeanywhere.com/home-automation-server/registerplugin.php';
	
	//Get all the needed info from the input, check if it is required
	var oldID = util.opt(info.plugin, 'id', null);
	var pluginname = util.opt(info.plugin, 'name', null);
	
	if (pluginname === null || oldID === null) {
		message = prelog + ':registerPlugin) Plugin name and old ID are required!';
		util.doCallback(callback, {err: true, stderr: message});
		return;
	}
	
	//Check if the ID is really a development ID.
	util.checkPluginID({id: oldID}, function(err, stdout, stderr) {
		
		if (err || stdout.type !== 'dev') {
			message = prelog + ':registerPlugin) Plugin is already registered';
			util.doCallback(callback, {err: true, stderr: message});
			return;
		}
	
		var plugindescription = util.opt(info.plugin, 'description', null);
		var pluginversion = util.opt(info.plugin, 'version', '0.1');

		var developer = util.opt(info.developer, 'name', null);
		var developerkey = util.opt(info.developer, 'key', null);

		if (developer === null || developerkey === null) {
			message = prelog + ':registerPlugin) No developer name or key is specified, both are required!';
			util.doCallback(callback, {err: true, stderr: message});
			return;
		}

		//Put all the data in a options object
		var options = {
			uri: portal,
			method: 'POST',
			datatype: 'json',
			data: {
				plugin: {
					name: pluginname,
					description: plugindescription,
					version: pluginversion
				},
				developer: {
					name: developer,
					key: developerkey
				}
			}
		};

		//Do the actual http request
		util.httpRequest(options, function(err, stdout, stderr) {
			if (err) {
				util.doCallback(callback, {err: true, stderr: stderr});
				return;
			}

			//If the server returns an error, do not continue
			if (stdout.err) {
				message = prelog + ':registerPlugin) Unable to register plugin to central server.';
				log.error(message + ' Error: ' + stdout.stderr);
				util.doCallback(callback, {err: true, stderr: message});
				return;
			}

			if (!(stdout.hasOwnProperty('stdout') && stdout.stdout.hasOwnProperty('id'))) {
				message = prelog + ':registerPlugin) Unable to register plugin to central server. The server response was not correct.';
				log.error(message + ' Response: (see next error log)');
				log.error(stdout);
				util.doCallback(callback, {err: true, stderr: message});
				return;
			}
			var newID = stdout.stdout.id;
			
			var folder = config.getPluginFolder({pluginname: oldID});
			
			//Set the new id in the global config
			config.setUniqueID(oldID, newID);
			
			var configfile = folder + '/config.json';
	
			//Set the new ID in the plugin config file!
			var options = {file: configfile, set: {id: newID}};

			//change the config file inside the pluginfolder
			changePluginConfig(options, function(err, stdout, stderr) {
				if (err) {
					log.debug(prelogFunc + 'Error with setting ID in plugin config file for ' + newID + ' inside folder: ' + folder);
				}
				
				log.debug (prelogFunc + 'Succesfully changed ID from ' + oldID + ' to ' + newID + ' inside folder: ' + folder);
			});
			
			util.doCallback(callback, {stdout: {id: newID}});
		});
		
	});
}


/*
 * This function will generate a tar file from the given plugin. This plugin can be
 * used for distribution of the app through the plugin store. The folder is checked
 * for all the necessary files. 
 *
 * @param {object} info:
 *		id {string}
 *		folder {string} folder inside plugindirectory
 *		version {string}
 * @param {function} callback
 * @return {callback}
 */
function packPlugin(info, callback) {
	var id = util.opt(info.plugin, 'id', null);
	var version = util.opt(info.plugin, 'version', null);
	
	var message;
	var prelogFunc = prelog + ':packPlugin) ';
	
	if (id === null || version === null) {
		message = prelogFunc + 'packPlugin both id and version must be given!';
		util.doCallback(callback, {err: true, stderr: message});
		return;
	}
	
	var targz = require('tar.gz');
	
	var filename = id + '-' + version + '.tar.gz';
	
	var folder = config.getPluginFolder({pluginname: id});
	var temp = config.getTempPath() + filename;
	
	//Check if the folder or temp path are incorrect
	if (!folder || !temp) {
		message = prelogFunc + 'PackPlugin folder or temppath are incorrect';
		log.debug(message);
		util.doCallback(callback, {err: true, stderr: message});
		return;
	}
	
	var configfile = folder + '/config.json';
	
	var options = {file: configfile, set: {version: version}};
	
	//change the config file inside the pluginfolder
	changePluginConfig(options, function(err, stdout, stderr) {
		
		if (err) {
			message = prelogFunc + 'Plugin config file update failed! Error: ' + stderr;
			log.debug(message);
			util.doCallback(callback, {err: true, stderr: message});
			return;
		}
		
		//Do the actual file compression
		var compress = new targz().compress(folder, temp, function(err){
			if(err) {
				message = prelogFunc + err;
				log.error(message);
				util.doCallback(callback, {err: true, stderr: message});
				return;
			}

			log.debug(prelogFunc + 'Successfully packed the plugin to tempfolder/' + filename);

			info.plugin.tarpath = temp;
			info.plugin.filename = filename;

			//Continue to the upload step
			uploadPlugin(info, callback);
		});
		
	});
	
}


/*
 * Change the configuration file inside the pluginfolder
 *
 * @param {object} options
 *		file {string} abs path to file (required)
 *		set {object} object with data to set example: {version: 1.0} (required)
 * @param {function} callback
 */
function changePluginConfig(options, callback) {
	var filepath = util.opt(options, 'file', false);
	var set = util.opt(options, 'set', false);
	
	var message;
	var prelogFunc = prelog + ':changePluginConfig) ';
	
	if (!filepath || !set) {
		message = prelogFunc + 'file or data set is not given!';
		util.doCallback(callback, {err: true, stderr: message}, true);
		return;
	}
	
	//Check if the file exists
	if (!util.fileExists(filepath)) {
			message = prelogFunc + 'The file (' + filepath + ') does not exist!';
			util.doCallback(callback, {err: true, stderr: message}, true);
			return;
	}
	
	util.getFileContent({file: filepath, lock: true, keeplock: true}, function(err, stdout, stderr) {
		if (err) {
			message = prelogFunc + 'Error while receiving file content!';
			util.doCallback(callback, {err: true, stderr: message}, true);
			return;
		}
		
		var data = util.parseJSON(stdout.content);
		
		if (data.err) {
			message = prelogFunc + 'Error with parsing plugin config file. Error: ' + data.stderr;
			util.doCallback(callback, {err: true, stderr: message}, true);
			return;
		}
		
		//Check if in the file packageconfig is available
		if (data.packageconfig === 'undefined') {
			message = prelogFunc + 'Couldn\'t find the correct config data!';
			
			log.debug(message + ' Checking at path: ' + filepath);
			util.doCallback(callback, {err: true, stderr: message});
			return;
		}
		
		var config = data.packageconfig;
		
		//For each field in 'set' change the config file
		for(var name in set) {
			config[name] = set[name];
		}
		
		//Write to the config file
		util.setFileContent({fd: stdout.fd, content: data, json: true, lock: true}, function(err, stdout, stderr) {
			if (err) {
				message = prelogFunc + 'Error while writing to plugin configfile!';
			
				log.debug(message + ' Error: ' + stderr);
				util.doCallback(callback, {err: true, stderr: message});
				return;
			}
			
			util.doCallback(callback, {stdout: true});
		});
	});
}


/*
 * Upload the plugin to the central server.
 *
 * @param {object} info:
 *		id {string}
 *		folder {string} folder inside plugindirectory
 *		version {string}
 * @param {function} callback
 * @return {callback}
 */
function uploadPlugin(info, callback) {
	var filepath = info.plugin.tarpath;
	var filename = info.plugin.filename;
	
	var url = 'http://preview.32urhzqdibxa8aorbk51fcdkq3zestt9us699c13dv64unmi.box.codeanywhere.com/home-automation-server/uploadplugin.php';
	var message;
	var prelogFunc = prelog + ':uploadPlugin) ';
	
	var response = {
		id: info.plugin.id,
		action: 'publish'
	};
	
	var request = require('request');
	
	var req = request.post(url, function (err, resp, body) {
		
		//Check for errors in request module
		if (err) {
			message = prelogFunc + 'Error with file upload!';
			log.error(message + err);
			util.doCallback(callback, {err: true, stderr: message});
			
			util.removeTempFile(filename);
			return;
		} else {
			var content;
			
			//Parse the JSON response from the server
			try {
				content = util.parseJSON(body);
			} catch (e) {
				message = prelogFunc + 'Error while parsing JSON response from server!';
				log.error(message + ' Error: ' + e);
				util.doCallback(callback, {err: true, stderr: message});
				util.removeTempFile(filename);
				return;
			}
			
			//If no errors, the return value is an object
			body = content;
			
			//Check for errors on the remote server
			if (body.err) {
				message = prelogFunc + 'Error on remote server: ' + body.stderr;
				log.error(message);
				util.doCallback(callback, {err: true, stderr: message});
				util.removeTempFile(filename);
				return;
			}
			
			//If the upload was succesfull
			response.message = prelogFunc + body.stdout;
			response.status = 'done';
			
			log.info(response.message);
			util.doCallback(callback, {stdout: response});
			
			//Remove the local tar.gz file
			util.removeTempFile(filename);
			
		}
	});
	
	var form = req.form();
	
	//Add plugin info
	form.append('pluginid', info.plugin.id);
	form.append('pluginname', info.plugin.name);
	form.append('pluginversion', info.plugin.version);
	form.append('developername', info.developer.name);
	form.append('developerkey', info.developer.key);
	
	//Add the actual pluginfile
	form.append('plugin', fs.createReadStream(filepath));
}