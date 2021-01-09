//_____ FILE IMPORTS________
const asyncHandler = require('../middlewares/asyncHandler'); //Global_asyncHandler
const errorResponse = require('../middlewares/errorHandler/error'); //error class

const APIFeatures = require('../utils/queryFeaturesAPI'); //queryAPIFeatures (methods)

//function returning function
// Used Controllers (generic function)
//func takes model as input & preform specific control operations

//===========================
// GET All doc's handler
//===========================
exports.getAll = (Model) => asyncHandler(async(req,res,next) =>{

    //_____CHAINING QUERY using Methods from queryFeaturesAPI_____
    //class = APIFeatures
    //constructor(mongoose_query, express_query);
    //quey = mongoose Query = Model.find()
    //queryString = express Query = req.query
    //features return -> this => query object

    //********** reviewController **********
    //To allow for nested GET Reviews on tour
    //SEARCH by tourId(
    let filter = {};
    if(req.params.tourId) filter= {tour: req.params.tourId};
   
    const features = new APIFeatures(Model.find(filter),req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();


    //EXCUTING QUERY
    //to check read performance using indexes - explain()
    //const docs = await features.query.explain();
    const docs = await features.query;

    //SENDING RESPONSE - get tours
    res.status(200).json({
        status:'success',
        results: docs.length,
        data: {data:docs}
    });
})



//===========================
// CREATE doc handler
//===========================
//For: Tour,Reviews
//for User - used .save() method
exports.createOne = (Model) => asyncHandler(async(req,res,next)=>{
    //const newDoc = new Model({doc_fields});
    //newDoc.save();

    //Model.create(req.body) - create new entity
    const doc = await Model.create(req.body);

    //Sending response - tour created
    res.status(201).json({
        status:'success',
        data: {data: doc}
    });
})



//===============================
// GET single doc(by id) handler
//===============================
//For Tour.populate('revews'), Users, Reviews;
exports.getOne = (Model,popOptions) => asyncHandler(async(req,res,next)=>{
     
    //Model.findById(req.params.id) OR Model.findOne({_id: req.params.id}) - find element by id
    //const doc = await Model.findById(req.params.id);
    //using populate() -> creates a new query which might affect our application
    
    let query = Model.findById(req.params.id);
    
    //if populate options present
    if(popOptions) query = query.populate(popOptions);
    
    const doc = await query;

    //If doc is not found
    if(!doc){
        //errorResponse
        return next(new errorResponse('No doc found with that Id',404));
    }

    //Send Response - doc found
    res.status(200).json({
        status:'success',
        data: {data: doc}
    });
})
  


//===========================
// UPDATE doc handler
//===========================
//For: Tour, User, Review
exports.updateOne = (Model) => asyncHandler(async(req,res,next)=>{

    //_____PUT VS PATCH_____
   //PATCH: replaces the fields that are different(modifies)
   //PUT: replaces the complete object(original Object)

   //Model.findByIdAndUpdate(req.params.id,req.body,{new:true, runValidators:true}) - find & update element by id
   const doc = await Model.findByIdAndUpdate(req.params.id, req.body ,{new:true, runValidators:true});

   //if doc is not found 
   if(!doc){
       //errorResponse
       return next(new errorResponse('No document found with that Id',404));
   }

   //Send Response - doc is updated
   res.status(200).json({
       status:'success',
       data:{data: doc}
   });
})



//===========================
// DELETE handler
//===========================
//For: Tours, User, Reviews
exports.deleteOne = (Model) => asyncHandler(async(req,res,next)=>{
    
    //Model.findByIdAndDelete - delete doc by id
    const doc = await Model.findByIdAndDelete(req.params.id);

    if(!doc){
        //errorResponse
        return next(new errorResponse('No document found with that Id',404));
    }

    //Send Resonse - doc id deleted
    res.status(204).json({
        status:'success',
        data:null //No data is send for delete request
    });
})