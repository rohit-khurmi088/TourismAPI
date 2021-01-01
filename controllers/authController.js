//_____NPM IMPORTS______
const {promisify} = require('util'); //(for jwt.verify)

//_____ FILE IMPORTS________
const asyncHandler = require('../middlewares/asyncHandler'); //Global_asyncHandler
const errorResponse = require('../middlewares/errorHandler/error'); //error class

const jwt = require('jsonwebtoken'); //JWT

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