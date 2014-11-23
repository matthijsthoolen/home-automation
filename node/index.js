var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var config = require('./config');

console.log(config.sayHelloInEnglish("Hi There"));

app.get('/home-automation/public/', function(req, res){
 	res.sendFile('/home/cabox/workspace/home-automation/public/index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');
});

io.on('connection', function(socket){
	console.log('a user connected');
	socket.on('disconnect', function(){
		console.log('user disconnected');
	});
});

io.on('connection', function(socket){
	socket.on('chat message', function(msg){
		io.emit('chat message', msg);
	});
});

http.listen(3000, function(){
  	console.log('listening on *:3000');
});