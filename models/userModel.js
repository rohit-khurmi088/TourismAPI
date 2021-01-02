const mongoose = require('mongoose');

const validator = require('validator'); //validator
const bcrypt = require('bcryptjs'); //bcryptjs for password encryption (async/await)
const crypto = require('crypto'); //for password reset token

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
    passwordChangedAt: Date, //if password was changed

    //PASSWORD RESET (save in database)
    passwordResetToken: String, //password reset token
    passwordResetExpires: Date,  //password reset token expireing time 

    //ACCOUNT Status (active -> default)
    active:{
        type:Boolean,
        default:true,
        select:false //dont show in results(stored in Database)
    }
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

//____________________________________________________________
//UPDATE ChangedPasswordAt property - After PASSWORD RESET
//____________________________________________________________
//this = current document
userSchema.pre('save', function(next){

    //If passowrdNotModified OR new user created
    if(!this.isModified('password') || this.isNew) return next();

    //OnlyUpdate if we modified the password (RESET)
    //__________________________
    //NOTE---
    //saving to Database is slower than issuing the JWT
    //sometimes ChangedPasswordTimeStamp is issued after JWT(faster)
    //set password ChangedAt 1 sec in the past
    this.passwordChangedAt = Date.now() - 1000 //(1000 = 1sec)

    next();
}),


//____________________________________________________________
//PRE-find-HOOKS (DONT SHOW INACTIVE users in the results)
//____________________________________________________________
//this = current query being executed
userSchema.pre(/^find/, function(next){
    //DONT SHOW INACTIVE users in the results
    this.find({active: {$ne: false}})

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
},

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
},



//____________________________________________________
// RESET PASSWORD - GENERATING 'password reset token'
//____________________________________________________
userSchema.methods.createPasswordResetToken = function(){
    
    //using crypto module -> generate random token  (32 characters hexadecimal string)
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    //Dont store reset token as plain string  in DATABASE (Hashing using 'sha256' algorithm)
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    //setting reset token expiring time (10 minutes after token was generated (in millisec))
    this.passwordResetExpires =  Date.now() + 10 * 60 * 1000; //10 minutes(millisec)

    //Encrypted reset token -> stored in database
    //plain reset token -> send to user email 
    console.log(resetToken, this.passwordResetToken);
    return resetToken;
}



//User Model
const User = mongoose.model('User', userSchema);

//exporting model
module.exports = User;