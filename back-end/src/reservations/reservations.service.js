// knex is a SQL query builder used to interact with the database
const knex = require("../db/connection");

/**
 * list - returns a list of all reservations for a specified date
 *
 * @param {date} date - The date for which the reservations are being retrieved
 * @returns {Array} An array of objects representing the reservations
 */
function list(date) {
    return knex("reservations")
        .select("*")
        .where({ reservation_date: date })
        .orderBy("reservation_time");
}

/**
 * create - creates a new reservation in the database
 *
 * @param {Object} reservation - The reservation to be created
 * @returns {Object} The created reservation
 */
function create(reservation) {
    return knex("reservations")
        .insert(reservation)
        .returning("*")
        .then((newReservation) => newReservation[0]);
}

/**
 * read - returns a single reservation based on its ID
 *
 * @param {Number} reservationId - The ID of the reservation being retrieved
 * @returns {Object} The reservation being retrieved
 */
function read(reservationId) {
    return knex("reservations")
        .select("*")
        .where({ reservation_id: reservationId })
        .first();
}

module.exports = {
    list,
    create,
    read,
};
