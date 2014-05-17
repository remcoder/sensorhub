
var SECOND  = 1000,
    MINUTE  = 60 * SECOND,
    HOUR    = 60 * MINUTE,
    DAY     = 24 * HOUR,
    WEEK    = 7  * DAY;

var lookup = {
      "second"  : SECOND,
      "minute"  : MINUTE,
      "hour"    : HOUR,
      "day"     : DAY,
      "week"    : WEEK
};

function granularity(g) {
  if (typeof g == 'number')
    return g;

  if (typeof g == 'string') {
    var key = g
      .toLowerCase()
      .replace(/s$/,''); // plural

    return lookup[key]
  }
  
  throw new Error('granularity should be either string or number');
}

function Timer(opts) {
  opts = opts || {};
  this.granularity = granularity(opts.granularity)
  this.interval = opts.interval || this.granularity / 20;
  // console.log('granularity', this.granularity);
  // console.log('interval', this.interval);
  this.currentTime = 0;
  this.dep = new Deps.Dependency;
}

Timer.prototype.getTime = function() {
  this.dep.depend();
  return this.currentTime;
}

Timer.prototype.setTime = function(t) {
  if (Math.round(this.currentTime/this.granularity) != Math.round(t / this.granularity)) {
    this.currentTime = t;
    this.dep.changed();
  }
}

Timer.prototype.start = function() {
  this.currentTime = new Date;
  this.timer = setInterval(function() {
    this.setTime(new Date);
  }.bind(this), this.interval);
}

Timer.prototype.stop = function() {
  clearInterval(this.timer);
}

// export as global
Chronos = {
  createTimer : function (opts) {
    return new Timer(opts);
  }
}
