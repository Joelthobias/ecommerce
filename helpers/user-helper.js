var db = require("../config/connection");
var collection = require("../config/collections");
const bcrpt = require("bcrypt");
const { promise } = require("bcrypt/promises");
const { reject, resolve } = require("promise");
const { USER_COLLECTION } = require("../config/collections");
const { response } = require("express");
var objectId = require("mongodb").ObjectID;
const Razorpay = require("razorpay");
var instance = new Razorpay({
  key_id: "rzp_test_TrQaF14UBI16RH",
  key_secret: "MtG62pWUdYEHSELtZzUzmYMi",
});
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
  viewpro:(proid)=>{
return new Promise(async(resolve,reject)=>{
  let pro=await db.get().collection(collection.PRODUCT_COLLECTION).find({_id:objectId(proid)})
        .toArray();
  
  resolve(pro)
})
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
  removecart: (proId, userId) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.cart_collection)
        .update(
          { user: objectId(userId) },
          { $pull: { products: { item: objectId(proId) } } },
          { multi: true }
        )
        .then((response) => {
          resolve(response);
        });
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
      //console.log(cartItems);
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
            resolve({ status: true });
          });
      }
    });
  },
  getTotal: (userId) => {
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

      console.log("jjjjjjjjjjjjjjjjjjjjjjjjjjj");
      console.log(total[0].total);
      resolve(total[0].total);
    });
  },
gettemTotal: (userId) => {
    return new Promise(async (resolve, reject) => {
      let total = await db
        .get()
        .collection(collection.oneCart)
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
  },

  placeorder: (order, products, total) => {
    return new Promise((resolve, reject) => {
      console.log(products);
      let status = order["payment-method"] === "COD" ? "placed" : "Pending";
      let OrderObj = {
        Deliveryaddress: {
          mobile: order.mobile,
          addres: order.address,
          pincode: order.pincode,
        },
        userdetails: objectId(order.userId),
        paymentmethod: order["payment-method"],
        totalAmount: total,
        products: products,
        status: status,
        date: new Date(),
      };
      db.get()
        .collection(collection.order_collection)
        .insertOne(OrderObj)
        .then((response) => {
          db.get()
            .collection(collection.cart_collection)
            .removeOne({ user: objectId(order.userId) });
          resolve(response.ops[0]._id);
          console.log(response);
        });
    });
  },
  placeoneorder: (order, products, total) => {
    return new Promise((resolve, reject) => {
      console.log(products);
      let status = order["payment-method"] === "COD" ? "placed" : "Pending";
      let OrderObj = {
        Deliveryaddress: {
          mobile: order.mobile,
          addres: order.address,
          pincode: order.pincode,
        },
        userdetails: objectId(order.userId),
        paymentmethod: order["payment-method"],
        totalAmount: total,
        products: products,
        status: status,
        date: new Date(),
      };
      db.get()
        .collection(collection.order_collection)
        .insertOne(OrderObj)
        .then((response) => {
          db.get()
            .collection(collection.oneCart)
            .removeOne({ user: objectId(order.userId) });
          resolve(response.ops[0]._id);
          //console.log(response);
        });
    });
  },
  getcartprolist: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .get()
        .collection(collection.cart_collection)
        .findOne({ user: objectId(userId) });
      resolve(cart.products);
      //console.log("dggggggggggggggggggggggggggf");

      console.log(cart.products);
    });
  },
  gettemcartprolist: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cart = await db
        .get()
        .collection(collection.oneCart)
        .findOne({ user: objectId(userId) });
      resolve(cart.products);
      console.log("dggggggggggggggggggggggggggf");

      console.log(cart.products);
    });
  },
  getuserorders: (userId) => {
    console.log(userId);
    return new Promise(async (resolve, reject) => {
      let orders = await db
        .get()
        .collection(collection.order_collection)
        .find({ userdetails: objectId(userId) })
        .toArray();
      console.log("orders");
      console.log(orders);
      resolve(orders);
    });
  },
  getorderdproducts: (orderId) => {
    return new Promise(async (resolve, reject) => {
      let orderItems = await db
        .get()
        .collection(collection.order_collection)
        .aggregate([
          {
            $match: { _id: objectId(orderId) },
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
      //console.log(orderItems);
      resolve(orderItems);
    });
  },
  generateRazopay: (orderId, total) => {
    return new Promise((resolve, reject) => {
      var options = {
        amount: total*100, // amount in the smallest currency unit
        currency: "INR",
        receipt: "" + orderId,
      };
      instance.orders.create(options, function (err, order) {
        if (err) {
          console.log(err);
        } else {
          console.log("NEW ORDER : ", order);

          resolve(order);
        }
      });
    });
  },
  verifyPayment: (details) => {
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", "MtG62pWUdYEHSELtZzUzmYMi");
      hmac.update(
        details["payment[razorpay_order_id]"] +
          "|" +
          details["payment[razorpay_payment_id]"]
      );
      hmac=hmac.digest("hex");
      if (hmac == details["payment[razorpay_signature]"]) {
        resolve();
      } else {
        reject();
      }
    });
  },
  changepaymentStatus: (orderId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.order_collection)
        .updateOne(
          { _id: objectId(orderId) },
          {
            $set: { status:'placed'},
          }
        )
        .then(() => {
          resolve();
        });
    });
  },
  getprice:(proid)=>{
    return new Promise(async(resolve,reject)=>{
      let price=await db.get().collection(collection.PRODUCT_COLLECTION).find({_id:objectId(proid)}).toArray()
      resolve(price)
    })
  }, addtotemcart: (proid, userid) => {
    let proObj = {
      item: objectId(proid),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let usercart = await db
        .get()
        .collection(collection.oneCart)
        .findOne({ user: objectId(userid) });
      if (usercart) {
        let proExist = usercart.products.findIndex(
          (product) => product.item == proid
        );
        console.log(proExist);
        if (proExist != -1) {
          db.get()
            .collection(collection.oneCart)
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
            .collection(collection.oneCart)
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
          .collection(collection.oneCart)
          .insertOne(cartobj)
          .then((response) => {
            resolve();
            console.log("cre");
          });
      }
    });
  }
};
