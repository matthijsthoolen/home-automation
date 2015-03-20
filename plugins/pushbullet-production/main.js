var PushBullet = require('./lib/pushbullet.js');
var prelog = '(Plugin:Pushbullet:main';

exports.start = function() {
	var pusher = new PushBullet('JCSXJO6dn5sKyGD9sAVU8zZPS8mUDatA');
	var stream = pusher.stream();
	
	event.registerEvent('new-message', 'Sends a notification on a new push message on the stream', null);
	
	startStream(pusher, stream);
};

function startStream(pusher, stream) {

	/* pusher.subscriptions(function(error, response) {
		console.log(response);
	}); */

	stream.connect(); 

	stream.on('connect', function() {
		log.info(prelog + ":startStream) You are connected");
	});

	stream.on('push', function(push) {
		log.info(prelog + ":startStream) I received a push message");
		//log.info(push);
		//log.info(push.body);
		var message = [{'from' : 'pushbullet', 'to' : 'stream', 'message' : 'Hello there!'}];
		eventstream.putEvent('new-message', null);
		//homestream.send(message);
	});

	stream.on('nop', function() {
		log.debug(prelog + ":startStream) nop...");
	});

	stream.on('tickle', function(type) {
		log.debug(prelog + ":startStream) TICKLE TICKLE!" + type);
	});

	var options = {
		limit: 10
	};

/* 	pusher.devices(options, function(error, response) {
		log.debug(response);
	}); */
}