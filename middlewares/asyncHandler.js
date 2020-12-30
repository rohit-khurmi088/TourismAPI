//----------ASYNC HANDLER-----------
/*DRY = Dont Repeat Yourself
One thing we can do to avoid repeating the try/catch code 
on each async middleware is write once in a high order function.*/

//async func returns Promises
//Promise.resolve() method returns a Promise object that is resolved with a given value.
//The catch() method returns a Promise and deals with rejected cases only.
//catch(err => next(err)) : same as writing catch(next)   

/* 
INSTED OF ->
  try{
      ...code
  }catch(err){
      ..error handling
  }
*/

//USE-> asyncHandler with async.. await...
const asyncHandler = fn =>{
    return (req,res,next)=>{
        fn(req,res,next).catch(next);
    }
}

module.exports = asyncHandler;