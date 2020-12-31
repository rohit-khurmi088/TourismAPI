const express = require('express');
const router = express.Router();

//Importing Middleware from tourController Top
const {aliasTopTours} = require('../controllers/tourController');

//Importing controllers from tourController (CRUD)
const {getAllTours, getTour, createTour, updateTour, deleteTour} = require('../controllers/tourController');



//Get Top-5-Cheap-Tours
router.route('/top-5-cheap').get(aliasTopTours, getAllTours); //CHAINING Middleware


//-----CHAINING SIMILAR ROUTES (CRUD)-----

router.route('/')
.get(getAllTours)
.post(createTour)

router.route('/:id')
.get(getTour)
.patch(updateTour)
.delete(deleteTour)



module.exports = router;