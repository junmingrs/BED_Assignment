USE bed_db;
GO

DROP TABLE IF EXISTS MenuItemCuisine;
DROP TABLE IF EXISTS Customer;
DROP TABLE IF EXISTS Operator;
DROP TABLE IF EXISTS MenuItem;
DROP TABLE IF EXISTS Cuisine;
DROP TABLE IF EXISTS Stall
DROP TABLE IF EXISTS Vendor;
DROP TABLE IF EXISTS Account;

CREATE TABLE Account (
  account_id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
  account_name VARCHAR(255) NOT NULL,
  account_email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('Customer', 'Vendor', 'Operator')),
);

CREATE TABLE Customer (
  customer_id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
  account_id UNIQUEIDENTIFIER NOT NULL REFERENCES Account(account_id),
  customer_name VARCHAR(255) NOT NULL,
);

CREATE TABLE Vendor (
  vendor_id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
  account_id UNIQUEIDENTIFIER NOT NULL REFERENCES Account(account_id),
  vendor_name VARCHAR(255) NOT NULL,
);

CREATE TABLE Operator (
    operator_id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    account_id UNIQUEIDENTIFIER NOT NULL REFERENCES Account(account_id),
    operator_name VARCHAR(255) NOT NULL,
);

CREATE TABLE Stall (
    stall_id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    vendor_id UNIQUEIDENTIFIER NOT NULL REFERENCES Vendor(vendor_id),
    stall_name VARCHAR(255) NOT NULL,
    stall_unit_no CHAR(6) NOT NULL CHECK (stall_unit_no LIKE '#[0-9][0-9]-[0-9][0-9]')
);

CREATE TABLE MenuItem (
    stall_id UNIQUEIDENTIFIER NOT NULL REFERENCES Stall(stall_id),
    item_code VARCHAR(5) NOT NULL,
    item_desc VARCHAR(255),
    item_price SMALLMONEY NOT NULL,
    item_category VARCHAR(255) NOT NULL CHECK (item_category IN ('Drinks', 'Dessert', 'Main', 'Sides')),
    CONSTRAINT PK_MenuItem PRIMARY KEY (stall_id, item_code),
);

CREATE TABLE Cuisine (
    cuisine_id VARCHAR(5) PRIMARY KEY,
    cuisine_desc VARCHAR(30) NOT NULL CHECK (cuisine_desc IN ('Korean', 'Western', 'Chinese', 'Japanese', 'Thai', 'Others')),
);

CREATE TABLE MenuItemCuisine (
    stall_id UNIQUEIDENTIFIER NOT NULL REFERENCES Stall(stall_id),
    cuisine_id VARCHAR(5) NOT NULL REFERENCES Cuisine(cuisine_id),
    item_code VARCHAR(5) NOT NULL,
    CONSTRAINT PK_MenuItemCuisine PRIMARY KEY (cuisine_id, stall_id, item_code),
    CONSTRAINT FK_MenuItemCuisine_MenuItem FOREIGN KEY (stall_id, item_code) REFERENCES MenuItem(stall_id, item_code)
)

