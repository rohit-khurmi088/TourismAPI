//_____NPM IMPORTS______


//_____ FILE IMPORTS________
const asyncHandler = require('../middlewares/asyncHandler'); //Global_asyncHandler
const errorResponse = require('../middlewares/errorHandler/error'); //error class

const Tour = require('../models/tourModel'); //Tour Model



//<-------TOURS CONTROLLERS(Handlers)------------->
//=====================
// GET ALL TOURS
//=====================
exports.getAllTours = asyncHandler(async(req,res,next)=>{

    //Model.find() - get all elements
    const tours = await Tour.find();

    //Send response - get tours
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