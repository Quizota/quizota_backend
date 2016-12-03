let Province = require('../models/province')
let utils = require('./utils')

class ProvinceController {

    constructor() {
        this.init()
    }

    async init() {
        this.provinceList = await Province.promise.find({})
    }

    randomProvince() {
        if(this.provinceList) {
            let index = utils.getRandomInt(0, this.provinceList.length - 1)
            return this.provinceList[index]
        }
        return null
    }
}

module.exports = new ProvinceController()