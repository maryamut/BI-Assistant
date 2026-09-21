export interface Category {
  categoryID: number;
  categoryName: string;
  description: string;
}

export interface Customer {
  customerID: string;
  companyName: string;
  contactName: string;
  contactTitle: string;
  city: string;
  country: string;
}

export interface Product {
  productID: number;
  productName: string;
  supplierID: number;
  categoryID: number;
  quantityPerUnit: string;
  unitPrice: number;
  unitsInStock: number;
  unitsOnOrder: number;
  reorderLevel: number;
  discontinued: boolean;
}

export interface Order {
  orderID: number;
  customerID: string;
  employeeID: number;
  orderDate: string;
  requiredDate: string;
  shippedDate: string | null;
  shipVia: number;
  freight: number;
  shipCity: string;
  shipCountry: string;
}

export interface OrderDetail {
  orderID: number;
  productID: number;
  unitPrice: number;
  quantity: number;
  discount: number;
}

export interface NorthwindDatabase {
  categories: Category[];
  customers: Customer[];
  products: Product[];
  orders: Order[];
  orderDetails: OrderDetail[];
}

export interface FilterState {
  startDate?: string;
  endDate?: string;
  categoryID?: number;
  country?: string;
  customerID?: string;
}

export interface CalculatedKPIs {
  totalNetSales: number;
  distinctOrdersCount: number;
  averageOrderValue: number;
  activeCustomersCount: number;
  totalFreight: number;
  averageDiscountRate: number;
  delayedOrdersCount: number;
}
