const bcrpt = require("bcrypt");
const { resolve } = require("promise");
var db = require("../config/connection");




module.exports = {
  doadmSignup: (adminData) => {
    console.log(adminData);

    return new Promise(async (resolve, reject) => {
      adminData.password = await bcrpt.hash(adminData.password, 10);
      console.log(adminData.password);
      db.get()
        .collection('admin')
        .insertOne(adminData)
        .then((data) => {
          resolve(data.ops[0]);
        });
    });
  },
  doadmLogin: (adminData) => {
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let admin = await db
        .get()
        .collection('admin')
        .findOne({ email: adminData.email });
      if (admin) {
        bcrpt.compare(adminData.password, admin.password).then((status) => {
          if (status) {
            console.log("Login sucess");
            response.admin = admin;
            response.status = true;
            resolve(response);
          } else {
            console.log("Login failed");
            resolve({err:"Password Not Match"});
          }
        });
      } else {
        resolve({err:"Email Not found"})
        console.log(err);
        console.log("email not found");
      }
    });
  },
  getorders:()=>{
    return new Promise((resolve,reject)=>{
      db.get().collection('order').find({}).toArray().then((orders)=>{
        resolve(orders)
        console.log(orders);
      })
    })
  },
  profromorder:(userid)=>{
    return new Promise(async(resolve,reject)=>{
     let orderspro = await db
        .get()
        .collection('order')
        .aggregate([
          {
            $match: { },
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
              from: 'product',//collection
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              product: { $arrayElemAt: ["$product", 0] },
            },
          },

        ])
        .toArray();
      // db.get().collection('order').find({}).toArray().then((orders)=>{

      
        console.log(orderspro);
        resolve(orderspro)
    })
  }
};