//_____NPM IMPORTS______


//_____ FILE IMPORTS________
const asyncHandler = require('../middlewares/asyncHandler'); //Global_asyncHandler
const errorResponse = require('../middlewares/errorHandler/error'); //error class

const APIFeatures = require('../utils/queryFeaturesAPI'); //queryAPIFeatures (methods)

const Tour = require('../models/tourModel'); //Tour Model


//=====================
// MIDDLEWARES
//=====================
//---------------------------------
//Controller for TOP 5 CHEAP Tours
//---------------------------------
//Eg: /api/v1/tours/top-5-cheap
exports.aliasTopTours = (req,res,next)=>{
    //Query for Top 5 Cheap Tours 
    //BEST & CHEAPEST: /api/v1/tours?limit=5&sort=-ratingsAverage,price
    //(decending ratingsAverage: 4.9 4.8 4.7 etc...(sorted by ratingsaverage1st);)
    //for CHEAPEST & BEST : select price 1st

    //PREFILLING PARTS OF QUERY OBJECTS BEFORE REACHING TO getAllTours
    //NOTE: query contains values in string form 
    req.query.limit = '5',
    req.query.sort = '-ratingsAverage,price'
    req.query.fields = 'name,price,ratingsAverage,sumamry,difficulty,duration';
    next();
}





//<-------TOURS CONTROLLERS(Handlers)------------->
//=====================
// GET ALL TOURS
//=====================
exports.getAllTours = asyncHandler(async(req,res,next)=>{
    
    //_____CHAINING QUERY using Methods from queryFeaturesAPI_____
    //class = APIFeatures
    //constructor(mongoose_query, express_query);
    //quey = mongoose Query = Model.find()
    //queryString = express Query = req.query
    //features return -> this => query object
    const features = new APIFeatures(Tour.find(),req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();


    //EXCUTING QUERY
    const tours = await features.query;

    //SENDING RESPONSE - get tours
    res.status(200).json({
        status:'success',
        results: tours.length,
        data: {tours:tours}
    });
})



//=====================
// CREATE NEW TOUR
//=====================
exports.createTour = asyncHandler(async(req,res,next)=>{
    //const newTour = new Tour({tour_fields});
    //newTour.save();

    //Model.create(req.body) - create new entity
    const newTour = await Tour.create(req.body);

    //Sending response - tour created
    res.status(201).json({
        status:'success',
        data: {tours: newTour}
    });
})



//=======================
// GET Single TOUR by Id
//=======================
exports.getTour = asyncHandler(async(req,res,next)=>{
     
    //Model.findById(req.params.id) OR Model.findOne({_id: req.params.id}) - find element by id
    const tour = await Tour.findById(req.params.id);

    //If tour is not found
    if(!tour){
        //errorResponse
        return next(new errorResponse('No tour found with that Id',404));
    }

    //Send Response - tour found
    res.status(200).json({
        status:'success',
        data: tour
    });
})



//==========================
// UPDATE Single TOUR by Id
//==========================
exports.updateTour = asyncHandler(async(req,res,next)=>{

     //_____PUT VS PATCH_____
    //PATCH: replaces the fields that are different(modifies)
    //PUT: replaces the complete object(original Object)

    //Model.findByIdAndUpdate(req.params.id,req.body,{new:true, runValidators:true}) - find & update element by id
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body ,{new:true, runValidators:true});

    //if tour is not found 
    if(!tour){
        //errorResponse
        return next(new errorResponse('No tour found with that Id',404));
    }

    //Send Response - tour is updated
    res.status(200).json({
        status:'success',
        data:tour
    });
})



//==========================
// DELETE Single TOUR by Id
//==========================
exports.deleteTour = asyncHandler(async(req,res,next)=>{
    
    //Model.findByIdAndDelete - delete tour by id
    const tour = await Tour.findByIdAndDelete(req.params.id);

    if(!tour){
        //errorResponse
        return next(new errorResponse('No tour found with that Id',404));
    }

    //Send Resonse - tour id deleted
    res.status(204).json({
        status:'success',
        data:null //No data is send for delete request
    });
})