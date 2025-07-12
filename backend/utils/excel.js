const xlsx = require('xlsx');

exports.exportToExcel = (products) => {
  const worksheet = xlsx.utils.json_to_sheet(products.map(p => ({
    'Article': p.article,
    'Stock Type': p.stockType,
    'Color': p.color,
    'Size': p.size,
    'Cartons': p.cartons,
    'Pair/Carton': p.pairPerCarton,
    'MRP': p.mrp,
    'Rate': p.rate,
    'Packing': p.packing
  })));
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Products');
  return xlsx.write(workbook, { type: 'buffer' });
};

// Excel Import Function
exports.importFromExcel = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);
  return data;
};
