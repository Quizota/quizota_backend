
let UserController = require('./usercontroller')
let errorCode = require('../models/errorcode')
let SocketUser = require('./socketuser')
let BoardController = require('./boardcontroller')


class SocketManager {

    constructor(io) {
        this.io = io

        this.socketListById = {}
        this.userSockets = {}
        this.userBySocketIds = {}
        
        this.boardControllers = {}

        this.io.on('connection', socket => {
            console.log('manager user connected: ' + socket.id)
            this.socketListById[socket.id] = socket

            socket.on('disconnect', async () => {
                await this.removeSocket(socket)
            })

            socket.on('im', async (msg) => {
                console.log(msg)
                await this.publicMsg(msg)
            })

            socket.on('data', async (dataEvent) => {
                console.log(dataEvent)
                let jsonData = JSON.parse(dataEvent)
                let cmd = jsonData.cmd
                let data = jsonData.data

                if(cmd === 'autoRegister') {
                    return await this.autoSignup(socket, data)
                } else if(cmd === 'login') {
                    return await this.login(socket, data)
                }
               
                if(!(socket.id in this.userBySocketIds)) {
                    return socket.emit('data', errorCode.userNotAuth)
                }

                let user = this.userBySocketIds[socket.id]
                let socketUser = this.userSockets[user.userName]

                switch (cmd) {
                    case 'playNow':
                        await this.playNow(socketUser)
                        break;
                    case 'syncGameData':
                        await this.syncGameData(socketUser, data)
                        break;
                    case 'findParticipant':
                        break;
                    default:
                        socketUser.send(errorCode.commandNotFound)
                        break;
                }
            })
        })
    }

    async removeSocket(socket) {
        if(socket.id in this.socketListById) {
            console.log('user disconnected: ' + socket.id)
            delete this.socketListById[socket.id]

            if(socket.id in this.userBySocketIds) {
                let user = this.userBySocketIds[socket.id]
                delete this.userBySocketIds[socket.id]

                if(user.userName in this.userSockets) {
                    let socketUser = this.userSockets[user.userName]
                    delete this.userSockets[user.userName]

                    if(!socketUser.isInLobby()) {
                        let lastRoom = socketUser.currentRoom
                        if(lastRoom in this.boardControllers) {
                            let board = this.boardControllers[lastRoom]
                            board.leaveBoard(socketUser, false)

                            if(board.isEmpty()) {
                                console.log(`Remove board: ${lastRoom}`)
                                delete this.boardControllers[lastRoom]
                            }
                        }
                    }
                }
            }
        }
    }

    async publicMsg(msg) {
        this.io.emit('im', msg)
    }

    async autoSignup(socket, data) {
        let displayName = data.displayName
        let user = await UserController.autoSignup(displayName)
        socket.emit('im', { code: 1, msg: `auto register success: ${displayName}`})

        let socketUser = await this.addNewUser(socket, user)
        await this.joinLobby(socketUser)
    }

    async login(socket, data) {

    }

    async addNewUser(socket, user) { 
        if(user.userName in this.userSockets) {
            let oldSocketUser = this.userSockets[user.userName]
            oldSocketUser.forceLogout()
        }

        let socketUser = new SocketUser(socket, user)

        this.userBySocketIds[socket.id] = user
        this.userSockets[user.userName] = socketUser

        return socketUser
    }

    async joinLobby(socketUser) {
        await socketUser.joinLobby()
        let boardList = []

        for(let board in this.boardControllers) {
            boardList.push(board.getInfo())
        }

        // send data lobby to user
        let data = {
            profile: socketUser.user,
            boardList: boardList
        }

        let resData = errorCode.joinLobbySuccess
        resData.data = data

        socketUser.send(resData)

        console.log(resData)
    }

    async playNow(socketUser) {
        for(let userName in this.userSockets) {
            if(userName !== socketUser.user.userName) {
                let participant = this.userSockets[userName]
                return this.createBoard(socketUser, participant)
            }
        }

        socketUser.send(errorCode.notFoundParticipant)
    }

    async createBoard(socketUser, participant) {
        let boardName = `${socketUser.user.userName}_${participant.user.userName}`
        let board = new BoardController(boardName)

        this.boardControllers[boardName] = board

        await board.joinBoard(socketUser)
        await board.joinBoard(participant)

        await board.startGame()
    }

    async syncGameData(socketUser, data) {
        if(socketUser.isInLobby()) {
            console.log('User is in lobby')
            return
        }

        let roomName = socketUser.currentRoom
        if(roomName in this.boardControllers) {
            let board = this.boardControllers[roomName]
            let syncData = errorCode.syncGameData
            syncData.data = data
            board.sendBroadcastExceptMe(socketUser, syncData)
        }
    }
}


module.exports = SocketManager
