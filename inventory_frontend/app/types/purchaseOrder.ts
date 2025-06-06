export interface PurchaseOrder {
  id: number;
  itemId: number;
  itemName: string;
  quantity: number;
  orderDate: string;
  arrivalDate?: string;
  trackingNumber?: string;
  arrived: boolean;
  createdBy?: string;
  arrivedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderRequest {
  itemId: number;
  quantity: number;
  orderDate?: string;
  trackingNumber?: string;
}

export interface PurchaseOrderCreateRequest {
  quantity: number;
  trackingNumber?: string;
} 