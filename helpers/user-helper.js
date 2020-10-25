var db = require("../config/connection");
var collection = require("../config/collections");
const bcrpt = require("bcrypt");
const { promise } = require("bcrypt/promises");
const { reject, resolve } = require("promise");
const { USER_COLLECTION } = require("../config/collections");
var objectId = require("mongodb").ObjectID;
module.exports = {
  doSignup: (userData) => {
    console.log(userData);

    return new Promise(async (resolve, reject) => {
      userData.password = await bcrpt.hash(userData.password, 10);
      console.log(userData.password);
      db.get()
        .collection(collection.USER_COLLECTION)
        .insertOne(userData)
        .then((data) => {
          resolve(data.ops[0]);
        });
    });
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ email: userData.email });
      if (user) {
        bcrpt.compare(userData.password, user.password).then((status) => {
          if (status) {
            console.log("Login sucess");
            response.user = user;
            response.status = true;
            resolve(response);
          } else {
            console.log("Login failed");
            resolve({ status: false });
          }
        });
      } else {
        console.log("email not found");
      }
    });
  },
  addtocart: (proid, userid) => {
    let proObj = {
      item: objectId(proid),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let usercart = await db
        .get()
        .collection(collection.cart_collection)
        .findOne({ user: objectId(userid) });
      if (usercart) {
        let proExist = usercart.products.findIndex(
          (product) => product.item == proid
        );
        console.log(proExist);
        if (proExist != -1) {
          db.get()
            .collection(collection.cart_collection)
            .updateOne(
              { user: objectId(userid), "products.item": objectId(proid) },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get()
            .collection(collection.cart_collection)
            .updateOne(
              { user: objectId(userid) },
              {
                $push: {
                  products: proObj,
                },
              }
            )
            .then((response) => {
              resolve();
            });
          console.log("Item Added to cart");
        }
      } else {
        let cartobj = {
          user: objectId(userid),
          products: [proObj],
        };
        db.get()
          .collection(collection.cart_collection)
          .insertOne(cartobj)
          .then((response) => {
            resolve();
            console.log("cre");
          });
      }
    });
  },

  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collection.cart_collection)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      console.log(cartItems);
      resolve(cartItems);
    });
  },

  getcartcount: (userid) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db
        .get()
        .collection(collection.cart_collection)
        .findOne({ user: objectId(userid) });
      if (cart) {
        count = cart.products.length;
      }
      resolve(count);
    });
  },
  chngQuantitiy: (about) => {
    about.count = parseInt(about.count);
    about.quantity = parseInt(about.quantity);
    console.log(about);

    return new Promise((resolve, reject) => {
      if (about.count == -1 && about.quantity == 1) {
        db.get()
          .collection(collection.cart_collection)
          .updateOne(
            { _id: objectId(about.cart) },
            {
              $pull: {
                products: { item: objectId(about.product) },
              },
            }
          )
          .then((response) => {
            resolve({ removeproduct: true });
            console.log(response);
          });
      } else {
        db.get()
          .collection(collection.cart_collection)
          .updateOne(
            {
              _id: objectId(about.cart),
              "products.item": objectId(about.product),
            },
            {
              $inc: { "products.$.quantity": about.count },
            }
          )
          .then((response) => {
            resolve({status:true });
          });
      }
    });
  },
  getTotal:(userId)=>{
   return new Promise(async (resolve, reject) => {
     let total = await db
       .get()
       .collection(collection.cart_collection)
       .aggregate([
         {
           $match: { user: objectId(userId) },
         },
         {
           $unwind: "$products",
         },
         {
           $project: {
             item: "$products.item",
             quantity: "$products.quantity",
           },
         },
         {
           $lookup: {
             from: collection.PRODUCT_COLLECTION,
             localField: "item",
             foreignField: "_id",
             as: "product",
           },
         },
         {
           $project: {
             item: 1,
             quantity: 1,
             product: { $arrayElemAt: ["$product", 0] },
             price: { $arrayElemAt: ["$product.price", 0] },
           },
         },
         {
           $group: {
             _id: null,
             total: { $sum: { $multiply: ["$quantity", "$product.price"] } },
           },
         },
       ])
       .toArray();
     console.log(total[0].total);
     resolve(total[0].total);
   });
  }
};
