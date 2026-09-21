/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');

const SQL_FILE_PATH = path.join(process.cwd(), 'InstNwnd_UTF8.txt');
const OUTPUT_DIR = path.join(process.cwd(), 'src', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'northwind.json');

function parseSqlValues(valuesString) {
  const result = [];
  let current = '';
  let inString = false;

  for (let i = 0; i < valuesString.length; i++) {
    const char = valuesString[i];
    if (char === "'" && (i === 0 || valuesString[i - 1] !== '\\')) {
      if (inString && valuesString[i + 1] === "'") {
        current += "'";
        i++;
      } else {
        inString = !inString;
      }
    } else if (char === ',' && !inString) {
      result.push(cleanValue(current.trim()));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(cleanValue(current.trim()));
  return result;
}

function cleanValue(val) {
  if (!val || val.toUpperCase() === 'NULL') return null;
  if (val.startsWith("N'") && val.endsWith("'")) return val.slice(2, -1);
  if (val.startsWith("'") && val.endsWith("'")) return val.slice(1, -1);
  if (!isNaN(val) && val !== '') return Number(val);
  return val;
}

function runExtraction() {
  if (!fs.existsSync(SQL_FILE_PATH)) {
    if (fs.existsSync(OUTPUT_FILE)) {
      console.log('ℹ️ فایل SQL در کانتینر یافت نشد اما northwind.json از قبل موجود است.');
      return;
    }
    console.warn('⚠️ فایل InstNwnd_UTF8.txt یافت نشد.');
    return;
  }

  console.log('🔄 در حال استخراج داده‌ها از InstNwnd_UTF8.txt...');
  const sqlContent = fs.readFileSync(SQL_FILE_PATH, 'utf-8');

  const categories = [];
  const customers = [];
  const employees = [];
  const shippers = [];
  const suppliers = [];
  const products = [];
  const orders = [];
  const orderDetails = [];

  // ۱. Categories
  const catRegex = /INSERT\s+"Categories"\s*\("CategoryID","CategoryName","Description","Picture"\)\s*VALUES\s*\(([^;]+)\)/gi;
  let match;
  while ((match = catRegex.exec(sqlContent)) !== null) {
    const vals = parseSqlValues(match[1]);
    categories.push({ categoryID: vals[0], categoryName: vals[1], description: vals[2] });
  }

  // ۲. Customers
  const custRegex = /INSERT\s+"Customers"\s*VALUES\s*\(([^)]+)\)/gi;
  while ((match = custRegex.exec(sqlContent)) !== null) {
    const vals = parseSqlValues(match[1]);
    customers.push({
      customerID: vals[0],
      companyName: vals[1],
      contactName: vals[2],
      contactTitle: vals[3],
      city: vals[5],
      country: vals[8],
      phone: vals[9],
    });
  }

  // ۳. Employees
  const empRegex = /INSERT\s+"Employees"\s*\([^)]+\)\s*VALUES\s*\(([\s\S]*?)\)(?:\r?\n|\s*go|\s*$)/gi;
  while ((match = empRegex.exec(sqlContent)) !== null) {
    const vals = parseSqlValues(match[1]);
    employees.push({
      employeeID: vals[0],
      lastName: vals[1],
      firstName: vals[2],
      title: vals[3],
      hireDate: vals[6],
      country: vals[11],
    });
  }

  // ۴. Shippers
  const shipRegex = /INSERT\s+"Shippers"\s*\([^)]+\)\s*VALUES\s*\(([^)]+)\)/gi;
  while ((match = shipRegex.exec(sqlContent)) !== null) {
    const vals = parseSqlValues(match[1]);
    shippers.push({ shipperID: vals[0], companyName: vals[1], phone: vals[2] });
  }

  // ۵. Products
  const prodRegex = /INSERT\s+"Products"\s*\([^)]+\)\s*VALUES\s*\(([^)]+)\)/gi;
  while ((match = prodRegex.exec(sqlContent)) !== null) {
    const vals = parseSqlValues(match[1]);
    products.push({
      productID: vals[0],
      productName: vals[1],
      supplierID: vals[2],
      categoryID: vals[3],
      quantityPerUnit: vals[4],
      unitPrice: Number(vals[5]),
      unitsInStock: Number(vals[6]),
      unitsOnOrder: Number(vals[7]),
      reorderLevel: Number(vals[8]),
      discontinued: Boolean(vals[9]),
    });
  }

  // ۶. Orders
  const orderRegex = /INSERT\s+INTO\s+"Orders"\s*\([^)]+\)\s*VALUES\s*\(([\s\S]*?)\)(?:\r?\n|go|$)/gi;
  while ((match = orderRegex.exec(sqlContent)) !== null) {
    const vals = parseSqlValues(match[1]);
    orders.push({
      orderID: vals[0],
      customerID: vals[1],
      employeeID: vals[2],
      orderDate: vals[3],
      requiredDate: vals[4],
      shippedDate: vals[5],
      shipVia: vals[6],
      freight: Number(vals[7]),
      shipName: vals[8],
      shipCity: vals[10],
      shipCountry: vals[13],
    });
  }

  // ۷. Order Details
  const detailRegex = /INSERT\s+"Order Details"\s*VALUES\s*\(([^)]+)\)/gi;
  while ((match = detailRegex.exec(sqlContent)) !== null) {
    const vals = parseSqlValues(match[1]);
    orderDetails.push({
      orderID: vals[0],
      productID: vals[1],
      unitPrice: Number(vals[2]),
      quantity: Number(vals[3]),
      discount: Number(vals[4]),
    });
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const outputData = {
    metadata: {
      generatedAt: new Date().toISOString(),
      referenceDate: '1998-05-06',
      counts: {
        categories: categories.length,
        customers: customers.length,
        employees: employees.length,
        shippers: shippers.length,
        products: products.length,
        orders: orders.length,
        orderDetails: orderDetails.length,
      },
    },
    categories,
    customers,
    employees,
    shippers,
    products,
    orders,
    orderDetails,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2), 'utf-8');
  console.log(`✅ فایل src/data/northwind.json ساخته شد (${orders.length} سفارش و ${orderDetails.length} ردیف).`);
}

runExtraction();
