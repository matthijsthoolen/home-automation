var prelog = '(Event:';

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
	plugins.hue.register();
};

/*
 * Register a new event and make it available to the other plugins
 */
exports.registerEvent = function(name, description, callback) {
	var event = {eventname: name, description: description, callback: callback, registered: []};
	
	events[name] = event;
};


/*
 * Register for a new event
 */
exports.listenForEvent = function(name, callback) {
		events[name].registered.push({callback: callback});
};


/*
 * Register a new action and make it available to the other plugins
 */
exports.registerAction = function(name, description, callfunction) {
	var action = {actionname: name, description: description, callfunction: callfunction};
	
	actions[name] = action;	
};


/*
 * Register all the default events to the array
 */
function registerDefaultEvents() {
	event.registerEvent('Haggie', 'Baggie', 'Mn bakkie');
}


/*
 * Register all the default actions to the array
 */
function registerDefaultActions() {
	
}