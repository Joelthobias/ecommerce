var express = require("express");
const { reset } = require("nodemon");
var router = express.Router();
var productHelper = require("../helpers/product-helper");
const userhelper = require("../helpers/user-helper");

const verifylogin=(req,res,next)=>{
  if(req.session.loggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}


/* GET home page. */
router.get("/",async function (req, res, next) {
  let cartcount=null
  let user = req.session.user;
 // console.log(user);

  if(req.session.user){
    cartcount=await userhelper.getcartcount(req.session.user._id)

  }


  productHelper.getAllProducts().then((products) => {
    //console.log(products);
    res.render("user/view-products", {products, user,cartcount });
  });
});



//login and signin part starts here



router.get("/login", function (req, res, next) {
  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    res.render("user/login", { "loginErr":req.session.loginErr });
    req.session.loginErr=false
  }
});

router.post("/login", function (req, res, next) {
  userhelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true;
      req.session.user = response.user;
      res.redirect("/");
    } else {
      req.session.loginErr="Invalid User Name Or Password"
      res.redirect("/login");
    }
  });
});

router.get("/signin", function (req, res, next) {
  res.render("user/signin", { admin: false });
});

router.post("/signin", function (req, res, next) {
  userhelper.doSignup(req.body).then((response) => {
    //console.log(response);
  });
});

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});



//login and signin part ends here

//cart starts here



router.get('/cart',verifylogin,async (req,res)=>{

let products = await userhelper.getCartProducts(req.session.user._id);

  res.render('user/cart',{products,user:req.session.user})
  console.log(products);
})


router.get('/add-to-cart/:id',(req,res)=>{
  console.log("'api call '");
  userhelper.addtocart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
  })
})











 




module.exports = router;
