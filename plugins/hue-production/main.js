var hue = require("node-hue-api"),
    HueApi = hue.HueApi,
    lightState = hue.lightState;

var prelog = '(Plugin:Hue:main';

var host = "192.168.1.110",
    username = "Automation",
    api,
    state;

exports.start = function() {
	api = new HueApi(host, username);
	log.info(prelog + ":start) Hue Api started");
};


/*
 * The main routine will call this function if it is ready to receive registration
 * on events and actions.
 */
exports.register = function () {
	//event.listenForEvent('new-message', ['hue', 'changeLightState', '2']);	
	//event.listenForEvent('new-message', ['hue', 'changeLightState', '1']);	
	event.registerAction('blink-lights', 'Blink the lights',  ['hue', 'blinkLights', '']);
};

var displayResult = function(result) {
    console.log(JSON.stringify(result, null, 2));
};

exports.changeLightState = function(light_id) {
	
	log.info(prelog + ':changeLightState) Received call!');

	// Set light state to 'on' with warm white value of 500 and brightness set to 100%
	state = lightState.create().on().white(500, 100);

	// --------------------------
	// Using a promise
	api.setLightState(light_id, state)
		.then(displayResult)
		.done();
};

exports.blinkLights = function () {
	log.info(prelog + ':blinkLights) Received call!');

	// Set light state to 'on' with warm white value of 500 and brightness set to 100%
	state = lightState.create().effect('colorloop');

	// --------------------------
	// Using a promise
	api.setLightState('1', state)
		.then(displayResult)
		.done();
};

//192.168.1.110

//Created user: "Automation"
//Created user: "2437a5842494b86faa9b5ac46c25f7"