/**
 * Created by phuongla on 11/18/2016.
 */

let passport = require('passport')
let wrap = require('nodeifyit')
let User = require('../models/user')

let LocalStrategy = require('passport-local').Strategy
let uuid = require('uuid')


// Handlers
async function localAuthHandler(userName, password) {
    let user = await User.promise.findOne({userName})

    if (!user || userName !== user.userName) {
        return [false, {message: 'Invalid username'}]
    }

    if (!await user.validatePassword(password)) {
        return [false, {message: 'Invalid password'}]
    }
    return user
}

async function localSignupHandler(userName, password) {

    userName = (userName || '').toLowerCase()
    if (await User.promise.findOne({userName})) {
        return [false, {message: 'That userName is already taken.'}]
    }

    // create the user
    let user = new User()
    user.userName = userName
    // Use a password hash instead of plain-text
    user.password = await user.generateHash(password)
    return await user.save()
}


async function localAutoSignupHandler(displayName, password) {
    let userName = uuid.v1()

    if (await User.promise.findOne({userName})) {
        return [false, {message: 'That userName is already taken.'}]
    }

    // create the user
    let user = new User()
    user.userName = userName
    user.displayName = displayName
    user.password = ''

    return await user.save()
}


function configure(CONFIG) {
    // Required for session support / persistent login sessions
    passport.serializeUser(wrap(async (user) => user._id))
    passport.deserializeUser(wrap(async (id) => {
        return await User.promise.findById(id)
    }))

    /**
     * Local Auth
     */
    let localLoginStrategy = new LocalStrategy({
        usernameField: 'userName'
    }, wrap(localAuthHandler, {spread: true}))

    let localSignupStrategy = new LocalStrategy({
        usernameField: 'userName'
    }, wrap(localSignupHandler, {spread: true}))

    let localAutoSignupStrategy = new LocalStrategy({
        usernameField: 'userName'
    }, wrap(localAutoSignupHandler, {spread: true}))

    passport.use('local-login', localLoginStrategy)
    passport.use('local-signup', localSignupStrategy)

    passport.use('local-auto-signup', localAutoSignupStrategy)


    return passport
}

module.exports = {passport, configure}