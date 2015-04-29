var prelog,
	parentCallback,
	nrEventSub = 0;

module.exports = function(callback) {
	parentCallback = callback;
	prelog = '(Event';
	
	this.start = start;
	this.askForRegistration = askForRegistration;
	this.registerEvent = registerEvent;
	this.subscribeToEvent = subscribeToEvent;
	this.unsubscribeFromEvent = unsubscribeFromEvent;
	this.registerAction = registerAction;
	
	return this;
};


/*
 * Start the event registration, defaults will be added automatically. Plugins can regitrate new events. 
 */
var start = function start() {
	
	registerDefaultEvents();
	registerDefaultActions();
	
	//log.info(prelog + ':start) Events can now be registered');
};


/*
 * After all the plugins have registrated there events, ask the other plugins to registrate for events
 */
var askForRegistration = function askForRegistration() {
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
var registerEvent = function registerEvent(name, description, callback) {
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
var subscribeToEvent = function subscribeToEvent(name, callback, timeconfig) {

	//check if the event (still) exists
	if (!events.hasOwnProperty(name)) {
		return false;
	}
	
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
var unsubscribeFromEvent = function unsubscribeFromEvent(name, id) {
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
var registerAction = function registerAction(name, description, callfunction) {
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