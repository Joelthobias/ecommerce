const bcrpt = require("bcrypt");
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
};