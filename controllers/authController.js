//_____NPM IMPORTS______
const {promisify} = require('util');  //(for jwt.verify)
const crypto = require('crypto');    //for password reset token

//_____ FILE IMPORTS________
const asyncHandler = require('../middlewares/asyncHandler'); //Global_asyncHandler
const errorResponse = require('../middlewares/errorHandler/error'); //error class

const jwt = require('jsonwebtoken'); //JWT
const sendEmail = require('../utils/email'); //nodemailer_EmailHandler

const User = require('../models/userModel'); //User Model



//<-------AUTH CONTROLLERS(Handlers)------------->

//=====================
// SIGNUP
//=====================
//Eg: POST /api/v1/users/signup
exports.signup = asyncHandler(async(req,res,next)=>{

    //CREATE new User
    const newUser = await User.create(req.body);

    //GENERATE TOKEN(jwt) on SignUp
    const token = jwt.sign({id: newUser._id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });

    //Sending Response
    res.status(201).json({
        status: 'success',
        token: token,
        data: {user: newUser}
    });
})


//=====================
// SIGNIN
//=====================
//Eg: POST /api/v1/users/signin
exports.signin = asyncHandler(async(req,res,next)=>{
    const {email,password} = req.body; //destructing email & passwords from req.body

    //1)CHECK IF USER ENTERED EMAIL & PASSWORD
    if(!email || !password){
        //errorResponse
        return next(new errorResponse('Please enter email or password',400));
    }

    //2)CHECK IF USER EXISTS & PASSWORD IS CORRECT
    //find user by email & including (Select:false filed(password) -> .select('+field'))
    //To check password is correct -> (use instance method correctPassword(enterdPassword,userPassword) - defined in model)
    const user = await User.findOne({email: email}).select('+password');

    //IF user DOES NOT EXIST & passoword DOES NOT MATCH (EnteredPassword != DatabasePassword)
    if(!user || !(await user.correctPassword(password, user.password))){
        //errorResponse
        return next(new errorResponse('Incorrect email OR password'), 401);
    }

    //If EVERYTHING IS OK -> CREATE a unique JWT for singIn
    const token = jwt.sign({id: user._id}, process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRES_IN
    });
    
    //Sending Response
    res.status(201).json({
        status: 'success',
        token: token,
    });
})






//=====================
// MIDDLEWARES 
//=====================
//__________________________________________________
// PROTECTING ROUTES -> checkAuthenticatedAccess()
//__________________________________________________
//To give loggedIn users to access certain routes
exports.checkAuthenticatedUser = asyncHandler(async(req,res,next)=>{

    //-------NOTE-----------
    //POSTMAN
    //For sending token as a header : set in headers-> Authorization: Bearer 'tokenValue'
    //Bearer = possessing token
    //req.headers = {  authorization: 'Bearer token'}
    //req.headers.authorization = 'Bearer token'
    //req.headers.authorization.split('') = [ 'Bearer', 'token' ]
    //req.headers.authorization.split('')[1] = token 
    //-----------------------

    let token;
    
    //1)CHECK IF TOKEN IS THERE - Get the token( from header) -signIn token(unique)
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];
        //console.log(token);
    }
    //if there is no token with the req. => not loggedIn
    if(!token){
        return next(new errorResponse('You are not logged in! Please log in to get access',401));
    }

    //2) VALIDATE the TOKEN (verification): JWT algo verifies if token is valid or not
    //requires callback - runs on verification
    //PROMISIFY this func - to return promise
    //buildIn promisify func -> util module (build in)
    //IF TOKEN IS valid -> grant access to routes
    const decoded = await promisify(jwt.verify)(token , process.env.JWT_SECRET)
    
    //IF TOKEN IS not-valid -> Error => Invalid Signature (handled on errorHandler middleware)
    console.log(decoded);
    //{ id: '5fedf883c7203a66e86bf0cf', iat: 1609436243, exp: 1617212243 }
    //id = user._id in database

    //3) CHECK if USER trying to access routes Still EXISTS
    //Eg- if user is deleted by admin but token still exist => dont logIn
    //tokens changes when password changes
    //find user by id from decoded 
    const currentUser = await User.findById(decoded.id);

    if(!currentUser){
        //errorResponse
        return next(new errorResponse('The user belonging to this token no longer exists',401));
    }


    //4) CHECK IF User changed password AFTER THE JWT was issued
    //using instance method - 
    //iat = issured at
    if(currentUser.changedPasswordAfter(decoded.iat)){
        return next(new errorResponse('User recently changed password. Please Login again!',401));
    };

    //IF Everything is pk -> call next() => GRANT ACCESS TO PROTECTED ROUTES
    //put user data on the request
    req.user = currentUser;

    next();
})




//__________________________________________________
// AUTHORIZATION -> BASED ON 'role' (restrictTo)
//__________________________________________________
// roles = ['user','admin','tour-guide','lead-tour-guide']
//we need to pass roles (arguments) to middleware to access routes => create wrapper func
//req.user = currentUser

exports.restrictTo = (...roles)=>{
    return (req,res,next)=>{
        //roles = array => ['admin','lead-guide'] , role = 'user' (Not Included)
        
        //FOR ALL USERS with No permission to access
        if(!roles.includes(req.user.role)){
            return next(new errorResponse('You do not have permission to perform this action',403));
        }

        next();
    }
}



//======================
//** FORGOT PASSWORD **
//=====================
//Eg: /api/v1/users/forgotPassword
exports.forgotPassword = asyncHandler(async(req,res,next)=>{
    
    //GET the User by email
    //__________________________________
    const user = await User.findOne({ email: req.body.email });
    //user not found ->
    if(!user){
        return next(new errorResponse('No User found with this email'),404);
    }
    
    //user found ->
    //1) GENERATE RANDOM RESET TOKEN (using instance method - createPasswordResetToken() - User Model)
    //__________________________________
    const resetToken = await user.createPasswordResetToken();

        //update document after generating reset token
        //validateBeforeSave: false :deactivate all the validators eg: name,email etc..reduired fields
        await user.save({ validateBeforeSave: false });
    
    //2) SEND reset Token TO User's email (nodemailer) - plain text
        //__________________________________
        //resetURL (RESET PASSWORD PAGE URL)
        ///api/v1/users/resestPassword/token
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/resetPassword/${resetToken}`;
        const message = `Forgot your password? Submit a PATCH reqiest woth your new password & passwordConfirm to: ${resetURL}\n
                         If you didn't forgeet your password, please ignore this email!`;
        
        //SENDING EMails
        try{
            //sendEmail({email,subject,message})
            await sendEmail({
                email: user.email, 
                subject: 'PASSWORD RESET TOKEN (Valid for 10 min)', 
                message: message 
            });

            //SENDING Response
            res.status(200).json({
                status: 'success',
                message: 'Password Reset Token sent to email!'
            });
        
        }catch(err){
            //RESET both the resetToken & resetExpires property
            user.createPasswordResetToken = undefined,
            user.passwordResetExpires = undefined
            
                //update document after generating reset token
                //validateBeforeSave: false :deactivate all the validators eg: name,email etc..reduired fields
                await user.save({ validateBeforeSave: false});
            
            //errorResponse
            return next(new errorResponse('There was an error sending the email.Try again later!',500));
        }
})




//=====================
//** RESET PASSWORD ** 
//=====================
//patch : modification in password
//Eg: /api/v1/users/resestPassword/token(any_token)
exports.resetPassword = asyncHandler(async(req,res,next)=>{

    //till now we were sending token as a plain text but to compare it wih token in the database we need to encrypt the token
    //to compare both tokens - encrypt the original token again
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    //Get User BASED on token + (tokenExpireDate > currentDate => token not expired)
    //______________________________________________________________________________
    //to get user from token Model.findOne({passworResetToken: token, passwordResetExpires: {$gt: Date.now()}});
    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: {$gt: Date.now()} });
    
    //->if there is no user
    if(!user){
        //errorResponse
        return next(new errorResponse('Token is Invalid or Expired',400));
    }
    //->If token has not been expired but there is user => SET NEW PASSWORD + REMOVE passwordResetToken,passwordExpiresIn from the database
    //____________________________________________________
    //----- SET NEW PASSWORD -----
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    //----- REMOVE passwordResetToken,passwordExpiresIn from the database -----
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    //update the document
    await user.save();

    //UPDATE ChangedPasswordAt property (defined in User Model)
    //__________________________
    // -> updated in pre-save-middleware

    //LogIn The user in -> SEND JWT
    //____________________________
    //jwt token
    const token = jwt.sign({id: user._id}, process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRES_IN
    });

    //SENDING RESPOSNSE
    res.status(200).json({
        status: 'success',
        token: token
    });

})





//=====================
//** UPDATE PASSWORD ** 
//=====================
exports.updatePassword = asyncHandler(async(req,res,next)=>{
//ONLY for loggedIn users => chain(checkAuthenticatedUser) 
//Let passwordCurrent = currentPassword (not storedIn database or Mode -> password = currentPassword(same))
//so, password = updatedPassword
//    passwordConfirm = confirm updated Password
//if we do user.findByIdAndUpdate() -> validators will not work here

    //GET Current User(req.user)
    //by default password -> select:false -> to show password use select('+password')
    const user = await User.findById(req.user.id).select('+password');

    //CHECK if Posted(ENTERED -currentPassword) Password Is correct
    //currentPassword => plain text & password to match with (in database)=> encrypted
    //use instance method correctPassowrd(enteredPassword, userPassword) - declared in User Model to compare both
    
    //if PASSWORDS DOES NOT MATCH ->error
    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))){
        //errorResponse
        return next(new errorResponse('Please enter correct Current Password',401));
    }
    
    //If PASSWORD is Correct(MATCHES) -> Update Password
    user.password = req.body.password,
    user.passwordConfirm = req.body.passwordConfirm
    //update the document
    await user.save();

    //LogIn The user in -> SEND JWT
    const token = jwt.sign({id: user.id}, process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRES_IN
    });

    //SENDING RESPOSNSE
    res.status(200).json({
        status: 'success',
        token: token
    });
})



