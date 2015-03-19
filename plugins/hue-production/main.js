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

var displayResult = function(result) {
    console.log(JSON.stringify(result, null, 2));
};

exports.changeLightState = function(light_id) {

	// Set light state to 'on' with warm white value of 500 and brightness set to 100%
	state = lightState.create().on().white(500, 100);

	// --------------------------
	// Using a promise
	api.setLightState(light_id, state)
		.then(displayResult)
		.done();
};

//192.168.1.110

//Created user: "Automation"
//Created user: "2437a5842494b86faa9b5ac46c25f7"