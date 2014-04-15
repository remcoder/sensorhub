if (Meteor.isClient) {
  Meteor.startup(function() {
    Meteor.subscribe('Sensors');
  });

  var _prevTimestamp = 0;
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


  setInterval(function() {
    setCurrentTime(+new Date);
  }, 300);

  Template.sensor.data = function () {
    var data = Sensors.findOne({  _sensorId: 'woonkamer' }) || {};
    data['_currentTime'] = getCurrentTime();

    if (data._timestamp != _prevTimestamp ) {
      _prevTimestamp = data._timestamp
    }
    var timeDiff = new Date - _prevTimestamp;
    data['_timeDiff'] = timeDiff;
    data['timeAgo'] = timeDiff < 20000 ? Math.round(timeDiff/1000) + "s ago" : moment(Math.min(_prevTimestamp, +new Date)).fromNow(); // prevent negative numbers b/c that would be weird. They're the result of having differing clocks on Pi and Meteor
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
