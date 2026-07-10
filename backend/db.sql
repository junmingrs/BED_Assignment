USE bed_db;
GO

DROP TABLE IF EXISTS MenuItemCuisine;
DROP TABLE IF EXISTS MenuItem;
DROP TABLE IF EXISTS Cuisine;
DROP TABLE IF EXISTS Stall;
DROP TABLE IF EXISTS Customer;
DROP TABLE IF EXISTS Vendor;
DROP TABLE IF EXISTS Operator;
DROP TABLE IF EXISTS NEA;
DROP TABLE IF EXISTS Account;

CREATE TABLE Account
(
    account_id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    account_email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('Customer', 'Vendor', 'Operator')),
);

CREATE TABLE Customer
(
    account_id UNIQUEIDENTIFIER PRIMARY KEY
        REFERENCES Account(account_id),

    customer_name VARCHAR(255) NOT NULL
);

CREATE TABLE Vendor
(
    account_id UNIQUEIDENTIFIER PRIMARY KEY
        REFERENCES Account(account_id)
);

CREATE TABLE Operator
(
    account_id UNIQUEIDENTIFIER PRIMARY KEY
        REFERENCES Account(account_id)
);

CREATE TABLE Stall
(
    stall_id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,

    vendor_id UNIQUEIDENTIFIER NOT NULL
        REFERENCES Vendor(account_id),

    stall_name VARCHAR(255) NOT NULL,
    stall_unit_no CHAR(6) NOT NULL
        CHECK (stall_unit_no LIKE '#[0-9][0-9]-[0-9][0-9]')
);

CREATE TABLE MenuItem
(
    stall_id UNIQUEIDENTIFIER NOT NULL REFERENCES Stall(stall_id),
    item_code VARCHAR(5) NOT NULL,
    item_desc VARCHAR(255),
    item_price SMALLMONEY NOT NULL,
    item_category VARCHAR(255) NOT NULL CHECK (item_category IN ('Drinks', 'Dessert', 'Main', 'Sides')),
    CONSTRAINT PK_MenuItem PRIMARY KEY (stall_id, item_code),
);

CREATE TABLE Cuisine
(
    cuisine_id VARCHAR(5) PRIMARY KEY,
    cuisine_desc VARCHAR(30) NOT NULL CHECK (cuisine_desc IN ('Korean', 'Western', 'Chinese', 'Japanese', 'Thai', 'Others')),
);

CREATE TABLE MenuItemCuisine
(
    stall_id UNIQUEIDENTIFIER NOT NULL REFERENCES Stall(stall_id),
    cuisine_id VARCHAR(5) NOT NULL REFERENCES Cuisine(cuisine_id),
    item_code VARCHAR(5) NOT NULL,
    CONSTRAINT PK_MenuItemCuisine PRIMARY KEY (cuisine_id, stall_id, item_code),
    CONSTRAINT FK_MenuItemCuisine_MenuItem FOREIGN KEY (stall_id, item_code) REFERENCES MenuItem(stall_id, item_code)
);

INSERT INTO Account
    (account_id, account_email, password_hash, role)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'alice@email.com', 'hashed_pw1', 'Customer'),
    ('22222222-2222-2222-2222-222222222222', 'ben@email.com', 'hashed_pw2', 'Customer'),
    ('33333333-3333-3333-3333-333333333333', 'kim@email.com', 'hashed_pw3', 'Vendor'),
    ('44444444-4444-4444-4444-444444444444', 'sakura@email.com', 'hashed_pw4', 'Vendor'),
    ('55555555-5555-5555-5555-555555555555', 'operator@email.com', 'hashed_pw5', 'Operator');


INSERT INTO Customer
    (account_id, customer_name)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Alice Tan'),
    ('22222222-2222-2222-2222-222222222222', 'Ben Lee');


INSERT INTO Vendor
    (account_id)
VALUES
    ('33333333-3333-3333-3333-333333333333'),
    ('44444444-4444-4444-4444-444444444444');


INSERT INTO Operator
    (account_id)
VALUES
    ('55555555-5555-5555-5555-555555555555');


INSERT INTO Stall
    (stall_id, vendor_id, stall_name, stall_unit_no)
VALUES
    ('DDDDDDD1-DDDD-DDDD-DDDD-DDDDDDDDDDDD',
     '33333333-3333-3333-3333-333333333333',
     'Kim Kitchen',
     '#01-01'),

    ('DDDDDDD2-DDDD-DDDD-DDDD-DDDDDDDDDDDD',
     '44444444-4444-4444-4444-444444444444',
     'Sakura Sushi',
     '#01-02');


INSERT INTO MenuItem
    (stall_id, item_code, item_desc, item_price, item_category)
VALUES
    ('DDDDDDD1-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'M001', 'Kimchi Fried Rice', 7.50, 'Main'),
    ('DDDDDDD1-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'M002', 'Bibimbap', 8.50, 'Main'),
    ('DDDDDDD1-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'D001', 'Korean Iced Tea', 2.00, 'Drinks'),

    ('DDDDDDD2-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'M001', 'Salmon Sushi Set', 12.50, 'Main'),
    ('DDDDDDD2-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'M002', 'Chicken Katsu', 9.00, 'Main'),
    ('DDDDDDD2-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'D001', 'Matcha Latte', 3.50, 'Drinks'),
    ('DDDDDDD2-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'S001', 'Mochi', 4.00, 'Dessert');


INSERT INTO Cuisine
    (cuisine_id, cuisine_desc)
VALUES
    ('C001', 'Korean'),
    ('C002', 'Japanese'),
    ('C003', 'Chinese'),
    ('C004', 'Western'),
    ('C005', 'Thai'),
    ('C006', 'Others');


INSERT INTO MenuItemCuisine
    (stall_id, cuisine_id, item_code)
VALUES
    ('DDDDDDD1-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'C001', 'M001'),
    ('DDDDDDD1-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'C001', 'M002'),
    ('DDDDDDD1-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'C001', 'D001'),

    ('DDDDDDD2-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'C002', 'M001'),
    ('DDDDDDD2-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'C002', 'M002'),
    ('DDDDDDD2-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'C002', 'D001'),
    ('DDDDDDD2-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'C002', 'S001');
