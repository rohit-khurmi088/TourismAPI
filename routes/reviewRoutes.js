const express = require('express');
const router = express.Router({ mergeParams: true }); //allows to merge review id with tourRoute

//importing auth middleware from authController
const {checkAuthenticatedUser, restrictTo} = require('../controllers/authController');
 
//importing Middleware from ReviewController
const {setTourUserIds} = require('../controllers/reviewController');

//importing functions from ReviewController(Destructuring)
const {getAllReviews,createReview,getReview,updateReview,deleteReview} = require('../controllers/reviewController');


//____________________
// Review ROUTES
//____________________
//---Chaining Similar Routes---
// api/v1/tours/:tourId/reviews - getAll, create
// api/v1/tours/:tourId/reviews/:id - get, update, delete

// Authentication: ONLY LOGGED IN USER -> access reviews
//- use middleware
//router.use(checkAuthenticatedUser); //protects all routes below this middleware
//Authorization: 
//ONLY 'user' -> create(POST) reviews (No admin,guide,lead-guide)
// guides, lead-guides -> cannot add, edit, delete reviews
// admin + user can update, delete reviews

router.route('/')
.get(checkAuthenticatedUser, getAllReviews)
.post(checkAuthenticatedUser, restrictTo('user'),setTourUserIds, createReview,) //only LoggedIn role='user'(not admin or guides) can create review

router.route('/:id')
.get(checkAuthenticatedUser, getReview)
.patch(checkAuthenticatedUser, restrictTo('user','admin'), updateReview)    //admins + user should be able to update reviews 
.delete(checkAuthenticatedUser, restrictTo('user','admin'), deleteReview)    //admins + user should be able to delete reviews 

module.exports = router;