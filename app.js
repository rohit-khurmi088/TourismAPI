const express = require('express');
const dotenv = require('dotenv').config();
const colors = require('colors');

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
//morgan: logger->logs req. to console 
//use only in development mode
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}

//bodyParser
app.use(express.urlencoded({ extended: true })); //form Data (req.body)
app.use(express.json()); //Json Data

//Serving css/js/images-static files(assets) 
app.use(express.static(`${__dirname}/assets`)); //OR (./assets)

//==================
// ROUTES
//==================
const tourRoutes = require('./routes/tourRoutes');
app.use('/api/v1/tours', tourRoutes);

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