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
		log.info(prelog + ":startStream) A push has been received from " + push.application_name + "("+ push.package_name + ") with title: " + push.title);
		
		checkPush(push);
		//log.info(push);
		//log.info(push.body);
		//var message = [{'from' : 'pushbullet', 'to' : 'stream', 'message' : 'Hello there!'}];
		//eventstream.putEvent('new-message', null);
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


/*
 * Check the push message for the content and check if an event needs to be fired.
 */
function checkPush(push) {
	
	applicationnameCheck = ['whatsapp', 'snapchat', 'mailwise', 'pushbullet'];
	
	if (push.application_name === undefined) {
		return false;
	}
	
	applicationname = push.application_name.toLowerCase().trim();
	
	if (applicationnameCheck.indexOf(applicationname) > -1) {
		log.info('sending out');
		eventstream.callAction('blink-lights', '');
	}
	
	
}

/*{"name":"homeautomation","hostname":"box-codeanywhere.com","pid":14454,"level":30,"type":"mirror","title":"Testmelding","body":"Als je dit op je computer ziet, werken Android-naar-pc-meldingen goed!\n","application_name":"Pushbullet",
"package_name":"com.pushbullet.android","notification_id":"-8","notification_tag":null,"dismissable":true,"client_version":159,"source_device_iden":"ujxwS7jJ61QsjzZGJDP3oy","source_user_iden":"ujxwS7jJ61Q","has_root":true,"icon":"/9j/4AAQSk","msg":"","time":"2015-03-20T16:32:45.234Z","v":0}    */  









