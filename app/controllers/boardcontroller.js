
let errorCode = require('../models/errorcode')
let gameController = require('./gamecontroller')
let NumberRush = require('../gamelogics/numberrush')
let userController = require('./usercontroller')
let VietnamChallenge = require('../gamelogics/vietnamechallenge')

class BoardController {

    constructor(socketManager, boardName) {
        this.socketManager = socketManager
        this.boardName = boardName
        this.players = []
        this.gameLogic = null
        this.isPlaying = false
        this.timeOut = null

        this.isHasNPC = false
    }

    async joinBoard(socketUser) {        
        let newJoin = errorCode.newPlayerJoinBoard
        newJoin.data = { user: socketUser.user }
        await this.sendBroadcastAllPlayers(newJoin)

        let currentPlayer = errorCode.playerJoinBoardSuccess
        currentPlayer.data = {}

        if(this.players.length > 0) {
            currentPlayer.data.user = this.players[0].user
        }
        await socketUser.send(currentPlayer)

        await socketUser.joinBoard(this.boardName)
        this.players.push(socketUser)

        if(socketUser.isNpc()) {
            this.isHasNPC = true
        }
    }

    async leaveBoard(socketUser) {
        for(let i = 0; i < this.players.length; i++) {
            let su = this.players[i]
            if(socketUser.user.userName === su.user.userName) {
                this.players.splice(i, 1)
                break;
            }
        }
        this.sendBroadcastExceptMe(socketUser, errorCode.playerLeaveBoard)

        if(this.isPlaying) {
            this.gameLogic.endGame()
        }
    }

    async sendBroadcastAllPlayers(data) {
        this.players.map(async (socketUser) => {
            await socketUser.send(data)
        })
    }

    async sendBroadcastExceptMe(socketUser, data) {
        if(!socketUser.isNpc()) {
            socketUser.socket.to(this.boardName).emit('data', data)
        }
    }

    async startGame() {

        let timeWait = 10000
        console.log('Start game after: ' + timeWait + ', ' + this.boardName)

        let playerArr = []

        for(let index in this.players) {
            playerArr.push(this.players[index].user)
        }

        let waitingStart = errorCode.waitingStartGame
        waitingStart.data = {waitingTime: timeWait, players: playerArr}
        await this.sendBroadcastAllPlayers(waitingStart)


        let gameData = await gameController.getRandomGameData()
        if(gameData.type === 'number_rush') {
            this.gameLogic = new NumberRush(this, gameData)
        } else if(gameData.type === 'vietnam_challenge') {
            this.gameLogic = new VietnamChallenge(this, gameData)
        }

        setTimeout(async () => {

            let returnData = errorCode.startGame
            returnData.data = await this.gameLogic.startGame()

            await this.sendBroadcastAllPlayers(returnData)
            this.isPlaying = true

            let self = this
            if(gameData.timeOut > 0) {
                this.timeOut = setTimeout(async () => {
                    await self.gameLogic.endGame()
                }, gameData.timeOut)
            }
            console.log('-------Game started : ' + ', ' + this.boardName)
        }, timeWait)
    }

    isEmpty() {
        return this.players.length === 0
    }

    getInfo() {
        let playerNames = []
        this.players.map( player => {
            playerNames.push(player.user.userName)
        })
 
        return {
            roomName: this.boardName,
            players: playerNames,
            gameInfo: this.gameLogic.game
        }
    }

    async handleGameMsg(socketUser, gameData) {

        if(!this.isPlaying) {
            return await socketUser.send(errorCode.gameNotPlay)
        }

        let jsonData = {} 
        try {
            if(gameData !== null) {
                jsonData = gameData.constructor === String ? JSON.parse(gameData) : gameData
            }
        } catch(err) {
            console.error(err)
        }

        let gameCmd = jsonData.cmd
        let data = jsonData.data

        switch(gameCmd) {
            case 'gameAction':
                await this.gameLogic.processAction(socketUser, data)
                break;
            default:
                let syncData = errorCode.syncGameData
                syncData.data = gameData
                await this.sendBroadcastExceptMe(socketUser, syncData)
                break;
        }
    }

    getPlayerByUserName(userName) {
        for(let i = 0; i < this.players.length; i++) {
            let player = this.players[i]
            if(player.user.userName === userName) {
                return player
            }
        }
        return null
    }

    async endGame(winner, results) {
        if(this.gameLogic === false) {
            return
        }
        if(this.timeOut) {
            clearTimeout(this.timeOut)
        }

        this.isPlaying = false

        // calculate elo bonus from range elo between 2 players
        let bonusElo = winner !== '' ? 20 : 0
        let res = errorCode.endGame
        res.data = { winName: winner, bonusElo: bonusElo, scores: results }

        this.saveBonus(winner, bonusElo)

        await this.sendBroadcastAllPlayers(res)



        let self = this
        this.timeOut = setTimeout(function() {
            console.log('timer kick user not back lobby: ' + ', ' + self.boardName)

            for(let i = 0; i < self.players.length; i++) {
                self.socketManager.backLobby(self.players[i])
                i--
            }
        }, 40000)

    }

    async saveBonus(winner, bonusElo) {
        this.players.map(async (socketUser) => {
            if(winner === '') {
                await userController.updateElo(socketUser.user, 0, this.gameLogic.getGameId)
            } else {
                if (socketUser.user.userName === winner) {
                    await userController.updateElo(socketUser.user, bonusElo, this.gameLogic.getGameId)
                } else{
                    await userController.updateElo(socketUser.user, -1, this.gameLogic.getGameId)
                }
            }
        })
    }

    getNPC() {
        for(let i = 0; i < this.players.length; i++) {
            if(this.players[i].isNpc()) {
                return this.players[i]
            }
        }
        return null
    }

}

module.exports = BoardController