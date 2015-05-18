var express = require('express');
var path = require('path');
var swig = require('swig');
var socketio  = require('socket.io');

var app, server, io;

var prelog = '(Plugin:webgui';

var pluginname = '';

var content = { messagesnew: '320 new messages', 
					   smallbox: [ 
						   {main: '30 berichten', muted: 'Nieuw', icon: 'fa-envelope-o'}, 
						   //{main: '20 plugins', muted: 'Geinstalleerd', icon: 'fa-bars'},
						   //{main: '5 plugins', muted: 'Hebben een update', icon: 'fa-bell-o'},
						   {main: '320 errors', muted: 'Zie log', icon: 'fa-rocket'}
					   ]
					  };


/* 
 * Start the server
 */
exports.start = function(name) {	
	pluginname = name;
	
	app = express();

	// This is where all the magic happens!
	app.engine('html', swig.renderFile);

	app.set('view engine', 'html');
	app.set('views', __dirname + '/views');

	app.use(i18nclass);
	
	// Swig will cache templates for you, but you can disable
	// that and use Express's caching instead, if you like:
	app.set('view cache', false);
	// To disable Swig's cache, do the following:
	swig.setDefaults({ cache: false, varControls: ['{#', '#}'] });
	// Don't leave both of these to `false` in production!
	
	app.use('/assets', express.static(__dirname + '/assets'));
	
	setRouting();
	
	setErrorRouting();
	
	server = app.listen(3001, function() {

		var host = server.address().address;
		var port = server.address().port;

		log.info(prelog + ':start) WebGui plugin listening at http://%s:%s', host, port);

	});
	//app.use(express.static(path.join(__dirname, 'assets/html')));
	
	io = require('socket.io').listen(server);	
	
	setIO();
	
	event.registerEvent('GUI-register', null, [pluginname, 'guiregister', null]);
};


/*
 * Stop the server, close socket etc.
 */
exports.stop = function() {
	server.close();
	log.info(prelog + ':stop) Succesfully stopped WebGui server');	
};


/*
 * Default function
 */
exports.register = function() {
	event.subscribeToEvent('registration-completed', [pluginname, 'makegui', null]);	
};


/*
 * A callback function for the event 'GUI-register'
 */
exports.guiregister = function (info) {
	content.smallbox.push(info);
};


/*
 * Wait until the registration is completed to fire the GUI-register event
 */
exports.makegui = function() {
	eventstream.putEvent('GUI-register', {parameters: {type: 1}});
};


/*
 * Routing expressjs
 */
function setRouting() {
	var html_dir = 'assets/html/';
	
	app.get('/', function(req, res) {
		//res.sendFile(html_dir + 'index.html', {"root": __dirname});
		
		//eventstream.putEvent('GUI-register', {parameters: {type: 1}});
		
		res.render('index', content);
	});
	
	app.get('/plugin', function(req, res) {
		renderPlugin(req, res);
	});
	
	app.get('/plugin-new', function(req, res) {
		renderPluginNew(req, res);	
	});
	
	app.get('/chat', function(req, res) {
		res.render('chat', content);
	});
	
	app.get('/Nina', function(req, res) {
		res.send('Hallo Nientje!!');
	});

}


/*
 * Handle error pages routing
 */
function setErrorRouting() {
	// Handle 404
	app.use(function(req, res) {
		res.status(404).render('404', {title: '404: File Not Found'});
	});

	// Handle 500
	app.use(function(error, req, res, next) {
		console.log(error);
		res.status(500).render('500', {title:'500: Internal Server Error', error: error});
	});
}


/*
 * Start the socket.io connections
 */
function setIO() {
	io.on('connection', function(socket){
		//console.log('a user connected');
		
		socket.on('disconnect', function(){
			//console.log('user disconnected');
		});
		
		socket.on('chat message', function(msg){
			console.log('message: ' + msg);
			io.emit('chat message', msg);
		});
		
		//socket connection for /plugin 
		socket.on('pluginaction', function(msg){			
			switch(msg.action) {
				case 'activate':
					util.runForEach(msg.list, plugin.activate, updateTable);
					break;
				case 'deactivate':
					util.runForEach(msg.list, plugin.deactivate, updateTable);
					break;
				case 'update':
					var list = listToObjects(msg.list);
					util.runForEach(list, plugin.update, updateTable);
					break;
				case 'remove':
					util.runForEach(msg.list, plugin.remove, updateTable);
					break;
				case 'publish':
					util.runForEach(msg.plugins, plugin.publishVersion, updateTable);
					break;
			}
		});
		
		socket.on('pluginStoreButton', pluginStoreButton);
	});
}


/*
 * Function to add a array with seperate id's to an array with objects with the 
 * seperate ID's. Input: [plugin1, plugin2] --> Output [{id: plugin1}, {id: plugin2}]
 *
 * @param {array} list
 * @return {array}
 */
function listToObjects(list) {
	var object = [];
	
	for (var i in list) {
		object.push({id: list[i]});
	}
	
	return object;
}


/*
 *
 */
function publishPlugin() {
	io.emit('askVersion', 'test');
}

	
/*
 *
 */
function updateTable(err, stdout, stderr) {
	if (err) {
		log.error('Error: ' + stderr.message);
		io.emit('pluginlistupdate', stderr);
		return;
	}
	
	io.emit('pluginlistupdate', stdout);
}
	
	
/*
 * On click of the 'add' or 'install' button on the new plugin page, run this function
 *
 * @param {object} msg
 *		action {string}
 * @param {function} callback
 */
function pluginStoreButton(msg, callback) {
	var action = util.opt(msg, 'action', false);
	var name = util.opt(msg, 'name', false);
	
	var prelogFunc = prelog + ':pluginStoreButton) ';
	
	if (action === 'add') {
		plugin.newDevPlugin({name: name}, function(err, stdout, stderr) {
			if (err) {
				log.warn(prelogFunc + 'Couldn\'t create newDevPlugin!');
				util.doCallback(callback, {err: true, stderr: 'Couldn\'t create newDevPlugin!'});
				return;
			}
			
			console.log('working!');
			
			callback('Joe je kan verder!');
		});
	}
}


/*
 * Render plugin page
 */
function renderPlugin(req, res) {
	var prelogFunc = prelog + ':renderPlugin) ';
	var message;
	
	var data;
	
	var plugins = plugin.getPluginInfo();
	
	var response = plugin.checkDevPlugins(plugins);
	
	if (response.err) {
		log.info(prelogFunc + 'There was an error with checking for developers');
		data = {plugins: plugins, developer: false};
	} else {
		data = response.stdout.data;
	}	
	
	res.render('plugins', data);
}


/*
 * Render the new plugin page
 */
function renderPluginNew(req, res) {
	var prelogFunc = prelog + ':renderPluginNew) ';
	var message;
	
	var plugins = plugin.getPluginList({dev: true});
	
	res.render('plugins-new', {plugins: plugins});
}
