
let shuffle = require('shuffle-array')
let errorCode = require('../models/errorcode')
let provinceController = require('../controllers/provincecontroller')
let geolib = require('geolib')

class VietnamChallenge {

    constructor(boardController, gameData) {
        this.boardController = boardController
        this.game = gameData
        this.randomArr = []
        this.currentQuestion = 0
        this.scores = {}
        this.countAnswer = 0
        this.lastAnswer = ''

        this.boardController.players.map( socketUser => {
            this.scores[socketUser.user.userName] = 0
        })
    }

    async startGame() {
        let totalQuestion = this.game.gameData.totalQuestion
        // console.log('totalQuestion: ' + totalQuestion)

        let arr = provinceController.provinceList
        shuffle(arr)

        for (let i = 0; i < totalQuestion; i++) {
            this.randomArr.push(arr[i])
        }

        await this.startQuestionTimer(false)

        return { game: this.game, data: { 'newQuestion': this.randomQuestion(), 'questionNo': this.currentQuestion } }
    }

    randomQuestion() {
        let question = this.randomArr[this.currentQuestion]
        this.currentQuestion++
        return question
    }

    async randomQuestionAndSendToPlayers() {
        let newQuestion = this.randomQuestion()

        let res = errorCode.syncGameData
        res.data = {cmd: 'newQuestion', data: { 'newQuestion': newQuestion, 'questionNo': this.currentQuestion }}
        this.boardController.sendBroadcastAllPlayers(res)
    }

    async startQuestionTimer(isRandomNewQuestion) {
        if(isRandomNewQuestion) {
            this.randomQuestionAndSendToPlayers()
        }

        this.countAnswer = 0
        this.lastAnswer = ''

        this.timeOut = setTimeout(async() => {
            if (this.currentQuestion === this.game.gameData.totalQuestion) {
                console.log('-------END GAME---------')
                return await this.endGame()
            }
            this.startQuestionTimer(true)
        }, this.game.gameData.questionTimeout)
    }
    
    async processAction(socketUser, data) {
        if(this.lastAnswer === socketUser.user.userName) {
            return
        }
        this.lastAnswer = socketUser.user.userName

        let lat = data.lat
        let lng = data.lng

        this.countAnswer++
        let isFinish = this.countAnswer === 2
        if(isFinish) {
            clearTimeout(this.timeOut)
        }

        let bonus = this.calculateBonus(lat, lng)
        this.scores[socketUser.user.userName] += bonus

        let isEndGame = this.currentQuestion === this.game.gameData.totalQuestion

        let res = errorCode.processActionSuccess
        res['data'] = {
            userName: socketUser.user.userName, score: this.scores[socketUser.user.userName],
            bonus: bonus, pickData: { lat: lat, lng: lng }
        }

        if(!isEndGame && isFinish) {
            res['data']['newQuestion'] = this.randomQuestion()
        }

        await this.boardController.sendBroadcastAllPlayers(res)
        
        if(isFinish && isEndGame) {
            await this.endGame()
        } else if(isFinish) {
            this.startQuestionTimer(false)
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

        if(maxScore < this.game.gameData.totalQuestion) {
            winner = ''
        }        

        await this.boardController.endGame(winner, this.scores)
    }

    calculateBonus(lat, lng) {
        let location = { latitude: lat, longitude: lng }
        let quest = this.randomArr[this.currentQuestion - 1]
        let questLocation = {latitude: quest.latitude, longitude: quest.longitude}
        
        let distance = geolib.getDistance(location, questLocation, 10, 1) / 1000
        console.log('distance (km): ' + distance)
        let maxDistance = 500
        let maxBonus = 100

        let bonus = maxBonus - maxBonus * (distance / maxDistance)
        return Math.round(bonus < 0 ? 0 : bonus)
    }

}

module.exports = VietnamChallenge