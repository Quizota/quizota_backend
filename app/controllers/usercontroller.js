/**
 * Created by phuongla on 11/18/2016.
 */

let User = require('../models/user')
let uuid = require('uuid')

let GameController = require('./gamecontroller')
let utils = require('./utils')


let shuffle = require('shuffle-array')


class UserController {

    constructor() {

    }

    async autoSignup(displayName) {

        let userName = uuid.v1()

        let user = new User()
        user.userName = userName
        user.displayName = displayName
        user.password = ''

        let rid = utils.getRandomInt(1, 10)
        user.avatar = `img/avatar/avatar_${rid}.png`


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
                } else {
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

    async genNewNPC() {

        let userNames = [['phuong12345681', 'Phuong TT'], ['hieu772661', 'Hieu TranP'], 
            ['thuan7762', 'Thuan TR'], ['hung7s77', 'Hung HHA'], ['than737j', 'Than LV'], 
            ['tri837c', 'Tri TTN'], ['trunghhc8', 'Trung HC'], ['hoi887s', 'Hoi Huong'], 
            ['tuanusa8c', 'Tuan NA'], ['teoem88d', 'Teo LV'], ['thuc776s', 'Thuc TA'], 
            ['hieutran8871', 'Hieu MV'], ['huong772c', 'Huong LT'], ['jack827cc', 'Jack Jill'], 
            ['chales8271', 'Chales Nguyen'], ['lucky7666s', 'Lucky Game'], ['sang8837', 'Sang PH'], 
            ['ve8872', 'Ve TV'], ['xuan887cc', 'Xuan TTA'], ['tai99882c', 'Tai NgoT']]

        shuffle(userNames);

        let npc = utils.getRandomInt(0, userNames.length - 1)
        let userName = userNames[npc][0]

        let other = await User.promise.findOne({userName: userName})
        if(other) {
            return other
        }

        let user = new User()
        user.userName = userName
        user.displayName = userNames[npc][1]
        user.password = ''

        user.gameUnlocked.push({gameId: 1, win: 0, lose: 0})
        user.gameUnlocked.push({gameId: 2, win: 0, lose: 0})

        await user.promise.save()
        
        return user
    }

}

module.exports = new UserController()
