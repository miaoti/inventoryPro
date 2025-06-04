-- Add new fields to items table for enhanced inventory management
ALTER TABLE items 
ADD COLUMN english_description VARCHAR(500),
ADD COLUMN equipment VARCHAR(255),
ADD COLUMN category ENUM('A', 'B', 'C') NOT NULL DEFAULT 'C',
ADD COLUMN status VARCHAR(100),
ADD COLUMN estimated_consumption INT,
ADD COLUMN rack VARCHAR(50),
ADD COLUMN floor VARCHAR(50),
ADD COLUMN area VARCHAR(50),
ADD COLUMN bin VARCHAR(50),
ADD COLUMN wk22 INT,
ADD COLUMN wk23 INT,
ADD COLUMN wk24 INT,
ADD COLUMN wk25 INT,
ADD COLUMN wk26 INT,
ADD COLUMN wk27 INT; 