if (Meteor.isClient) {
  Meteor.startup(function() {
    Meteor.subscribe('Sensors');
    Meteor.subscribe('Measurements');
  });

  var prev = null;
  var prevTimeStamp = null;
  var timer = Chronos.createTimer({ granularity : 'second' });
  timer.start();


  Template.sensors.data = function () {
    
    return Sensors.find().map(function(s,index) {
      var now = s.currentTime = +timer.getTime();
      var delta = 0;

      if (s._timestamp && +s._timestamp != +prevTimeStamp ) {
        
        prevTimeStamp = s._timestamp;
        // console.log('updating', 'prevTimeStamp',prevTimeStamp, 'new timestamp' ,s._timestamp);
        if (prev === null) {
          prev = prevTimeStamp;
        } else {
          prev = now;
        }
      } else if (prev) {
        delta = now - prev;
        // console.log('update delta', delta);
      }  
      
      s._delta = delta;
      s._color = delta > 60000 ? 'rgba(255,0,0,0.2)' : '#black';
      
      if (delta < 60000) 
        s.timeAgo = 'less than a minute ago';
      else
        s.timeAgo = moment().subtract('ms', delta).fromNow();
      s._index = index;
      return s;

    });
  };

  

  // Template.history.rendered = function() {
  //   var canvas = this.findAll('canvas')[0];
  //   var ctx = canvas.getContext('2d');
  //   // console.log('rendered', canvas);

  //   Deps.autorun(function() {
  //     var filtered = Measurements
  //     .find({ temperature : { $ne : null} }, { limit: 30})
  //     .fetch();
        
  //     var data = {
  //       labels : filtered.map(function(f,i) { return i; }),
  //       datasets : [{
  //         fillColor : "rgba(220,220,220,0.5)",
  //         strokeColor : "rgba(220,220,220,1)",
  //         pointColor : "rgba(220,220,220,1)",
  //         pointStrokeColor : "#fff",
  //         data : filtered.map(function(f) { return f.temperature; }),
  //       }]
  //     };  
      
  //     console.time('chart');
  //     var myNewChart = new Chart(ctx).Bar(data, { 
  //       animation: false,
  //       scaleOverride: true,
  //       scaleSteps: 10,
  //       scaleStepWidth: 1,
  //       scaleStartValue: 15
  //     });
  //     console.timeEnd('chart');

  //     //console.log(filtered);
  //   });
  // }
}

if (Meteor.isServer) {
  Meteor.startup(function() {
    Meteor.publish('Sensors',      function() { return Sensors.find({}); });
    Meteor.publish('Measurements', function() { return Measurements.find({}); });
  });

  Meteor.methods({
    measurement : function(data) {
      var sensorId =  data.id ;
      var timestamp = new Date();
      console.log('measurement data received: [' + sensorId + '][' + timestamp + ']', data);
      
      Measurements.insert({
        _sensorId   : sensorId,
        _timestamp  : timestamp,
        temperature : data.temperature,
        humidity    : data.humidity
      });

      if (data.temperature)
        Sensors.upsert({ _sensorId : sensorId }, { 
          $set : {
            _timestamp : timestamp,
            temperature : data.temperature,
          }
        });

      if (data.humidity)
        Sensors.upsert({ _sensorId : sensorId }, { 
          $set : {
            _timestamp : timestamp,
            humidity : data.humidity
          }
        });
    }
  });
}
Sensors = new Meteor.Collection('sensors');
Measurements = new Meteor.Collection('measurements');
