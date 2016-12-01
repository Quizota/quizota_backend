
let errorCode = {
    userNotAuth: {code: 'userNotAuth', msg: 'User is not authenticated'},
    commandNotFound: { code: 'commandNotFound', msg: 'command not found' },
    anotherLogin: { code: 'anotherLogin', msg: 'Your account has new connection from other device' },
    notFoundParticipant: { code: 'notFoundParticipant', msg: 'Not found participant' },
    userNameExist: {code: 'userNameExist', msg: 'Your username is existed'},
    loginFailed: {code: 'loginFailed', msg: 'Your username or password is wrong'},

    signupFailed: {code: 'signupFailed', msg: 'Display name required minimum 3 characters'},

    processActionFailed: {code: 'processActionFailed', msg: 'Your action is fail'},
    gameNotPlay: {code: 'gameNotPlay', msg: 'Game is not play'},
       
    loginSuccess: {code: 'loginSuccess', msg: 'Your process is successful' },
    joinLobbySuccess: {code: 'joinLobbySuccess', msg: 'User joined lobby' },
    newPlayerJoinBoard: { code: 'newPlayerJoinBoard', msg: 'new player join board' },
    playerLeaveBoard: { code: 'playerLeaveBoard', msg: 'player leave board' },
    startGame: { code: 'startGame', msg: 'start game & send init game data' },
    syncGameData: { code: 'syncGameData', msg: 'sync game data' },

    processActionSuccess: {code: 'processActionSuccess', msg: 'Your action is success'},
    endGame: {code: 'endGame', msg: 'End game'},
    playerJoinBoardSuccess: { code: 'playerJoinBoardSuccess', msg: 'Player joined board success' },
    newUserJoinLobby: { code: 'newUserJoinLobby', msg: 'new User joined lobby' },

    chatInRoom: { code: 'chatInRoom', msg: 'chat in room' },

    getMyInfo: { code: 'getMyInfo', msg: 'my info success' },
    leaderBoard: { code: 'leaderBoard', msg: 'leader Board Info' },

    waitingStartGame: { code: 'waitingStartGame', msg: 'Waiting start game' },
}

module.exports = errorCode