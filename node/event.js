var prelog = '(Event:';
var nrEventSub = 0;

/*
 * Start the event registration, defaults will be added automatically. Plugins can regitrate new events. 
 */
exports.start = function() {
	
	registerDefaultEvents();
	registerDefaultActions();
	
	log.info(prelog + 'start) Events can now be registered');
};


/*
 * After all the plugins have registrated there events, ask the other plugins to registrate for events
 */
exports.askForRegistration = function() {
	var plugins = config.getActivePlugins();
	
	log.info(prelog + ':askForRegistration) Ask all active plugins for registration to events and tasks');
	
	for(var name in plugins) {
		plugin.callFunction(name, 'register');
	}
	
	eventstream.putEvent('registration-completed');
};


/*
 * Register a new event and make it available to the other plugins
 *
 * @param {string} name
 * @param {string} description
 * @param {array} callback: [pluginname, function, parameters]
 */
exports.registerEvent = function(name, description, callback) {
	var event = {eventname: name, description: description, callback: callback, registered: []};
	
	events[name] = event;
};


/*
 * Register for a new event. An unique ID is returned.
 * 
 * @param {string} name
 * @param {array} callback: special callback array [pluginname, function, parameters]
 * @param {object} timeconfig: {0: (for all days) [{f: starttime, t: endtime}, ...], 1: till 7: from monday till sunday}
 * @return {int} id
 */
exports.subscribeToEvent = function(name, callback, timeconfig) {
	
	if (typeof timeconfig === 'undefined') {
    	timeconfig = null;
  	}
	
	var id = nrEventSub;
	nrEventSub++;

	events[name].registered.push({id: id, callback: callback, timeconfig: timeconfig});

	return id;
};


/*
 * Unsubscribe from an event. The function will loop through the array and remove if the ID matches.
 *
 * @param {string} name
 * @param {int} id
 * @return {boolean}
 */
exports.unsubscribeFromEvent = function(name, id) {
	var registered = events[name].registered; 
	
	for (var i = 0; i < registered.length; i++) {
		if (registered[i].id === id) {
			registered.splice(i--, 1);
			return true;
		}
	}
	
	return false;
};


/*
 * Register a new action and make it available to the other plugins
 *
 * @param {string} name
 * @param {string} description
 * @param {array} callfunction: The function to call on the action [pluginname, function, parameters]
 */
exports.registerAction = function(name, description, callfunction) {
	var action = {actionname: name, description: description, callfunction: callfunction};
	
	actions[name] = action;	
};


/*
 * Register all the default events to the array
 */
function registerDefaultEvents() {
	event.registerEvent('registration-completed', 'Run when all registration is completed', null);
}


/*
 * Register all the default actions to the array
 */
function registerDefaultActions() {
	
}