//_____NPM IMPORTS______


//_____ FILE IMPORTS________
const asyncHandler = require('../middlewares/asyncHandler'); //Global_asyncHandler
const errorResponse = require('../middlewares/errorHandler/error'); //error class

const Review = require('../models/reviewModel'); //Review Model

//<-------Review CONTROLLERS(Handlers)------------->

//=====================
// GET ALL Reviews
//=====================
//Eg: GET /api/v1/tours/:tourId/reviews
//GET ALL REVIEWS by specific tour (Tour Id) - /:tourId
exports.getAllReviews = asyncHandler(async(req,res,next)=>{

    //SEARCH by tourId(
    let filter = {};
    if(req.params.tourId) filter= {tour: req.params.tourId};

    //getting all reviews
    const reviews = await Review.find(filter);

    //SENDING Response
    res.status(200).json({
        status:'success',
        results: reviews.length,
        data: {reviews} 
    });

})


//=====================
// CREATE NEW Review
//=====================
//Eg: POST /api/v1/tours/:tourId/reviews
//CREATE Review for a specific tour
exports.createReview = asyncHandler(async(req,res,next)=>{

    //In body we passed - current tour:tourId, current user:userId
    //current tourId: req.params.tourId
    //current userId: req.user.id (Current user = req.user - checkAuthenticated Middeware)
    if(!req.body.tour) req.body.tour = req.params.tourId;
    if(!req.body.user) req.body.user = req.user.id; 

    //getting all reviews
    const newReview = await Review.create(req.body);

    //SENDING Response
    res.status(201).json({
        status:'success',
        data: {newReview}
    });

})



//=======================
// GET Single Review by Id
//=======================
exports.getReview = asyncHandler(async(req,res,next)=>{
     
    //Model.findById(req.params.id) OR Model.findOne({_id: req.params.id}) - find element by id
    const review = await Review.findById(req.params.id);

    //If review is not found
    if(!review){
        //errorResponse
        return next(new errorResponse('No review found with that Id',404));
    }

    //Send Response - tour found
    res.status(200).json({
        status:'success',
        data: review
    });
})

//==========================
// UPDATE Single Review by Id
//==========================
exports.updateReview = asyncHandler(async(req,res,next)=>{

    //_____PUT VS PATCH_____
   //PATCH: replaces the fields that are different(modifies)
   //PUT: replaces the complete object(original Object)

   //Model.findByIdAndUpdate(req.params.id,req.body,{new:true, runValidators:true}) - find & update element by id
   const review = await Review.findByIdAndUpdate(req.params.id, req.body ,{new:true, runValidators:true});

   //if tour is not found 
   if(!review){
       //errorResponse
       return next(new errorResponse('No review found with that Id',404));
   }

   //Send Response - tour is updated
   res.status(200).json({
       status:'success',
       data:review
   });
})


//==========================
// DELETE Single Review by Id
//==========================
exports.deleteReview = asyncHandler(async(req,res,next)=>{
    
    //Model.findByIdAndDelete - delete review by id
    const review = await Review.findByIdAndDelete(req.params.id);

    if(!review){
        //errorResponse
        return next(new errorResponse('No review found with that Id',404));
    }

    //Send Resonse - review id deleted
    res.status(204).json({
        status:'success',
        data:null //No data is send for delete request
    });
})

