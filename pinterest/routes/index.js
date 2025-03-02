var express = require('express');
var router = express.Router();
var userModel = require('./users');
var postModel = require('./post');
const passport = require('passport');
const localStrategy = require('passport-local');
const upload = require("./multer")


passport.use(new localStrategy(userModel.authenticate()))

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {nav : false});
});
router.get('/register', function(req, res, next) {
  res.render('register', {nav : false});
});

router.get('/edit/:id', function(req, res, next) {
  res.render('edit');
});
router.get('/profile',isLoggedIn,async function(req, res, next) {
  const user = await userModel
  .findOne({username : req.session.passport.user})
  .populate("posts")
  console.log(user);
  res.render('profile', {user, nav : true});
});
router.get('/show/posts',isLoggedIn,async function(req, res, next) {
  const user = await userModel
  .findOne({username : req.session.passport.user})
  .populate("posts")
  console.log(user);
  res.render('show', {user, nav : true});
});
router.post('/createpost',isLoggedIn, upload.single("postimage"),async function(req, res, next) {
  const user = await userModel.findOne({username : req.session.passport.user})
  const post = await postModel.create({
    user: user._id,
    title: req.body.title,
    description: req.body.description,
    image: req.file.filename
  })
  user.posts.push(post._id)
  await user.save()
  res.redirect("/profile")
});
router.get('/feed', isLoggedIn, async function(req, res, next) {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    const posts = await postModel.find({}).populate("user");
    
    res.render("feed", { user, posts, nav: true });
  } catch (err) {
    console.error("Error fetching feed:", err);
    // Handle error
    res.status(500).send("Internal Server Error");
  }
});

router.get('/add',isLoggedIn,async function(req, res, next) {
  const user = await userModel.findOne({username : req.session.passport.user})

  res.render('add', {user, nav : true});
});
router.post('/register', function(req, res, next) {
  let {username,password, contact,email, name} = req.body
  let data = new userModel({
    username,
    contact,
    email,
    name

  })
  userModel.register(data,password)
  .then(function(){
    passport.authenticate('local')(req, res, function(){
      res.redirect('/profile')
    })
  })
});
router.post('/login',passport.authenticate("local",{
  failureRedirect: "/" ,
  successRedirect: "/profile",
} ), function(req, res, next) {

});


router.get('/logout', function(req, res, next) {
  req.logout(function(err){
    if (err) {return next(err);}
    res.redirect('/');
  });
});
function isLoggedIn(req,res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect('/');
}
router.post('/fileupload',isLoggedIn,upload.single("image"), async function(req, res, next) {
  const user = await userModel.findOne({username : req.session.passport.user})
  user.profileImage = req.file.filename
  await user.save()
  res.redirect('/profile')
});



module.exports = router;
