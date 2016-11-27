let mongoose = require('mongoose')

let provinceSchema = mongoose.Schema( {
    _id: Number,
    name: String,
    longitude: Number,
    latitude: Number
})

module.exports = mongoose.model('Province', provinceSchema)