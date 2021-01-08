//==========================================
// SEEDING the Database(only for Debugging)
//==========================================
/*async await: finish executing 1st func before passing the control to next*/
//tours(dummy data - JSON) seeds to be added
/* Create a func that will seed our database with Bootcamps evertime we start the server*/

const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv').config();
const colors = require('colors');

//IMPORT MODEL
const Tour = require('./models/tourModel'); //ToursModel
const User = require('./models/userModel'); //UserModel
const Review = require('./models/reviewModel'); //ReviewModel

//Seprate Database connection for seeder
//replacing <PASSWORD> with DATABASE_PASSWORD in DATABASE_URL from .env file
const Db = process.env.DATABASE_URL.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
//Connecting to Database
mongoose.connect(Db, {
    useNewUrlParser:true, 
    useCreateIndex:true, 
    useFindAndModify:false,
    useUnifiedTopology: true
})
.then(()=> console.log('Seeder DB Connection Successful!'));


//=========================
//Read data from JSON file
//=========================
//JSON.parse() to convert text("String") into a JavaScript_object:
//readFileSync: reads a file synchronously
//console.error(err); writes error message to the console

//ToursData tours[]
const tours = JSON.parse(fs.readFileSync(`${__dirname}/utils/data/tours-new.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/utils/data/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/utils/data/reviews.json`, 'utf-8'));





//=========================
//IMPORT Data => DB
//=========================
const importData = async()=>{
    try{
        //TOURS
        await Tour.create(tours);

        //USERS
        //TO import user data(already encrypted password -> comment lines (84-119) in userModel)
        //turn of password encryption
        //once data is imported remove comments -> turn on encryption for future passwords encryptions
        //PASSWORD for all users ins seeder: 'test1234'
        await User.create(users, {validateBeforeSave:false}); //turnOffValidations(confirmPassword)
        
        //REVIEWS
        await Review.create(reviews);
        
        console.log('DATA Imported ...'.green.inverse);
    }catch(err){
        console.log(err);
    }
    //exit process after import
    process.exit(); 
};





//=========================
//DELETE Data => DB
//=========================
const deleteData = async()=>{
    try{
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('DATA Destroyed ...'.red.inverse);
    }catch(err){
        console.log(err);
    }
    //exit process after delete
    process.exit();
};



//=================================
//OPTIONS (to decide IMPORT/DELETE)
//=================================
//console.log(process.argv);

//node seeder -i :import data
//node seeder -d :delete data   
if(process.argv[2] === '-i'){
    importData();
}
else if(process.argv[2] === '-d'){
    deleteData();
}