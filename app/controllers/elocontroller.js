
let Elo = require('../models/elo')

class EloController {
    constructor() {
        this.eloRange = await Elo.promise.find()
    }

}

module.exports = new EloController()