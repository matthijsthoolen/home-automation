var HueApi = require("node-hue-api").HueApi;

var hostname = "192.168.2.129",
    newUserName = null; // You can provide your own username value, but it is normally easier to leave it to the Bridge to create it
    userDescription = "device description goes here";

var displayUserResult = function(result) {
    console.log("Created user: " + JSON.stringify(result));
};

var displayError = function(err) {
    console.log(err);
};

var hue = new HueApi();

// --------------------------
// Using a callback (with default description and auto generated username)
hue.createUser(hostname, null, null, function(err, user) {
    if (err) throw err;
    displayUserResult(user);
});