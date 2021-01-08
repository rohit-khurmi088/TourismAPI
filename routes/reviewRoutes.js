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

router.route('/')
.get(getAllReviews)
.post(checkAuthenticatedUser,restrictTo('user'),setTourUserIds, createReview,) //only LoggedIn role='user'(not admin or guides) can create review

router.route('/:id')
.get(getReview)
.patch(updateReview)    
.delete(deleteReview)    

module.exports = router;