
let errorCode = require('../models/errorcode')
const LOBBY_NAME = 'LOBBY'

class SocketUser {
    constructor(socket, user) {
        this.user = user
        this.socket = socket
        this.currentRoom = LOBBY_NAME
    }

    async joinLobby() {

        if(!this.isInLobby()) {
            if(!this.isNpc()) {
                this.socket.leave(this.currentRoom)
            }
        }

        console.log(`Join lobby: ${this.user.displayName}`)
        if(!this.isNpc()) {
            this.socket.join(LOBBY_NAME)
        }
        this.currentRoom = LOBBY_NAME

        let resData = errorCode.newUserJoinLobby
        resData.msg = `${this.user.displayName} joined lobby`
        await this.publicMsgInCurrentRoom(resData)
    }

    async forceLogout() {
        if(!this.isNpc()) {
            this.send(errorCode.anotherLogin)
            this.socket.disconnect(true)
        }
    }

    async publicMsgInCurrentRoom(msg) {
        if(!this.isNpc()) {
            this.socket.to(this.currentRoom).emit('data', msg)
        }
    }

    isInLobby() {
        return this.currentRoom === LOBBY_NAME 
    }

    async send(msg) {
        if(!this.isNpc()) {
            this.socket.emit('data', msg)
        }
    }

    async joinBoard(boardName) {
        
        if(!this.isNpc()) {
            this.socket.leave(this.currentRoom)
            this.socket.join(boardName)
        }
        this.currentRoom = boardName
    }

    isNpc() {
        return this.socket === null
    }
}

module.exports = SocketUser