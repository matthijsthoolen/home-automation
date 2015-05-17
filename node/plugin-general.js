/******************************************************************************\
 *																			  *
 *							General actions									  *
 *																			  *
\******************************************************************************/

var prelog = '(Pluginmodule:general';

module.exports = function(callback) {
	
	parentCallback = callback;
	
	var ext = [];
	var int = [];
	
	return {ext: ext, int: int};
};