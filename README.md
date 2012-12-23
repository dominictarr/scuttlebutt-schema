# scuttlebutt-schema

Tools for creating scuttlebutts.

[![server-tests](https://travis-ci.org/dominictarr/scuttlebutt-schema)
](https://secure.travis-ci.org/dominictarr/scuttlebutt-schema.png?branch=master)

[![browser-support](https://ci.testling.com/dominictarr/scuttlebutt-schema.png)
](https://ci.testling.com/dominictarr/scuttlebutt-schema)

## schema

``` js
var schema = require('scuttlebutt-schema')
var Model  = require('scuttlebutt/model')
var Events = require('scuttlebutt/events')

var createScuttlebutt = schema({
  model: function () {
    return new Model()
  },
  events: function () {
    neturn new Events()
  }
})

//keys are matched on the prefix.
var model1 = createScuttlebutt('model1')
var model2 = createScuttlebutt('model2')
var events1 = createScuttlebutt('events1')
```

## open

`open` loads a scuttlebutt via a stream.
given a schema, and a createStream function,
`open` returns a async function that will callback a fully loaded scuttlebutt.
the `createStream` function takes a string, just like `schema`, and should return a stream 
to a scuttlebutt instance with the same name, or a file where that scuttlebutt instance is persisted. 
``` js
var open = require('scuttlebutt-schema').open(schema, createStream)
//now call the function with a name.
open(name, function (err, sb) {
  //sb is now ready to use!
})
```

full example

``` js

var makeOpen = require('scuttlebutt-schema').open

var open = makeMake(function (name) {
  //return a scuttlebutt.
  return new Model()
}, function (name) {
  //return a duplex stream...
  return http.get('http://whatever.com/replicate/'+name)
})

open(name, function (_, scuttlebutt) {
  //scuttlebutt is ready!
})


## License

MIT
