/**
 * Created by phuongla on 11/18/2016.
 */

let User = require('../models/user')
let uuid = require('uuid')

let GameController = require('./gamecontroller')



class UserController {

    constructor() {

    }

    async autoSignup(displayName) {

        let userName = uuid.v1()

        let user = new User()
        user.userName = userName
        user.displayName = displayName
        user.password = ''

        user.gameUnlocked.push({gameId: 1, win: 0, lose: 0})
        user.gameUnlocked.push({gameId: 2, win: 0, lose: 0})

        await user.promise.save()      
        
        return user
    }

    async saveUser(user, newUserName, password) {
        let other = await User.promise.findOne({userName: newUserName})
        if(other) {
            return false
        }
        
        user.userName = newUserName
        user.isDefined = true
        await user.setPassword(password)

        await user.promise.save()
        return user
    }

    async login(userName, password) {
        let user = await User.promise.findOne({userName: userName})
        if(!user) {
            return false
        }
        if(!(await user.validatePassword(password))) {
            return false
        }
        
        return user
    }

    async updateElo(user, bonusElo, gameId) {
        user.updateElo(bonusElo)
        if(bonusElo > 0) {
            user.exp += 2
        } else {
            user.exp += 1
        }

        for(let i = 0; i < user.gameUnlocked.length; i++) {
            if(user.gameUnlocked[i].gameId === gameId) {
                if (bonusElo > 0) {
                    user.gameUnlocked[i].win += 1
                    break
                } else if (bonusElo < 0) {
                    user.gameUnlocked[i].lose += 1
                    break
                }
            }
        }

        await user.promise.save()
    }

    async getLeaderBoard() {
        return await User.find({})
            .sort({elo: -1})
            .select({displayName: 1, userName: 1, elo: 1, level: 1})
            .limit(20)
    }

}

module.exports = new UserController()
