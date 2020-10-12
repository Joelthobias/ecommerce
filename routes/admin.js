var express = require("express");
var router = express.Router();
const fs = require("fs");
var productHelper = require("../helpers/product-helper");
/* GET users listing. */
router.get("/", function (req, res, next) {
  productHelper.getAllProducts().then((products) => {
    console.log(products);
    res.render("admin/view-products", { admin: true, products });
  });
});

router.get("/add-product", (req, res) => {
  res.render("admin/add-product", { admin: true });
});

router.post("/add-product", (req, res) => {
  // console.log(req.body)
  // console.log(req.files.image)

  productHelper.addproduct(req.body, (id) => {
    let image = req.files.image;
    console.log(id);
    image.mv("./public/product-images/" + id + ".jpg", (err, done) => {
      if (!err) {
        res.render("admin/add-product", { admin: true });
      } else {
        console.log(err);
      }
    });
  });
});

//function to delete a product

router.get("/delete-product/:id", (req, res) => {
  let proid = req.params.id;
  console.log(proid);

  fs.unlink("./public/product-images/" + proid + ".jpg", (err) => {
    if (err) throw err;
    console.log("file deleted");
  });
  productHelper.Delete(proid).then((response) => {
    res.redirect("/admin/");
  });
});

//function to edit a product

router.get("/edit-product/:id", async (req, res) => {
  let product = await productHelper.getproductdetails(req.params.id);
  console.log(product);
  res.render("admin/edit-product", {product});
});


router.post("/edit-product/:id", (req, res) => {
  productHelper.updateProduct(req.params.id, req.body).then(()=>{
    res.redirect("/admin");
    
    if(req.files.image){
      let image=req.files.image
    image.mv("./public/product-images/" + req.params.id + ".jpg");
    
    }

  })
    
  })


module.exports = router;
