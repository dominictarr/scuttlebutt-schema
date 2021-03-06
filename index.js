var parserx = require('parse-regexp')

//don't make the timeout too large, because it will prevent the process from exiting...
var TIMEOUT = 100

var exports = module.exports = function (schema) {
  if('function' == typeof schema)
    return schema

  if(!schema)
    throw new Error('expect a function, or object of functions that return scuttlebutts')

  var rules = []
  for (var p in schema) {
    if('function' === typeof schema[p])
      rules.push({rx: parserx(p) || p, fn: schema[p]})
  }

  if(!rules.length)
    throw new Error('cannot have empty schema')

  function match (key) {
    if('object' === typeof key) return key
    for (var i in rules) {
      var r = rules[i]
      var m = key.match(r.rx)
      if(m && m.index === 0) {
        var scuttlebutt = r.fn(key)
        scuttlebutt.name = key
        return scuttlebutt
      }
    }
  }

  match.schema = schema
  match.rules = rules

  return match
}

exports.schema = exports

exports.cache =
function cached (open, onCache) {
  var local = {}
  return function (name, tail, cb) {
    if('function' == typeof tail)
      cb = tail, tail = true

    var cached = local[name]
    if(cached && 'function' === typeof cached.clone) {
      var n = cached.clone()
      n.name = name
      cb(null, n)
      return n
    }
    var clone
    var scuttlebutt = open(name, tail, function (err, scuttlebutt) {
      if(err) return cb(err)
      scuttlebutt.name = name
      cb(null, clone || scuttlebutt)
    })

    //will callback an error
    if(!scuttlebutt) return

    scuttlebutt.name = name
    
    //only scuttlebutts with clone can be cleanly cached.
    if('function' === typeof scuttlebutt.clone) {
      local[name] = scuttlebutt
      clone = scuttlebutt.clone()
      clone.name = name
      if(onCache) onCache('cache', scuttlebutt.name)
      //okay... have something to dispose the scuttlebutt when there are 0 streams.
      //hmm, count streams... and emit an event 'unstream' or something?
      //okay, if all the steams have closed but this one, then it means no one is using this,
      //so close...
      //TODO add this to level-scuttlebutt.

      var timer = null
      scuttlebutt.on('unstream', function (n) {
        if(n === 1) {
          clearTimeout(timer)
          timer = setTimeout(function () {
            scuttlebutt.dispose()
            if(onCache) onCache('uncache', scuttlebutt.name)
          }, TIMEOUT)
            //if an emitter was passed, imet
        } else if(n > 1)
          clearTimeout(timer)
      })
      scuttlebutt.on('dispose', function () {
        delete local[name]
      })
    }

    return scuttlebutt
  }
}

exports.sync = 
exports.open = function (schema, connect) {
  //pass in a string name, or a scuttlebutt instance
  //you want to reconnect to the server.
  return function (name, tail, cb) {
    if('function' == typeof tail)
      cb = tail, tail = true

    var scuttlebutt
    if('string' === typeof name)
      scuttlebutt = schema(name)
    else {
      scuttlebutt = name
      name = scuttlebutt.name
    }
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

