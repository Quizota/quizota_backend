

let requireDir = require('require-dir')
let App = require('./app/app')


let config = requireDir('./config', {recurse: true})
let port = process.env.PORT || 8000


let app = new App(config, __dirname)
app.initialize(port)
    .then(() => {
      console.log(`Listening @ http://0.0.0.0:${port}`)
    })
