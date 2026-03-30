// The demo database for the main loaded database
const DEMO_DB = `
-- Enable foreign key support
PRAGMA foreign_keys = ON;

-- Create Customers Table
CREATE TABLE Customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT
);

-- Create Products Table
CREATE TABLE Products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    created_at DATE NOT NULL
);

-- Create Orders Table with Foreign Key Constraints
CREATE TABLE Orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    order_date DATE NOT NULL,
    quantity INTEGER NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES Customers(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE
);

-- Insert 30 Customers
INSERT INTO Customers (first_name, last_name, email, phone) VALUES
('Emma', 'Rodriguez', 'emma.rodriguez@gmail.com', '(555) 123-4567'),
('Liam', 'Chen', 'liam.chen@example.com', '(555) 234-5678'),
('Olivia', 'Patel', 'olivia.patel@hotmail.com', '(555) 345-6789'),
('Noah', 'Kim', 'noah.kim@live.com', '(555) 456-7890'),
('Ava', 'Singh', 'ava.singh@gmail.com', '(555) 567-8901'),
('Ethan', 'Garcia', 'ethan.garcia@hotmail.com', '(555) 678-9012'),
('Sophia', 'Nguyen', 'sophia.nguyen@live.com', '(555) 789-0123'),
('Mason', 'Wang', 'mason.wang@example.com', '(555) 890-1234'),
('Isabella', 'Kumar', 'isabella.kumar@outlook.com', '(555) 901-2345'),
('William', 'Hernandez', 'william.hernandez@example.com', '(555) 012-3456'),
('Mia', 'Lee', 'mia.lee@example.com', '(555) 987-6543'),
('James', 'Gupta', 'james.gupta@outlook.com', '(555) 876-5432'),
('Charlotte', 'Martinez', 'charlotte.martinez@example.com', '(555) 765-4321'),
('Benjamin', 'Suzuki', 'benjamin.suzuki@hotmail.com', '(555) 654-3210'),
('Amelia', 'Ahmed', 'amelia.ahmed@outlook.com', '(555) 543-2109'),
('Lucas', 'Park', 'lucas.park@hotmail.com', '(555) 432-1098'),
('Harper', 'Tanaka', 'harper.tanaka@gmail.com', '(555) 321-0987'),
('Alexander', 'Mehta', 'alexander.mehta@proton.com', '(555) 210-9876'),
('Evelyn', 'Sato', 'evelyn.sato@outlook.com', '(555) 109-8765'),
('Michael', 'Khan', 'michael.khan@outlook.com', '(555) 098-7654'),
('Abigail', 'Yamaguchi', 'abigail.yamaguchi@proton.com', '(555) 876-5432'),
('Daniel', 'Choi', 'daniel.choi@gmail.com', '(555) 765-4321'),
('Emily', 'Gupta', 'emily.gupta@example.com', '(555) 654-3210'),
('Jacob', 'Liu', 'jacob.liu@proton.com', '(555) 543-2109'),
('Madison', 'Cho', 'madison.cho@hotmail.com', '(555) 432-1098'),
('Logan', 'Pham', 'logan.pham@gmail.com', '(555) 321-0987'),
('Elizabeth', 'Nakamura', 'elizabeth.nakamura@example.com', '(555) 210-9876'),
('Sebastian', 'Malik', 'sebastian.malik@example.com', '(555) 109-8765'),
('Avery', 'Suzuki', 'avery.suzuki@hotmail.com', '(555) 098-7654'),
('Jackson', 'Krishnamurthy', 'jackson.krishnamurthy@gmail.com', '(555) 987-6543');

-- Insert 20 Products
INSERT INTO Products (name, description, price, created_at) VALUES
('Smart Home Hub', 'Central control system for smart home devices', 129.99, '2025-01-15'),
('Wireless Earbuds', 'Noise-cancelling earbuds with long battery life', 199.99, '2025-01-16'),
('Fitness Tracker', 'Advanced health monitoring smartwatch', 149.99, '2025-01-17'),
('4K Action Camera', 'Waterproof camera for extreme sports', 299.99, '2025-01-18'),
('Portable Solar Charger', 'Eco-friendly charging solution for devices', 79.99, '2025-01-19'),
('Smart Robot Vacuum', 'AI-powered cleaning robot with mapping', 249.99, '2025-01-20'),
('Noise-Cancelling Headphones', 'Premium over-ear wireless headphones', 349.99, '2025-01-21'),
('Portable Power Station', 'High-capacity battery for outdoor adventures', 399.99, '2025-01-22'),
('Smart Garden Sensor', 'Monitors plant health and soil conditions', 59.99, '2025-01-23'),
('Electric Skateboard', 'Compact personal transportation device', 499.99, '2025-01-24'),
('Compact Drone', 'Portable aerial photography drone', 299.99, '2025-01-25'),
('Smart Thermostat', 'Energy-efficient home temperature control', 179.99, '2025-01-26'),
('Portable Projector', 'Pocket-sized HD movie projector', 249.99, '2025-01-27'),
('Wireless Charging Pad', 'Multi-device fast charging station', 69.99, '2025-01-28'),
('Smart Water Bottle', 'Hydration tracking and temperature control', 39.99, '2025-01-29'),
('Bluetooth Speaker', 'Waterproof outdoor sound system', 129.99, '2025-01-30'),
('Digital Writing Tablet', 'Electronic notebook with cloud sync', 199.99, '2025-02-01'),
('Portable Air Purifier', 'Compact air cleaning device', 99.99, '2025-02-02'),
('Smart Light Bulbs', 'Color-changing WiFi-enabled lighting', 29.99, '2025-02-03'),
('Wireless Game Controller', 'Universal gaming controller', 79.99, '2025-02-04');

-- Insert 10 Orders
INSERT INTO Orders (customer_id, product_id, order_date, quantity) VALUES
(1, 5, '2025-02-10', 2),
(7, 12, '2025-02-11', 1),
(15, 3, '2025-02-12', 3),
(22, 8, '2025-02-13', 1),
(9, 16, '2025-02-14', 2),
(18, 1, '2025-02-15', 1),
(25, 7, '2025-02-16', 1),
(11, 19, '2025-02-17', 4),
(29, 11, '2025-02-18', 1),
(5, 14, '2025-02-19', 2);

-- Verification Queries
SELECT 'Customers Count:', COUNT(*) FROM Customers;
SELECT 'Products Count:', COUNT(*) FROM Products;
SELECT 'Orders Count:', COUNT(*) FROM Orders;
`;

export default DEMO_DB;
