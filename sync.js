
var sync = module.exports = function (schema, connect) {
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

/*
example:

var sync = makeSync(function (name) {
  //return a scuttlebutt.
  return new Model()
}, function (name) {
  //return a duplex stream...
  return http.get('http://whatever.com/replicate/'+name)
})

sync(name, function (_, scuttlebutt) {
  //scuttlebutt is ready!
})

*/
