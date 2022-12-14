require("dotenv").config();
const { USER, PASS } = process.env;
const pg = require("spiced-pg");
const db = pg(`postgres:${USER}:${PASS}@localhost:5432/petition`);

// query is a promise, return it, so it can be chained with then()

// SIGNATURES -------------------------------------

function addSignature(userId, signature) {
    return db
        .query(`INSERT INTO signatures (user_id, signature) VALUES ($1, $2);`, [
            userId,
            signature,
        ])
        .catch((err) => console.log(console.log("Query error:", err)));
}

function getAllSignatures() {
    return db
        .query(`SELECT * FROM signatures ORDER BY id DESC;`)
        .then((data) => data.rows)
        .catch((err) => console.log(console.log("Query error:", err)));
}

function getLastSignatureId() {
    return db
        .query(`SELECT id FROM signatures ORDER BY id DESC LIMIT 1;`)
        .then((data) => data.rows[0].id)
        .catch((err) => console.log(console.log("Query error:", err)));
}

function getSignatureByUserId(userId) {
    return db
        .query(`SELECT * FROM signatures WHERE user_id=$1`, [userId])
        .then((data) => data.rows[0])
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

function getLastUserId() {
    return db
        .query(`SELECT id FROM users ORDER BY id DESC LIMIT 1;`)
        .then((data) => data.rows[0].id)
        .catch((err) => console.log(console.log("Query error:", err)));
}

function getUserByEmail(email) {
    return db
        .query(`SELECT * FROM users WHERE email=$1`, [email])
        .then((data) => data.rows[0])
        .catch((err) => console.log(console.log("Query error:", err)));
}

module.exports = {
    addSignature,
    getAllSignatures,
    getLastSignatureId,
    getSignatureByUserId,
    addUser,
    getLastUserId,
    getUserByEmail,
};
