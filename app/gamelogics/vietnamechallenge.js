
let shuffle = require('shuffle-array')
let errorCode = require('../models/errorcode')
let provinceController = require('../controllers/provincecontroller')
let geolib = require('geolib')
const bufferDelayNewQuestion = 2000

let utils = require('../controllers/utils')

class VietnamChallenge {

    constructor(boardController, gameData) {
        this.boardController = boardController
        this.game = gameData
        this.randomArr = []
        this.currentQuestion = 0
        this.scores = {}
        this.countAnswer = 0
        this.lastAnswer = ''
        this.lastStartTime = Date.now()

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

        this.schedulerNPC()

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

            this.schedulerNPC()
            
        }

        this.countAnswer = 0
        this.lastAnswer = ''
        this.lastStartTime = Date.now()

        this.timeOut = setTimeout(async() => {
            if (this.currentQuestion === this.game.gameData.totalQuestion) {
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

        let resultData = this.calculateBonus(lat, lng)
        this.scores[socketUser.user.userName] += resultData.bonus

        let isEndGame = this.currentQuestion === this.game.gameData.totalQuestion

        let res = errorCode.processActionSuccess
        res['data'] = {
            userName: socketUser.user.userName, score: this.scores[socketUser.user.userName],
            bonus: resultData.bonus, pickData: { lat: lat, lng: lng },
            time: (Date.now() - this.lastStartTime) / 1000, distance: resultData.distance

        }

        await this.boardController.sendBroadcastAllPlayers(res)

        if(!isEndGame && isFinish) {
            let self = this
            setTimeout(function() {
                self.startQuestionTimer(true)
            }, bufferDelayNewQuestion)
        }
        
        if(isFinish && isEndGame) {
            let self = this
            setTimeout(function() {
                self.endGame()
            }, bufferDelayNewQuestion)
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

        console.log('-------END GAME--' + ', ' + this.boardController.boardName)
        console.log('-------Winner:' + winner + ', ' + JSON.stringify(this.scores))

        await this.boardController.endGame(winner, this.scores)
    }

    calculateBonus(lat, lng) {
        let location = { latitude: lat, longitude: lng }
        let quest = this.randomArr[this.currentQuestion - 1]
        let questLocation = {latitude: quest.latitude, longitude: quest.longitude}
        
        let distance = geolib.getDistance(location, questLocation, 10, 1) / 1000
        //console.log('distance (km): ' + distance)
        let maxDistance = 500
        let maxBonus = 100

        let bonus = distance <= 50 ? maxBonus : (maxBonus - maxBonus * (distance / maxDistance))
        return {bonus: Math.round(bonus < 0 ? 0 : bonus), distance: distance}
    }

    getGameId() {
        return this.game.id
    }

    schedulerNPC() {
        if(this.boardController.isHasNPC) {
            let timeRandom = utils.getRandomInt(this.game.gameData.questionTimeout / 3, this.game.gameData.questionTimeout - 2)
            //console.log(this.boardController.boardName + ', NPC answer after: ' + timeRandom)
            setTimeout(() => {
                let npc = this.boardController.getNPC()
                if(npc) {
                    let province = provinceController.randomProvince()
                    if(province) {
                        console.log(this.boardController.boardName + ", " + npc.user.displayName + ' NPC anwsered')
                        //console.log(province)
                        let data = {lat: province.latitude, lng: province.longitude}                          
                        this.processAction(npc, data)
                    }
                }
            }, timeRandom)
        }
    }

}

module.exports = VietnamChallenge