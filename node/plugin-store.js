/******************************************************************************\
 *																			  *
 *								Plugin store								  *
 *																			  *
\******************************************************************************/

var prelog = '(Pluginmodule:store';

module.exports = function(callback) {
	
	parentCallback = callback;
	
	var ext = [];
	var int = [];
	
	ext.getPluginList = getPluginList;
	
	return {ext: ext, int: int};
};


/*
 * Get a list of all the online plugins, flag the plugins which are installed already
 *
 * @param {object} options
 *		order {string} asc/desc (default asc)
 *		perRow {int} number of items per row (default 4)
 *		dev {boolean} add a 'add new dev-plugin' button
 * @param {function} callback
 * @return {object} pluginlist
 */
var getPluginList = function getPluginList(options, callback) {
	var data = config.getConfiguration('server');
	
	var order = util.opt(options, 'order', 'asc');
	var perRow = util.opt(options, 'perRow', 4);
	var dev = util.opt(options, 'dev', false);
	
	var plugin;
	var i = 0;
	
	var list = [];
	var tmpRow = [];
	
	//From object to array for easy sorting
	var array = util.objectToArray(data);
	
	//Sort the array
	array = util.sortArray(array, {});
	
	//Add a dev item to the first row. 
	if (dev) {
		var devItem = {
			'name': 'Dev-plugin template',
			'description': 'Generate a new developer plugin template',
			'stars': false,
			'dev': true,
			'button': 'Add',
			'buttonTitle': 'Add a new developer plugin template!'
		};
		
		tmpRow.push(devItem);
		i++;
	}
	
	//For each plugin check if it's installed.
	array.forEach(function(plugin) {
	//for (var id in data) {
		
		//If the row is full, push the row to the list
		if (i % perRow === 0 && i !== 0) {
			list.push(tmpRow);
			tmpRow = [];
		}
		
		plugin.installed = exports.checkInstalled(plugin.id);
		
		tmpRow.push(plugin);
		i++;
	});
	
	//Check if the tmpRow contains partly filled rows, and push them to the list.
	if (tmpRow.length > 0) {
		list.push(tmpRow);
	}
	
	util.doCallback(callback, {stdout: list});
	return list;
};