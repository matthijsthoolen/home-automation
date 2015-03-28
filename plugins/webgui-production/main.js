var express = require('express');
var path = require("path");
var app, server;

exports.start = function() {
	app = express();
	
	app.use('/assets', express.static(__dirname + '/assets'));
	
	setRouting();
	
	server = app.listen(3001, function() {

		var host = server.address().address;
		var port = server.address().port;

		console.log('Example app listening at http://%s:%s', host, port);

	});
	app.use(express.static(path.join(__dirname, 'assets/html')));
};

function setRouting() {
	var html_dir = 'assets/html/';
	
	app.get('/', function(req, res) {
		res.sendFile(html_dir + 'index.html', {"root": __dirname});
	});
	
	app.get('/Nina', function(req, res) {
		res.send('Hallo Nientje!!');
	});
}