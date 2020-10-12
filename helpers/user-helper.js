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
    return new Promise(async (resolve, reject) => {
      let usercart = await db
        .get()
        .collection(collection.cart_collection)
        .findOne({ user: objectId(userid) });
      if (usercart) {
        db.get()
          .collection(collection.cart_collection)
          .updateOne(
            { user: objectId(userid) },
            {
              $push: {
                products: objectId(proid),
              },
            }
          )
          .then((response) => {
            resolve();
          });
        console.log("Item Added to cart");
      } else {
        let cartobj = {
          user: objectId(userid),
          products: [objectId(proid)],
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
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              let: { prolist: "$products" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $in: ["$_id", "$$prolist"],
                    },
                  },
                },
              ],
              as: "cartitems",
            },
          },
        ])
        .toArray();
      resolve(cartItems[0].cartitems);
    });
  },

  getcartcount:(userid)=>{
    return new Promise(async (resolve,reject)=>{
      let count=0
      let cart=await db.get().collection(collection.cart_collection).findOne({user:objectId(userid)})
      if(cart){
        count=cart.products.length
      }
      resolve(count)
    })
  }
};
