/**
 * Created by phuongla on 11/18/2016.
 */

let User = require('../models/user')
let uuid = require('node-uuid')



class UserController {

    constructor() {

    }

    async autoSignup(displayName) {
        let userName = uuid.v1()

        let user = new User()
        user.userName = userName
        user.displayName = displayName
        user.password = ''

        await user.promise.save()
        
        return user
    }

    async saveUser(user, newUserName, password) {
        let other = await User.promise.findOne({userName: newUserName})
        if(other) {
            return false
        }
        
        user.userName = newUserName
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

    async updateElo(user, bonusElo) {
        user.updateElo(bonusElo)
        await user.promise.save()
    }

}

module.exports = new UserController()
