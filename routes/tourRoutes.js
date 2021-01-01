const express = require('express');
const router = express.Router();

//____________ AUTH middleware ______________________
const {checkAuthenticatedUser, restrictTo} = require('../controllers/authController');


//_______ Tour controllers _____________________
//Importing SpecaialRoutes(Aggregation) form tourController
const {getTourStats,getMonthlyPlan} = require('../controllers/tourController');

//Importing Middleware from tourController (Top-5-Tours)
const {aliasTopTours} = require('../controllers/tourController');

//Importing controllers from tourController (CRUD)
const {getAllTours, getTour, createTour, updateTour, deleteTour} = require('../controllers/tourController');


//---------------(Aggregation)------------------
//Get Tour Stats 
router.route('/tour-stats').get(getTourStats);

//GET Monthly Plan (by year) 
router.route('/monthly-plan/:year').get(getMonthlyPlan);
//------------------------------------------------

//Get Top-5-Cheap-Tours (query)
router.route('/top-5-cheap').get(aliasTopTours, getAllTours); //CHAINING Middleware

//------------------------------------------------
//-----CHAINING SIMILAR ROUTES (CRUD)-----

router.route('/')
.get(checkAuthenticatedUser,getAllTours) //only authenticated user => grant access
.post(createTour)

router.route('/:id')
.get(getTour)
.patch(updateTour)
.delete(checkAuthenticatedUser, restrictTo('admin', 'lead-guide'), deleteTour)  //authenticated + based on role['admin','lead-guide']



module.exports = router;