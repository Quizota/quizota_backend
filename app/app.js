/**
 * Created by phuongla on 11/17/2016.
 */
let express = require('express')
let morgan = require('morgan')
let cookieParser = require('cookie-parser')
let bodyParser = require('body-parser')
let session = require('express-session')
let path = require('path')

let browserify = require('browserify-middleware')
let passportMiddleware = require('./middlewares/passport')
let mongoose = require('mongoose')

require('../bootstrap')

let routes = require('./routes')
const NODE_ENV = process.env.NODE_ENV || 'development'

let Server = require('http').Server
let io = require('socket.io')
let SocketManager = require('./controllers/socketmanager')


class App {

    constructor(config, rootDir) {
        let app = this.app = express()

        app.config = {
            database: config.database[NODE_ENV]
        }

        passportMiddleware.configure(config)
        app.passport = passportMiddleware.passport

        // connect to the database
        mongoose.connect(app.config.database.url)
        mongoose.Promise = require('bluebird')

        // set up our express middleware
        app.use(morgan('dev')) // log every request to the console
        app.use(cookieParser('ilovethenodejs')) // read cookies (needed for auth)
        app.use(bodyParser.json()) // get information from html forms
        app.use(bodyParser.urlencoded({ extended: true }))


        let MongoStore = require('connect-mongo')(session)

        // required for passport
        app.use(session({
            secret: 'ilovethenodejs',
            resave: false,
            saveUninitialized: true,
            store: new MongoStore({ 
                mongooseConnection: mongoose.connection,
                ttl: 24 * 3600 
            })
        }))


        app.use(app.passport.initialize())
        app.use(app.passport.session())

        // configure routes
        routes(app)



        let viewDir = path.join(rootDir, 'views')
        app.set('views', viewDir)
        app.set('view engine', 'ejs') // set up ejs for templating


        browserify.settings({transform: ['babelify']})
        app.use('/js/index.js', browserify( path.join(rootDir, 'public/js/index.js')))


        this.server = Server(app)
        this.io = io(this.server)
        
        this.socketManager = new SocketManager(this.io)
    }

    async initialize(port) {
        await this.server.promise.listen(port)
        return this
    }
}

module.exports =  App