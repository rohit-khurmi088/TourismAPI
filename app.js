const express = require('express');
const dotenv = require('dotenv').config();
const colors = require('colors');

//--------- SECURITY CONSIDERATIONS ------------
const rateLimit = require('express-rate-limit');             //request rate limiter
const helmet = require('helmet');                           //SET Security HTTP HEADERS 
const mongoSanitize = require('express-mongo-sanitize');   //Data Sanitization agains NoSQL query Injection
const xss = require('xss-clean');                         // Data Sanitization against XSS 
const hpp = require('hpp');                              // HTTP parameter Pollution
//------------------------------------------------

const morgan = require('morgan');

//ExpressBoilerPlate for GET,Post etc..
const app = express();

//====================
// FILE IMPORTS
//====================
//ERROR HANDLING MIDDLEWARE
const errorResponse = require('./middlewares/errorHandler/error'); //errorResponse class
const errorHandler = require('./middlewares/errorHandler/errorHandler'); //errorHandler middleware

//==================
// MIDDLEWARES
//==================
/*Note: if we dont call next() -> req,res cycle will get strucked in the middleware & will not move to the next function */
//_______________________________
//   helmet() Middleware
//________________________________
//SET Security HTTP HEADERS 
//put at the top of all middlewares
app.use(helmet());

//----- Morgan Middleware -----
//morgan: logger->logs req. to console 
//use only in development mode
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}

//____________________________
// RATE LIMITER (for '/api')
//____________________________
//request rate limiter (put before bodyParser)
//(for all routes startting with ('/api))
const limiter = rateLimit({
    max: 200,                //req. limits
    windowMs: 60 * 60 * 1000, //1hr(in millisec)
    message: 'Too many request from this IP, Please try again in an hour'
});
app.use('/api', limiter);

//----- bodyParser -----
app.use(express.urlencoded({ extended: true })); //form Data (req.body)

//*limit data from req.body to upto 10kb;*
app.use(express.json({limit:'10kb'})); //Json Data 

//_______________________________
//   DATA Sanitize
//________________________________
//1)Data Sanitization against NoSQL query Injection
//filters out $ sign, mongoDb operators from req.body
app.use(mongoSanitize()); 

//2)Data Sanitization against XSS
//prevents from adding html code in req.body -> converts html symbol to html entity
app.use(xss());          

//_________________________________________
// PREVENTING HTTP parameter Pollution(hpp) 
//_________________________________________
//Eg:/api/v1/tours?sort=price&sort=duration=5&duration=7
//whitelist = array of properties for which we allow duplicates in the query
app.use(hpp({
    whitelist:[
        'duration',
        'ratingsQuantity',
        'ratingsAverage',
        'maxGroupSize',
        'difficulty',
        'price'
    ]
}));

//----- STATIC FILES -----
//Serving css/js/images-static files(assets) 
app.use(express.static(`${__dirname}/assets`)); //OR (./assets)

//-----test DATA middleware----- 
app.use((req,res,next)=>{
    req.requestTime = new Date().toISOString();
    //console.log(req.headers);
    next();
})

//==================
// ROUTES
//==================
const tourRoutes = require('./routes/tourRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/v1/tours', tourRoutes); //tourRoutes
app.use('/api/v1/users', userRoutes); //userRoutes


//ERROR 404! PAGE NOT FOUND
//Handle all the HTTP Methods
//Error Handler 404!
app.all('*', (req,res,next)=>{

    /*res.status(404).json({
        status:'fail',
        message: `Error 404! Can't find ${req.originalUrl} on this server!`
    })*/

    //Creating err
    /*const err = new Error(`Error 404! Can't find ${req.originalUrl} on this server!`);
    err.status = 'fail';
    err.statusCode = 404;
    //passing err to errMiddleware
    next(err);*/

    //Using errorResponse class for sending errors
    next(new errorResponse(`Error 404! Can't find ${req.originalUrl} on this server!`, 404));
});


//Global Error Handler
app.use(errorHandler);


module.exports = app;