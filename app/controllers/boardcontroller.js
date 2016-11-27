
let errorCode = require('../models/errorcode')
let gameController = require('./gamecontroller')
let NumberRush = require('../gamelogics/numberrush')
let userController = require('./usercontroller')
let VietnamChallenge = require('../gamelogics/vietnamechallenge')

class BoardController {

    constructor(boardName) {
        this.boardName = boardName
        this.players = []
        this.gameLogic = null
        this.isPlaying = false
        this.timeOut = null
    }

    async joinBoard(socketUser) {        
        let newJoin = errorCode.playerJoinBoard
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
        socketUser.socket.to(this.boardName).emit('data', data)
    }

    async startGame() {        
        let gameData = await gameController.getRandomGameData()
        let returnData = errorCode.startGame

        if(gameData.type === 'number_rush') {
            this.gameLogic = new NumberRush(this, gameData)
        } else if(gameData.type === 'vietnam_challenge') {
            this.gameLogic = new VietnamChallenge(this, gameData)
        }
        returnData.data = await this.gameLogic.startGame()
        await this.sendBroadcastAllPlayers(returnData)
        this.isPlaying = true

        let self = this
        if(gameData.timeOut > 0) {
            this.timeOut = setTimeout(async () => {
                await self.gameLogic.endGame()       
            }, gameData.timeOut)
        }
    }

    isEmpty() {
        return this.players.length === 0
    }

    getInfo() {
        let playerNames = []
        this.players.map( player => {
            playerNames.push(player.user.userName)
        })

        let gameInfo = {
            name: 'game test',
            img: 'images/games/gametest.png'
        }

        return {
            roomName: this.boardName,
            players: playerNames,
            gameInfo: gameInfo
        }
    }

    async handleGameMsg(socketUser, gameData) {

        if(!this.isPlaying) {
            return await socketUser.send(errorCode.gameNotPlay)
        }

        let gameCmd = gameData.cmd
        let data = gameData.data

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

        let player = this.getPlayerByUserName(winner)

        if(player) {
            await userController.updateElo(player.user, bonusElo)
        }

        await this.sendBroadcastAllPlayers(res)
    }

    

}

module.exports = BoardController