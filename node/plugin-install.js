var sys = require('sys'),
    exec = require('child_process').exec;

exec('git status', {cwd: '/home/cabox/workspace/home-automation/'}, function(err, stdout, stderr) {
        console.log("cd: " + err + " : "  + stdout);
        exec("pwd", function(err, stdout, stderr) {
            console.log("pwd: " + err + " : " + stdout);
            exec("git status", function(err, stdout, stderr) {
                console.log("git status returned " ); console.log(err);
            })
        })
    })