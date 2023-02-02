const service = require("./reservations.service");
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");
const hasProperties = require("../utils/hasProperties");
const hasRequiredProperties = hasProperties("first_name", "last_name", "mobile_number", "reservation_date", "reservation_time", "people");
const validateTypes = require("../utils/validateReservation");
const validateInputTypes = validateTypes();

function formatDate(req, res, next) {
  const TodayDate = new Date(Date.now());
  const year = TodayDate.getFullYear();
  const month = TodayDate.getMonth() + 1;
  const day = TodayDate.getDate();
  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate
}

async function searchPhoneNum(req, res, next) {
  const { mobile_number } = req.query; //searches for a reservation based on the mobile_number query parameter in the request

  if(mobile_number){
    const listing = await service.search(mobile_number);
    res.status(200).json({ data: listing })// If the mobile_number is present, it calls the search method of the service module to retrieve the reservation and returns it as a JSON response with a status of 200.
  } else {
    next();// If the mobile_number is not present, it calls the next function to proceed to the next middleware.
  }
}

async function list(req, res, _next) {
  let { date }  = req.query;//It lists all reservations based on a date query parameter in the request.
  if(!date){
    date = formatDate()
  }// If the date parameter is not present, it calls formatDate to get the current date, then it calls the list method of the service module to retrieve the reservations

  const listing = await service.list(date)
  let filtered = listing.filter((eachRes) => 
    eachRes.status !== 'finished'
  )// It filters the reservations to exclude those with a status of 'finished' and returns the filtered list as a JSON response.
  res.json({ data: filtered})
}

async function create(req, res, _next) {
  const data = await service.create(req.body.data);
  res.status(201).json({ data });// It creates a new reservation by calling the create method of the service module with the data from the request body and returns the newly created reservation as a JSON response with a status of 201.
}

async function reservationExists(req, res, next){
  const { reservation_id } = req.params;//This middleware checks if the reservation with the 
  //reservation_id specified in the request params exists
  const foundReservation = await service.read(reservation_id);
  if(!foundReservation){
    return next({ status:404, message:`Reservation with id ${reservation_id} not found`})
  }//calls the next function with an error object that has a status of 404 and a message indicating that the reservation was not found
  res.locals.foundReservation = foundReservation;
  next();// If it does exist, it saves it to res.locals.foundReservation and calls the next function to proceed to the next middleware.
}

async function read(req, res, next) {
  const { reservation_id } = req.params;
  const foundReservation = await service.read(reservation_id);
  res.json({ data: foundReservation });// It reads a reservation by calling the read method of the service module with the reservation_id specified in the request params. It returns the reservation as a JSON response.
}

// validateStatusChange is a middleware function that checks if the status change requested by the user is valid.
function validateStatusChange(req, res, next) {
  // Get the current status of the reservation
  const resStatus = res.locals.foundReservation.status;
  // Get the status the user wants to update to
  const updateStatus = req.body.data.status;

  // If the current status of the reservation is 'finished', return an error with a message.
  if(resStatus == 'finished'){
    next({ status: 400, message:`${res.locals.foundReservation.reservation_id} has status: ${resStatus}`})
  }
  // If the status the user wants to update to is 'unknown', return an error with a message.
  if(updateStatus == 'unknown') {
    next({ status: 400, message: `Cannot enter a status of ${updateStatus}`})
  }
  // If the status change is valid, call the next middleware.
  next();
}


async function update(req, res, next) {
  // Create a new object with the updated status
  const updatedRes = {
    ...res.locals.foundReservation,
    status: req.body.data.status,
  }
  // Call the service's update function to save the updated reservation
  const updated = await service.update(updatedRes);
  // Return a success response with the updated reservation data
  res.status(200).json({ data: updated })
}


module.exports = {
  list: [asyncErrorBoundary(searchPhoneNum), asyncErrorBoundary(list)],
  create: [hasRequiredProperties, validateInputTypes, asyncErrorBoundary(create)],
  read: [asyncErrorBoundary(reservationExists), asyncErrorBoundary(read)],
  update: [asyncErrorBoundary(reservationExists), validateStatusChange, asyncErrorBoundary(update)]
};