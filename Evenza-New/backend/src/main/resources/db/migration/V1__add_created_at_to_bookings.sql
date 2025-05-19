-- First add the column as nullable
ALTER TABLE bookings ADD COLUMN created_at DATETIME NULL;

-- Update existing records with the current timestamp
UPDATE bookings SET created_at = NOW() WHERE created_at IS NULL;

-- After updating all records, make the column non-nullable
ALTER TABLE bookings MODIFY created_at DATETIME NOT NULL; 