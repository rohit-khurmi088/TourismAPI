/*MONGOOSE is an ODM(Object Data Modelling) library for MongoDb & Nodejs -> providing a higher layer of abstraction
just like Express is an Abstraction layer for nodejs 
features: Shema to Model data, relationships, simple query API, easy data validations, middlewares */
const mongoose = require('mongoose');

//database URL + name(node_api_bootcamp) from .env file
const connectDb = async ()=>{

    //replacing <PASSWORD> with DATABASE_PASSWORD in DATABASE_URL
    const Db = process.env.DATABASE_URL.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
    
    //Connecting to Database
    const conn = await mongoose.connect(Db, {
        useCreateIndex:true,
        useUnifiedTopology:true,
        useFindAndModify:false,
        useNewUrlParser:true
    });
    console.log(`Successfully Connected to MongoDB: ${conn.connection.host}`.green);
}

module.exports = connectDb;