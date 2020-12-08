const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const app = express();
const config = require('config');
const fileupload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const cloudinary = require('cloudinary').v2;
const bcrypt = require('bcrypt');

cloudinary.config({
    cloud_name: 'pradhancloud',
    api_key : '598792189368595',
    api_secret: 'KXnbhwu-_IDDxJahGzG5bcYn8bw'
});
app.use(fileupload({
    useTempFiles: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set('view engine', "ejs");
app.use(cookieParser());

const connString = 'mongodb+srv://user_pradhan:TVI1DCfplDiuBLJw@cluster0.5kgs2.mongodb.net/userDB?retryWrites=true&w=majority';

mongoose.connect(connString, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
    .then(() => console.log('db connected...'))
    .catch(err => console.error(err));

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    documents: {
        type : [String],
        default : []
    }
    // healthcard_url: String
});

const UserSchema = new mongoose.model("User", userSchema);

app.get("/",(req,res) => {
    res.render("home");
});

app.get("/register",(req,res) => {
    res.render("register");
});

app.get("/login",(req,res) => {
    res.render("login");
});

const privatekey = 'abc123';
const isAuthenticated = (req,res,next) => {
    const token = req.cookies['token'];
    if(!token) return res.redirect('/login');

    try{
        const payload = jwt.verify(token , privatekey);
        req.user = payload;
        next();
    }
    catch(err)
    {
        return res.redirect('/login'); 
    }
}

app.get("/submit",isAuthenticated ,(req,res) => {
      const token = req.cookies['token'];
      const payload = jwt.verify(token , privatekey);
      res.render("submit" , {results : payload.documents});
});

app.post('/submit' ,isAuthenticated, async (req,res) => {
    const currUserEmail = req.user.email;
    const img = req.files.img;
    console.log(img);
    if(img.size == 0) return res.status(400).send('upload an image first.!');
    if(img.mimetype !== 'image/jpg' && img.mimetype !== 'image/jpeg' && img.mimetype !== 'image/png')
        return res.status(400).render('report', {message:'file type not supported..'});
    cloudinary.uploader.upload(img.tempFilePath , async (err , result) => {
        if(err) return res.status(400).send('error uploading file');
        try{
            const user = await UserSchema.findOne({email: currUserEmail});
            const resi = [...user.documents];
            resi.push(result.secure_url);
            console.log(resi);
            const doc = await UserSchema.findOneAndUpdate({email: currUserEmail}, {documents : resi}, {
                new: true
              });
            console.log(doc);
            res.render('submit' , {results : resi});
        }
        catch(ex){
            return res.send('upload failed . try again bhai');
        }

    
  }) })


app.get("/logout",function(req,res){
    res.clearCookie('token');
    res.redirect("/");
});


app.post('/register' , async (req,res) => {
    let ss = await UserSchema.findOne({ email : req.body.email });
    if(ss) return res.status(400).send('User already registered..');

    const img = req.files.img;
    console.log(img);
    if(img.size == 0) return res.status(400).send('upload an image first.!');
    if(img.mimetype !== 'image/jpg' && img.mimetype !== 'image/jpeg' && img.mimetype !== 'image/png')
        return res.status(400).render('report', {message:'file type not supported..'});
    cloudinary.uploader.upload(img.tempFilePath , async (err , result) => {
            if(err) return res.status(400).send('error uploading file');
            // const user = await UserSchema.findOneAndUpdate({ email : currUserEmail } , { document : req.files.img })
                const docs = []
                docs.push(result.secure_url);
                console.log(docs);
                //bcrypt
                const salt = await bcrypt.genSalt(10);
                const hashedpwd = await bcrypt.hash(req.body.password , salt);
                
                const user = new UserSchema({
                    email : req.body.email,
                    password: hashedpwd,
                    documents: [...docs]
                })
                try{
                    const result = await user.save();
                    console.log('healthID ==> ' , result._id);
                    
                    //res.send('Your healthID is ----->>> ' + result._id);
                    // res.render('submit' ,{results : result.documents});
                    res.status(200).send('User registered successfully...Now Login... Your health ID is => ' + result._id );
                }
                catch (ex) {
                    res.send('couldnt register user...');
                }
      })
})

app.post('/login' ,async (req,res) => {
    const id = req.body.healthid;
    const userdetails = await UserSchema.findOne({_id : id});
    if(!userdetails) res.status(404).send('no user registered with the given health id ...');

    if(userdetails.email !== req.body.email) res.send('invalid login credentials..')

    const check = await bcrypt.compare(req.body.password , userdetails.password);
    if(!check) return res.status(401).render('login', {message:'Invalid email or password'});

    const token = jwt.sign({ email : userdetails.email , documents : userdetails.documents } , privatekey);
    res.cookie('token' , token);
    res.redirect('/submit');
})

// abhi run karo toh and server share karna 
  const port = process.env.PORT || 3000;
  app.listen(port, (err) => {
      if(!err)
      console.log('listening on port ' + port);
  })
// 

// set CLOUDINARY_URL=cloudinary://598792189368595:KXnbhwu-_IDDxJahGzG5bcYn8bw@pradhancloud
