import { NextRequest, NextResponse } from 'next/server';
import {
  calculateKPIs,
  getSalesTrend,
  getCategorySales,
  getTopProducts,
  getTopCustomers,
  getOperationalAnomalies,
  getFilteredOrders,
  getOrderDrillDown,
  staticEntities,
} from '@/lib/analytics';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const orderId = searchParams.get('orderId');
  if (orderId) {
    const drilldown = getOrderDrillDown(Number(orderId));
    if (!drilldown) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json(drilldown);
  }

  const filters = {
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    categoryID: searchParams.get('categoryID') ? Number(searchParams.get('categoryID')) : undefined,
    customerID: searchParams.get('customerID') || undefined,
    country: searchParams.get('country') || undefined,
  };

  const kpis = calculateKPIs(filters);
  const salesTrend = getSalesTrend(filters);
  const categorySales = getCategorySales(filters);
  const topProducts = getTopProducts(filters, 5);
  const topCustomers = getTopCustomers(filters, 5);
  const anomalies = getOperationalAnomalies();
  const recentOrders = getFilteredOrders(filters).slice(-10).reverse();

  return NextResponse.json({
    filters,
    kpis,
    salesTrend,
    categorySales,
    topProducts,
    topCustomers,
    anomalies,
    recentOrders,
    entities: staticEntities,
  });
}
