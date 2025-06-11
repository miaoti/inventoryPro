#!/bin/bash

echo "🔍 Verifying QR Code Database Migration..."

# Check if QR code columns exist in the database
QR_COLUMNS_EXIST=$(docker-compose -f docker-compose.prod.yml exec -T mysql mysql -u root -p$MYSQL_ROOT_PASSWORD -e "
USE inventory_db;
SELECT COUNT(*) 
FROM information_schema.columns 
WHERE table_schema = 'inventory_db' 
  AND table_name = 'items' 
  AND column_name IN ('qr_code_id', 'qr_code_data');
" 2>/dev/null | tail -1)

echo "Found $QR_COLUMNS_EXIST QR code columns in items table"

if [ "$QR_COLUMNS_EXIST" -eq "2" ]; then
    echo "✅ QR code columns already exist"
else
    echo "❌ QR code columns missing - applying migration manually..."
    
    # Apply the QR code migration manually
    docker-compose -f docker-compose.prod.yml exec -T mysql mysql -u root -p$MYSQL_ROOT_PASSWORD -e "
    USE inventory_db;
    
    -- Add QR code fields to items table if they don't exist
    ALTER TABLE items ADD COLUMN IF NOT EXISTS qr_code_id VARCHAR(255) UNIQUE;
    ALTER TABLE items ADD COLUMN IF NOT EXISTS qr_code_data TEXT;
    
    -- Create index for better performance if it doesn't exist
    CREATE INDEX IF NOT EXISTS idx_items_qr_code_id ON items(qr_code_id);
    
    -- Update flyway schema history to mark this migration as completed
    INSERT IGNORE INTO flyway_schema_history (version, description, type, script, checksum, installed_by, execution_time, success, installed_rank) 
    VALUES ('20', 'add qr code fields', 'SQL', 'V20__add_qr_code_fields.sql', 0, 'manual', 100, 1, 
           (SELECT COALESCE(MAX(installed_rank), 0) + 1 FROM flyway_schema_history fsh));
    
    SELECT 'QR code migration applied manually' as status;
    " 2>/dev/null
    
    echo "✅ QR code migration applied manually"
fi

# Verify the migration was successful
echo "🔍 Final verification of QR code columns..."
docker-compose -f docker-compose.prod.yml exec -T mysql mysql -u root -p$MYSQL_ROOT_PASSWORD -e "
USE inventory_db;
DESCRIBE items;
" 2>/dev/null | grep -E "(qr_code_id|qr_code_data)" || echo "❌ QR code columns still not found"

echo "📊 Current migration status:"
docker-compose -f docker-compose.prod.yml exec -T mysql mysql -u root -p$MYSQL_ROOT_PASSWORD -e "
USE inventory_db;
SELECT version, description, success, installed_on 
FROM flyway_schema_history 
ORDER BY installed_rank DESC 
LIMIT 5;
" 2>/dev/null || echo "Could not fetch migration history" 