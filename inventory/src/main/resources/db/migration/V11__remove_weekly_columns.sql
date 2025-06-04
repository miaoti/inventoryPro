-- Remove old hardcoded weekly columns and add dynamic weeklyData column
-- Using procedures to safely drop columns if they exist

-- Drop wk22 if exists
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'items' 
     AND COLUMN_NAME = 'wk22') > 0,
    'ALTER TABLE items DROP COLUMN wk22',
    'SELECT "Column wk22 does not exist"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop wk23 if exists
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'items' 
     AND COLUMN_NAME = 'wk23') > 0,
    'ALTER TABLE items DROP COLUMN wk23',
    'SELECT "Column wk23 does not exist"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop wk24 if exists
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'items' 
     AND COLUMN_NAME = 'wk24') > 0,
    'ALTER TABLE items DROP COLUMN wk24',
    'SELECT "Column wk24 does not exist"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop wk25 if exists
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'items' 
     AND COLUMN_NAME = 'wk25') > 0,
    'ALTER TABLE items DROP COLUMN wk25',
    'SELECT "Column wk25 does not exist"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop wk26 if exists
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'items' 
     AND COLUMN_NAME = 'wk26') > 0,
    'ALTER TABLE items DROP COLUMN wk26',
    'SELECT "Column wk26 does not exist"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop wk27 if exists
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'items' 
     AND COLUMN_NAME = 'wk27') > 0,
    'ALTER TABLE items DROP COLUMN wk27',
    'SELECT "Column wk27 does not exist"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add new dynamic weekly data column if it doesn't exist
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'items' 
     AND COLUMN_NAME = 'weekly_data') = 0,
    'ALTER TABLE items ADD COLUMN weekly_data TEXT',
    'SELECT "Column weekly_data already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt; 