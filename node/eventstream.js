var prelog = '(Eventstream:';

/*
 * Start listening to the stream
 */
exports.start = function() {
	log.info(prelog + 'start) Stream is now available');
};


/*
 * Add event to the stream and notify all the subscribers
 *
 * @param {string} eventname is the name of the event to fire.
 * @param {object} info:info must be an object with possible keys: 
 * - parameters to put as one parameter object
 */
exports.putEvent = function(eventname, info) {
	
	//check if the event is still available
	if (!events.hasOwnProperty(eventname)) {
		return false;
	}
	
	var eventinfo = events[eventname];
	var parameters = null;
	
	//check if parameters is given, if so set it
	if (info !== null && typeof info === 'object' && 'parameters' in info) {
		parameters = info.parameters;	
	}
	
	eventinfo.registered.forEach(function(callFunction) {
		var callback = callFunction.callback;
		var timeconfig = callFunction.timeconfig;
		
		//If the event is not active at this moment go to the next iteration
		if (!checkTimeconfig(timeconfig)) return;
		
		//If parameters === null set the default parameter
		if (parameters === null) parameters = callback[2];
		
		callPlugin(callback[0], callback[1], parameters, eventinfo.callback);
	});
};


/*
 * Call action
 *
 * @param {string} actionname
 * @param {string} parameters
 */ 
exports.callAction = function(actionname, parameters) {
	if (!(actionname in actions)) {
		log.error(prelog + "callAction) The action '" + actionname+ "' is called, but doesn't exist (anymore)");
		return false;
	}
	var action = actions[actionname].callfunction;
	
	callPlugin(action[0], action[1], parameters);
};





/* 
 * Call this function with the encoded json message
 *
 * @param {array} message: 
 * [{ 	from: 'pluginname', 
 *		to: 'pluginnames', (seperated by ;)
 *		message: 'the actual message',
 *		reply: 'optional reply parameter to identify the reply'
 * }] 
 * Multiple messages can be send at once by adding another object to
 * the end.
 */
exports.send = function(message) {
	log.info(prelog + 'send) received your message: ' + message);
	log.info(message[0].message);
};


/*
 * Call a callback function of a plugin
 * 
 * @param {string} plugin
 * @param {string} functionname
 * @param {mixed} parameters
 */
exports.callBack = function(plugin, functionname, parameters) {
	callPlugin(plugin, functionname, parameters);	
};


/*
 * Run a function of a plugin
 * 
 * @param {string} pluginname
 * @param {string} functionname
 * @param {mixed} parameters
 * @param {array} info
 */
function callPlugin(pluginname, functionname, parameters, info) {
	plugin.callFunction(pluginname, functionname, parameters, info);
}


/*
 * Check if an event of action is active at this moment
 *
 * @param {object} timeconfig
 * @return {boolean}
 */
function checkTimeconfig(timeconfig) {
	
	//If timeconfig equals null it is always active so return true
	if (timeconfig === null) {
		return true;
	}
	
	var d = new Date(),
		h = checkTime(d.getHours()),
		m = checkTime(d.getMinutes());
	var n = d.getDay();
	n = 1;
	
	var till, from;
	
	var today = timeconfig[n];
	
	//Check if the current time is within the active time
	for (var p in today) {
		if( today.hasOwnProperty(p) ) {
			from = today[p].f.split(':');
			till = today[p].t.split(':');
			
			//If end time is 00:00:00 correct it to make it work in the formula below
			if (till[0] == '00') {
				till[0] = '24';
				till[1] = '60';
			}
			
			//log.info('current time = ' + h + ':' + m);
			
			//First if checks if the hour is between the minimum or maximum, if so return true.
			//Else we have to check more detailed and check for the minutes.
			if (h > from[0] && h < till[0]) {
				return true;
			} else if (h == from[0] && m >= from[1] || h == till[0] && m <= till[1]) {
				return true;
			}
		}
	}   
	
	return false;
}

function checkTime(i) {
	return (i < 10) ? "0" + i : i;
}