var express = require('express');
var router = express.Router();
var productHelper = require('../helpers/product-helper')
/* GET users listing. */
router.get('/', function (req, res, next) {
  productHelper.getAllProducts().then((products) => {

    console.log(products);
    res.render('admin/view-products', { admin: true, products });
  })

});


router.get('/add-product', (req, res) => {
  res.render('admin/add-product', { admin: true })
})


router.get('/edit-product', (req, res) => {
  res.render('admin/add-product', { admin: true })
})


router.post('/add-product', (req, res) => {
  // console.log(req.body)
  // console.log(req.files.image)

  productHelper.addproduct(req.body, (id) => {

    let image = req.files.image
    console.log(id);
    image.mv('./public/product-images/' + id + '.jpg', (err, done) => {
      if (!err) {
        res.render("admin/add-product")
      } else {
        console.log(err);
      }
    })

  })
})
module.exports = router;
