const express = require('express');
const router = express.Router();

//____________ AUTH middleware ______________________
const {checkAuthenticatedUser, restrictTo} = require('../controllers/authController');

//_______ Tour controllers _____________________
//Importing SpecaialRoutes(Aggregation) form tourController
const {getTourStats,getMonthlyPlan} = require('../controllers/tourController');

//Importing Middleware from tourController (Top-5-Tours)
const {aliasTopTours} = require('../controllers/tourController');

//Importing GeoSpatial controller form tourController
const {getToursWithin,getDistances} = require('../controllers/tourController');

//Importing controllers from tourController (CRUD)
const {getAllTours, getTour, createTour, updateTour, deleteTour} = require('../controllers/tourController');


//________ REVIEW ROUTES _______________________
const reviewRoutes = require('./reviewRoutes');
//==============================================
// REVIEW ROUTES (NESTED ROUTES tour -> review)
//===============================================
// api/v1/tours/:id/reviews - getAll, create
// api/v1/tours/:id/reviews/:id - get, update, delete
router.use('/:tourId/reviews', reviewRoutes);



//======================
// TOUR ROUTES
//======================
//api/v1/tours - getAll, create
//api/v1/tours/:id/ - get, update, delete

//---------------(Aggregation)------------------
//Get Tour Stats 
router.route('/tour-stats').get(getTourStats);

//GET Monthly Plan (by year) 
router.route('/monthly-plan/:year').get(checkAuthenticatedUser, restrictTo('admin', 'lead-guide', 'guide'),getMonthlyPlan); //only access by guide,lead-guide,admin
//------------------------------------------------

//Get Top-5-Cheap-Tours (query)
router.route('/top-5-cheap').get(aliasTopTours, getAllTours); //CHAINING Middleware

//------------------------------------------------


//------------------ GEOSPATIAL Query Routes --------------------------------------------
//=======================================================
// Show Tours within certain distance (GEOSPATIAL QUERY)
//=======================================================
//GEO_SPATIAL QUERY WITHIN RADIUS
//Eg: /tours-within/221/center/34.149781105328685, -118.10402585535664/unit/mi (mi = miles)
router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(getToursWithin);

//==========================================================================================
// Calculate Distances to all the tours from a certain point (GEOSPATIAL Aggregation QUERY)
//==========================================================================================
router.route('/distances/:latlng/unit/:unit').get(getDistances);


//-----------------------------------------------------------------------------------------
//-----CHAINING SIMILAR ROUTES (CRUD)-----

router.route('/')
.get(getAllTours)
.post(checkAuthenticatedUser, restrictTo('admin','lead-guide'), createTour) //only admin + lead-guide (authenticated) - create Tour

router.route('/:id')
.get(getTour)
.patch(checkAuthenticatedUser, restrictTo('admin', 'lead-guide'), updateTour)   //only admin + lead-guide (authenticated) - update Tour
.delete(checkAuthenticatedUser, restrictTo('admin', 'lead-guide'), deleteTour) //only admin + lead-guide (authenticated) - delete Tour


module.exports = router;