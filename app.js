//jshint esversion:6 

require('dotenv').config()
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const mongoose=require("mongoose");
//const encrypt = require('mongoose-encryption');
//const md5 = require('md5');
//const bcrypt = require('bcrypt');
//const saltRounds = 10;
const session=require('express-session');
// const passport=require('passport');
// const passportLocalMongoose=require("passport-local-mongoose");
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
const app=express();
const fileupload = require('express-fileupload');


app.use(fileupload({
  useTempFiles: true
}));
app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(express.static("public"));
app.set('view engine',"ejs");


// app.use(session({
//   secret:"Finnest Codder of NIT",
//   resave:false,
//   saveUninitialized:false
// }));

// app.use(passport.initialize());
// app.use(passport.session());

// TVI1DCfplDiuBLJw

// mongodb atlas stuff 
const connString = 'mongodb+srv://user_pradhan:TVI1DCfplDiuBLJw@cluster0.5kgs2.mongodb.net/userDB?retryWrites=true&w=majority';

mongoose.connect(connString,{ useNewUrlParser: true,useUnifiedTopology: true, useCreateIndex: true })
        .then( () => console.log('db connected...'))
        .catch( err => console.error(err));

const userSchema=new mongoose.Schema({
    email:String,
    password:String
    // googleId:String,
    // healthcard_url: String
    // secret:String
  });
  
// userSchema.plugin(passportLocalMongoose);
// userSchema.plugin(findOrCreate);

//const secret=process.env.SECRET;
//console.log(md5("qwerty"));
//userSchema.plugin(encrypt,{secret:secret,encryptedFields:['password']});

const UserSchema = new mongoose.model("User",userSchema);

// passport.use(User.createStrategy());
// used to serialize the user for the session
// passport.serializeUser(function(user, done) {
//   done(null, user.id); 
//  // where is this user.id going? Are we supposed to access this anywhere?
// });

// // used to deserialize the user
// passport.deserializeUser(function(id, done) {
//   User.findById(id, function(err, user) {
//       done(err, user);
//   });
// });

// passport.use(new GoogleStrategy({
//   clientID: process.env.CLIENT_ID,
//   clientSecret: process.env.CLIENT_SECRET,
//   callbackURL: "http://localhost:3000/auth/google/secrets"
// },
// function(accessToken, refreshToken, profile, cb) {
//   console.log(profile);
//   User.findOrCreate({ googleId: profile.id }, function (err, user) {
//     return cb(err, user);
//   });
// }
// ));

app.get("/",function(req,res){
    res.render("home");
});

// app.get('/auth/google',
//   passport.authenticate('google', { scope: ["profile"] }));

//   app.get("/auth/google/secrets", 
//   passport.authenticate('google', { failureRedirect: '/login' }),
//   function(req, res) {
//     // Successful authentication, redirect home.
//     res.redirect("/secrets");
//   });

app.get("/register",function(req,res){
    res.render("register");
});

app.get("/login",function(req,res){
    res.render("login");
});


app.get("/secrets",function(req,res){
  User.find({"secret":{$ne:null}},function(err,foundUsers){
    if(err){
      console.log(err);
    }
    else{
      if(foundUsers)
      {
        res.render("secrets",{usersWithSecrets:foundUsers});
      }
    }
  }); 
});


app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
    res.render("submit");
  }else{
    res.redirect("/login");
  }
});

// app.post("/submit",function(req,res) {
//   // const submittedSecret=req.body.secret;
//   User.findById(req.user.id,function(err,foundUser) {
//     if(err){
//       console.log(err);
//     }
//     else{
//       if(foundUser){
//         foundUser.secret=submittedSecret;
//         foundUser.save(function() {
//           res.redirect("/secrets");
//         });
//       }
//     }
//   });
// });

app.post('/submit' , (req,res) => {
  const user = UserSchema.findById(req.body.id)
})
 

app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
});

app.post("/register",async (req,res) => {
  // User.register({username:req.body.username},req.body.password,function(err,user){
  //   if(err){
  //     console.log(err);
  //     res.redirect("/register");
  //   }
  //   else{
  //     passport.authenticate("local")(req,res,function(){
  //         res.redirect("/secrets");
  //     });
  //   }
  // });

  const user = new UserSchema({
    email: req.body.email ,
    password: req.body.password
    // healthcard_url: req.body.
  })

  try{
    const result = await user.save();
    console.log(result);
    res.render('submit');
  }
  catch(err)
  {
      res.send('Couldnt register user' + err);
  }

});

app.post("/login", function(req, res){
    const user=new User({
      username:req.body.username,
      password:req.body.password
    });

    req.login(user,function(err){
      if(err){
        console.log(err);
      }
      else{
        //passport.authenticate("local")(req,res,function(){
          res.redirect("/secrets");
       // })
      }
    });
});

app.listen("3000",function(){
    console.log("server started on port 3000");
});

// bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
//   // Store hash in your password DB.
//   const user=new User({
//     email:req.body.username,
//     password:hash
// });
// user.save(function(err){
//     if(err)
//     console.log(err);
//     else
//     res.render("secrets");
// });
// });  

// const username = req.body.username;
//     const password = req.body.password;
    
//     User.findOne({email: username}, function(err, foundUser){
//       console.log(foundUser);
//         if (err) {
//         console.log(err);
//       } else {
//         if (foundUser) {
//           bcrypt.compare(password, foundUser.password,function(err, result) {
//       // result == false
//             if(result==true){
//               res.render("secrets");
//             }
//             else{
//               res.send("Wrong password");
//             }
//           });
//         }
//       }
//     });
