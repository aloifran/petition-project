require("dotenv").config();
const { USER, PASS } = process.env;
const pg = require("spiced-pg");
const db = pg(`postgres:${USER}:${PASS}@localhost:5432/petition`);

// SIGNATURES -------------------------------------

// query is a promise, return it, so it can be chained with then() in the server
function getAllSignatures() {
    return db
        .query(`SELECT * FROM signatures ORDER BY id DESC;`)
        .then((data) => data.rows)
        .catch((err) => console.log(console.log("Query error:", err)));
}

function getLastSignatureId() {
    return db
        .query(`SELECT id FROM signatures ORDER BY id DESC LIMIT 1`)
        .then((data) => data.rows[0].id)
        .catch((err) => console.log(console.log("Query error:", err)));
}

function getSignatureById(id) {
    return db
        .query(`SELECT signature FROM signatures where id=$1`, [id])
        .then((data) => data.rows[0].signature)
        .catch((err) => console.log(console.log("Query error:", err)));
}

function addSignature(firstName, lastName, signature) {
    return db
        .query(
            `INSERT INTO signatures (firstname, lastname, signature) VALUES ($1, $2, $3);`,
            [firstName, lastName, signature]
        )
        .catch((err) => console.log(console.log("Query error:", err)));
}

// USERS -------------------------------------

function addUser(firstName, lastName, email, password) {
    return db
        .query(
            `INSERT INTO users (firstname, lastname, email, password) VALUES ($1, $2, $3, $4);`,
            [firstName, lastName, email, password]
        )
        .catch((err) => console.log(console.log("Query error:", err)));
}

module.exports = {
    getAllSignatures,
    addSignature,
    getLastSignatureId,
    getSignatureById,
    addUser,
};
