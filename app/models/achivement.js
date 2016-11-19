let mongoose = require('mongoose')

let achievemenSchema = mongoose.Schema( {
    id: Number,
    name: String,
    img: String,
    rule: String
})

module.exports = mongoose.model('Achievement', achievemenSchema)