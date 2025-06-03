-- Add any additional indexes or constraints if needed
-- This migration is for future enhancements

-- Add index for item barcodes for faster lookups
CREATE INDEX idx_items_barcode ON items(barcode);

-- Add index for user email lookups
CREATE INDEX idx_users_email ON users(email);

-- Add index for alert types for filtering
CREATE INDEX idx_alerts_type ON alerts(alert_type); 