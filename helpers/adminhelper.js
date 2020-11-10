const bcrpt = require("bcrypt");
const { resolve, all } = require("promise");
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
            $unwind:all,
            $unwind:'$Deliveryaddress',
            $unwind: "$products",
          },
          {
            $project: {
              orderid:'$_id',
              username:'$username',
              mobile:'$Deliveryaddress.mobile',
              addres:'$Deliveryaddress.addres',
              pincode:'$Deliveryaddress.pincode',
              userdetails:'$userdetails',
              item: "$products.item",
              paymentmethod:'$paymentmethod',
              status:'$status',
              date:'$date',
              time:'$time',
              total:'$totalAmount'
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
              orderid:1,
              mobile:1,
              addres: 1,
              pincode: 1,
              userdetails: 1,
              paymentmethod: 1,
              status: 1,
              date: 1,
              time: 1,
              total:1,
              username:1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },

        ])
        .toArray();
        console.log(orderspro);
        resolve(orderspro)
    })
  },
  
};