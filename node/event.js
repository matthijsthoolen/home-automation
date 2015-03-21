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
 * Register for a new event. An unique ID is returned.
 */
exports.subscribeToEvent = function(name, callback, timeconfig) {
	
	if (typeof timeconfig === 'undefined') {
    	timeconfig = null;
  	}
	
	var id = nrEventSub;
	nrEventSub++;

	events[name].registered.push({id: id, callback: callback, timeconfig: timeconfig});
	
	//this.unsubscribeFromEvent(name, id);

	return id;
};


//TODO: Make this function
/*
 * Unsubscribe from an event
 */
exports.unsubscribeFromEvent = function(name, id) {
	var registered = events[name].registered; 
	
	var i = 0;
	
	//eventinfo.registered.forEach(function(callFunction) {
	
	log.info(registered);
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
	//event.registerEvent('Haggie', 'Baggie', 'Mn bakkie');
}


/*
 * Register all the default actions to the array
 */
function registerDefaultActions() {
	
}