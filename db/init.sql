DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures (
    id SERIAL primary key,
    firstname VARCHAR(255) NOT NULL,
    lastname VARCHAR(255) NOT NULL,
    signature VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT current_timestamp
);