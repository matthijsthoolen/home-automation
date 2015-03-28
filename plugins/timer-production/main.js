var prelog = '(Plugin:timer:main';

exports.start = function() {
	log.info(prelog + ":start) Timer started");
	
	var timerobject = setInterval(timertest, 10000);
};

exports.register = function() {
	
};

function timertest() {
	//log.info(prelog + ':timertest) Hello there this is a nice timer!!');
}