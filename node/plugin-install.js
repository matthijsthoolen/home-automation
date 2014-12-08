var sys = require('sys'),
    exec = require('child_process').exec;

var filename = 'pushbullet-1.0.tar.gz';

exec('wget http://loginweb.nl/hometest/' + filename, {cwd: '/home/cabox/workspace/home-automation/temp'}, function(err, stdout, stderr) {
    console.log("git status returned:\n " + err + " : "  + stdout);
	exec('tar -zxvf ' + filename, {cwd: '/home/cabox/workspace/home-automation/temp' }, function(err, stdout, stderr) {
		console.log('pwd: ' + err + ' : ' + stdout);
		exec('rm '  + filename, {cwd: '/home/cabox/workspace/home-automation/temp' }, function(err, stdout, stderr) {
			console.log('rm status returned ' ); console.log(err); 
		})
    })
})