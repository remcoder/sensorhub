var _ = require('underscore');
var DDPClient = require("ddp");

var ddpclient = new DDPClient({
  host: 'sensorhub.meteor.com',
  port: 80,
  //host: "192.168.178.21", 
  //port: 3000,
  /* optional: */
  auto_reconnect: true,
  auto_reconnect_timer: 500,
  use_ejson: true,  // default is false
  use_ssl: false, //connect to SSL server,
  use_ssl_strict: true, //Set to false if you have root ca trouble.
  maintain_collections: true //Set to false to maintain your own collections.
});

ddpclient.connect(function(error) {
  if (error) {
    console.log('DDP connection error!');
    return;
  }

  console.log('connected!');

  process.stdin.setEncoding('utf8');

	process.stdin.on('readable', function(chunk) {
	  var chunk = process.stdin.read();
	  if (chunk !== null) {
	  	//console.log('measurement received from sensor: ', chunk);
	  	var data = parse(chunk);
			ddpclient.call('measurement', [data], function(err, result) {
		  		console.log('measurement sent: ', data);
	  		})	    
	  }
	});



  
});

/*
 * Useful for debugging and learning the ddp protocol
 */
// ddpclient.on('message', function(msg) {
//   console.log("ddp message: " + msg);
// });

/* 
 * If you need to do something specific on close or errors.
 * (You can also disable auto_reconnect and call ddpclient.connect()
 * when you are ready to re-connect.)
*/
ddpclient.on('socket-close', function(code, message) {
  console.log("Close: %s %s", code, message);
});

ddpclient.on('socket-error', function(error) {
  console.log("Socket error! We'll keep trying...");
});

function parse(chunk) {
	var data = {};
	var lines = chunk.split('\n');
	lines.forEach(function (line) {
		if (!line) return;

		if (line.indexOf(']') == -1)
			return;

		var parts1 = line.split(']');
		var senderId = parts1[0].slice(1).trim();
		if (/^\d+$/.test(senderId)) senderId = +senderId; // convert to number if numeric
		var valuePart = parts1[1].trim();
		var parts = valuePart.split('=');
		var key = parts[0];
		var value = parts[1];
		if (!key || !value) return;
		data[key.trim().toLowerCase()] = value.trim().toLowerCase();
		data.id = senderId;
	})

	return _.pick(data, 'id', 'temperature', 'humidity');
}
