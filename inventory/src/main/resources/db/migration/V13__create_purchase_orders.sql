CREATE TABLE purchase_orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    order_date DATETIME NOT NULL,
    arrival_date DATETIME NULL,
    tracking_number VARCHAR(255) NULL,
    is_arrived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
); 