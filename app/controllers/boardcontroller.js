
let errorCode = require('../models/errorcode')

class BoardController {

    constructor(boardName) {
        this.boardName = boardName
        this.players = []
    }

    async joinBoard(socketUser) {
         await socketUser.joinBoard(this.boardName)
         this.players.push(socketUser)

         let data = errorCode.playerJoinBoard
         data.data = { user: socketUser.user } 
         this.sendBroadcastAllPlayers(data)
    }

    async leaveBoard(socketUser, isBackLobby) {
        for(let i = 0; i < this.players.length; i++) {
            let su = this.players[i]
            if(socketUser.user.userName === su.user.userName) {
                this.players.splice(i, 1)
                break;
            }
        }
        if(isBackLobby) {
            socketUser.leaveBoard(this.boardName)
        }
        this.sendBroadcastExceptMe(socketUser, errorCode.playerLeaveBoard)
    }

    async sendBroadcastAllPlayers(data) {
        this.players.map(async (socketUser) => {
            socketUser.send(data)
        })
    }

    async sendBroadcastExceptMe(socketUser, data) {
        socketUser.socket.to(this.boardName).emit('data', data)
    }

    async startGame() {
        this.sendBroadcastAllPlayers(errorCode.startGame)
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
        let gameCmd = gameData.cmd
        let data = gameData.data

        switch(gameCmd) {
            default:
                let syncData = errorCode.syncGameData
                syncData.data = gameData
                this.sendBroadcastExceptMe(socketUser, syncData)
                break;
        }
    }

}

module.exports = BoardController