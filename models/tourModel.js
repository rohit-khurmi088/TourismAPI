const mongoose = require('mongoose'); 

//SLUG -3rd party package(slugify)
const slugify = require('slugify');

//validators
const validator = require('validator');

//TourSchema - where we model our data by desctibing the structue of data, default values & validation
/* name,duration,maxGroupSize,difficulty, ratingsAverage,ratingsQuantity price, priceDiscount, summary,description, imageCover, images, createdAt, startDates */
const tourSchema = new mongoose.Schema({
    //name & slug
    name:{
        type:String,
        required:[true, 'A Tour must have a name'],
        unique:true,
        trim:true, //removes whitespaces from start & end of string 
        maxlength:[40, 'A Tour name must have less or equal then 40 characters'],
        minlength:[10, 'A Tour name must have more or equal then 10 characters'],
    },
    //Slug(url friendly version of name)
    slug:String,

    //duration & maxGroupSize
    duration:{
        type:Number,
        required:[true, 'A Tour must have a duration']
    },
    maxGroupSize:{
        type:Number,
        required:[true, 'A Tour must have a group Size']
    },

    //difficulity(easy,medium,difficult)
    difficulty:{
        type:String,
        required:[true, 'A Tour must have a difficulity'],
        enum: {
            values: ['easy', 'medium', 'difficult'], //values to select
            message: 'Difficulty is either: easy, medium or difficult'
        }
    },

    //ratings: not added by the user who creates tour
    ratingsAverage:{
        type:Number,
        default:4.5,
        min:[1, 'Ratings must be above 1.0'],
        max:[5, 'Ratings must be below 5.0']
    },
    ratingsQuantity:{
        type:Number,
        default:0
    },

    //Price & Discount
    price:{
        type:Number,
        required:[true, 'A Tour must have a price']
    },
    //optional discount
    priceDiscount: {
        type: Number,
        //custom validator(Check if discount<price?)
        validate: {
            validator: function(val){
                //this here points to the current doc - at the time of creation
                return val < this.price;
            },
            message: 'Discount price ({VALUE}) should be below regular price'
        }
    },
    
    //sumary(front) & description
    summary:{
        type:String,
        trim:true, //removes whitespaces from start & end of string,
        required:[true,'A Tour must have a summary']
    },
    description:{
        type:String,
        trim:true //removes whitespaces from start & end of string
    },
    
    //imageCover(FrontPage) & images
    imageCover:{
        type:String, //image name saved in database
        required:[true,'A Tour must have a cover image']
    },
    images: [String], //Array of strings
    
    //CreatedAt(automatic timestamp)
    createdAt:{
        type: Date,
        default: Date.now() 
    },

    //startDates
    startDates:[Date], //Array of dates

    //SECRET TOURS (special_Tour_package)
    secretTour:{
        type:Boolean,
        default:false
    },

    //Start_Location & locations[]
    //LOCATION(mongoose)-(GEOJSON data)
    //startLocation
    startLocation:{
        type:{
            type:String,
            default:'Point',
            enum: ['Point'],   //'location.type' must be 'Point
        },
        //coordinates: [longitude,latitude] 
        coordinates: [Number],
        address:String,
        description:String
    },
    //other tour Locations[]
    locations:[{
        type:{
            type:String,
            default:'Point',
            enum: ['Point'],   //'location.type' must be 'Point
        },
        //coordinates: [longitude,latitude] 
        coordinates: [Number],
        address:String,
        description:String,
        day: Number
    }],

    //guides
    //(user(role) = guide => ref from user model)
    guides:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:"User" //user model
        }
    ]

},{
    //Defining Schema to get Virtual_Properties in output
    toJSON: {virtuals:true},
    toObject:{virtuals:true}
});


//====================
//virtual Property
//====================
//NOT SAVED IN Database
//converting days -> weeks (duration)
tourSchema.virtual('durationWeeks').get(function(){
    return this.duration / 7;
});


//========================================
// ** virtual POPULATE (reviews on tour)**
//========================================
//Keeping a reference of all child documents -> parent document without persisting that data to the database
//if we keep array of review id on tours - infinite long array + manual query teviews
//-> To access all the reviews under the given tour
//-> WITHOUT keeping arrays of reviews id on tours: use virtual properties

//Tour Id in Review model = tour
//(NOTE: _id in localModel = tour in foreignModel )
tourSchema.virtual('reviews',{
    ref: 'Review',          //reviewModel
    foreignField: 'tour',  //name of the field in the other model(Review) where the ref to current model(Tour) in stored
    localField: '_id'     //where the id is actually store in the current model
});


//==============================================
//Mongoose MIDDLEWARES (hooks)
//==============================================
//_____________DOCUMENT MIDDLEWARE______________
//this = current docs being processed (saved)

//pre-save-hooks (Adding slug)
tourSchema.pre('save', function(next){
    this.slug = slugify(this.name, {lower:true});
    next();
});

//post-save-hook
/*tourSchema.post('save', function(doc,next){
	//console.log(post-save-hooks);
	console.log(doc);
	next();
});*/

//_____________QUERY MIDDLEWARE_________________
//this = current query being executed
//Regular expression for all queries starting with find: /^find/

//______________________________________________
//RELATING TOURS(model) with REVIEWS (model)
//-----------------------------------------------
// POPULATING tours(find) with guides(ref) data (pre-find-hooks)
//-----------------------------------------------
//using populate() -> creates a new query which might affect our application
//POPULATING tours - 'guides' data(as ref from user model)
//select only certian fields to show using populate (- => exclude fields)
tourSchema.pre(/^find/, function(next){
    this.populate({
        path:'guides',  //ref data
        select:'-__v -passwordChangedAt -password' //excluded fields
    });
    next();
})
//-------------------------------------------------

//pre-find-hook(find all documents where SecretTours!=true)
tourSchema.pre(/^find/, function(next){
    this.find({ secretTour:{ $ne: true} });

    //queryStartTime
    this.start = Date.now();

    next();
});

//post-find-hook (calculate query execution time)
tourSchema.post(/^find/, function(docs, next){
    //query ExcutionTime =  queryEndTime - queryStartTime
    console.log(`Query took ${Date.now() - this.start} milliseconds!`);

    //console.log(docs);
    next();
});

//__________AGGREGATION MIDDLEWARE_______________
//this = current aggregation

//Exclude SECRET TOURS from the aggregation Pipeline
tourSchema.pre('aggregate', function(next){

    //console.log(this); //Agregate{}
    //console.log(this.pipeline); //Aggreage Pipeline Object
    
    //unshift(): add an element at the beginning of the array
    this.pipeline().unshift({$match:{secretTour:{$ne:true}}});

    next();
})

//==============================================

//Tour Model(blueprint/wrapper of Schema) -providing interface for CRUD operations
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;