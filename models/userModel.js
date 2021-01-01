const mongoose = require('mongoose');

const validator = require('validator'); //validator
const bcrypt = require('bcryptjs'); //bcryptjs for password encryption (async/await)

//userSchema
const userSchema = new mongoose.Schema({
    //name
    name:{
        type:String,
        required:[true, 'Please enter your name']
    },
    //email
    email:{
        type:String,
        required:[true, 'Please enter your email'],
        unique:true,
        lowercase:true,
        //validating email
        //javascript regx email(validation)
        /*match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email   '
        ]*/
        validate: [validator.isEmail, 'Please enter a valid email'],

    },
    //photo
    photo:String,

    //ROLE (role based authorization)
    role:{
        type:String,
        enum:['user', 'guide', 'lead-guide', 'admin'],
        //default_role
        default: 'user' 
    },
    
    //password
    password:{
        type:String,
        required:[true,'Please enter your password'],
        minlength: 8 
    },
    //confirmPassword(Not Stored in database)
    passwordConfirm:{
        type:String,
        select: false, //Not shown in results
        required:[true, 'Please confirm your password'],
        //validate password & confirm password - ONLY WORKS ON save()
        //(THIS ONLY works on .create() OR .save() => to update user - use save() Not findOneAndUpdate())
        validate: {
            validator: function(val){
                return val === this.password; //abc === abc
            },
            message:'Passwords are not same'
        }
    },

    //PASSWORD Changed DATE
    passwordChangedAt: Date //if password was changed
});


//==============================================
//Mongoose MIDDLEWARES (hooks)
//==============================================
//____________________________________________________________
//PRE-SAVE-HOOKS (password Hashing before saving in database)
//____________________________________________________________
//this = current document
userSchema.pre('save', async function(next){
    //IF PASSWORD IS not Created/Updated(modified/changed) -> no hasing
    if(!this.isModified('password')) return next();

    //only hash password -> IF PASSWORD IS Created/Updated
    //hash passoword using bcrypt before saving in database
    //bcrypt.hash(password, salt) => default salt value = 10 
    //Higher salt => stronger encryption (but more time consuming)
    this.password = await bcrypt.hash(this.password, 12);

    //Dont save passwordConfirm in database( set to 'undefined')
    this.passwordConfirm = undefined;

    next();
})

//==================
// INSTANCE METHOD
//==================
//Available on all the instances of a given Model -> called on user document
//_______________________________________
//COMPARE EnteredPassword & UserPassword
//_______________________________________
//correctPassowrd(enteredPassword, userPassword) -> returns true/false
userSchema.methods.correctPassword = async function(enterdPassword, userPassword){
    
    //enterdPassword = plain text , userPassword = encrypted/hashed (in database)
    //use bcrypt.compare() to compare passwords 
    return await bcrypt.compare(enterdPassword, userPassword);
}

//___________________________________________________________________
//CHECK if user changed the password after the JWT(Token) was issued
//____________________________________________________________________
//JWtTimestamp = when the token was issued
//by default user not changed the password after token was issued
//JWTTimestamp = millisec
//convert passwordChangedAt -> millisec (To compare jwt issued & password changed time)
userSchema.methods.changedPasswordAfter = function(JWTTimestamp){

    //if Password was changed
    if(this.passwordChangedAt){
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime()/1000 ,10) //millisec
        //console.log(changedTimeStamp, JWTTimestamp);
        return JWTTimestamp < changedTimeStamp; //millisec
    }
    //if Password was not changed
    return false;
}




//User Model
const User = mongoose.model('User', userSchema);

//exporting model
module.exports = User;