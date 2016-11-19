let mongoose = require('mongoose')

let gameSchema = mongoose.Schema( {
    id: Number,
    name: String,
    img: String,
    levelUnlock: Number,
    type: String,
    gameData: mongoose.Schema.Types.Mixed
})

module.exports = mongoose.model('Game', gameSchema)