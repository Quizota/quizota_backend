let mongoose = require('mongoose')
let crypto = require('crypto')
const PEPPER = 'nodejs_minigame'

let userSchema = mongoose.Schema( {
    displayName: String,
    userName: {
        type: String,
        index: true,
        unique: true
    },
    password: String,
    avatar: {
        type: String,
        default: 'images/avatar/default.png'
    },
    gameUnlocked: [
        { 
            gameId: Number,
            win: Number,
            lose: Number
        }
    ],
    level: {
        type: Number,
        default: 1
    },
    elo: {
        type: Number,
        default: 1200
    },
    achievements: [Number],

})

userSchema.methods.validatePassword = async function(password) {
    let hash = await crypto.promise.pbkdf2(password, PEPPER, 4096, 512, 'sha256')
    return hash.toString('hex') === this.password
}

module.exports = mongoose.model('User', userSchema)