-- ============================================
-- Vacation Rental Database - Complete Schema
-- ============================================

DROP DATABASE IF EXISTS VacationRentalDB;
CREATE DATABASE VacationRentalDB;
USE VacationRentalDB;

-- ============================================
-- USER TABLE
-- ============================================
CREATE TABLE USER_a (
    UserId INT PRIMARY KEY AUTO_INCREMENT,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    Email VARCHAR(255) NOT NULL UNIQUE,
    ProfilePicturePath VARCHAR(500) NULL,
    PhoneNumber VARCHAR(20),
    IDCardNumber VARCHAR(50) UNIQUE,
    Password VARCHAR(300) NOT NULL,
    UserType ENUM('Owner', 'Renter') NOT NULL,
    IDCardFrontPath VARCHAR(500),
    AverageRating DECIMAL(3,2) DEFAULT 0,
    TotalReviews INT DEFAULT 0,
    INDEX idx_email (Email),
    INDEX idx_usertype (UserType)
);

-- ============================================
-- ADMIN TABLE
-- ============================================
CREATE TABLE ADMIN (
    AdminId INT PRIMARY KEY AUTO_INCREMENT,
    UserId INT NOT NULL UNIQUE,
    FOREIGN KEY (UserId) REFERENCES USER_a(UserId) ON DELETE CASCADE
);

-- ============================================
-- PROPERTY TABLE
-- ============================================
CREATE TABLE Property (
    PropertyId INT PRIMARY KEY AUTO_INCREMENT,
    Title VARCHAR(255) NOT NULL,
    Description TEXT,
    Address VARCHAR(255) NOT NULL,
    City VARCHAR(100) NOT NULL,
    Wilaya VARCHAR(100) NOT NULL,
    Latitude DECIMAL(10,8),
    Longitude DECIMAL(11,8),
    PropertyType ENUM('Apartment', 'House', 'Room', 'Cottage') NOT NULL,
    PricePerNight DECIMAL(10,2) NOT NULL,
    AvailabilityStatus ENUM('Active', 'Inactive', 'Blocked') NOT NULL DEFAULT 'Active',
    NumofRooms INT NOT NULL,
    OwnerId INT NOT NULL,
    MainImage VARCHAR(500),
    IsFeatured BOOLEAN DEFAULT FALSE,
    IsBoosted BOOLEAN DEFAULT FALSE,
    FeaturedUntil DATE,
    BoostedUntil DATE,
    ViewCount INT DEFAULT 0,
    MaxImages INT DEFAULT 3,
    AverageRating DECIMAL(3,2) DEFAULT 0,
    TotalReviews INT DEFAULT 0,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (OwnerId) REFERENCES USER_a(UserId) ON DELETE CASCADE,
    INDEX idx_owner (OwnerId),
    INDEX idx_status (AvailabilityStatus),
    INDEX idx_featured (IsFeatured),
    INDEX idx_boosted (IsBoosted),
    INDEX idx_city (City)
);

-- ============================================
-- PROPERTY IMAGES TABLE
-- ============================================
CREATE TABLE PROPERTY_Image (
    ImageId INT PRIMARY KEY AUTO_INCREMENT,
    PropertyId INT NOT NULL,
    ImageURL VARCHAR(255) NOT NULL,
    Caption VARCHAR(255),
    FOREIGN KEY (PropertyId) REFERENCES Property(PropertyId) ON DELETE CASCADE,
    INDEX idx_property (PropertyId)
);

-- ============================================
-- FEATURES TABLE
-- ============================================
CREATE TABLE Feature (
    FeatureId INT PRIMARY KEY AUTO_INCREMENT,
    FeatureName VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE has_features (
    PropertyId INT NOT NULL,
    FeatureId INT NOT NULL,
    FOREIGN KEY (PropertyId) REFERENCES Property(PropertyId) ON DELETE CASCADE,
    FOREIGN KEY (FeatureId) REFERENCES Feature(FeatureId) ON DELETE CASCADE,
    PRIMARY KEY (PropertyId, FeatureId)
);

-- ============================================
-- BOOKING TABLE
-- ============================================
CREATE TABLE Booking (
    BookingId INT PRIMARY KEY AUTO_INCREMENT,
    UserId INT NOT NULL,
    PropertyId INT NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    LengthOfStay INT NOT NULL,
    TotalPrice DECIMAL(10,2) NOT NULL,
    BookingStatus ENUM('Pending', 'Confirmed', 'Cancelled', 'Completed') NOT NULL DEFAULT 'Pending',
    PhoneNumber VARCHAR(20),
    BasePrice DECIMAL(10,2) NOT NULL,
    DiscountAmount DECIMAL(10,2) DEFAULT 0,
    OwnerShare DECIMAL(10,2) DEFAULT 0,
    PlatformFee DECIMAL(10,2) DEFAULT 0,
    PaymentReference VARCHAR(255),
    PaymentDate DATETIME,
    OwnerPaidOut BOOLEAN DEFAULT FALSE,
    PayoutDate DATETIME,
    PayoutMethod VARCHAR(50),
    PayoutReference VARCHAR(255),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES USER_a(UserId) ON DELETE CASCADE,
    FOREIGN KEY (PropertyId) REFERENCES Property(PropertyId) ON DELETE CASCADE,
    INDEX idx_user (UserId),
    INDEX idx_property (PropertyId),
    INDEX idx_status (BookingStatus),
    INDEX idx_dates (StartDate, EndDate),
    INDEX idx_payment_ref (PaymentReference)
);

-- ============================================
-- PAYMENT TABLE (OLD - KEPT FOR COMPATIBILITY)
-- ============================================
CREATE TABLE Payment (
    PaymentId INT PRIMARY KEY AUTO_INCREMENT,
    BookingId INT NOT NULL,
    Amount DECIMAL(10,2) NOT NULL,
    PaymentDate DATE NOT NULL,
    PaymentMethod ENUM('Card', 'Cash', 'Transfer', 'Chargily') NOT NULL,
    FOREIGN KEY (BookingId) REFERENCES Booking(BookingId) ON DELETE CASCADE
);

-- ============================================
-- PROMOTION TABLE
-- ============================================
CREATE TABLE Promotion (
    PromotionId INT PRIMARY KEY AUTO_INCREMENT,
    PromotionType ENUM('LongStay', 'Seasonal', 'SpecialOffer') NOT NULL,
    MinStayDays INT NOT NULL,
    DiscountType ENUM('Percentage', 'FixedAmount') NOT NULL,
    DiscountValue DECIMAL(10,2) NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL
);

CREATE TABLE benefits_from (
    PromotionId INT NOT NULL,
    BookingId INT NOT NULL,
    FOREIGN KEY (PromotionId) REFERENCES Promotion(PromotionId) ON DELETE CASCADE,
    FOREIGN KEY (BookingId) REFERENCES Booking(BookingId) ON DELETE CASCADE,
    PRIMARY KEY (PromotionId, BookingId)
);

-- ============================================
-- ADVERTISEMENT PACKAGES
-- ============================================
CREATE TABLE AdvertPackage (
    PackageId INT PRIMARY KEY AUTO_INCREMENT,
    PackageName VARCHAR(100) NOT NULL,
    PackageType ENUM('Free', 'Premium', 'Boost') NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    DurationDays INT NOT NULL,
    MaxImages INT DEFAULT 3,
    ChargilyProductId VARCHAR(255),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Payment_Transaction (
    TransactionId INT PRIMARY KEY AUTO_INCREMENT,
    PropertyId INT NOT NULL,
    OwnerId INT NOT NULL,
    PackageId INT NOT NULL,
    Amount DECIMAL(10,2) NOT NULL,
    PaymentMethod VARCHAR(50) NOT NULL,
    PaymentStatus ENUM('Pending', 'Completed', 'Failed', 'Refunded') NOT NULL DEFAULT 'Pending',
    TransactionReference VARCHAR(255),
    PaymentDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ExpiryDate DATE,
    FOREIGN KEY (PropertyId) REFERENCES Property(PropertyId) ON DELETE CASCADE,
    FOREIGN KEY (OwnerId) REFERENCES USER_a(UserId) ON DELETE CASCADE,
    FOREIGN KEY (PackageId) REFERENCES AdvertPackage(PackageId) ON DELETE CASCADE,
    INDEX idx_property (PropertyId),
    INDEX idx_owner (OwnerId),
    INDEX idx_status (PaymentStatus),
    INDEX idx_reference (TransactionReference)
);

-- ============================================
-- PAYMENT HISTORY (FOR BOOKING PAYMENTS)
-- ============================================
CREATE TABLE Payment_History (
    PaymentId INT PRIMARY KEY AUTO_INCREMENT,
    PaymentType ENUM('Package', 'Booking') NOT NULL,
    ReferenceId INT NOT NULL,
    PayerId INT NOT NULL,
    Amount DECIMAL(10,2) NOT NULL,
    PlatformFee DECIMAL(10,2) DEFAULT 0,
    RecipientShare DECIMAL(10,2) DEFAULT 0,
    ChargilyCheckoutId VARCHAR(255),
    PaymentStatus ENUM('Pending', 'Completed', 'Failed') DEFAULT 'Pending',
    PaymentDate DATETIME,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (PaymentType),
    INDEX idx_payer (PayerId),
    INDEX idx_checkout (ChargilyCheckoutId),
    INDEX idx_status (PaymentStatus)
);

-- ============================================
-- MESSAGING SYSTEM
-- ============================================
CREATE TABLE Message (
    MessageId INT PRIMARY KEY AUTO_INCREMENT,
    SenderId INT NOT NULL,
    ReceiverId INT NOT NULL,
    PropertyId INT,
    MessageText TEXT NOT NULL,
    IsRead BOOLEAN DEFAULT FALSE,
    SentAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (SenderId) REFERENCES USER_a(UserId) ON DELETE CASCADE,
    FOREIGN KEY (ReceiverId) REFERENCES USER_a(UserId) ON DELETE CASCADE,
    FOREIGN KEY (PropertyId) REFERENCES Property(PropertyId) ON DELETE SET NULL,
    INDEX idx_sender (SenderId),
    INDEX idx_receiver (ReceiverId),
    INDEX idx_unread (IsRead),
    INDEX idx_conversation (SenderId, ReceiverId)
);

CREATE TABLE Conversation (
    ConversationId INT PRIMARY KEY AUTO_INCREMENT,
    RenterId INT NOT NULL,
    OwnerId INT NOT NULL,
    PropertyId INT,
    LastMessageAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (RenterId) REFERENCES USER_a(UserId) ON DELETE CASCADE,
    FOREIGN KEY (OwnerId) REFERENCES USER_a(UserId) ON DELETE CASCADE,
    FOREIGN KEY (PropertyId) REFERENCES Property(PropertyId) ON DELETE SET NULL,
    UNIQUE KEY unique_conversation (RenterId, OwnerId, PropertyId),
    INDEX idx_renter (RenterId),
    INDEX idx_owner (OwnerId)
);

-- ============================================
-- REVIEW SYSTEM
-- ============================================
CREATE TABLE Review (
    ReviewId INT PRIMARY KEY AUTO_INCREMENT,
    ReviewerId INT NOT NULL,
    ReviewedUserId INT NOT NULL,
    PropertyId INT,
    BookingId INT,
    Rating INT NOT NULL CHECK (Rating >= 1 AND Rating <= 5),
    Comment TEXT,
    ReviewDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ReviewerType ENUM('Renter', 'Owner') NOT NULL,
    ReviewedRole ENUM('Renter', 'Owner', 'Property') NOT NULL,
    FOREIGN KEY (ReviewerId) REFERENCES USER_a(UserId) ON DELETE CASCADE,
    FOREIGN KEY (ReviewedUserId) REFERENCES USER_a(UserId) ON DELETE CASCADE,
    FOREIGN KEY (PropertyId) REFERENCES Property(PropertyId) ON DELETE CASCADE,
    FOREIGN KEY (BookingId) REFERENCES Booking(BookingId) ON DELETE CASCADE,
    UNIQUE KEY unique_review (ReviewerId, BookingId, ReviewedUserId),
    INDEX idx_reviewer (ReviewerId),
    INDEX idx_reviewed (ReviewedUserId),
    INDEX idx_property (PropertyId),
    INDEX idx_booking (BookingId)
);

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Insert Advertisement Packages
INSERT INTO AdvertPackage (PackageName, PackageType, Price, DurationDays, MaxImages, ChargilyProductId) VALUES
('Free Listing', 'Free', 0, 365, 3, NULL),
('Premium Listing', 'Premium', 3000, 30, 15, '01kjjxmx3ft0vjkb8fe7e4vge0'),
('Weekly Boost', 'Boost', 1000, 7, 10, '01kjjyasrhpks2dxpt4425k8yy');

-- Insert Common Features
INSERT INTO Feature (FeatureName) VALUES
('WiFi'),
('Air Conditioning'),
('Heating'),
('Kitchen'),
('Parking'),
('Swimming Pool'),
('Garden'),
('Balcony'),
('TV'),
('Washing Machine'),
('Pet Friendly'),
('Wheelchair Accessible');

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View for active properties with owner info
CREATE OR REPLACE VIEW v_active_properties AS
SELECT 
    p.*,
    CONCAT(u.FirstName, ' ', u.LastName) as OwnerName,
    u.Email as OwnerEmail,
    u.PhoneNumber as OwnerPhone,
    u.AverageRating as OwnerRating
FROM Property p
JOIN USER_a u ON p.OwnerId = u.UserId
WHERE p.AvailabilityStatus = 'Active';

-- View for pending payouts
CREATE OR REPLACE VIEW v_pending_payouts AS
SELECT 
    b.BookingId,
    b.TotalPrice,
    b.OwnerShare,
    b.PlatformFee,
    b.StartDate,
    b.EndDate,
    b.PaymentDate,
    p.Title as PropertyTitle,
    CONCAT(owner.FirstName, ' ', owner.LastName) as OwnerName,
    owner.Email as OwnerEmail,
    owner.PhoneNumber as OwnerPhone,
    CONCAT(renter.FirstName, ' ', renter.LastName) as RenterName
FROM Booking b
JOIN Property p ON b.PropertyId = p.PropertyId
JOIN USER_a owner ON p.OwnerId = owner.UserId
JOIN USER_a renter ON b.UserId = renter.UserId
WHERE b.BookingStatus = 'Confirmed'
  AND b.OwnerPaidOut = FALSE
  AND b.PaymentDate IS NOT NULL
  AND b.EndDate < CURDATE()
ORDER BY b.EndDate ASC;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to prevent owners from booking their own properties
DELIMITER //

CREATE TRIGGER prevent_owner_self_booking
BEFORE INSERT ON Booking
FOR EACH ROW
BEGIN
    DECLARE property_owner_id INT;
    
    SELECT OwnerId INTO property_owner_id
    FROM Property
    WHERE PropertyId = NEW.PropertyId;
    
    IF property_owner_id = NEW.UserId THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Property owners cannot book their own properties';
    END IF;
END//

DELIMITER ;

-- ============================================
-- STORED PROCEDURES
-- ============================================

-- Procedure to calculate platform profit
DELIMITER //

CREATE PROCEDURE sp_calculate_platform_profit(
    IN start_date DATE,
    IN end_date DATE
)
BEGIN
    SELECT 
        SUM(b.PlatformFee) as BookingProfit,
        SUM(pt.Amount) as PackageProfit,
        (SUM(b.PlatformFee) + SUM(pt.Amount)) as TotalProfit
    FROM 
        (SELECT COALESCE(SUM(PlatformFee), 0) as PlatformFee
         FROM Booking 
         WHERE PaymentDate BETWEEN start_date AND end_date) b,
        (SELECT COALESCE(SUM(Amount), 0) as Amount
         FROM Payment_Transaction 
         WHERE PaymentDate BETWEEN start_date AND end_date 
         AND PaymentStatus = 'Completed') pt;
END//

DELIMITER ;

-- ============================================
-- GRANTS (OPTIONAL - ADJUST AS NEEDED)
-- ============================================
-- GRANT ALL PRIVILEGES ON VacationRentalDB.* TO 'your_user'@'localhost';
-- FLUSH PRIVILEGES;

-- ============================================
-- DATABASE COMPLETE
-- ============================================
SELECT 'Database VacationRentalDB created successfully!' as Status;
-- Update existing promotions to be active NOW and for the next 30 days
UPDATE Promotion 
SET StartDate = CURDATE(), 
    EndDate = DATE_ADD(CURDATE(), INTERVAL 30 DAY)
WHERE PromotionId IN (18, 19, 20);
