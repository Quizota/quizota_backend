let mongoose = require('mongoose')

let eloSchema = mongoose.Schema( {
    level: Number,
    elo: Number,
    name: String,
    img: String
})

module.exports = mongoose.model('Elo', eloSchema)