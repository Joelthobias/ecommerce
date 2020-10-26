const { response } = require("express");
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
    res.redirect('/login')
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
if(products!=0){
  let total = await userhelper.getTotal(req.session.user._id);
  products.quantitiy = parseInt(products.quantitiy);

  res.render("user/cart", {
    products,
    user: req.session.user,
    uses: req.session.user._id,
    total,
  });
}else{
  products.quantitiy = parseInt(products.quantitiy);

  res.render("user/cart", {
    products,
    user: req.session.user
    
    
  });
}


  console.log(products);
})


router.get('/add-to-cart/:id',(req,res)=>{
  console.log("'api call '");
  userhelper.addtocart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
  })
})

router.get("/remove-product/:id", (req, res) => {
  userhelper
    .removecart(req.params.id, req.session.user._id)
    .then((response) => {
      console.log('item deleted from cart');
      res.redirect('/cart')
    });
});



router.post("/chngQuantitiy", (req, res, next) => {
  userhelper.chngQuantitiy(req.body).then(async (response) => {
    let products = await userhelper.getCartProducts(req.session.user._id);
    if (products != 0) {
      response.total = await userhelper.getTotal(req.body.user);

      res.json(response);
    } else {
      res.redirect("/cart");
      console.log('empt                           cccccccccccccccccccccccccccccccccccccarttttttttttttttttt');
    }
  });
});

router.get('/place-order',verifylogin,async(req,res,next)=>{
  let total=await userhelper.getTotal(req.session.user._id)
  res.render('user/placeorder',{total,user:req.session.user})
})

router.post('/place-order',async(req,res)=>{
  console.log(req.body);
  let products = await userhelper.getcartprolist(req.body.userId);
  let total = await userhelper.getTotal(req.body.userId);
  userhelper.placeorder(req.body,products,total).then((response)=>{
    res.json({status:true})
  })
})


router.get('/orders',verifylogin,(req,res)=>{
  userhelper.getOrders(req.session.user._id).then((orders) => {
    console.log(orders);
    let data=orders
      res.render("user/orders", { data,orders, user: req.session.user});

  });
})


 




module.exports = router;
