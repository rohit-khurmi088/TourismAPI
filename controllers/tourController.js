//_____NPM IMPORTS______


//_____ FILE IMPORTS________
const asyncHandler = require('../middlewares/asyncHandler'); //Global_asyncHandler
const errorResponse = require('../middlewares/errorHandler/error'); //error class

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
    req.query.fields = 'name,price,ratingsAverage,sumamry,difficulty';
    next();
}





//<-------TOURS CONTROLLERS(Handlers)------------->
//=====================
// GET ALL TOURS
//=====================
exports.getAllTours = asyncHandler(async(req,res,next)=>{

    //copy req.query to new object (to exclude special queries)
    //for manipulating queries
    const queryObj = {...req.query};
    //console.log(queryObj); 

    //________________________________________________________
    // EXCLUDING Special fields 'detected' as id: from query
    //________________________________________________________
    //what fields to exclude
    const excludedFields = ['page','fields','limit','sort']
    //if the excludedfields names are found in query delete it from query
    excludedFields.forEach(el => delete queryObj[el]);

    //__________________________________________________________
    //1) FILTERING : using Special Mongoose operators with query
    //__________________________________________________________
    //EG: /api/v1/tours?duration[gte]=5&difficulty=easy
    //{"duration":"5","difficulty":"easy"} - queryObj :cannot use speacial mongoDb operators without $
    //{"duration":{"$gte":"5"},"difficulty":"easy"} - queryStr : -adding $ using replace method by converting to string
    //{ duration: { '$gte': '5' }, difficulty: 'easy' } - query :use special mongoDb operators

    //Using queries with Special mongoose Operators(gt:> |gte:>= |lt:< | lte:<= |in)
    //converting queryObj -> queryStr + UING REPLACE METHOD to replace query key -> $ query key
    //replace(regualrExpression, callback)
    let queryStr = JSON.stringify(queryObj);
    //console.log(queryStr);
    queryStr = queryStr.replace( /\b(lt|lte|gt|gte|in)\b/g, match=> `$${match}`);

   let query_object = JSON.parse(queryStr);
    //console.log(query_object);

    //FINAL QUERY (Model.find() - get all elements)
    let query = Tour.find(query_object);

    //______________
    //2) SORTING
    //______________
    //query.sort()
    //sort = excluded field (declared above)
    // EG: (sort by price {req.query.sort= price})
    // /api/v1/tours?sort=price,ratingsAverage(ASCENDING ratings(lowest 1st))
    // api/v1/tours?sort=price,-ratingsAverage (DECENDING ratings (highest 1st))

    //if there is a query to sort
    if(req.query.sort){
        //for results with same price ->sort by 2nd field- ratingsAverage
        //mongoDb: sort(price ratingsAverage)
        //req.query.sort : price,ratingsAverage
        //req.query.sort.split(',') : [ 'price','ratingsAverage' ] 
        //req.quer.sort.split(',').join(' ') : price ratingsAverage

        //console.log(req.query.sort.split(',').join(' '));
        const sortBy = req.query.sort.split(',').join(' ');

        //CHAINIGN sort method to query
        query = query.sort(sortBy);
    }else{
        //default sort
        query = query.sort('-createdAt'); //newest 1st(Decending)
    }

    //_______________________
    //3) Limit Fields (SELECT)
    //_______________________
    // Limiting FIELDS to get back in response 
    //query.select()
    //fields = excluded field (declared above)
    //A client choose which field to get back in response (reduce bandwidth in case of heavy dataset)
    //EG: /api/v1/tours?fields=name,duration,difficulty,price

    if(req.query.fields){
        //mongoDb: select(name duration difficulty price)
        //const fields = req.query.fields.split(',').join(' '); :name,duration,difficulty,price
        //const fields = req.query.fields.split(',').join(' '); :[ 'name', 'duration', 'difficulty', 'price' ]
        //const fields = req.query.fields.split(',').join(' '); :name duration difficulty price  
        
        //console.log(req.query.sort.fields(',').join(' '));
        const projectedFields = req.query.fields.split(',').join(' ');

        //CHAINING select method to query
        query = query.select(projectedFields);
    }else{
        //default(-field => exclude field)
        query = query.select('-__v');    //__v: only used internally by mongoDb
    }

    //_______________________
    //4) PAGINATION
    //_______________________
    //EG: /api/v1/tours?page=1&limit=3
    //Page = currentPage
    //limit = no. of items on currentPage
    //skip (StartIndex) = (page - 1) * limit 
    //EndIndex = page*limit;
    //totalItems = await Tours.countDocuments();
    //converting query_value string to number: parseInt('string', radixIndex(10 = decimal));

    const page = parseInt(req.query.page, 10) || 1;     //defaultPage=1
    const limit = parseInt(req.query.limit, 10) || 4;  //defaultLimit=4
    const skip = (page - 1) * limit;                  //startIndex
    const end = page * limit;                        //endIndex
    const totalItems = await Tour.countDocuments(); //totalDocuments

    //CHAINING method to query
    query = query.skip(skip).limit(limit);

    //console.log(page);
    //console.log(limit);
    //console.log(skip);
    //console.log(end);
    //console.log(totalItems);
    //console.log(req.query);

    //Pagination Result
    const pagination = {};

    //NEXT Page
    if(end<totalItems){
        pagination.next={
            page: page+1,
            limit: limit
        }
    }
    //PREVIOUS Page
    if(skip>0){
        pagination.prev={
            page: page-1,
            limit: limit
        }
    }
    //if Page does not exists(we dont have prev or next page)
    if(skip >= totalItems){
        //errorResponse
        throw new Error('This Page does not exists');
    }



    //EXCUTING QUERY
    const tours = await query;

    //SENDING RESPONSE - get tours
    res.status(200).json({
        status:'success',
        results: tours.length,
        pagination:pagination, //pagination Result
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