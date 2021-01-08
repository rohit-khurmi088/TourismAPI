//_____NPM IMPORTS______


//_____ FILE IMPORTS________
const asyncHandler = require('../middlewares/asyncHandler'); //Global_asyncHandler
const errorResponse = require('../middlewares/errorHandler/error'); //error class

const Review = require('../models/reviewModel'); //Review Model

//**Common controller functions**
const {getAll,createOne,getOne,updateOne,deleteOne} = require('./handlerFactory'); 

//<-------Review CONTROLLERS(Handlers)------------->

//=====================
// GET ALL Reviews
//=====================
//Eg: GET /api/v1/tours/:tourId/reviews
//GET ALL REVIEWS by specific tour (Tour Id) - /:tourId
exports.getAllReviews = getAll(Review);


//=====================
// CREATE NEW Review
//=====================
//Eg: POST /api/v1/tours/:tourId/reviews
//CREATE Review for a specific tour

//** Middleware ** to be passed before 'createReview' Routes
exports.setTourUserIds = (req,res,next)=>{
    //----- Allow Nested Routes -----
    //In body we passed - current tour:tourId, current user:userId
    //current tourId: req.params.tourId
    //current userId: req.user.id (Current user = req.user - checkAuthenticated Middeware)
    if(!req.body.tour) req.body.tour = req.params.tourId;
    if(!req.body.user) req.body.user = req.user.id; 

    next();
}
exports.createReview = createOne(Review);


//=======================
// GET Single Review by Id
//=======================
exports.getReview = getOne(Review);


//==========================
// UPDATE Single Review by Id
//==========================
exports.updateReview = updateOne(Review);


//==========================
// DELETE Single Review by Id
//==========================
exports.deleteReview = deleteOne(Review);

