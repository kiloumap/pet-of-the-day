CREATE TABLE users
(
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100)        NOT NULL,
    nickname      VARCHAR(50) UNIQUE  NOT NULL,
    email         VARCHAR(254) UNIQUE NOT NULL,
    password_hash VARCHAR(255)        NOT NULL,
    birth_date    DATE                NOT NULL,
    city          VARCHAR(100),
    country       VARCHAR(100),
    postal_code   VARCHAR(20),
    created_at    TIMESTAMP DEFAULT NOW(),
    updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE groups
(
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    owner_id   INT REFERENCES users (id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE pets
(
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    age        INT          NOT NULL,
    birth_date DATE         NOT NULL,
    species    VARCHAR(50)  NOT NULL,
    group_id   INT REFERENCES groups (id),
    base_score INT          NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
