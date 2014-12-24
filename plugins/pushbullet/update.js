/*
 * Start the update process
 */
exports.start = function(options, callback) {
	var currentinfo = util.opt(options, 'currentinfo', null);
	var newversion = util.opt(options, 'newversion', null);
	var tempfolder = util.opt(options, 'tempfolder', null);
	
	callback(null, 'completed', null);
};