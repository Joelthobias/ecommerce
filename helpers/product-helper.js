var db = require("../config/connection");
var collection = require("../config/collections");
var objectId = require("mongodb").ObjectID;

module.exports = {
  addproduct: (product,price, callback) => {
    // console.log(product);
product.price = parseInt(product.price);
    db.get()
      .collection("product")
      .insert(product,price)
      .then((data) => {
        callback(data.ops[0]._id);
      });
  },

  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get().collection(collection.PRODUCT_COLLECTION).find().toArray()
      resolve(products);
    });
  },

  
  Delete: (proid) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .removeOne({ _id: objectId(proid) })
        .then((response) => {
          resolve(response);
          //console.log(response);
        });
    });
  },
  getproductdetails: (proid) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: objectId(proid) })
        .then((product) => {
          resolve(product);
          //   console.log(product);
        });
    });
  },
  updateProduct: (proid, pro) => {
    let price=parseInt(pro.price)
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { _id: objectId(proid) },
          {
            $set: {
              name: pro.name,
              description: pro.description,
              price: price,
              catagory: pro.catagory,
            },
          }
        )
        .then((response) => {
          resolve(response);
          //   console.log(product);
        });
    });
  },
};
