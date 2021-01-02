//==================================
// GLOBAL ERROR Handler middleware
//=================================
// https://expressjs.com/en/guide/error-handling.html
/* Http statusCodes
500 = Internal Server Error 
400 = bad request, 404 = not found, 401 = Unauthorized, 403 = forbidden, 429 = tooMany requests
200 = success, 201 = created 204 = deleted */

//Error Response class
const errorResponse = require('./error');

//=====================
//  ERROR HANDLER 
//=====================
const errorHandler = (err, req,res,next)=>{
    //console.log(err.stack);

    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'Server Error';

    //___________________
    // PRODUCTION MODE
    //___________________
    if(process.env.NODE_ENV === 'production'){
        //copy of err for each error type + assign properties(message) of err in it
        let error = { ...err };
        error.message = err.message;
        
        console.log(err.message);
        //console.log(err.name); -> Error Name
        //console.log(err.value); -> req.params.id
        
        //-----------------
        // MONGOOSE ERRORS
        //-----------------
        //_______Mongoose Bad_Request_Id ERROR______
        if(err.name === 'CastError'){
            const message = `Invalid ${err.path}: ${err.value}`;
            error = new errorResponse(message, 400);
        }
        
        //______Mongoose Duplicate_Key_ERROR_______
        if(err.code === 11000){
            //Regular expression to find text between quotes : /(["'])(\\?.)*?\1/
            //match regular exp. with errmsg field
            const value = err.errmsg.match(/(["'])(\\?.)*?\1/);
            //console.log(value); //gives an array
            const val = value[0]
            //console.log(val); //give the required value
       
            const message = `Duplicate field value: ${val}. Please use another value!`;
            error = new errorResponse(message, 400);
        }
   
        //______Mongoose Validataion_ERROR_______   
        if(err.name === 'ValidationError'){
            //extract messages for different validations into single array
            //object.values - to extract object values
            const errors = Object.values(err.errors).map(el => el.message);

            const message = `Invalid input data. ${errors.join('.')}`;
            error = new errorResponse(message, 400)
        }
       
        //-----------------
        // JWT ERRORS
        //-----------------
        //______JWT INVALID SIGNATURE_ERROR_______ 
        //USER tries to access application with invalid token
        if(err.name === 'JsonWebTokenError'){
            const message = 'Invalid token.Please log in again!'
            error = new errorResponse(message, 401);

        } 
        //______JWT EXPIRED TOKEN_ERROR_______ 
        if(err.name === 'TokenExpiredError'){
            const message = 'Your token has expired. Please login again';
            error = new errorResponse(message, 401);
        }


        //SENDING ERROR RESPONSE
        res.status(error.statusCode).json({
            status: error.status,
            //error: error || 'Server Error',
            message: error.message,
        });
    }



    //___________________
    // DEVELOPMENT MODE
    //___________________
    if(process.env.NODE_ENV === 'development'){

        console.log(err.message);

        //SENDING ERROR RESPONSE
        res.status(err.statusCode).json({
            status: err.status,
            error: err || 'Server Error',
            message: err.message,
            stack: err.stack
        }); 
    }
    
  
}

module.exports = errorHandler;

