let Province = require('../models/province')

class ProvinceController {

    constructor() {
        this.init()
    }

    async init() {
        this.provinceList = await Province.promise.find({})
    }
}

module.exports = new ProvinceController()