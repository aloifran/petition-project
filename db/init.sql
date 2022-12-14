-- USE THIS FILE ONLY TO RECREATE DB

DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS signatures;

CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    firstname VARCHAR(255) NOT NULL,
    lastname VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 );

CREATE TABLE signatures (
    id SERIAL primary key,
    user_id INTEGER NOT NULL REFERENCES users(id),
    signature VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT current_timestamp
);