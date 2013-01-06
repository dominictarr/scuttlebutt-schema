var parserx = require('parse-regexp')

var exports = module.exports = function (schema) {
  if('function' == typeof schema)
    return schema

  var rules = []
  for (var p in schema) {
    rules.push({rx: parserx(p) || p, fn: schema[p]})
  }

  function match (key) {
    for (var i in rules) {
      var r = rules[i]
      var m = key.match(r.rx)
      if(m && m.index === 0)
        return r.fn(key)
    }
  }

  match.schema = schema
  match.rules = rules

  return match
}

exports.schema = exports

exports.cache =
function cached (open) {
  var local = {}
  return function (name, tail, cb) {
    if('function' == typeof tail)
      cb = tail, tail = true

    var cached = local[name]
    if(cached && 'function' === typeof cached.clone) {
      var n = cached.clone()
      cb(null, n)
      return n
    }
    var clone
    var scuttlebutt = open(name, tail, function (err) {
      cb(err, clone || scuttlebutt)
    })
    
    //only scuttlebutts with clone can be cleanly cached.
    if('function' === typeof scuttlebutt.clone) {
      local[name] = scuttlebutt
      clone = scuttlebutt.clone()
      //okay... have something to dispose the scuttlebutt when there are 0 streams.
      //hmm, count streams... and emit an event 'unstream' or something?
      //okay, if all the steams have closed but this one, then it means no one is using this,
      //so close...
      //TODO add this to level-scuttlebutt.
      scuttlebutt.on('unstream', function (n) {
        if(n === 1) scuttlebutt.dispose()
      })
    }

    return scuttlebutt
  }
}

exports.sync = 
exports.open = function (schema, connect) {
  return function (name, tail, cb) {
    if('function' == typeof tail)
      cb = tail, tail = true

    var scuttlebutt = schema(name)
    var es = scuttlebutt.createStream()
    var stream = connect(name)

    if(!stream)
      return cb(new Error('unable to connect'))

    stream.pipe(es).pipe(stream)

    var ready = false
    es.once('sync', function () {
      if(ready) return
      ready = true

      //cb the stream we are loading the scuttlebutt from,
      //incase it errors after we cb?
      //I'm not sure about this usecase.
      //Actually, just leave that feature out!
      //that way I don't have to break API when I realize it was a bad idea.
      if(cb)    cb(null, scuttlebutt)
      if(!tail) es.end()
    })
    //hmm, this has no way to detect that the stream has errored
    stream.once('error', function (err) {
      if(!ready) return cb(err)
    })

    return scuttlebutt
  }
}

