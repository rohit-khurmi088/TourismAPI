class APIFeatures{
    //filter(), sort(), limitFields(), pagiantion()

    //to use these functions in other models-
    //query = mongoose query => Model.find() :(NOT Directly available here)
    //querySting = express query => req.query:(NOT Directly available here)
    constructor(query,queryString){
        this.query = query,
        this.queryString = queryString 
    }

    //In filter(), sort(), limitFields(), pagiantion()
    //REPLACE req.query by this.queryString
    //REPLACE query by this.query



    //============================================
    //______________FILTER METHOD_________________
    //============================================
    filter(){
        //copy req.query to new object (to exclude special queries)
        //for manipulating queries
        const queryObj = {...this.queryString};
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

        //saving query to a query varibale so that later we can CHAIN ALL THE other METHODS TO THE query 
        //FINAL QUERY (Model.find() - get all elements)
        this.query = this.query.find(query_object);

        //return the entireObject
        return this;
    }
   


    //============================================
    //______________SORT METHOD___________________
    //============================================
    sort(){
        //______________
        //2) SORTING
        //______________
        //query.sort()
        //sort = excluded field (declared above)
        // EG: (sort by price {req.query.sort= price})
        // /api/v1/tours?sort=price,ratingsAverage(ASCENDING ratings(lowest 1st))
        // api/v1/tours?sort=price,-ratingsAverage (DECENDING ratings (highest 1st))
        
        //if there is a query to sort
        if(this.queryString.sort){
            //for results with same price ->sort by 2nd field- ratingsAverage
            //mongoDb: sort(price ratingsAverage)
            //req.query.sort : price,ratingsAverage
            //req.query.sort.split(',') : [ 'price','ratingsAverage' ] 
            //req.quer.sort.split(',').join(' ') : price ratingsAverage
            
            //console.log(req.query.sort.split(',').join(' '));
            const sortBy = this.queryString.sort.split(',').join(' ');

            //CHAINIGN sort method to query
            this.query = this.query.sort(sortBy);
        }else{
            //default sort
            this.query = this.query.sort('-createdAt'); //newest 1st(Decending)
        }

        //return the entireObject
        return this;
    }
   


    //============================================
    //______________Limit_Fields METHOD___________
    //============================================
    limitFields(){
        //_______________________
        //3) Limit Fields (SELECT)
        //_______________________
        // Limiting FIELDS to get back in response 
        //query.select()
        //fields = excluded field (declared above)
        //A client choose which field to get back in response (reduce bandwidth in case of heavy dataset)
        //EG: /api/v1/tours?fields=name,duration,difficulty,price
        
        if(this.queryString.fields){
            //mongoDb: select(name duration difficulty price)
            //const fields = req.query.fields.split(',').join(' '); :name,duration,difficulty,price
            //const fields = req.query.fields.split(',').join(' '); :[ 'name', 'duration', 'difficulty', 'price' ]
            //const fields = req.query.fields.split(',').join(' '); :name duration difficulty price  
            
            //console.log(req.query.sort.fields(',').join(' '));
            const projectedFields = this.queryString.fields.split(',').join(' ');
            
            //CHAINING select method to query
            this.query = this.query.select(projectedFields);
        }else{
            //default(-field => exclude field)
            this.query = this.query.select('-__v');    //__v: only used internally by mongoDb
        }

        //return the entireObject
        return this;
    }
   


    //============================================
    //______________PAGINATION METHOD_____________
    //============================================
    paginate(){
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

        const page = parseInt(this.queryString.page, 10) || 1;     //defaultPage=1
        const limit = parseInt(this.queryString.limit, 10) || 9;  //defaultLimit=9
        const skip = (page - 1) * limit;                  //startIndex
        
        //CHAINING method to query
        this.query = this.query.skip(skip).limit(limit);

        //return the entireObject
        return this;
    }
}

module.exports = APIFeatures;