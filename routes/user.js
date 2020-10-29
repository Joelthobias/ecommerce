const { response } = require("express");
var express = require("express");
const { reset } = require("nodemon");
var router = express.Router();
var productHelper = require("../helpers/product-helper");
const userhelper = require("../helpers/user-helper");

const verifylogin=(req,res,next)=>{
  if (req.session.userloggedIn) {
    next();
  } else {
    res.redirect("/login");
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
  if (req.session.userloggedIn) {
    res.redirect("/");
  } else {
    res.render("user/login", { 'userloginErr':req.session.userloginErr });
    req.session.userloginErr=false
  }
});

router.post("/login", function (req, res, next) {
  userhelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.user = response.user;
      req.session.userloggedIn = true;

      res.redirect("/");
    } else {
      req.session.userloginErr="Invalid User Name Or Password"
      res.redirect("/login");
    }
  });
});

router.get("/signin", function (req, res, next) {
  res.render("user/signin", { admin: false });
});

router.post("/signin", function (req, res, next) {
  userhelper.doSignup(req.body).then((response) => {
          req.session.user = response;
          req.session.user.loggedIn = true;
    res.redirect('/')
    //console.log(response);
  });
});

router.get("/logout", (req, res) => {
  req.session.user=null
  req.session.userloggedIn=false
  res.redirect("/");
});



//login and signin part ends here

//cart starts here



router.get('/cart',verifylogin,async (req,res)=>{
 

let products = await userhelper.getCartProducts(req.session.user._id);
if(products!=0){
  let total = await userhelper.getTotal(req.session.user._id);
  products.quantitiy = parseInt(products.quantitiy);
products.price = parseInt(products.price)
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
  userhelper.placeorder(req.body, products, total).then((response) => {
    if (req.body["payment-method"]=='COD'){
      res.json({ CODSucess: true })
    }else{
      //at here response is orderId
      userhelper.generateRazopay(response, total).then((response) => {
        response.user=req.session.user
        res.json(response)
      });
    }
  });
})


router.get('/orders',verifylogin,async(req,res)=>{
  let orders= await userhelper.getuserorders(req.session.user._id)
  //console.log(orders);
  res.render('user/orders',{user:req.session.user,orders})
})

router.get("/view-order-product/:id", verifylogin, async(req, res) => {
    let products = await userhelper.getorderdproducts(req.params.id);

  console.log(products);
  res.render("user/view-order-product", { products,user:req.session.user });
});

router.get("/order-sucess", (req, res) => {
  res.render("user/order-s", { user: req.session.user });
});

 

router.post("/verifyPayment",(req,res)=>{
  console.log(req.body);
  userhelper.verifyPayment(req.body).then(()=>{
    userhelper.changepaymentStatus(req.body['order[receipt]']).then(()=>{
      res.json({status:true})
    }).catch((err)=>{
      console.log(err);
      res.json({status:false})
    })
  })
});


module.exports = router;
