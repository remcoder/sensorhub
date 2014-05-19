if (Meteor.isClient) {
  Meteor.startup(function() {
    Meteor.subscribe('Sensors');
    Meteor.subscribe('Measurements');
  });

  var prev = null;
  var prevTimeStamp = null;
  var timer = Chronos.createTimer({ granularity : "second" });
  timer.start();

  Template.sensor.data = function () {
    // console.log('sensor.data')
    var data = Sensors.findOne({  _sensorId: 'woonkamer' }) || {};
    var now = data['_currentTime'] = +timer.getTime();
    
    if (data._timestamp != prevTimeStamp ) {
      prevTimeStamp = data._timestamp;
      if (prev === null)
        prev = prevTimeStamp;
      else
        var updated = true;
    }
    
    var delta = now - prev;
    data['_delta'] = delta;
    data['timeAgo'] = delta < 20000 
      ? Math.round(delta/1000) + "s ago" 
      : moment(now - delta).fromNow();

    var color = mapTo(delta, 0, 60000, 0, 255); //Math.max(255 * (delta / 60000));
    var alpha = 1 - mapTo(delta, 0, 60000, 0, 0.5);
    data['_color'] = "rgba(" +Math.round(color)+ ",0,0, "+alpha+")";

    if (updated)
      prev = now;
    return data;
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

function mapTo (v, s0,s1, t0,t1) {
  var v_new = t1 * (v / s1)
  return Math.max(t0, Math.min(t1, v_new));
}

if (Meteor.isServer) {
  Meteor.startup(function() {
    // Measurements.remove({});
    // Sensors.remove({});

    Meteor.publish('Sensors', function() {
      return Sensors.find({});
    });

    Meteor.publish('Measurements', function() {
      return Measurements.find({});
    });
  });

  Meteor.methods({
    measurement : function(sensorId, timestamp, data) {
      console.log("measurement data received: [" + sensorId + "][" + timestamp + "]", data);
      
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
  })
}
Sensors = new Meteor.Collection("sensors");
Measurements = new Meteor.Collection("measurements");
