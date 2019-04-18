const passport    = require('passport');
const GitHubStrategy = require('passport-github').Strategy;

module.exports = function (app, db) {
    console.log("Calling all dbs: "+db);
    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser((user, done) => {
      done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        db.collection('chatusers').findOne(
            {id: id},
            (err, doc) => {
                done(null, doc);
            }
        );
    });

    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: "https://ritalawportfoliowebsite.herokuapp.com/auth/github/callback"
      },
      function(accessToken, refreshToken, profile, cb) {
         console.log(db);
          db.collection('chatusers').findAndModify(
              {id: profile.id},
              {},
              {$setOnInsert:{
                  id: profile.id,
                  name: profile.displayName || 'Anonymous',
                  photo: profile.photos[0].value || '',
               //   email: profile.emails[0].value || 'No public email',
                  created_on: new Date(),
                  provider: profile.provider || '',
                  chat_messages: 0
              },$set:{
                  last_login: new Date()
              },$inc:{
                  login_count: 1
              }},
              {upsert:true, new: true}, //Insert object if not found, Return new object after modify
              (err, doc) => {
                  console.log("Access Token: "+ JSON.stringify(accessToken));
                  return cb(null, doc.value);
              }
          );
        }
    ));

}