var prelog = '(Eventstream:';

/*
 * Start listening to the stream
 */
exports.start = function() {
	log.info(prelog + 'start) Stream is now available');
};


/*
 * Add event to the stream and notify all the subscribers
 */
exports.putEvent = function(eventname, info) {
	var eventinfo = events[eventname];
	
	eventinfo.registered.forEach(function(callFunction) {
		var callback = callFunction.callback;
		var timeconfig = callFunction.timeconfig;
		
		//If the event is not active at this moment go to the next iteration
		if (!checkTimeconfig(timeconfig)) return;
		
		callPlugin(callback[0], callback[1], callback[2]);
	});
};

/*
 * Call action
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
 * Call a plugin with the given function and parameters
 */
function callPlugin(plugin, functionname, parameters) {
	
	//return false if the plugin is not loaded (doesn't exist in the array)
	if (!(plugin in plugins)) return false;
	
	//check if the given function is indeed a function
	if (typeof plugins[plugin][functionname] === "function") { 
		plugins[plugin][functionname](parameters);
		return true;
	}
	
	log.info(prelog + 'callPlugin) The function "' + functionname + '" is not valid for the plugin: ' + plugin);
	
	return false;
}

/*
 * Check if an event of action is active at this moment
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