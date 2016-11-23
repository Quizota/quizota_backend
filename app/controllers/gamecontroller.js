
let Game = require('../models/game')

class GameController {
    
    async getRandomGameData() {
        let game = new Game()

        game.id = 1
        game.name = 'Number Rush'
        game.gameData = { maxNumber: 3 }
        game.image = ''
        game.type = 'number_rush'
        game.timeOut = 20000

        return game
    }
}

module.exports = new GameController()