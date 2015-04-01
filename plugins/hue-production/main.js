var hue = require("node-hue-api"),
    HueApi = hue.HueApi,
    lightState = hue.lightState;

var prelog = '(Plugin:Hue:main';
var demo = true;

var host = "192.168.1.110",
    username = "Automation",
    api,
    state;

exports.start = function() {
	api = new HueApi(host, username);
	log.info(prelog + ":start) Hue Api started");
	findBridge();
};


/*
 * The main routine will call this function if it is ready to receive registration
 * on events and actions.
 */
exports.register = function () {
	
	event.subscribeToEvent('new-message', ['hue', 'changeLightState', '2']);	
	event.subscribeToEvent('new-message', ['hue', 'changeLightState', '1'], {0: [{f: '00:00', t: '08:00'}, {f: '22:00', t: '00:00'}], 1: [{f: '00:00', t: '12:00'}, {f: '22:00', t: '00:00'}], 2: [{f: '00:00', t: '14:00'}], 3: '', 4: '', 5: '', 6: '', 7: ''});	
	
	event.subscribeToEvent('GUI-register', ['hue', 'gui', '']);
	
	event.registerAction('blink-lights', 'Blink the lights',  ['hue', 'blinkLights', '']);
	
	eventstream.putEvent('new-message', 'blabla');
};

var displayResult = function(result) {
    console.log(JSON.stringify(result, null, 2));
};


/*
 *
 */
exports.gui = function (par1, par2) {
	eventstream.callBack(par2[0], par2[1], {main: '6 lampen actief', muted: 'Totaal 14 lampen', icon: 'fa-lightbulb-o'});
};


/*
 * Search for a bridge if an error occures, keep the demo mode on true and return
 * else set the demo mode on false and return true.
 */
function findBridge() {
	hue.nupnpSearch(function(err, result) {
		if (err) {
			log.error(prelog + ':findBridge) Error by finding bridge, entering demo mode!');
			demo = true;
			return false;
		} 
		
		if (result.length <= 0) {
			log.error(prelog + ':findBridge) No bridge found, entering demo mode!');
			demo = true;
			return false;
		}
		
		demo = false;
		
		log.info(prelog + ':findBridge) No errors, assuming bridge is found! ' + result);
		
		return true;
		
		//log.info("HELLO + " + result);
		//displayBridges(result);
	});
}

exports.changeLightState = function(light_id) {
	
	log.info(prelog + ':changeLightState) Received call!');
	
	if (demo) return true;

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
	
	if (demo) return true;

	var oldstate = lightState.create().copy();
	
	api.setLightState('1', oldstate)
		.done();
	
	// Set light state to 'on' with warm white value of 500 and brightness set to 100%
	var state = lightState.create().on().white(500, 100).longAlert();

	// --------------------------
	// Using a promise
	api.setLightState('1', state)
		.then(displayResult)
		.done();
	
	api.setLightState('1', oldstate)
		.done();
};

//192.168.1.110

//Created user: "Automation"
//Created user: "2437a5842494b86faa9b5ac46c25f7"