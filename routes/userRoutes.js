const express = require('express');
const router = express.Router();

//importing functions from authController 
const {signup, signin} = require('../controllers/authController');

//importing functions from userController(Destructuring)
const {getAllUsers,createUser,getUser,updateUser,deleteUser} = require('../controllers/userController');


//____________________
// AUTH ROUTES
//____________________
router.route('/signup').post(signup); //signUp
router.route('/signin').post(signin); //signIn

//____________________
// USER ROUTES
//____________________
//Chaining Similar Routes

router.route('/')
.get(getAllUsers)
.post(createUser)

router.route('/:id')
.get(getUser)
.patch(updateUser)
.delete(deleteUser)



module.exports = router;