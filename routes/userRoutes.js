const express = require('express');
const router = express.Router();

//importing functions from authController 
const {signup, signin ,checkAuthenticatedUser, forgotPassword, resetPassword, updatePassword } = require('../controllers/authController');

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

router.route('/updateMe').patch(checkAuthenticatedUser, updateMe ) //(only LoggedIn user) -> UPDATE USER Data
router.route('/deleteMe').delete(checkAuthenticatedUser, deleteMe ) //(only LoggedIn user) -> Inactive his account


//---Chaining Similar Routes---

router.route('/')
.get(getAllUsers)
.post(createUser)

router.route('/:id')
.get(getUser)
.patch(updateUser)  //only admin - dont't change password here
.delete(deleteUser) //only admin



module.exports = router;