
let errorCode = require('../models/errorcode')
const LOBBY_NAME = 'LOBBY'

class SocketUser {
    constructor(socket, user) {
        this.user = user
        this.socket = socket
        this.currentRoom = LOBBY_NAME
    }

    async joinLobby() {
        console.log(`Join lobby: ${this.user.displayName}`)
        this.socket.join(LOBBY_NAME)
        this.currentRoom = LOBBY_NAME

        let resData = errorCode.chatMessage
        resData.msg = `${this.user.displayName} joined lobby`
        await this.publicMsgInCurrentRoom(resData)
    }

    async forceLogout() {
        this.socket.emit('im', errorCode.anotherLogin)
        this.socket.disconnect(true)
    }

    async publicMsgInCurrentRoom(msg) {
        this.socket.to(this.currentRoom).emit('im', msg)
    }

    isInLobby() {
        return this.currentRoom === LOBBY_NAME 
    }

    async send(msg) {
        this.socket.emit('data', msg)
    }

    async joinBoard(boardName) {
        this.socket.leave(LOBBY_NAME)
        this.socket.join(boardName)
        this.currentRoom = boardName
    }

    async leaveBoard(boardName) {
        this.socket.leave(boardName)
        this.joinLobby()
    }
}

module.exports = SocketUser