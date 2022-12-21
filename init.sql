-- USE THIS FILE ONLY TO RECREATE DB
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS signatures;
DROP TABLE IF EXISTS user_profiles;

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
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
    signature VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT current_timestamp
);

CREATE TABLE user_profiles (
    id SERIAL primary key,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
    city VARCHAR(255),
    age VARCHAR(255),
    homepage VARCHAR(255),
    created_at TIMESTAMP DEFAULT current_timestamp
);