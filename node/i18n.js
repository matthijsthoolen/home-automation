i18n = require('i18n');

i18n.configure({
	// setup some locales - other locales default to en silently
	locales: ['en', 'nl'],

	// where to store json files - defaults to './locales' relative to modules directory
	//directory: __dirname + '/locales',
	directory: '../locales',

	defaultLocale: 'en',
	
	updateFiles: true,

	// sets a custom cookie name to parse locale settings from  - defaults to NULL
	//cookie: 'lang',
});

module.exports = function(req, res, next) {

	i18n.init(req, res);
	//res.local('__', res.__);

	var current_locale = i18n.getLocale();
	
	//i18n.setLocale('en');
	//i18n.setLocale(req, 'en');
	req.setLocale('en');

	return next();
};