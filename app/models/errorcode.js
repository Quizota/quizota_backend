
let errorCode = {
    userNotAuth: {code: -1002, msg: 'User is not authenticated'},
    commandNotFound: { code: -1000, msg: `command not found` },
    anotherLogin: { code: -1001, msg: 'Your account has new connection from other device' },
    notFoundParticipant: { code: -1003, msg: 'Not found participant' },
    userNameExist: {code: -1004, msg: 'Your username is existed'},
    loginFailed: {code: -1005, msg: 'Your username or password is wrong'},
    
    success: {code: 1, msg: 'Your process is successful' },
    joinLobbySuccess: {code: 2, msg: 'User joined lobby' },
    playerJoinBoard: { code: 3, msg: 'player leave board' },
    playerLeaveBoard: { code: 4, msg: 'player leave board' },
    startGame: { code: 5, msg: 'start game & send init game data' },
    syncGameData: { code: 6, msg: 'sync game data' },
    chatMessage: { code: 100}
}

module.exports = errorCode