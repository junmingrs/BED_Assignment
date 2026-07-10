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
DROP TABLE IF EXISTS Orders;
DROP TABLE IF EXISTS Rating;
DROP TABLE IF EXISTS Complaint;

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
);

CREATE TABLE Orders (
    order_id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    stall_id UNIQUEIDENTIFIER NOT NULL REFERENCES Stall(stall_id),
    customer_id UNIQUEIDENTIFIER NOT NULL REFERENCES Customer(customer_id),
    order_date DATETIME DEFAULT GETDATE(),
    total_amount SMALLMONEY NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled')),
    queue_number INT NOT NULL
);

CREATE TABLE Rating (
    rating_id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    stall_id UNIQUEIDENTIFIER NOT NULL REFERENCES Stall(stall_id),
    customer_id UNIQUEIDENTIFIER NOT NULL REFERENCES Customer(customer_id),
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE Complaint (
    complaint_id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
    stall_id UNIQUEIDENTIFIER NOT NULL REFERENCES Stall(stall_id),
    customer_id UNIQUEIDENTIFIER NOT NULL REFERENCES Customer(customer_id),
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'Open' CHECK (status IN ('Open', 'Investigating', 'Resolved', 'Closed')),
    created_at DATETIME DEFAULT GETDATE()
);

INSERT INTO Account (account_id, account_name, account_email, password_hash, role)
VALUES
('11111111-1111-1111-1111-111111111111', 'Alice Tan', 'alice@email.com', 'hashed_pw1', 'Customer'),
('22222222-2222-2222-2222-222222222222', 'Ben Lee', 'ben@email.com', 'hashed_pw2', 'Customer'),
('33333333-3333-3333-3333-333333333333', 'Kim Kitchen', 'kim@email.com', 'hashed_pw3', 'Vendor'),
('44444444-4444-4444-4444-444444444444', 'Sakura Sushi', 'sakura@email.com', 'hashed_pw4', 'Vendor'),
('55555555-5555-5555-5555-555555555555', 'Operator One', 'operator@email.com', 'hashed_pw5', 'Operator');

INSERT INTO Customer (customer_id, account_id, customer_name)
VALUES
('AAAAAAA1-AAAA-AAAA-AAAA-AAAAAAAAAAAA', '11111111-1111-1111-1111-111111111111', 'Alice Tan'),
('AAAAAAA2-AAAA-AAAA-AAAA-AAAAAAAAAAAA', '22222222-2222-2222-2222-222222222222', 'Ben Lee');

INSERT INTO Vendor (vendor_id, account_id, vendor_name)
VALUES
('BBBBBBB1-BBBB-BBBB-BBBB-BBBBBBBBBBBB', '33333333-3333-3333-3333-333333333333', 'Kim Kitchen'),
('BBBBBBB2-BBBB-BBBB-BBBB-BBBBBBBBBBBB', '44444444-4444-4444-4444-444444444444', 'Sakura Sushi');

INSERT INTO Operator (operator_id, account_id, operator_name)
VALUES
('CCCCCCC1-CCCC-CCCC-CCCC-CCCCCCCCCCCC', '55555555-5555-5555-5555-555555555555', 'Operator One');

INSERT INTO Stall (stall_id, vendor_id, stall_name, stall_unit_no)
VALUES
('DDDDDDD1-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'BBBBBBB1-BBBB-BBBB-BBBB-BBBBBBBBBBBB', 'Kim Kitchen', '#01-01'),
('DDDDDDD2-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'BBBBBBB2-BBBB-BBBB-BBBB-BBBBBBBBBBBB', 'Sakura Sushi', '#01-02');

INSERT INTO MenuItem (stall_id, item_code, item_desc, item_price, item_category)
VALUES
('DDDDDDD1-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'M001', 'Kimchi Fried Rice', 7.50, 'Main'),
('DDDDDDD1-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'M002', 'Bibimbap', 8.50, 'Main'),
('DDDDDDD1-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'D001', 'Korean Iced Tea', 2.00, 'Drinks'),

('DDDDDDD2-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'M001', 'Salmon Sushi Set', 12.50, 'Main'),
('DDDDDDD2-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'M002', 'Chicken Katsu', 9.00, 'Main'),
('DDDDDDD2-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'D001', 'Matcha Latte', 3.50, 'Drinks'),
('DDDDDDD2-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'S001', 'Mochi', 4.00, 'Dessert');

INSERT INTO Cuisine (cuisine_id, cuisine_desc)
VALUES
('C001', 'Korean'),
('C002', 'Japanese'),
('C003', 'Chinese'),
('C004', 'Western'),
('C005', 'Thai'),
('C006', 'Others');

INSERT INTO MenuItemCuisine (stall_id, cuisine_id, item_code)
VALUES
('DDDDDDD1-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'C001', 'M001'),
('DDDDDDD1-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'C001', 'M002'),
('DDDDDDD1-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'C001', 'D001'),

('DDDDDDD2-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'C002', 'M001'),
('DDDDDDD2-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'C002', 'M002'),
('DDDDDDD2-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'C002', 'D001'),
('DDDDDDD2-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'C002', 'S001');

INSERT INTO Orders (order_id, stall_id, customer_id, order_date, total_amount, status, queue_number)
VALUES
(NEWID(), 'DDDDDDD1-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'AAAAAAA1-AAAA-AAAA-AAAA-AAAAAAAAAAAA', '2026-07-01 12:30:00', 15.50, 'Completed', 1),
(NEWID(), 'DDDDDDD1-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'AAAAAAA2-AAAA-AAAA-AAAA-AAAAAAAAAAAA', '2026-07-02 18:15:00', 8.50, 'Completed', 2),
(NEWID(), 'DDDDDDD1-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'AAAAAAA1-AAAA-AAAA-AAAA-AAAAAAAAAAAA', '2026-07-03 12:00:00', 9.50, 'Preparing', 3),
(NEWID(), 'DDDDDDD1-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'AAAAAAA2-AAAA-AAAA-AAAA-AAAAAAAAAAAA', '2026-07-05 11:00:00', 7.50, 'Cancelled', 4),
(NEWID(), 'DDDDDDD2-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'AAAAAAA2-AAAA-AAAA-AAAA-AAAAAAAAAAAA', '2026-07-01 19:00:00', 12.50, 'Completed', 1),
(NEWID(), 'DDDDDDD2-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'AAAAAAA1-AAAA-AAAA-AAAA-AAAAAAAAAAAA', '2026-07-02 13:45:00', 16.00, 'Completed', 2),
(NEWID(), 'DDDDDDD2-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'AAAAAAA2-AAAA-AAAA-AAAA-AAAAAAAAAAAA', '2026-07-04 20:00:00', 3.50, 'Pending', 3);

INSERT INTO Rating (rating_id, stall_id, customer_id, rating, comment, created_at)
VALUES
(NEWID(), 'DDDDDDD1-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'AAAAAAA1-AAAA-AAAA-AAAA-AAAAAAAAAAAA', 5, 'Really good kimchi fried rice! Will order again.', '2026-07-01 12:45:00'),
(NEWID(), 'DDDDDDD1-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'AAAAAAA2-AAAA-AAAA-AAAA-AAAAAAAAAAAA', 4, 'Bibimbap was solid but a bit too spicy for me.', '2026-07-02 18:30:00'),
(NEWID(), 'DDDDDDD1-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'AAAAAAA1-AAAA-AAAA-AAAA-AAAAAAAAAAAA', 3, 'Portion size could be bigger, but taste is okay.', '2026-07-03 12:20:00'),
(NEWID(), 'DDDDDDD2-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'AAAAAAA2-AAAA-AAAA-AAAA-AAAAAAAAAAAA', 5, 'Salmon sushi was super fresh! Loved it.', '2026-07-01 19:15:00'),
(NEWID(), 'DDDDDDD2-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'AAAAAAA1-AAAA-AAAA-AAAA-AAAAAAAAAAAA', 4, 'Chicken katsu was crispy, will come back.', '2026-07-02 14:00:00'),
(NEWID(), 'DDDDDDD2-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'AAAAAAA2-AAAA-AAAA-AAAA-AAAAAAAAAAAA', 2, 'Matcha latte was too sweet, not what I expected.', '2026-07-04 20:15:00');

INSERT INTO Complaint (complaint_id, stall_id, customer_id, subject, description, status, created_at)
VALUES
(NEWID(), 'DDDDDDD1-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'AAAAAAA2-AAAA-AAAA-AAAA-AAAAAAAAAAAA', 'Hair found in food', 'I found a piece of hair in my Bibimbap. Please investigate.', 'Investigating', '2026-07-02 18:35:00'),
(NEWID(), 'DDDDDDD2-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'AAAAAAA2-AAAA-AAAA-AAAA-AAAAAAAAAAAA', 'Overcharged for order', 'I was charged $16.00 but my order total was only $12.50. Need a refund.', 'Open', '2026-07-02 14:10:00'),
(NEWID(), 'DDDDDDD2-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'AAAAAAA1-AAAA-AAAA-AAAA-AAAAAAAAAAAA', 'Order came late', 'Delivery took 45 minutes longer than expected. Food was cold.', 'Resolved', '2026-07-01 20:00:00'),
(NEWID(), 'DDDDDDD1-DDDD-DDDD-DDDD-DDDDDDDDDDDD', 'AAAAAAA1-AAAA-AAAA-AAAA-AAAAAAAAAAAA', 'Staff was rude', 'The vendor was really rude when I asked for extra kimchi. Very disappointed.', 'Closed', '2026-07-03 12:25:00');