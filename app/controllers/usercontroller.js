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

}

module.exports = new UserController()
