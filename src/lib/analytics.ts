import rawData from '@/data/northwind.json';
import { NorthwindDataset, FilterParams } from '@/types/northwind';

const data = rawData as unknown as NorthwindDataset;

export const REFERENCE_DATE = data.metadata?.referenceDate || '1998-05-06';

export function getLineItemNetSales(item: { unitPrice: number; quantity: number; discount: number }): number {
  return Number((item.unitPrice * item.quantity * (1 - item.discount)).toFixed(2));
}

const detailsByOrderId = new Map<number, typeof data.orderDetails>();
(data.orderDetails || []).forEach((d) => {
  const current = detailsByOrderId.get(d.orderID) || [];
  current.push(d);
  detailsByOrderId.set(d.orderID, current);
});

export function getFilteredOrders(filters: FilterParams = {}) {
  return (data.orders || []).filter((order) => {
    const orderDate = new Date(order.orderDate).getTime();
    if (filters.startDate && orderDate < new Date(filters.startDate).getTime()) return false;
    if (filters.endDate && orderDate > new Date(filters.endDate).getTime()) return false;
    if (filters.customerID && order.customerID !== filters.customerID) return false;
    if (filters.country && order.shipCountry !== filters.country) return false;

    if (filters.categoryID) {
      const items = detailsByOrderId.get(order.orderID) || [];
      const hasCat = items.some((it) => {
        const prod = data.products.find((p) => p.productID === it.productID);
        return prod && prod.categoryID === Number(filters.categoryID);
      });
      if (!hasCat) return false;
    }

    return true;
  });
}

export function calculateKPIs(filters: FilterParams = {}) {
  const filteredOrders = getFilteredOrders(filters);
  const orderIds = new Set(filteredOrders.map((o) => o.orderID));

  let totalNetSales = 0;
  let totalItemsCount = 0;
  let totalDiscountLost = 0;

  (data.orderDetails || []).forEach((item) => {
    if (orderIds.has(item.orderID)) {
      if (filters.categoryID) {
        const prod = data.products.find((p) => p.productID === item.productID);
        if (!prod || prod.categoryID !== Number(filters.categoryID)) return;
      }
      const net = getLineItemNetSales(item);
      const gross = item.unitPrice * item.quantity;
      totalNetSales += net;
      totalItemsCount += item.quantity;
      totalDiscountLost += gross - net;
    }
  });

  const totalOrders = filteredOrders.length;
  const aov = totalOrders > 0 ? totalNetSales / totalOrders : 0;
  const activeCustomersCount = new Set(filteredOrders.map((o) => o.customerID)).size;
  const totalFreight = filteredOrders.reduce((sum, o) => sum + (o.freight || 0), 0);

  const delayedOrders = filteredOrders.filter(
    (o) => o.shippedDate && new Date(o.shippedDate).getTime() > new Date(o.requiredDate).getTime()
  );

  return {
    totalNetSales: Math.round(totalNetSales * 100) / 100,
    totalOrders,
    averageOrderValue: Math.round(aov * 100) / 100,
    activeCustomersCount,
    totalFreight: Math.round(totalFreight * 100) / 100,
    totalItemsCount,
    totalDiscountLost: Math.round(totalDiscountLost * 100) / 100,
    delayedOrdersCount: delayedOrders.length,
    referenceDate: REFERENCE_DATE,
  };
}

export function getSalesTrend(filters: FilterParams = {}) {
  const filteredOrders = getFilteredOrders(filters);
  const orderIds = new Set(filteredOrders.map((o) => o.orderID));
  const monthlyData: Record<string, { month: string; netSales: number; ordersCount: number }> = {};

  filteredOrders.forEach((o) => {
    const d = new Date(o.orderDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyData[key]) {
      monthlyData[key] = { month: key, netSales: 0, ordersCount: 0 };
    }
    monthlyData[key].ordersCount += 1;
  });

  (data.orderDetails || []).forEach((item) => {
    if (orderIds.has(item.orderID)) {
      if (filters.categoryID) {
        const prod = data.products.find((p) => p.productID === item.productID);
        if (!prod || prod.categoryID !== Number(filters.categoryID)) return;
      }
      const ord = data.orders.find((o) => o.orderID === item.orderID);
      if (ord) {
        const d = new Date(ord.orderDate);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData[key]) {
          monthlyData[key].netSales += getLineItemNetSales(item);
        }
      }
    }
  });

  return Object.values(monthlyData)
    .map((m) => ({ ...m, netSales: Math.round(m.netSales) }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function getCategorySales(filters: FilterParams = {}) {
  const filteredOrders = getFilteredOrders(filters);
  const orderIds = new Set(filteredOrders.map((o) => o.orderID));
  const catSales: Record<number, number> = {};

  (data.orderDetails || []).forEach((item) => {
    if (orderIds.has(item.orderID)) {
      const prod = data.products.find((p) => p.productID === item.productID);
      if (!prod) return;
      catSales[prod.categoryID] = (catSales[prod.categoryID] || 0) + getLineItemNetSales(item);
    }
  });

  return (data.categories || []).map((c) => ({
    categoryID: c.categoryID,
    categoryName: c.categoryName,
    netSales: Math.round(catSales[c.categoryID] || 0),
  })).sort((a, b) => b.netSales - a.netSales);
}

export function getTopProducts(filters: FilterParams = {}, limit = 5) {
  const filteredOrders = getFilteredOrders(filters);
  const orderIds = new Set(filteredOrders.map((o) => o.orderID));
  const prodMap = new Map<number, { sales: number; quantity: number }>();

  (data.orderDetails || []).forEach((it) => {
    if (orderIds.has(it.orderID)) {
      const current = prodMap.get(it.productID) || { sales: 0, quantity: 0 };
      current.sales += getLineItemNetSales(it);
      current.quantity += it.quantity;
      prodMap.set(it.productID, current);
    }
  });

  const list = Array.from(prodMap.entries()).map(([productId, metrics]) => {
    const prod = data.products.find((p) => p.productID === productId);
    const cat = data.categories.find((c) => c.categoryID === prod?.categoryID);
    return {
      productID: productId,
      productName: prod ? prod.productName : 'نامشخص',
      categoryName: cat ? cat.categoryName : 'نامشخص',
      totalSales: Math.round(metrics.sales),
      totalQuantity: metrics.quantity,
    };
  });

  return list.sort((a, b) => b.totalSales - a.totalSales).slice(0, limit);
}

export function getTopCustomers(filters: FilterParams = {}, limit = 5) {
  const filteredOrders = getFilteredOrders(filters);
  const orderIds = new Set(filteredOrders.map((o) => o.orderID));
  const custMap = new Map<string, { sales: number; orderCount: number }>();

  filteredOrders.forEach((o) => {
    const cur = custMap.get(o.customerID) || { sales: 0, orderCount: 0 };
    cur.orderCount += 1;
    custMap.set(o.customerID, cur);
  });

  (data.orderDetails || []).forEach((it) => {
    if (orderIds.has(it.orderID)) {
      const order = data.orders.find((o) => o.orderID === it.orderID);
      if (order) {
        const cur = custMap.get(order.customerID);
        if (cur) cur.sales += getLineItemNetSales(it);
      }
    }
  });

  return Array.from(custMap.entries())
    .map(([custId, metrics]) => {
      const customer = data.customers.find((c) => c.customerID === custId);
      return {
        customerID: custId,
        companyName: customer ? customer.companyName : custId,
        country: customer ? customer.country : 'نامشخص',
        totalSales: Math.round(metrics.sales),
        orderCount: metrics.orderCount,
      };
    })
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, limit);
}

export function getOrderDrillDown(orderId: number) {
  const order = (data.orders || []).find((o) => o.orderID === orderId);
  if (!order) return null;

  const customer = data.customers.find((c) => c.customerID === order.customerID);
  const employee = data.employees.find((e) => e.employeeID === order.employeeID);
  const shipper = data.shippers.find((s) => s.shipperID === order.shipVia);
  const items = (detailsByOrderId.get(orderId) || []).map((it) => {
    const prod = data.products.find((p) => p.productID === it.productID);
    return {
      productID: it.productID,
      productName: prod ? prod.productName : 'نامشخص',
      unitPrice: it.unitPrice,
      quantity: it.quantity,
      discount: it.discount,
      extendedPrice: getLineItemNetSales(it),
    };
  });

  const netTotal = items.reduce((sum, item) => sum + item.extendedPrice, 0);

  return {
    order,
    customer,
    employee,
    shipper,
    items,
    netTotal: Math.round(netTotal * 100) / 100,
  };
}

export function getOperationalAnomalies() {
  const delayed = (data.orders || [])
    .filter((o) => o.shippedDate && new Date(o.shippedDate) > new Date(o.requiredDate))
    .map((o) => {
      const cust = data.customers.find((c) => c.customerID === o.customerID);
      const delayDays = Math.ceil(
        (new Date(o.shippedDate!).getTime() - new Date(o.requiredDate).getTime()) / (1000 * 3600 * 24)
      );
      return {
        orderID: o.orderID,
        customerName: cust?.companyName || o.customerID,
        orderDate: o.orderDate,
        requiredDate: o.requiredDate,
        shippedDate: o.shippedDate,
        delayDays,
      };
    })
    .sort((a, b) => b.delayDays - a.delayDays)
    .slice(0, 5);

  const lowStock = (data.products || [])
    .filter((p) => !p.discontinued && p.unitsInStock <= p.reorderLevel && p.unitsOnOrder === 0)
    .map((p) => ({
      productID: p.productID,
      productName: p.productName,
      unitsInStock: p.unitsInStock,
      reorderLevel: p.reorderLevel,
    }))
    .slice(0, 5);

  return { delayed, lowStock };
}

export const staticEntities = {
  categories: data.categories || [],
  countries: Array.from(new Set((data.customers || []).map((c) => c.country))).sort(),
  customers: (data.customers || []).map((c) => ({ id: c.customerID, name: c.companyName })),
};
