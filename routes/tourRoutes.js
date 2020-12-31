const express = require('express');
const router = express.Router();

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
.get(getAllTours)
.post(createTour)

router.route('/:id')
.get(getTour)
.patch(updateTour)
.delete(deleteTour)



module.exports = router;