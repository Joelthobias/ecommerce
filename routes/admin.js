var express = require("express");
var router = express.Router();
const fs = require("fs");
const adminhelper = require("../helpers/adminhelper");
const userhelper = require("../helpers/user-helper");

var productHelper = require("../helpers/product-helper");
const verifyadmlogin = (req, res, next) => {
  if (req.session.adminloggedIn) {
    next();
  } else {
    res.redirect("/min/login");
  }
};
// router.get("/signin", function (req, res, next) {
//   res.render("user/signin", { admin: false });
// });

// router.post("/admin/signin", function (req, res, next) {
//   adminhelper.doadmSignup(req.body).then((response) => {
//     req.session.admin = response;
//     req.session.admin.loggedIn = true;
//     res.redirect("/min");
//     //console.log(response);
//   });
// });
router.get("/login", function (req, res, next) {
  if (req.session.adminloggedIn) {
    res.redirect("/");
  } else {
    res.render("admin/login", { 'adminloginErr':req.session.adminloginErr });
    req.session.adminloginErr = false;
  }
});

router.post("/login", function (req, res, next) {
  adminhelper.doadmLogin(req.body).then((response) => {
    if (response.status) {
      req.session.admin = response.admin;
      req.session.adminloggedIn = true;

      res.redirect("/min");
    } else {
      req.session.adminloginErr =response.err
      res.redirect("/min/login");
    }
  });
});
router.get("/logout", function (req, res, next) {
  
      req.session.admin = null
      req.session.adminloggedIn = false;

      res.redirect("/min");
    
});
/* GET users listing. */
router.get("/", verifyadmlogin, (req, res, next) =>{
  productHelper.getAllProducts().then((products) => {
    //console.log(products);
    res.render("admin/admhome", { admin: req.session.admin, products });
  });
});

router.get("/add-product",verifyadmlogin, (req, res) => {
  res.render("admin/add-product", { admin: req.session.admin });
});

router.post("/add-product", (req, res) => {
  // console.log(req.body)
  // console.log(req.files.image)
let price= parseInt(req.body.price);
  productHelper.addproduct(req.body,price ,(id) => {
    let image = req.files.image;
   // console.log(id);
    image.mv("./public/product-images/" + id + ".jpg", (err, done) => {
      if (!err) {
        res.render("admin/add-product", { admin: req.session.admin });
      } else {
        console.log(err);
      }
    });
  });
});

//function to delete a product

router.get("/delete-product/:id",verifyadmlogin, (req, res) => {
  let proid = req.params.id;
  console.log(proid);

  fs.unlink("./public/product-images/" + proid + ".jpg", (err) => {
    if (err) throw err;
    console.log("file deleted");
  });
  productHelper.Delete(proid).then((response) => {
    res.redirect("/min/");
  });
});

//function to edit a product

router.get("/edit-product/:id",verifyadmlogin, async (req, res) => {
  let product = await productHelper.getproductdetails(req.params.id);
  console.log(product);
  res.render("admin/edit-product", {product,admin: req.session.admin});
});


router.post("/edit-product/:id", (req, res) => {
  productHelper.updateProduct(req.params.id, req.body).then(()=>{
    res.redirect("/min");
    
    if(req.files.image){
      let image=req.files.image
    image.mv("./public/product-images/" + req.params.id + ".jpg");
    
    }

  })
    
  })

  router.get('/viewpros',(req,res)=>{
    productHelper.getAllProducts().then((products) => {
    //console.log(products);
    res.render("admin/view-products", { admin: req.session.admin, products });
  });
  })
 router.get('/orders',verifyadmlogin,async(req,res)=>{
   let orders=await adminhelper.getorders()
  // let proid=orders.products.item
   adminhelper.profromorder().then((response)=>{
     if(response.status==placed){
        res.render('admin/view-orders',{response,admin: req.session.admin,placed})

     }else if(response.status==Shipped){
 res.render('admin/view-orders',{response,admin: req.session.admin,shipped})
     }else{
        res.render('admin/view-orders',{response,admin: req.session.admin,Delevierd})

     }

   })



   
 })
module.exports = router;
