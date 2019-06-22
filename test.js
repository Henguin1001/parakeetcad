var fs = require('fs')
var gerberParser = require('gerber-parser')

var parser = gerberParser()

parser.on('warning', function(w) {
  console.warn('warning at line ' + w.line + ': ' + w.message)
})

fs.createReadStream('Gerber_TopLayer.GTL')
  .pipe(parser)
  .on('data', function(obj) {
    console.log(JSON.stringify(obj))
  })
