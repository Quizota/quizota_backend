
let Game = require('../models/game')

class GameController {
    
    constructor() {
        this.gameList = []

        let game = new Game()
        game.id = 1
        game.name = 'Number Rush'
        game.gameData = { maxNumber: 3 }
        game.image = 'img/game/game_icon_1.png'
        game.type = 'number_rush'
        game.timeOut = 20000
        game.active = true
        this.gameList.push(game)


        game = new Game()
        game.id = 2
        game.name = 'Vietnam Challange'
        game.gameData = { totalQuestion: 5, questionTimeout: 15000 }
        game.image = 'img/game/game_icon_2.png'
        game.type = 'vietnam_challenge'
        game.timeOut = 0
        game.active = true
        this.gameList.push(game)


        game = new Game()
        game.id = 3
        game.name = 'Math'
        game.gameData = { maxNumber: 3 }
        game.image = 'img/game/game_icon_3.png'
        game.type = 'math'
        game.timeOut = 20000
        game.active = false
        this.gameList.push(game)


        game = new Game()
        game.id = 4
        game.name = 'Estimation'
        game.gameData = { maxNumber: 3 }
        game.image = 'img/game/game_icon_4.png'
        game.type = 'estimation'
        game.timeOut = 20000
        game.active = false
        this.gameList.push(game)


        game = new Game()
        game.id = 5
        game.name = 'Quiz'
        game.gameData = { maxNumber: 3 }
        game.image = 'img/game/game_icon_5.png'
        game.type = 'quiz'
        game.timeOut = 20000
        game.active = false
        this.gameList.push(game)
    }

    async getRandomGameData() {
        return this.gameList[1]
    }

}

module.exports = new GameController()