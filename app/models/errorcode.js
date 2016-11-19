
let errorCode = {
    userNotAuth: {code: -1002, msg: 'User is not authenticated'},
    commandNotFound: { code: -1000, msg: `command not found` },
    anotherLogin: { code: -1001, msg: 'Your account has new connection from other device' },
    notFoundParticipant: { code: -1003, msg: 'Not found participant' },
    joinLobbySuccess: {code: 1, msg: 'User joined lobby' },
    playerJoinBoard: { code: 2, msg: 'player leave board' },
    playerLeaveBoard: { code: 3, msg: 'player leave board' },
    startGame: { code: 4, msg: 'sync game data' },
    syncGameData: { code: 5, msg: 'sync game data' },
    chatMessage: { code: 100},
    
}

module.exports = errorCode