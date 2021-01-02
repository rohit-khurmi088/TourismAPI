//_____NPM IMPORTS______


//_____ FILE IMPORTS________
const asyncHandler = require('../middlewares/asyncHandler'); //Global_asyncHandler
const errorResponse = require('../middlewares/errorHandler/error'); //error class

const User = require('../models/userModel'); //User Model

//<-------USERS CONTROLLERS(Handlers)------------->

//=====================
// GET ALL USERS
//=====================
exports.getAllUsers = asyncHandler(async(req,res,next)=>{

    //Get all users - Model.find()
    const users = await User.find();

    //Sending Response
    res.status(200).json({
        status:'success',
        results: users.length,
       data: {users}
    });
})


//=======================================
// UPDATE the USER current Data (by user)
//=======================================
//Eg: Patch /api/v1/users/updateMe
//Updating passwords -> authController
//updating userData -> userController (findByIdAndUpdate(): name,email)
//ONLY LoggedIn user -> Update Password
exports.updateMe = asyncHandler(async(req,res,next)=>{

    //1)if user posts (or tries to update password) -> error
    if(req.body.password || req.body.passwordConfirm){
        return next(new errorResponse('This route is not for password update. Please use /updateMyPassword.',400));
    }

    //2)** Only name & email update -> allowed*/
    //FILTER req.body so that it only does not contain UNWANTED FIELDs(that cant be updated
    //________________________________________________________________
    //defining filterObj method
    //filerObj(req.body, all allowed fields('f1','f2'...))
    const filterObj = (obj, ...allowedFields)=>{
        //const newObj = {}; //emptyObject
        //loop through keys of req.body('name','email','role' etc...)
        //if allowedFields ('name','email') incudes fields from req.body 
        //include that field from req.body into newObj & return new Obj
        const newObj = {};
        Object.keys(obj).forEach(el =>{
            if(allowedFields.includes(el)) newObj[el] = obj[el];   
        });
        return newObj; 
    }

    const filteredBody = filterObj(req.body, 'name','email')

    //3)UPDATE the user data  - findByIdAndUpdate()
    //GET User by id (CURRENT USER = req.user)
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {new:true, runValidators:true});
    //console.log(updatedUser);

    //SENDING RESPONSE
    res.status(200).json({
        status:'success',
        user: updatedUser //updatedUser
    });
})


//=======================================
// DELETE the USER (by user)
//=======================================
//Eg: delete /api/v1/users/delteMe
exports.deleteMe = asyncHandler(async(req,res,next)=>{

    //Allow user to delte his account from the application
    //When user deletes his account -> dont delete document from database
    //SET THE ACCOUNT STATUS -> inactive
    //user at some point in the future may -> REactivate his account
    
    //Dont show inactive (active:false) user in output -> using queryMiddleware
    
    //GET current user(req.user) + update active:false
    const user = await User.findByIdAndUpdate(req.user.id, {active:false});
    
    //SENDING RESPONSE
    res.status(204).json({
        status:'success',
        data: null
    })

});






//=====================
// CREATE NEW USER
//=====================
exports.createUser = (req,res)=>{
    res.status(500).json({
        status:'error',
        message:'This route is not defined yet'
    });
}


//=======================
// GET Single USER by Id
//=======================
exports.getUser = (req,res)=>{
    res.status(500).json({
        status:'error',
        message:'This route is not defined yet'
    });
}


//==========================
// UPDATE Single USER by Id
//==========================
exports.updateUser = (req,res)=>{
    res.status(500).json({
        status:'error',
        message:'This route is not defined yet'
    });
}


//==========================
// DELETE Single USER by Id
//==========================
exports.deleteUser = (req,res)=>{
    res.status(500).json({
        status:'error',
        message:'This route is not defined yet'
    });
}




