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
        .query(
            `SELECT * FROM signatures WHERE signature != '' ORDER BY id DESC;`
        )
        .then((data) => data.rows)
        .catch((err) => console.log(console.log("Query error:", err)));
}

function getLastSignatureId() {
    return db
        .query(`SELECT id FROM signatures ORDER BY id DESC LIMIT 1;`)
        .then((data) => data.rows[0].id)
        .catch((err) => console.log(console.log("Query error:", err)));
}

function getUserSignature(userId) {
    return db
        .query(`SELECT * FROM signatures WHERE user_id=$1;`, [userId])
        .then((data) => data.rows[0])
        .catch((err) => console.log(console.log("Query error:", err)));
}

function removeUserSignature(userId) {
    return db
        .query(`DELETE FROM signatures WHERE user_id=$1;`, [userId])
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
        .query(`SELECT * FROM users WHERE email=$1;`, [email])
        .then((data) => data.rows[0])
        .catch((err) => console.log(console.log("Query error:", err)));
}

// except the password
function updateUser(firstName, lastName, email, userId) {
    return db
        .query(
            `UPDATE users SET firstname=$1, lastname=$2, email=$3 WHERE id=$4;`,
            [firstName, lastName, email, userId]
        )
        .catch((err) => console.log(console.log("Query error:", err)));
}

function updateUserPass(hash, userId) {
    return db
        .query(`UPDATE users SET password=$1 WHERE id=$2;`, [hash, userId])
        .catch((err) => console.log(console.log("Query error:", err)));
}

function getUserData(id) {
    return db
        .query(
            `SELECT firstname, lastname, email, password, city, age, homepage
            FROM users
            JOIN user_profiles ON users.id = user_profiles.user_id
            WHERE users.id=$1;`,
            [id]
        )
        .then((data) => data.rows[0])
        .catch((err) => console.log(console.log("Query error:", err)));
}

// USER PROFILES ---------------------------------

function addUserProfile(userId, city, age, homepage) {
    return db
        .query(
            `INSERT INTO user_profiles (user_id, city, age, homepage) VALUES ($1, $2, $3, $4);`,
            [userId, city, age, homepage]
        )
        .catch((err) => console.log(console.log("Query error:", err)));
}

function updateUserProfile(city, age, homepage, userId) {
    return db
        .query(
            `UPDATE user_profiles SET city=$1, age=$2, homepage=$3 WHERE user_id=$4;`,
            [city, age, homepage, userId]
        )
        .catch((err) => console.log(console.log("Query error:", err)));
}

// SIGNERS  ------------------------------------

function getSignersData() {
    return db
        .query(
            `SELECT firstname, lastname, age, city, homepage, signatures.created_at as signed_at
            FROM users
            JOIN user_profiles ON users.id = user_profiles.user_id
            JOIN signatures ON users.id = signatures.user_id
            WHERE signatures.signature != ''
            ORDER BY users.id DESC;`
        )
        .then((data) => data.rows)
        .catch((err) => console.log(console.log("Query error:", err)));
}

module.exports = {
    addUser,
    addUserProfile,
    addSignature,
    getAllSignatures,
    getLastSignatureId,
    getUserSignature,
    removeUserSignature,
    getSignersData,
    getLastUserId,
    getUserByEmail,
    getUserData,
    updateUser,
    updateUserProfile,
    updateUserPass,
};
