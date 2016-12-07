
let UserController = require('./usercontroller')
let errorCode = require('../models/errorcode')
let SocketUser = require('./socketuser')
let BoardController = require('./boardcontroller')
let GameController = require('./gamecontroller')


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

            socket.on('data', async (dataEvent) => {
                console.log(dataEvent)
                let jsonData = {}
                try {
                    jsonData = dataEvent.constructor === String ? JSON.parse(dataEvent) : dataEvent
                } catch(err) {
                    console.error(err)
                }

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
                    case 'saveUser':
                        await this.saveUser(socketUser, data)
                        break;
                    case 'backLobby':
                        await this.backLobby(socketUser)
                        break;
                    case 'chatInRoom':
                        await this.chatInRoom(socketUser, data)
                        break;
                    case 'leaderBoard':
                        await this.leaderBoard(socketUser)
                        break;
                    case 'findParticipant':
                        await this.findParticipant()
                        break;
                    case 'getMyInfo':
                        await this.getMyInfo(socketUser)
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
                        this.leaveBoard(socketUser)
                    }
                }
            }
        }
    }

    async autoSignup(socket, data) {

        let displayName = data.displayName

        if(displayName === null || displayName.length < 3) {
            return socket.emit('data', errorCode.signupFailed)
        }

        let user = await UserController.autoSignup(displayName)
        console.log(`Register success: ${displayName}`)

        await this.addNewUser(socket, user)

    }

    async login(socket, data) {
        let userName = data.userName
        let password = data.password

        let user = await UserController.login(userName, password)
        
        if(!user) {
            return socket.emit('data', errorCode.loginFailed)
        }
        await this.addNewUser(socket, user)

    }

    async addNewUser(socket, user) { 
        if(user.userName in this.userSockets) {
            let oldSocketUser = this.userSockets[user.userName]
            oldSocketUser.forceLogout()
        }

        let socketUser = new SocketUser(socket, user)

        this.userBySocketIds[socket.id] = user
        this.userSockets[user.userName] = socketUser


        let res = errorCode.loginSuccess
        res.data = {
            profile: socketUser.user,
            gameList: GameController.gameList
        }
        socketUser.send(res)

        await this.joinLobby(socketUser)
    }

    async joinLobby(socketUser) {
        await socketUser.joinLobby()
        let boardList = []

        for(let boardName in this.boardControllers) {
            let board = this.boardControllers[boardName]
            boardList.push(board.getInfo())
        }

        // send data lobby to user
        let data = {
            boardList: boardList
        }

        let resData = errorCode.joinLobbySuccess
        resData.data = data

        socketUser.send(resData)
    }

    async playNow(socketUser) {
        let findTime = 2000

        setTimeout(async () => {
            for(let userName in this.userSockets) {
                if(userName !== socketUser.user.userName) {
                    let participant = this.userSockets[userName]

                    if(!participant.isInLobby()) {
                        continue
                    }

                    return this.createBoard(socketUser, participant)
                }
            }

            let newNpc = await this.genNewNPC()
            if(newNpc) {
                return this.createBoard(socketUser, newNpc)
            }

            socketUser.send(errorCode.notFoundParticipant)
        }, findTime)

    }

    async createBoard(socketUser, participant) {
        let boardName = `${socketUser.user.userName}_${participant.user.userName}`
        let board = new BoardController(this, boardName)

        console.log("Found user: " + participant.user.displayName + ", is NPC: " + participant.isNpc())
        console.log(`Board create: ${boardName}`)

        await board.joinBoard(socketUser)
        await board.joinBoard(participant)

        await board.startGame()

        this.boardControllers[boardName] = board
    }

    async syncGameData(socketUser, data) {
        if(socketUser.isInLobby()) {
            console.log('User is in lobby')
            return
        }

        let roomName = socketUser.currentRoom
        if(roomName in this.boardControllers) {
            let board = this.boardControllers[roomName]
            board.handleGameMsg(socketUser, data)
        }
    }

    async saveUser(socketUser, data) {
        let newUsername = data.userName
        let password = data.password
        let oldUserName = socketUser.user.userName

        let user = await UserController.saveUser(socketUser.user, newUsername, password)
        if(!user) {
            return await socketUser.send(errorCode.userNameExist)
        }

        socketUser.user = user
        this.userBySocketIds[socketUser.socket.id] = user
        this.userSockets[newUsername] = socketUser

        delete this.userSockets[oldUserName]
        
        socketUser.send(errorCode.success)
    }

    async leaveBoard(socketUser) {
        
        let lastRoom = socketUser.currentRoom
        if(lastRoom in this.boardControllers) {
            let board = this.boardControllers[lastRoom]
            board.leaveBoard(socketUser)
            
            if(board.isEmpty()) {
                console.log(`Remove board: ${lastRoom}`)
                delete this.boardControllers[lastRoom]
            }
        }
    }

    async backLobby(socketUser) {
       if(!socketUser.isInLobby()) {
           this.leaveBoard(socketUser)
           this.joinLobby(socketUser)
       } 
    }

    async chatInRoom(socketUser, data) {
        let res = errorCode.chatInRoom
        let msg = data.msg
        res.data = { displayName: socketUser.user.displayName, msg: msg }

        await socketUser.publicMsgInCurrentRoom(res)
    }

    async leaderBoard(socketUser) {
        let leaderBoard = await UserController.getLeaderBoard()
        let res = errorCode.leaderBoard
        res.data = leaderBoard
        socketUser.send(res)
    }

    async findParticipant(socketUser, data) {
    }

    async getMyInfo(socketUser) {
        let res = errorCode.getMyInfo
        res.data = {
            profile: socketUser.user,
            gameList: GameController.gameList
        }
        socketUser.send(res)
    }

    async genNewNPC() {
        let npc = await UserController.genNewNPC()
        let socketUser = new SocketUser(null, npc)

        this.userSockets[npc.userName] = socketUser
        return socketUser
    }
}


module.exports = SocketManager
