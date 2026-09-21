import fs from 'fs';
import path from 'path';

export function extractNorthwindData(sqlContent) {
  const data = {
    categories: [],
    customers: [],
    employees: [],
    shippers: [],
    suppliers: [],
    products: [],
    orders: [],
    orderDetails: []
  };

  // استخراج Categories (حذف باینری)
  const catRegex = /INSERT\s+"Categories"\([^)]+\)\s+VALUES\((\d+),'([^']+)',(?:'([^']*)'|NULL),0x[0-9A-F]+\)/gi;
  let match;
  while ((match = catRegex.exec(sqlContent)) !== null) {
    data.categories.push({
      categoryID: parseInt(match[1]),
      categoryName: match[2],
      description: match[3] || ''
    });
  }

  // استخراج Customers
  const custRegex = /INSERT\s+"Customers"\s+VALUES\('([^']+)','([^']+)','([^']*)',(?:'([^']*)'|NULL),'([^']*)','([^']*)',(?:'([^']*)'|NULL),(?:'([^']*)'|NULL),'([^']*)','([^']*)',(?:'([^']*)'|NULL)\)/gi;
  while ((match = custRegex.exec(sqlContent)) !== null) {
    data.customers.push({
      customerID: match[1],
      companyName: match[2],
      contactName: match[3],
      contactTitle: match[4] || '',
      city: match[6],
      country: match[9]
    });
  }

  // استخراج Employees
  const empRegex = /INSERT\s+"Employees"\([^)]+\)\s+VALUES\((\d+),'([^']+)','([^']+)','([^']*)','([^']*)','([^']*)','([^']*)','([^']*)','([^']*)',(?:'([^']*)'|NULL),'([^']*)','([^']*)','([^']*)','([^']*)',0x[0-9A-F]+,(?:'([^']*)'|NULL),(?:(\d+)|NULL)/gi;
  while ((match = empRegex.exec(sqlContent)) !== null) {
    data.employees.push({
      employeeID: parseInt(match[1]),
      lastName: match[2],
      firstName: match[3],
      title: match[4],
      titleOfCourtesy: match[5],
      city: match[9],
      country: match[12],
      reportsTo: match[16] ? parseInt(match[16]) : null
    });
  }

  // استخراج Shippers
  const shipRegex = /INSERT\s+"Shippers"\([^)]+\)\s+VALUES\((\d+),'([^']+)','([^']+)'\)/gi;
  while ((match = shipRegex.exec(sqlContent)) !== null) {
    data.shippers.push({
      shipperID: parseInt(match[1]),
      companyName: match[2],
      phone: match[3]
    });
  }

  // استخراج Suppliers
  const suppRegex = /INSERT\s+"Suppliers"\([^)]+\)\s+VALUES\((\d+),'([^']+)','([^']*)','([^']*)','([^']*)','([^']*)',(?:'([^']*)'|NULL),(?:'([^']*)'|NULL),'([^']*)','([^']*)'/gi;
  while ((match = suppRegex.exec(sqlContent)) !== null) {
    data.suppliers.push({
      supplierID: parseInt(match[1]),
      companyName: match[2],
      contactName: match[3],
      contactTitle: match[4],
      city: match[6],
      country: match[9]
    });
  }

  // استخراج Products
  const prodRegex = /INSERT\s+"Products"\([^)]+\)\s+VALUES\((\d+),'([^']+)',(\d+),(\d+),'([^']*)',([0-9.]+),(\d+),(\d+),(\d+),([01])\)/gi;
  while ((match = prodRegex.exec(sqlContent)) !== null) {
    data.products.push({
      productID: parseInt(match[1]),
      productName: match[2],
      supplierID: parseInt(match[3]),
      categoryID: parseInt(match[4]),
      quantityPerUnit: match[5],
      unitPrice: parseFloat(match[6]),
      unitsInStock: parseInt(match[7]),
      unitsOnOrder: parseInt(match[8]),
      reorderLevel: parseInt(match[9]),
      discontinued: match[10] === '1'
    });
  }

  // استخراج Orders
  const orderRegex = /VALUES\s*\((\d+),N'([^']+)',(\d+),'([^']+)','([^']+)','?([^',)]+)'?,(\d+),([0-9.]+),N'([^']*)',N'([^']*)',N'([^']*)',/gi;
  while ((match = orderRegex.exec(sqlContent)) !== null) {
    data.orders.push({
      orderID: parseInt(match[1]),
      customerID: match[2],
      employeeID: parseInt(match[3]),
      orderDate: match[4],
      requiredDate: match[5],
      shippedDate: match[6] === 'NULL' ? null : match[6],
      shipVia: parseInt(match[7]),
      freight: parseFloat(match[8]),
      shipCity: match[11],
      shipCountry: match[10]
    });
  }

  // استخراج Order Details
  const detailRegex = /INSERT\s+"Order Details"\s+VALUES\((\d+),(\d+),([0-9.]+),(\d+),([0-9.]+)\)/gi;
  while ((match = detailRegex.exec(sqlContent)) !== null) {
    data.orderDetails.push({
      orderID: parseInt(match[1]),
      productID: parseInt(match[2]),
      unitPrice: parseFloat(match[3]),
      quantity: parseInt(match[4]),
      discount: parseFloat(match[5])
    });
  }

  return data;
}
