var nconf = require('nconf');

exports.sayHelloInEnglish = function(text) {
  return text;
};


nconf.file({ file: '/home/cabox/workspace/home-automation/config.json' });
 
nconf.load();
nconf.set('name', 'Home-automation');

nconf.set('plugins:pushbullet:version', 'newest');
nconf.set('plugins:pushbullet:active', 'true');
nconf.set('plugins:pushbullet:level', '1');


console.log(nconf.get('plugins'));

nconf.save(function (err) {
	if (err) {
		console.error(err.message);
		return;
	}
	console.log('Configuration saved successfully.');
});