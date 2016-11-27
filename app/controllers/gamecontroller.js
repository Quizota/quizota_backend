
let Game = require('../models/game')

class GameController {
    
    constructor() {
        this.gameList = []

        let game = new Game()
        game.id = 1
        game.name = 'Number Rush'
        game.gameData = { maxNumber: 3 }
        game.image = ''
        game.type = 'number_rush'
        game.timeOut = 20000

        this.gameList.push(game)


        game = new Game()
        game.id = 2
        game.name = 'Vietnam Challange'
        game.gameData = { totalQuestion: 3, questionTimeout: 10000 }
        game.image = ''
        game.type = 'vietnam_challenge'
        game.timeOut = 0

        this.gameList.push(game)
    }

    async getRandomGameData() {
        return this.gameList[1]
    }
}

module.exports = new GameController()