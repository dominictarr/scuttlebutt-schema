var parserx      = require('parse-regexp')

module.exports = function (schema) {
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
        return r.fn
    }
  }

  match.schema = schema
  match.rules = rules

  return match
}
