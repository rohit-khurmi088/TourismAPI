const express = require('express');
const router = express.Router();

//Importing controllers from tourController (CRUD)
const {getAllTours, getTour, createTour, updateTour, deleteTour} = require('../controllers/tourController');


//-----CHAINING SIMILAR ROUTES-----

router.route('/')
.get(getAllTours)
.post(createTour)

router.route('/:id')
.get(getTour)
.patch(updateTour)
.delete(deleteTour)



module.exports = router;