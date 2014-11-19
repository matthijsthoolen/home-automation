var PushBullet = require('pushbullet');
var pusher = new PushBullet('JCSXJO6dn5sKyGD9sAVU8zZPS8mUDatA');

var stream = pusher.stream();

pusher.subscriptions(function(error, response) {
	console.log(response);
});

stream.connect();

stream.on('connect', function() {
    console.log("You are connected");
});

stream.on('push', function(push) {
    console.log("OMG I received a push message");
});

stream.on('nop', function() {
    console.log("nop...");
});

stream.on('tickle', function(type) {
    console.log("TICKLE TICKLE!" + type);
});

var options = {
    limit: 10
};

pusher.devices(options, function(error, response) {
	console.log(response);
});