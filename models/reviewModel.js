const mongoose = require('mongoose');

//review, ratings, createdAt, tourId, userId
//Review Schema
const reviewSchema = new mongoose.Schema({
    //review
    review:{
        type:String,
        required:[true, 'Review cannot be empty']
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


//Review Model
const Review = mongoose.model('Review', reviewSchema);

//exporting Model
module.exports = Review;