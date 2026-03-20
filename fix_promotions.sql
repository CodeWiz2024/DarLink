-- Fix benefits_from table to link promotions to properties instead of bookings
-- This migration changes the table structure to match the application logic

USE VacationRentalDB;

-- Drop existing foreign key constraints
ALTER TABLE benefits_from DROP FOREIGN KEY benefits_from_ibfk_1;
ALTER TABLE benefits_from DROP FOREIGN KEY benefits_from_ibfk_2;

-- Drop primary key
ALTER TABLE benefits_from DROP PRIMARY KEY;

-- Change BookingId column to PropertyId
ALTER TABLE benefits_from CHANGE COLUMN BookingId PropertyId INT NOT NULL;

-- Add new foreign key constraint to Property table
ALTER TABLE benefits_from ADD CONSTRAINT benefits_from_ibfk_property
    FOREIGN KEY (PropertyId) REFERENCES Property(PropertyId) ON DELETE CASCADE;

-- Add new primary key
ALTER TABLE benefits_from ADD PRIMARY KEY (PromotionId, PropertyId);

-- Add index for better performance
CREATE INDEX idx_benefits_from_property ON benefits_from(PropertyId);