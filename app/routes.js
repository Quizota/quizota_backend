
let isLoggedIn = require('./middlewares/isLoggedIn')


module.exports = (app) => { 

  let passport = app.passport

  app.get('/', (req, res) => res.render('chat.ejs'))


  /*
  app.post('/', passport.authenticate('local-auto-signup', {
    successRedirect: '/chat',
    failureRedirect: '/'
  }))
  */

  /*
  app.get('/chat', isLoggedIn, (req, res) => {
    let displayName = req.user.displayName
    let state = JSON.stringify({displayName})
    res.render('chat.ejs', {displayName, state})
  })
  */
}

