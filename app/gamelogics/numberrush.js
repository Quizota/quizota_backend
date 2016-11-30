
let shuffle = require('shuffle-array')
let errorCode = require('../models/errorcode')

class NumberRush {

    constructor(boardController, gameData) {
        this.boardController = boardController
        this.gameData = gameData
        this.randomArr = []
        this.currentNumber = 0 
        this.scores = {}

        this.boardController.players.map( socketUser => {
            this.scores[socketUser.user.userName] = 0
        })
    }

    async startGame() {
        let maxNumber = this.gameData.gameData.maxNumber
        console.log('maxNumber: ' + maxNumber)
        for (let i=1; i <= maxNumber; i++) {
            this.randomArr.push(i)
        }
        shuffle(this.randomArr)
        return { game: this.gameData, data: this.randomArr }
    }
    
    async processAction(socketUser, data) {
        let pickNumber = data.pickNumber

        if(pickNumber <= this.currentNumber || pickNumber > this.currentNumber + 1) {
            return await socketUser.send(errorCode.processActionFailed)
        }

        this.currentNumber++
        this.scores[socketUser.user.userName] += 1

        let res = errorCode.processActionSuccess
        res['data'] = {userName: socketUser.user.userName, pickNumber: pickNumber, score: this.scores[socketUser.user.userName]}

        await this.boardController.sendBroadcastExceptMe(socketUser, res)
        await socketUser.send(res)

        if(this.currentNumber >= this.gameData.gameData.maxNumber) {
            await this.endGame()
        }

    }

    async endGame() {
        let winner = ''
        let maxScore = 0

        for(let userName in this.scores) {
            if(this.scores[userName] > maxScore) {
                winner = userName
                maxScore = this.scores[userName]
            }
        }

        if(maxScore !== 0) {
            winner = ''
        }        

        await this.boardController.endGame(winner, this.scores)
    }

    getGameId() {
        return this.gameData.id
    }
}

module.exports = NumberRush