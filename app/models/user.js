let mongoose = require('mongoose')
let crypto = require('crypto')
const PEPPER = 'nodejs_minigame'

let userSchema = mongoose.Schema( {
    displayName: String,
    userName: {
        type: String,
        unique: true
    },
    password: String,
    avatar: {
        type: String,
        default: 'images/avatar/default.png'
    },
    gameUnlocked: [
        {
            gameId: {
                type: Number
            },
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
    isDefined: {
        type: Boolean,
        default: false
    },
    exp: {
        type: Number,
        default: 0
    }
})

userSchema.methods.validatePassword = async function(password) {
    if(!this.isDefined)
        return true

    let hash = await crypto.promise.pbkdf2(password, PEPPER, 4096, 512, 'sha256')
    return hash.toString('hex') === this.password
}

userSchema.methods.setPassword = async function(password) {
    let hash = await crypto.promise.pbkdf2(password, PEPPER, 4096, 512, 'sha256')
    this.password = hash.toString('hex')
}

userSchema.methods.updateElo = async function(increaseElo) {
    this.elo += increaseElo
}


module.exports = mongoose.model('User', userSchema)