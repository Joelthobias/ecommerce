const mongoclient = require('mongodb').MongoClient

const state={
        db:null
}


module.exports.connect = (done) => {
       
const url ='mongodb://localhost:27017'
// const url = 'mongodb+srv://joel:Qwertyuiop@1@cluster0.chsu5.mongodb.net/admin'
const dbname='shopping'

        mongoclient.connect(url,(err, data) => {
                 if (err) return(err)
                state.db=data.db(dbname)
                done()
        })

}
module.exports.get=()=>{
        return state.db
}



// const MongoClient = require('mongodb').MongoClient;
// const uri = "mongodb+srv://Joel:Qwertyuiop%401%0A@cluster0.ef50f.mongodb.net/<dbname>?retryWrites=true&w=majority";
// const client = new MongoClient(uri, { useNewUrlParser: true });
// client.connect(err => {
//   const collection = client.db("test").collection("devices");
//   // perform actions on the collection object
//   client.close();
// });
