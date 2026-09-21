import dbData from '@/data/northwind.json';
import { FilterState, CalculatedKPIs, Order, OrderDetail, Product, Customer, Category } from './types';

export const db = dbData as {
  categories: Category[];
  customers: Customer[];
  products: Product[];
  orders: Order[];
  orderDetails: OrderDetail[];
};

export const ANCHOR_DATE = '1998-05-06';

// محاسبه خطی خالص فروش برای یک ردیف
export function calculateLineNetSales(detail: OrderDetail): number {
  return detail.unitPrice * detail.quantity * (1 - detail.discount);
}

// فیلتر کردن هوشمند سفارش‌ها بدون تکرار (Anti-duplication)
export function getFilteredOrders(filters: FilterState): Order[] {
  return db.orders.filter(order => {
    if (filters.startDate && new Date(order.orderDate) < new Date(filters.startDate)) return false;
    if (filters.endDate && new Date(order.orderDate) > new Date(filters.endDate)) return false;
    if (filters.country && order.shipCountry !== filters.country) return false;
    if (filters.customerID && order.customerID !== filters.customerID) return false;

    if (filters.categoryID) {
      const orderItems = db.orderDetails.filter(od => od.orderID === order.orderID);
      const hasCategory = orderItems.some(od => {
        const prod = db.products.find(p => p.productID === od.productID);
        return prod?.categoryID === filters.categoryID;
      });
      if (!hasCategory) return false;
    }

    return true;
  });
}

// محاسبه جامع KPIها
export function calculateKPIs(filters: FilterState): CalculatedKPIs {
  const filteredOrders = getFilteredOrders(filters);
  const orderIdSet = new Set(filteredOrders.map(o => o.orderID));

  let totalNetSales = 0;
  let totalDiscountVal = 0;
  let totalGrossSales = 0;

  const relevantDetails = db.orderDetails.filter(od => {
    if (!orderIdSet.has(od.orderID)) return false;
    if (filters.categoryID) {
      const prod = db.products.find(p => p.productID === od.productID);
      return prod?.categoryID === filters.categoryID;
    }
    return true;
  });

  for (const detail of relevantDetails) {
    const net = calculateLineNetSales(detail);
    const gross = detail.unitPrice * detail.quantity;
    totalNetSales += net;
    totalGrossSales += gross;
    totalDiscountVal += (gross * detail.discount);
  }

  // تجمیع هزینه حمل از خود جدول سفارش‌ها (جلوگیری از ضرب در تعداد اقلام)
  const totalFreight = filteredOrders.reduce((sum, o) => sum + o.freight, 0);

  const distinctOrdersCount = filteredOrders.length;
  const averageOrderValue = distinctOrdersCount > 0 ? totalNetSales / distinctOrdersCount : 0;
  
  const activeCustomersCount = new Set(filteredOrders.map(o => o.customerID)).size;
  const averageDiscountRate = totalGrossSales > 0 ? (totalDiscountVal / totalGrossSales) * 100 : 0;

  // سفارش‌های با تأخیر در ارسال
  const delayedOrdersCount = filteredOrders.filter(o => {
    if (!o.shippedDate) return false;
    return new Date(o.shippedDate) > new Date(o.requiredDate);
  }).length;

  return {
    totalNetSales: Math.round(totalNetSales * 100) / 100,
    distinctOrdersCount,
    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
    activeCustomersCount,
    totalFreight: Math.round(totalFreight * 100) / 100,
    averageDiscountRate: Math.round(averageDiscountRate * 10) / 10,
    delayedOrdersCount
  };
}

// روند فروش ماهانه
export function getMonthlySalesTrend(filters: FilterState) {
  const filteredOrders = getFilteredOrders(filters);
  const orderIdSet = new Set(filteredOrders.map(o => o.orderID));

  const monthlyMap = new Map<string, { month: string; netSales: number; orderCount: number }>();

  filteredOrders.forEach(order => {
    const d = new Date(order.orderDate);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, { month: monthKey, netSales: 0, orderCount: 0 });
    }
    monthlyMap.get(monthKey)!.orderCount += 1;
  });

  db.orderDetails.forEach(detail => {
    if (!orderIdSet.has(detail.orderID)) return;
    if (filters.categoryID) {
      const prod = db.products.find(p => p.productID === detail.productID);
      if (prod?.categoryID !== filters.categoryID) return;
    }
    const order = db.orders.find(o => o.orderID === detail.orderID)!;
    const d = new Date(order.orderDate);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyMap.has(monthKey)) {
      monthlyMap.get(monthKey)!.netSales += calculateLineNetSales(detail);
    }
  });

  return Array.from(monthlyMap.values())
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(m => ({ ...m, netSales: Math.round(m.netSales) }));
}

// ۵ محصول و ۵ مشتری برتر
export function getTopEntities(filters: FilterState) {
  const filteredOrders = getFilteredOrders(filters);
  const orderIdSet = new Set(filteredOrders.map(o => o.orderID));

  const productMap = new Map<number, { name: string; revenue: number; quantity: number }>();
  const customerMap = new Map<string, { name: string; revenue: number; ordersCount: number }>();

  // نگاشت مشتریان
  filteredOrders.forEach(order => {
    const cust = db.customers.find(c => c.customerID === order.customerID);
    const name = cust?.companyName || order.customerID;
    if (!customerMap.has(order.customerID)) {
      customerMap.set(order.customerID, { name, revenue: 0, ordersCount: 0 });
    }
    customerMap.get(order.customerID)!.ordersCount += 1;
  });

  // نگاشت فروش محصولات و تکمیل مبالغ مشتریان
  db.orderDetails.forEach(detail => {
    if (!orderIdSet.has(detail.orderID)) return;
    const prod = db.products.find(p => p.productID === detail.productID);
    if (filters.categoryID && prod?.categoryID !== filters.categoryID) return;

    const net = calculateLineNetSales(detail);

    // افزودن به محصول
    if (!productMap.has(detail.productID)) {
      productMap.set(detail.productID, { name: prod?.productName || 'نامشخص', revenue: 0, quantity: 0 });
    }
    const pRecord = productMap.get(detail.productID)!;
    pRecord.revenue += net;
    pRecord.quantity += detail.quantity;

    // افزودن به مشتری
    const order = db.orders.find(o => o.orderID === detail.orderID);
    if (order && customerMap.has(order.customerID)) {
      customerMap.get(order.customerID)!.revenue += net;
    }
  });

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map(p => ({ ...p, revenue: Math.round(p.revenue) }));

  const topCustomers = Array.from(customerMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map(c => ({ ...c, revenue: Math.round(c.revenue) }));

  return { topProducts, topCustomers };
}

// بررسی مسائل، خطاها و ریسک‌های تجاری مبتنی بر داده واقعی
export function getBusinessAnomalies(filters: FilterState) {
  const filteredOrders = getFilteredOrders(filters);

  // ۱. سفارش‌های ارسالی با تاخیر
  const delayedShipments = filteredOrders
    .filter(o => o.shippedDate && new Date(o.shippedDate) > new Date(o.requiredDate))
    .map(o => ({
      orderID: o.orderID,
      customer: db.customers.find(c => c.customerID === o.customerID)?.companyName,
      delayDays: Math.ceil((new Date(o.shippedDate!).getTime() - new Date(o.requiredDate).getTime()) / (1000 * 3600 * 24))
    }))
    .sort((a, b) => b.delayDays - a.delayDays)
    .slice(0, 5);

  // ۲. محصولات نیازمند تامین فوری
  const stockAlerts = db.products
    .filter(p => !p.discontinued && p.unitsInStock <= p.reorderLevel)
    .map(p => ({
      productID: p.productID,
      name: p.productName,
      stock: p.unitsInStock,
      reorderLevel: p.reorderLevel,
      deficit: p.reorderLevel - p.unitsInStock
    }))
    .sort((a, b) => b.deficit - a.deficit)
    .slice(0, 5);

  return { delayedShipments, stockAlerts };
}
