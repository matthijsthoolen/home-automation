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
		
		plugins[callback[0]][callback[1]](callback[2]);
	});
};

/*
 * Call action
 */ 
exports.callAction = function(actionname, parameters) {
	var action = actions[actionname].callfunction;
	
	log.info("Sending");
	
	plugins[action[0]][action[1]](parameters);
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