/**
 * Created by phuongla on 11/18/2016.
 */

let mongoose = require('mongoose');

let matchSchema = mongoose.Schema({
    _id: ObjectId,
    gameId: Number,
    players: [
        {
            userId: String,
            score: Number
        }
    ]
})