if (Meteor.isClient) {
  Meteor.startup(function() {
    Meteor.subscribe('Sensors');
  });

  var _prevTimestamp = 0;
  var _prevTime = 0;
  var _currentTime = 0;
  var _currentTimeDep = new Deps.Dependency;


  var getCurrentTime = function () {
    _currentTimeDep.depend()
    return _currentTime;
  };

  var setCurrentTime = function (t) {
    _currentTime = t;
    _currentTimeDep.changed();
  };


  (function animloop(){
    requestAnimFrame(animloop);
    setCurrentTime(+new Date);
  })();

  Template.sensor.data = function () {
    var data = Sensors.findOne({  _sensorId: 'woonkamer' }) || {};
    data['_currentTime'] = getCurrentTime();

    if (data._timestamp != _prevTimestamp ) {
      _prevTime = +new Date;
      _prevTimestamp = data._timestamp
    }
    var timeDiff = new Date - _prevTime;
    data['_timeDiff'] = timeDiff;
    data['_timeDiffSeconds'] = Math.floor(timeDiff / 1000);
    var color = mapTo(timeDiff, 0, 60000, 0, 255); //Math.max(255 * (timeDiff / 60000));
    var alpha = 1 - mapTo(timeDiff, 0, 60000, 0, 0.5);
    data['_color'] = "rgba(" +Math.round(color)+ ",0,0, "+alpha+")";
    return data;
  };
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
    })
  });

  Meteor.methods({
    measurement : function(sensorId, timestamp, data) {
      console.log("measurement data received: [" + sensorId + "][" + timestamp + "]", data);
      
      Measurements.insert({
        _sensorId : sensorId,
        _timestamp : timestamp,
        temperature : data.temperature,
        humidity : data.humidity
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
