const express = require('express');
const router = express.Router();

//importing functions from authController 
const {signup, signin ,checkAuthenticatedUser, forgotPassword, resetPassword, updatePassword, restrictTo } = require('../controllers/authController');

//importing Middleware from userController
const {getMe} = require('../controllers/userController');

//importing functions from userController(Destructuring)
const {getAllUsers,createUser,getUser,updateUser,deleteUser, updateMe,deleteMe} = require('../controllers/userController');


//____________________
// AUTH ROUTES
//____________________
router.route('/signup').post(signup); //signUp
router.route('/signin').post(signin); //signIn

router.route('/forgotPassword').post(forgotPassword); //forgotPassword
router.route('/resetPassword/:token').patch(resetPassword); //resetPassword

//ONLY for loggedIn users => chain(checkAuthenticatedUser) 
router.route('/updateMyPassword').patch(checkAuthenticatedUser, updatePassword); //updatePassword

//____________________
// USER ROUTES
//____________________
//ACCESSABLE BY LOGGED IN USER (only) 
//- use middleware
//router.use(checkAuthenticatedUser); //protects all routes below this middleware

router.route('/Me').get(checkAuthenticatedUser, getMe, getUser);   //this will now using middleware give current authenticated user
router.route('/updateMe').patch(checkAuthenticatedUser, updateMe ) //(only LoggedIn user) -> UPDATE USER Data
router.route('/deleteMe').delete(checkAuthenticatedUser, deleteMe ) //(only LoggedIn user) -> Inactive his account


//---Chaining Similar Routes---
//ACCESSABLE BY LOGGED IN 'admin' (only)
//- use middleware OR use checks in individual routes
//router.use(restrictTo('admin')); //protects all routes below this middleware

router.route('/')
.get(checkAuthenticatedUser, restrictTo('admin'), getAllUsers)  //only admin
.post(checkAuthenticatedUser, restrictTo('admin'),createUser)  //only admin

router.route('/:id')
.get(checkAuthenticatedUser, restrictTo('admin'),getUser)       //only admin    
.patch(checkAuthenticatedUser, restrictTo('admin'),updateUser)  //only admin - dont't change password here
.delete(checkAuthenticatedUser, restrictTo('admin'),deleteUser) //only admin



module.exports = router;