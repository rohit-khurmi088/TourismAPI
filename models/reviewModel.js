const mongoose = require('mongoose');

const Tour = require('./tourModel');

//review, ratings, createdAt, tourId, userId
//Review Schema
const reviewSchema = new mongoose.Schema({
    //review
    review:{
        type:String,
        required:[true, 'Review cannot be empty'],
    },
    //ratings
    ratings:{
        type:Number,
        min:[2, 'Ratings cannot be less than 2'],
        max:[5 , 'Ratings cannot be more than 5'] 
    },
    //createdAt (automatic timestamp)
    createdAt:{
        type: Date,
        default: Date.now()
    },

    //TourId (ref)
    tour:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tour",
        requred: [true, "A Review must belong to a Tour."]
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        requred: [true, "A Review must belong to a User."]  
    },

},{
    //Defining Schema to get Virtual_Properties in output
    toJSON: {virtuals:true},
    toObject:{virtuals:true}
});

//---------------
//INDEXING 
//---------------
/* 1 user = 1 review on 1 tour
Each user should be able to write only single review on a given tour
-> use unique index 
but tour: unique , user:unique = wrong 
    - that would mean each user could write only 1 review
    - each tour could get 1 review
Here we need combination of tour + user -> unique (Compound Index)*/

//currently not working! check later...
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });


//_____________QUERY MIDDLEWARE_________________
//this = current query being executed
//Regular expression for all queries starting with find: /^find/

//-----------------------------------------------
// POPULATING Reviews(find) with tour,user(ref) data (pre-find-hooks)
//-----------------------------------------------
//using populate() -> creates a new query which might affect our application
//POPULATING tours - 'tour,user' data(as ref from tour,user model)
//select only certian fields to show using populate (- => exclude fields)
//select = tour name , user name,photo
reviewSchema.pre(/^find/, function(next){
    /*this.populate({
        path:'tour',
        select:'name'
    }).populate({
        path:'user',
        select: 'name photo'
    });*/

    //Tour data is already availabe in tours model & we connected reviews to tour using virtual Populate
    //here we populate only user data
    this.populate({
        path:'user',
        select: 'name photo'
    })

    next();
})
//-------------------------------------------------


//___________________________________________________________________________
// ** CALCULATING (ratingsQuantity, ratingsAverage) -> store on Tour Model **
//___________________________________________________________________________
//STORING a summary of related data set (calulated on 1 model - REVIEWS) -> main data set (another model -TOURS)
//STORE ratingsAverage, ratingsQuantity on each tour
//so that we dont have to query reviews & calculate average Each time we query tours

//CALCULATING ratingsQuantity & ratingsAverage on Review Model & passsing details to Tour Model
//-> instance methods - called on schema (this = current schema)
//-> statics methods - called on model directly + schema (this = current model)
// aggregate methods -> called on Model => use static methods to calculate RatingsAverage, ratingsQuantity

//DECLARING calcAverageRatings(tourId) - static method
reviewSchema.statics.calcAverageRatings = async function(tourId){

    //tourId - availabe on review model using ref
    //this = current Model = Review 
    console.log(tourId); //this.tour(declared above)
    
    //1) Aggregation Pipelines - calculating avgRatings, ratingsQuantity
    const stats = await this.aggregate([
        //find tour by tourId
        {$match :{tour: tourId }},             
        //group reviews by tours
        {$group: {
            _id:'$tour',                          
            nRatings:{$sum:1},                     //number of tours (stats[0].nRatings)
            avgRatings:{$avg:'$ratings'}          //calculating average (stats[0].avgRatings)
        }}
    ]);
    //console.log(stats);
    
   //2) UPDATING computed stats -> TOUR Model
    if(stats.length > 0){
        //Computed Values
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRatings,
            ratingsAverage: stats[0].avgRatings
        });
    }else{
        //Default Values
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0, //default no.of.ratings
            ratingsAverage: 4.5 //default avg.ratings
        });
    }   
};

//All REVIEWS status calculations - handled in POST middleware

// --------- CREATE REVIEW STATS ---------
//POST-SAVE-MIDDLEWARE { works only on create() review }
//USING calcAverageRatings(tourId) - static method on MODEL
reviewSchema.post('save',function(){
    //here this = current document 
    // this.constructor = current Model
    //fucntion call
    this.constructor.calcAverageRatings(this.tour);
});

//--------- UPDATE/DELETE  REVIEW STATS ---------
//review updated: findByIdAndUpdate
//review deleted: findByIdAndDelete
//regualr expression: /^findOneAnd/
//PRE-FIND-MIDDLEWARE { works only when Review is updated() OR deleted()}
reviewSchema.pre(/^findOneAnd/, async function(next){
    //this = current query
    //we want to get access to current Review

    //execute the query to get the current document being processed ('r' say)
    //current review updated/deleted
    //pass this.r from PRE ->  POST find middleware to access method on Model 
    //we need to access the document so use findOne() on query -> gets document form db
    this.r = await this.findOne(); //gives Document
    //console.log(this.r); 

    next();
});

//POST-FIND-MIDDLEWARE { works only when Review is updated() OR deleted()}
reviewSchema.post(/^findOneAnd/, async function(){
    // await this.findOne(); does NOT work here, query has already executed
    //so we need to pass the query from pre middleware to post middleware - to get tourId (DocumentId)
    //here this.r = this (similar to above - create review stats)
    await this.r.constructor.calcAverageRatings(this.r.tour);
});
//______________________________________________________________________________________________________

//Review Model
const Review = mongoose.model('Review', reviewSchema);

//exporting Model
module.exports = Review;