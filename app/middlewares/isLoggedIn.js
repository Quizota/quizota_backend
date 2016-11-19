/**
 * Created by phuongla on 11/18/2016.
 */

module.exports = (req, res, next) => {
    if (req.isAuthenticated()) return next()
    res.redirect('/')
}