//_____NPM IMPORTS______


//_____ FILE IMPORTS________
const asyncHandler = require('../middlewares/asyncHandler'); //Global_asyncHandler
//const errorResponse = require('../middlewares/errorHandler/error'); //error class

const Tour = require('../models/tourModel'); //Tour Model

//**Common controller functions**
const {getAll, createOne,getOne,updateOne,deleteOne} = require('./handlerFactory'); 

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
exports.getAllTours = getAll(Tour);


//=====================
// CREATE NEW TOUR
//=====================
exports.createTour = createOne(Tour);


//=======================
// GET Single TOUR by Id
//=======================
//POPULATING 'reviews' on tour(used virtual Properties)
//const tour = await Tour.findById(req.params.id).populate('reviews');
exports.getTour = getOne(Tour,{ path:'reviews' });


//==========================
// UPDATE Single TOUR by Id
//==========================
exports.updateTour = updateOne(Tour);


//==========================
// DELETE Single TOUR by Id
//==========================
exports.deleteTour = deleteOne(Tour);





//==============================================================
// GET STATS FOR ALL TOURS(by Difficulty: easy,medium,difficult)
//===============================================================
//Eg: /api/v1/tours/tour-stats
exports.getTourStats = asyncHandler(async(req,res,next)=>{

    //AIM:
    //GROUP tours -> categories (easy,medium,hard) with the following fields->
    //number of Tours, avgRatings,number of Ratings, avgPrice, minPrice, maxPrice

    //Model.aggregate([Pipeline])
    //Pipeline = [opr1,opr2,opr3...] executed Sequentially
    const stats = await Tour.aggregate([
        //FIND tours with ratingsAvg>=4.5 
        {$match : {ratingsAverage: {$gte:4.5}}},

        //GROUP
        {$group:{
             //group the following fields by category:difficulty -easy,medium,difficult
            _id:{ $toUpper: '$difficulty'},
            //no.of tours,ratings, avgratings, minPrice,avgPrice, maxPrice in each category
            numTours: {$sum:1},  //count 1 for each document
            numRatings: {$sum: '$ratingsQuantity'},
            avgRatings: {$avg: '$ratingsAverage'},
            avgPrice: {$avg: '$price'},
            minPrice: {$min: '$price'},
            maxPrice: {$max :'$price'}
        }},

        //SORT (sort groups by avgPrice)
        //1: ascending(lowest avgPrice group shows 1st) , -1:decending
        {$sort: {avgPrice:1}},

        //SHOW Only difficult & medium groups
        //{$match: {_id:{$ne:'EASY'}}},
    ]);
    
    //Sending Response
    res.status(200).json({
        status: 'success',
        data: stats
    });
})




//===============================================
// GET TOURS by Month of the Year (Monthly-Plan)
//================================================
//Eg: /api/v1/tours/monthly-plan/:year 
exports.getMonthlyPlan = asyncHandler(async(req,res,next)=>{

    //AIM
    //Get Tours by month of the year (year passed as :/year req.params.year)
    
    const year = parseInt(req.params.year); //currentYear

    const plan = await Tour.aggregate([
        //startDates = [d1,d2,d3]
        //1 tour can start on different months or on different dates
        //unwind by date => split by -> same tour same data but different dates
        //$unwind: creates 3 objects for same tour with differnt start dates (For all tours)
        {$unwind: '$startDates'},

        //to match for currentYear, start dates should be in the same year
        {$match:{
            startDates:{
                $gte: new Date(`${year}-01-01`),
                $lte: new Date(`${year}-12-31`),
            }
        }},

        //to match for diffrent month wise -> make different groups for tours according to months
        {$group:{
            _id: {$month: '$startDates'}, //id = monthNumber(1-12)
            //only display number of tours & tour name
            numToursStart: {$sum:1},
            tours:{$push:'$name'} //push tour names in tours{}
        }},

        //Add a newField - month of value = _id (declared above)
        {$addFields: {month: '$_id'}},
       
        //exclude id from shown results(1= show/ 0 = exclude)
        {$project:{ _id:0 }},

        //sort by highest number of tours
        {$sort: {numToursStart:-1}},
        //12 months = 12 results
        {$limit:12}
    ])

    res.status(200).json({
        status: 'success',
        data: {plan}
    });
})
