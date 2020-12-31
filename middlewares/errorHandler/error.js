//Class for Operational Errors -> send error message in Production_Mode
class errorResponse extends Error{
    constructor(message,statusCode){
        
        //MESSAGE
        //calling parent class constructor
        super(message);  
        //STATUSCODE
        this.statusCode = statusCode; 
        //STATUS
        //if statusCode = 404 -> status = fail
        //if statusCode = 500 -> status = error
        this.status = `${this.statusCode}`.startsWith('4')? 'fail': 'error';

        //Operational errors
        //check Operation Property to send error message in Production_Mode
        this.isOperational = true;

        //Avoid these errors from appearing in the err.stack
        Error.captureStackTrace(this, this.constructor);

    }
}

module.exports = errorResponse;