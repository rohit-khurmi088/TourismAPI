//_____NPM IMPORTS______


//_____ FILE IMPORTS________
const asyncHandler = require('../middlewares/asyncHandler'); //Global_asyncHandler
const errorResponse = require('../middlewares/errorHandler/error'); //error class

const User = require('../models/userModel'); //User Model

//<-------USERS CONTROLLERS(Handlers)------------->

//=====================
// GET ALL USERS
//=====================
exports.getAllUsers = asyncHandler(async(req,res)=>{

    //Get all users - Model.find()
    const users = await User.find();

    //Sending Response
    res.status(200).json({
        status:'success',
       data: {users}
    });
})

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




