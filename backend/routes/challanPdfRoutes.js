

// const express = require('express');
// const router = express.Router();
// const PDFDocument = require('pdfkit');
// const Challan = require('../models/Challan');
// const mongoose = require('mongoose');

// router.get('/:id', async (req, res) => {
//   try {
//     // ID validation
//     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
//       return res.status(400).json({
//         success: false,
//         error: "Invalid Challan ID format"
//       });
//     }

//     const challan = await Challan.findById(req.params.id);
    
//     if (!challan) {
//       return res.status(404).json({ 
//         success: false, 
//         error: 'Challan not found' 
//       });
//     }

//     // PDF headers
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename="challan-${challan.invoiceNo.replace('/', '-')}.pdf"`);

//     // Create PDF document
//     const doc = new PDFDocument({ 
//       margin: 40,
//       size: 'A4'
//     });
    
//     doc.pipe(res);

//     // ✅ HEADER SECTION
//     doc.fontSize(20).font('Helvetica-Bold').text('GPFAX FOOTWEAR', { align: 'center' });
//     doc.fontSize(14).font('Helvetica').text('ESTIMATE', { align: 'center' });
    
//     // Original Copy (top right)
//     doc.fontSize(10).font('Helvetica').text('Original Copy', 450, 80);
    
//     doc.moveDown(1.5);

//     // ✅ PARTY DETAILS SECTION - Improved Layout
//     const leftCol = 50;
//     const rightCol = 320;
//     let leftY = doc.y;
//     let rightY = leftY;

//     // Left column with dynamic width handling
//     doc.fontSize(10).font('Helvetica-Bold');
    
//     // Party Name with proper wrapping
//     doc.text('Party Name', leftCol, leftY, { continued: true });
//     doc.font('Helvetica').text(` : ${challan.partyName}`, { 
//       width: rightCol - leftCol - 20,
//       continued: false 
//     });
//     leftY = doc.y + 8;
    
//     // L.R. No.
//     doc.font('Helvetica-Bold').text('L.R. No.', leftCol, leftY, { continued: true });
//     doc.font('Helvetica').text(' : ____________________', { continued: false });

//     // Right column - Calculate total cartons first
//     const totalCartons = challan.items.reduce((sum, item) => sum + item.cartons, 0);
    
//     const formattedDate = new Date(challan.date).toLocaleDateString('en-IN', {
//       day: '2-digit',
//       month: '2-digit',
//       year: 'numeric'
//     });
    
//     // Right column fields with consistent spacing
//     const rightFields = [
//       { label: 'Date', value: formattedDate },
//       { label: 'Invoice No.', value: challan.invoiceNo },
//       { label: 'Station', value: challan.station },
//       { label: 'Marka', value: challan.marka || 'N/A' },
//       { label: 'Transport', value: challan.transport },
//       { label: 'Cartons', value: totalCartons.toString() }
//     ];

//     rightFields.forEach((field, index) => {
//       const y = rightY + (index * 16);
//       doc.font('Helvetica-Bold').text(field.label, rightCol, y, { continued: true });
//       doc.font('Helvetica').text(` : ${field.value}`, { continued: false });
//     });

//     doc.moveDown(2);

//     // ✅ TABLE SECTION - Improved positioning
//     const tableTop = doc.y + 10;
//     const tableLeft = 40;
    
//     // Column definitions (adjusted widths to match your image)
//     const columns = [
//       { label: 'Article Name', x: tableLeft, width: 100 },
//       { label: 'Color', x: tableLeft + 100, width: 70 },
//       { label: 'Size', x: tableLeft + 170, width: 45 },
//       { label: 'No. of\nCRTN', x: tableLeft + 215, width: 50 },
//       { label: 'Pair/\nCRTN', x: tableLeft + 265, width: 50 },
//       { label: 'Total\nPair', x: tableLeft + 315, width: 50 },
//       { label: 'Rate/\nPair', x: tableLeft + 365, width: 65 },
//       { label: 'Amount', x: tableLeft + 430, width: 80 }
//     ];

//     // Draw table header with improved styling
//     let headerY = tableTop;
//     doc.fontSize(9).font('Helvetica-Bold'); // ✅ Fixed syntax error

//     columns.forEach(col => {
//       doc.text(col.label, col.x, headerY, { 
//         width: col.width, 
//         align: 'center' 
//       });
//     });

//     // Header border
//     const tableWidth = columns[columns.length - 1].x + columns[columns.length - 1].width - tableLeft;
//     doc.rect(tableLeft, headerY - 5, tableWidth, 25).stroke();
    
//     // Vertical lines for header
//     let currentX = tableLeft;
//     columns.forEach(col => {
//       currentX += col.width;
//       if (currentX < tableLeft + tableWidth) {
//         doc.moveTo(currentX, headerY - 5).lineTo(currentX, headerY + 20).stroke();
//       }
//     });

//     // ✅ TABLE ROWS
//     let rowY = headerY + 25;
//     let totalAmount = 0;
//     let serialNo = 1;

//     doc.font('Helvetica').fontSize(8);

//     challan.items.forEach(item => {
//       // Row border
//       doc.rect(tableLeft, rowY, tableWidth, 15).stroke();
      
//       // Vertical lines
//       currentX = tableLeft;
//       columns.forEach(col => {
//         currentX += col.width;
//         if (currentX < tableLeft + tableWidth) {
//           doc.moveTo(currentX, rowY).lineTo(currentX, rowY + 15).stroke();
//         }
//       });

//       // Row data
//       const rowData = [
//         `${serialNo}. ${item.article}`,
//         item.color,
//         item.size,
//         item.cartons.toString(),
//         item.pairPerCarton.toString(),
//         item.totalPair.toString(),
//         `Rs. ${item.rate.toFixed(2)}`,
//         `Rs. ${item.amount.toFixed(2)}`
//       ];

//       columns.forEach((col, index) => {
//         doc.text(rowData[index], col.x + 2, rowY + 3, { 
//           width: col.width - 4, 
//           align: index === 0 ? 'left' : 'center' 
//         });
//       });

//       totalAmount += item.amount;
//       rowY += 15;
//       serialNo++;
//     });

//     // ✅ TOTALS SECTION
//     rowY += 10;
    
//     // Total cartons and pairs
//     const totalPairs = challan.items.reduce((sum, item) => sum + item.totalPair, 0);
    
//     doc.fontSize(10).font('Helvetica-Bold');
//     doc.text(`Totals c/o`, tableLeft, rowY);
//     doc.text(`${totalCartons} Cart`, tableLeft + 2, rowY, { align: 'center' });
//     doc.text(`${totalPairs}`, tableLeft + 90, rowY, { align: 'center' });
    
//     // Final total amount
//     rowY += 20;
//     doc.fontSize(12).font('Helvetica-Bold');
//     doc.text(`Grand Total: Rs. ${totalAmount.toFixed(2)}`, tableLeft + 350, rowY);

//     doc.end();

//   } catch (err) {
//     console.error('PDF generation error:', err);
//     res.status(500).json({ 
//       success: false, 
//       error: 'Failed to generate PDF' 
//     });
//   }
// });

// module.exports = router;
// const express = require('express');
// const router = express.Router();
// const PDFDocument = require('pdfkit');
// const Challan = require('../models/Challan');
// const Product = require('../models/Product');
// const mongoose = require('mongoose');
// const axios = require('axios');

// // Helper functions for products PDF
// function getVirtualGroup(stockType, gender) {
//   const st = (stockType || '').toLowerCase();
//   const gen = (gender || '').toLowerCase();
//   if (st === 'pu') {
//     if (gen === 'ladies') return { group: 'PU LADIES', order: 7 };
//     if (gen === 'kids_ladies') return { group: 'PU KID LADIES', order: 8 };
//     if (gen === 'gents') return { group: 'PU GENTS', order: 9 };
//     if (gen === 'kids_gents') return { group: 'PU KIDS GENTS', order: 10 };
//     return { group: 'PU OTHER', order: 11 };
//   }
//   if (st === 'eva') {
//     if (gen === 'ladies') return { group: 'EVA LADIES', order: 2 };
//     if (gen === 'kids_ladies') return { group: 'EVA KID LADIES', order: 3 };
//     if (gen === 'gents') return { group: 'EVA GENTS', order: 4 };
//     if (gen === 'kids_gents') return { group: 'EVA KIDS GENTS', order: 5 };
//     return { group: 'EVA OTHER', order: 6 };
//   }
//   return { group: 'OTHER', order: 99 };
// }

// function extractSeriesPref(series) {
//   const match = (series || '').match(/^(\d+)/);
//   return match ? parseInt(match[1], 10) : Infinity;
// }

// // Route 1: Original Challan PDF (Your working code - unchanged)
// router.get('/:id', async (req, res) => {
//   try {
//     // ID validation
//     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
//       return res.status(400).json({
//         success: false,
//         error: "Invalid Challan ID format"
//       });
//     }

//     const challan = await Challan.findById(req.params.id);
    
//     if (!challan) {
//       return res.status(404).json({ 
//         success: false, 
//         error: 'Challan not found' 
//       });
//     }

//     // PDF headers
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename="challan-${challan.invoiceNo.replace('/', '-')}.pdf"`);

//     // Create PDF document
//     const doc = new PDFDocument({ 
//       margin: 40,
//       size: 'A4'
//     });
    
//     doc.pipe(res);

//     // ✅ HEADER SECTION
//     doc.fontSize(20).font('Helvetica-Bold').text('GPFAX FOOTWEAR', { align: 'center' });
//     doc.fontSize(14).font('Helvetica').text('ESTIMATE', { align: 'center' });
    
//     // Original Copy (top right)
//     doc.fontSize(10).font('Helvetica').text('Original Copy', 450, 80);
    
//     doc.moveDown(1.5);

//     // ✅ PARTY DETAILS SECTION - Improved Layout
//     const leftCol = 50;
//     const rightCol = 320;
//     let leftY = doc.y;
//     let rightY = leftY;

//     // Left column with dynamic width handling
//     doc.fontSize(10).font('Helvetica-Bold');
    
//     // Party Name with proper wrapping
//     doc.text('Party Name', leftCol, leftY, { continued: true });
//     doc.font('Helvetica').text(` : ${challan.partyName}`, { 
//       width: rightCol - leftCol - 20,
//       continued: false 
//     });
//     leftY = doc.y + 8;
    
//     // L.R. No.
//     doc.font('Helvetica-Bold').text('L.R. No.', leftCol, leftY, { continued: true });
//     doc.font('Helvetica').text(' : ____________________', { continued: false });

//     // Right column - Calculate total cartons first
//     const totalCartons = challan.items.reduce((sum, item) => sum + item.cartons, 0);
    
//     const formattedDate = new Date(challan.date).toLocaleDateString('en-IN', {
//       day: '2-digit',
//       month: '2-digit',
//       year: 'numeric'
//     });
    
//     // Right column fields with consistent spacing
//     const rightFields = [
//       { label: 'Date', value: formattedDate },
//       { label: 'Invoice No.', value: challan.invoiceNo },
//       { label: 'Station', value: challan.station },
//       { label: 'Marka', value: challan.marka || 'N/A' },
//       { label: 'Transport', value: challan.transport },
//       { label: 'Cartons', value: totalCartons.toString() }
//     ];

//     rightFields.forEach((field, index) => {
//       const y = rightY + (index * 16);
//       doc.font('Helvetica-Bold').text(field.label, rightCol, y, { continued: true });
//       doc.font('Helvetica').text(` : ${field.value}`, { continued: false });
//     });

//     doc.moveDown(2);

//     // ✅ TABLE SECTION - Improved positioning
//     const tableTop = doc.y + 10;
//     const tableLeft = 40;
    
//     // Column definitions (adjusted widths to match your image)
//     const columns = [
//       { label: 'Article Name', x: tableLeft, width: 100 },
//       { label: 'Color', x: tableLeft + 100, width: 70 },
//       { label: 'Size', x: tableLeft + 170, width: 45 },
//       { label: 'No. of\nCRTN', x: tableLeft + 215, width: 50 },
//       { label: 'Pair/\nCRTN', x: tableLeft + 265, width: 50 },
//       { label: 'Total\nPair', x: tableLeft + 315, width: 50 },
//       { label: 'Rate/\nPair', x: tableLeft + 365, width: 65 },
//       { label: 'Amount', x: tableLeft + 430, width: 80 }
//     ];

//     // Draw table header with improved styling
//     let headerY = tableTop;
//     doc.fontSize(9).font('Helvetica-Bold');

//     columns.forEach(col => {
//       doc.text(col.label, col.x, headerY, { 
//         width: col.width, 
//         align: 'center' 
//       });
//     });

//     // Header border
//     const tableWidth = columns[columns.length - 1].x + columns[columns.length - 1].width - tableLeft;
//     doc.rect(tableLeft, headerY - 5, tableWidth, 25).stroke();
    
//     // Vertical lines for header
//     let currentX = tableLeft;
//     columns.forEach(col => {
//       currentX += col.width;
//       if (currentX < tableLeft + tableWidth) {
//         doc.moveTo(currentX, headerY - 5).lineTo(currentX, headerY + 20).stroke();
//       }
//     });

//     // ✅ TABLE ROWS
//     let rowY = headerY + 25;
//     let totalAmount = 0;
//     let serialNo = 1;

//     doc.font('Helvetica').fontSize(8);

//     challan.items.forEach(item => {
//       // Row border
//       doc.rect(tableLeft, rowY, tableWidth, 15).stroke();
      
//       // Vertical lines
//       currentX = tableLeft;
//       columns.forEach(col => {
//         currentX += col.width;
//         if (currentX < tableLeft + tableWidth) {
//           doc.moveTo(currentX, rowY).lineTo(currentX, rowY + 15).stroke();
//         }
//       });

//       // Row data
//       const rowData = [
//         `${serialNo}. ${item.article}`,
//         item.color,
//         item.size,
//         item.cartons.toString(),
//         item.pairPerCarton.toString(),
//         item.totalPair.toString(),
//         `Rs. ${item.rate.toFixed(2)}`,
//         `Rs. ${item.amount.toFixed(2)}`
//       ];

//       columns.forEach((col, index) => {
//         doc.text(rowData[index], col.x + 2, rowY + 3, { 
//           width: col.width - 4, 
//           align: index === 0 ? 'left' : 'center' 
//         });
//       });

//       totalAmount += item.amount;
//       rowY += 15;
//       serialNo++;
//     });

//     // ✅ TOTALS SECTION
//     rowY += 10;
    
//     // Total cartons and pairs
//     const totalPairs = challan.items.reduce((sum, item) => sum + item.totalPair, 0);
    
//     doc.fontSize(10).font('Helvetica-Bold');
//     doc.text(`Totals c/o`, tableLeft, rowY);
//     doc.text(`${totalCartons} Cart`, tableLeft + 2, rowY, { align: 'center' });
//     doc.text(`${totalPairs}`, tableLeft + 90, rowY, { align: 'center' });
    
//     // Final total amount
//     rowY += 20;
//     doc.fontSize(12).font('Helvetica-Bold');
//     doc.text(`Grand Total: Rs. ${totalAmount.toFixed(2)}`, tableLeft + 350, rowY);

//     doc.end();

//   } catch (err) {
//     console.error('PDF generation error:', err);
//     res.status(500).json({ 
//       success: false, 
//       error: 'Failed to generate PDF' 
//     });
//   }
// });

// // Route 2: Products with Images PDF (New route)
// router.get('/:id/products', async (req, res) => {
//   try {
//     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
//       return res.status(400).json({
//         success: false,
//         error: "Invalid Challan ID format"
//       });
//     }

//     const challan = await Challan.findById(req.params.id);
//     if (!challan) {
//       return res.status(404).json({ 
//         success: false, 
//         error: 'Challan not found' 
//       });
//     }

//     // Fetch products matching challan items
//     let products = [];
//     for (const item of challan.items) {
//       const prod = await Product.findOne({
//         article: item.article,
//         color: item.color,
//         size: item.size,
//         isDeleted: { $ne: true }
//       }).lean();
//       if (prod) {
//         prod.cartons = item.cartons; // Override with challan quantity
//         products.push(prod);
//       }
//     }

//     products = products.filter(prod => (prod.cartons || 0) > 0);

//     if (products.length === 0) {
//       return res.status(404).json({ 
//         success: false, 
//         error: 'No products found for this challan' 
//       });
//     }

//     // Grouping
//     const groupedProducts = products.reduce((acc, product) => {
//       const key = `${product.article}-${product.gender}`.toUpperCase();
//       if (!acc[key]) {
//         acc[key] = {
//           article: product.article,
//           gender: product.gender,
//           stockType: product.stockType,
//           image: null,
//           mrp: product.mrp,
//           rate: product.rate,
//           pairPerCarton: product.pairPerCarton,
//           series: product.series,
//           variants: []
//         };
//       }
//       if (!acc[key].image && product.image) {
//         acc[key].image = product.image;
//       }
//       acc[key].variants.push(product);
//       return acc;
//     }, {});

//     // Sorting
//     const sortedFilteredGroups = Object.entries(groupedProducts).sort((a, b) => {
//       const [_, groupA] = a;
//       const [__, groupB] = b;
//       const groupInfoA = getVirtualGroup(groupA.stockType, groupA.gender);
//       const groupInfoB = getVirtualGroup(groupB.stockType, groupB.gender);
//       if (groupInfoA.order !== groupInfoB.order) return groupInfoA.order - groupInfoB.order;
//       const prefA = extractSeriesPref((groupA.series || '').trim());
//       const prefB = extractSeriesPref((groupB.series || '').trim());
//       if (prefA !== prefB) return prefA - prefB;
//       const seriesA = (groupA.series || '').trim().toUpperCase();
//       const seriesB = (groupB.series || '').trim().toUpperCase();
//       if (seriesA < seriesB) return -1;
//       if (seriesA > seriesB) return 1;
//       return (groupA.article < groupB.article) ? -1 : (groupA.article > groupB.article) ? 1 : 0;
//     });

//     // PDF headers
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename="challan-products-${challan.invoiceNo.replace('/', '-')}.pdf"`);

//     // Create PDF
//     const doc = new PDFDocument({
//       margins: { top: 40, bottom: 40, left: 40, right: 40 },
//       size: 'A4'
//     });
    
//     doc.pipe(res);

//     // Products with Images logic
//     for (let index = 0; index < sortedFilteredGroups.length; index++) {
//       const [article, group] = sortedFilteredGroups[index];
//       if (index > 0) doc.addPage();

//       // Header
//       doc.fontSize(16).font('Helvetica-Bold').text('GPFAX PVT. LTD.', { align: 'center' });
//       doc.moveDown(0.5);
//       doc.fontSize(14).text('Stock Statement', { align: 'center' });
//       doc.moveDown(1);

//       // Date Info
//       const now = new Date().toLocaleString();
//       const dateOnly = new Date().toLocaleDateString();
//       doc.fontSize(10).font('Helvetica')
//         .text(`Date-Time: ${now}`, 40, doc.y)
//         .text(`As On Date: ${dateOnly}`, { align: 'right' });

//       // Product Info
//       const firstVariant = group.variants[0];
//       doc.text(`Stock Type: ${firstVariant.stockType || ''}`, 40, doc.y + 15)
//         .text(`Series: ${group.series || firstVariant.series || '-'}`, { align: 'right' })
//         .moveDown(1.5);

//       doc.fontSize(12).font('Helvetica-Bold').text(`ART.: ${article}`);
//       doc.text(`Rate: ${group.rate || '-'} /-`);
//       doc.text(`MRP: ${group.mrp || '-'} /-`);
//       doc.moveDown(0.5)
//         .fontSize(10).font('Helvetica')
//         .text(`Pair/Crtn: ${group.pairPerCarton || '-'}`)
//         .moveDown(1);

//       // Blue Block Container + Image download logic
//       let hasImage = false;
//       let imageBuffer = null;
//       if (group.image && group.image.startsWith('http')) {
//         try {
//           const response = await axios.get(group.image, { responseType: 'arraybuffer' });
//           imageBuffer = Buffer.from(response.data, 'binary');
//           hasImage = true;
//         } catch (err) {
//           hasImage = false;
//           imageBuffer = null;
//         }
//       }

//       const blockTop = doc.y;
//       const blockHeight = 370;
//       doc.rect(20, blockTop, 555, blockHeight)
//         .fillColor('#D7F6F8').fill()
//         .fillColor('black');

//       // Image
//       if (hasImage && imageBuffer) {
//         try {
//           const imageWidth = 200;
//           const imageHeight = 180;
//           const centerX = 20 + (555 - imageWidth) / 2;
//           const imageY = blockTop + 20;
//           doc.image(imageBuffer, centerX, imageY, {
//             fit: [imageWidth, imageHeight],
//             align: 'center',
//             valign: 'center'
//           });
//         } catch (err) {}
//       }

//       // Stock Table
//       const tableTop = blockTop + (hasImage ? 220 : 20);
//       let y = tableTop;
//       const rowHeight = 25;
//       const colorColumnWidth = 120;
//       const sizeColumnWidth = 80;

//       // Filter in-stock variants
//       const variants = group.variants.filter(v => (v.cartons || 0) > 0);
//       const sizes = Array.from(new Set(variants.map(v => v.size?.trim().toUpperCase())))
//         .filter(Boolean).sort((a, b) => parseInt(a) - parseInt(b));
//       const colors = Array.from(new Set(variants.map(v => v.color?.trim() || '-')));

//       // Table grid setup
//       const tableStartX = 40;
//       const tableWidth = colorColumnWidth + (sizes.length * sizeColumnWidth);

//       // Header row
//       doc.strokeColor('#000').lineWidth(1);
//       doc.font('Helvetica-Bold').fontSize(10);
//       doc.rect(tableStartX, y, tableWidth, rowHeight).fillColor('#f0f0f0').fill().fillColor('black');
//       doc.text('Color', tableStartX + 5, y + 8, { width: colorColumnWidth - 10, align: 'left' });
//       let headerX = tableStartX + colorColumnWidth;
//       sizes.forEach(size => {
//         doc.text(size, headerX + 5, y + 8, { width: sizeColumnWidth - 10, align: 'center' });
//         headerX += sizeColumnWidth;
//       });
      
//       // Header borders
//       doc.moveTo(tableStartX, y).lineTo(tableStartX + tableWidth, y).stroke();
//       doc.moveTo(tableStartX, y + rowHeight).lineTo(tableStartX + tableWidth, y + rowHeight).stroke();
//       doc.moveTo(tableStartX, y).lineTo(tableStartX, y + rowHeight).stroke();
//       doc.moveTo(tableStartX + colorColumnWidth, y).lineTo(tableStartX + colorColumnWidth, y + rowHeight).stroke();
//       for (let i = 1; i <= sizes.length; i++) {
//         const lineX = tableStartX + colorColumnWidth + (i * sizeColumnWidth);
//         doc.moveTo(lineX, y).lineTo(lineX, y + rowHeight).stroke();
//       }
//       y += rowHeight;

//       // Data rows
//       doc.font('Helvetica').fontSize(9);
//       colors.forEach((color, colorIndex) => {
//         if (colorIndex % 2 === 0) {
//           doc.rect(tableStartX, y, tableWidth, rowHeight).fillColor('#f9f9f9').fill().fillColor('black');
//         }
//         doc.text(color, tableStartX + 5, y + 8, { width: colorColumnWidth - 10, align: 'left' });
//         let cellX = tableStartX + colorColumnWidth;
//         sizes.forEach(size => {
//           const variant = variants.find(v =>
//             v.color?.trim() === color &&
//             v.size?.trim().toUpperCase() === size
//           );
//           const value = variant?.cartons?.toString() || '-';
//           doc.text(value, cellX + 5, y + 8, { width: sizeColumnWidth - 10, align: 'center' });
//           cellX += sizeColumnWidth;
//         });
        
//         // Row borders
//         doc.moveTo(tableStartX, y).lineTo(tableStartX + tableWidth, y).stroke();
//         doc.moveTo(tableStartX, y + rowHeight).lineTo(tableStartX + tableWidth, y + rowHeight).stroke();
//         doc.moveTo(tableStartX, y).lineTo(tableStartX, y + rowHeight).stroke();
//         doc.moveTo(tableStartX + colorColumnWidth, y).lineTo(tableStartX + colorColumnWidth, y + rowHeight).stroke();
//         for (let i = 1; i <= sizes.length; i++) {
//           const lineX = tableStartX + colorColumnWidth + (i * sizeColumnWidth);
//           doc.moveTo(lineX, y).lineTo(lineX, y + rowHeight).stroke();
//         }
//         y += rowHeight;
//       });
//       doc.moveTo(tableStartX, y).lineTo(tableStartX + tableWidth, y).stroke();
//     }

//     doc.end();

//   } catch (err) {
//     console.error('PDF generation error:', err);
//     res.status(500).json({ 
//       success: false, 
//       error: 'Failed to generate products PDF' 
//     });
//   }
// });

// module.exports = router;
// const express = require('express');
// const router = express.Router();
// const PDFDocument = require('pdfkit');
// const Challan = require('../models/Challan');
// const Product = require('../models/Product');
// const mongoose = require('mongoose');
// const axios = require('axios');

// // Helper functions
// const nowIND = () => new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Kolkata'}));
// const fmtDate = d => d.toLocaleDateString('en-IN',{day:'2-digit',month:'2-digit',year:'numeric'});
// const fmtDateT = d => d.toLocaleString('en-IN',{day:'2-digit',month:'2-digit',year:'numeric',
//                                                hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true});

// function getVirtualGroup(stockType, gender) {
//   const st = (stockType || '').toLowerCase();
//   const gen = (gender || '').toLowerCase();
//   if (st === 'pu') {
//     if (gen === 'ladies') return { group: 'PU LADIES', order: 7 };
//     if (gen === 'kids_ladies') return { group: 'PU KID LADIES', order: 8 };
//     if (gen === 'gents') return { group: 'PU GENTS', order: 9 };
//     if (gen === 'kids_gents') return { group: 'PU KIDS GENTS', order: 10 };
//     return { group: 'PU OTHER', order: 11 };
//   }
//   if (st === 'eva') {
//     if (gen === 'ladies') return { group: 'EVA LADIES', order: 2 };
//     if (gen === 'kids_ladies') return { group: 'EVA KID LADIES', order: 3 };
//     if (gen === 'gents') return { group: 'EVA GENTS', order: 4 };
//     if (gen === 'kids_gents') return { group: 'EVA KIDS GENTS', order: 5 };
//     return { group: 'EVA OTHER', order: 6 };
//   }
//   return { group: 'OTHER', order: 99 };
// }

// function extractSeriesPref(series) {
//   const match = (series || '').match(/^(\d+)/);
//   return match ? parseInt(match[1], 10) : Infinity;
// }

// const vGroup = (t='',g='')=>{
//   t=t.toLowerCase(); g=g.toLowerCase();
//   if(t==='eva') return {order:2+['ladies','kids_ladies','gents','kids_gents'].indexOf(g)};
//   if(t==='pu' ) return {order:7+['ladies','kids_ladies','gents','kids_gents'].indexOf(g)};
//   return {order:99};
// };

// // Route 1: Original Challan PDF (unchanged)
// router.get('/:id', async (req, res) => {
//   try {
//     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
//       return res.status(400).json({
//         success: false,
//         error: "Invalid Challan ID format"
//       });
//     }

//     const challan = await Challan.findById(req.params.id);
    
//     if (!challan) {
//       return res.status(404).json({ 
//         success: false, 
//         error: 'Challan not found' 
//       });
//     }

//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename="challan-${challan.invoiceNo.replace('/', '-')}.pdf"`);

//     const doc = new PDFDocument({ 
//       margin: 40,
//       size: 'A4'
//     });
    
//     doc.pipe(res);

//     doc.fontSize(20).font('Helvetica-Bold').text('GPFAX FOOTWEAR', { align: 'center' });
//     doc.fontSize(14).font('Helvetica').text('ESTIMATE', { align: 'center' });
//     doc.fontSize(10).font('Helvetica').text('Original Copy', 450, 80);
//     doc.moveDown(1.5);

//     const leftCol = 50;
//     const rightCol = 320;
//     let leftY = doc.y;
//     let rightY = leftY;

//     doc.fontSize(10).font('Helvetica-Bold');
//     doc.text('Party Name', leftCol, leftY, { continued: true });
//     doc.font('Helvetica').text(` : ${challan.partyName}`, { 
//       width: rightCol - leftCol - 20,
//       continued: false 
//     });
//     leftY = doc.y + 8;
    
//     doc.font('Helvetica-Bold').text('L.R. No.', leftCol, leftY, { continued: true });
//     doc.font('Helvetica').text(' : ____________________', { continued: false });

//     const totalCartons = challan.items.reduce((sum, item) => sum + item.cartons, 0);
//     const formattedDate = new Date(challan.date).toLocaleDateString('en-IN', {
//       day: '2-digit',
//       month: '2-digit',
//       year: 'numeric'
//     });
    
//     const rightFields = [
//       { label: 'Date', value: formattedDate },
//       { label: 'Invoice No.', value: challan.invoiceNo },
//       { label: 'Station', value: challan.station },
//       { label: 'Marka', value: challan.marka || 'N/A' },
//       { label: 'Transport', value: challan.transport },
//       { label: 'Cartons', value: totalCartons.toString() }
//     ];

//     rightFields.forEach((field, index) => {
//       const y = rightY + (index * 16);
//       doc.font('Helvetica-Bold').text(field.label, rightCol, y, { continued: true });
//       doc.font('Helvetica').text(` : ${field.value}`, { continued: false });
//     });

//     doc.moveDown(2);

//     const tableTop = doc.y + 10;
//     const tableLeft = 40;
    
//     const columns = [
//       { label: 'Article Name', x: tableLeft, width: 100 },
//       { label: 'Color', x: tableLeft + 100, width: 70 },
//       { label: 'Size', x: tableLeft + 170, width: 45 },
//       { label: 'No. of\nCRTN', x: tableLeft + 215, width: 50 },
//       { label: 'Pair/\nCRTN', x: tableLeft + 265, width: 50 },
//       { label: 'Total\nPair', x: tableLeft + 315, width: 50 },
//       { label: 'Rate/\nPair', x: tableLeft + 365, width: 65 },
//       { label: 'Amount', x: tableLeft + 430, width: 80 }
//     ];

//     let headerY = tableTop;
//     doc.fontSize(9).font('Helvetica-Bold');

//     columns.forEach(col => {
//       doc.text(col.label, col.x, headerY, { 
//         width: col.width, 
//         align: 'center' 
//       });
//     });

//     const tableWidth = columns[columns.length - 1].x + columns[columns.length - 1].width - tableLeft;
//     doc.rect(tableLeft, headerY - 5, tableWidth, 25).stroke();
    
//     let currentX = tableLeft;
//     columns.forEach(col => {
//       currentX += col.width;
//       if (currentX < tableLeft + tableWidth) {
//         doc.moveTo(currentX, headerY - 5).lineTo(currentX, headerY + 20).stroke();
//       }
//     });

//     let rowY = headerY + 25;
//     let totalAmount = 0;
//     let serialNo = 1;

//     doc.font('Helvetica').fontSize(8);

//     challan.items.forEach(item => {
//       doc.rect(tableLeft, rowY, tableWidth, 15).stroke();
      
//       currentX = tableLeft;
//       columns.forEach(col => {
//         currentX += col.width;
//         if (currentX < tableLeft + tableWidth) {
//           doc.moveTo(currentX, rowY).lineTo(currentX, rowY + 15).stroke();
//         }
//       });

//       const rowData = [
//         `${serialNo}. ${item.article}`,
//         item.color,
//         item.size,
//         item.cartons.toString(),
//         item.pairPerCarton.toString(),
//         item.totalPair.toString(),
//         `Rs. ${item.rate.toFixed(2)}`,
//         `Rs. ${item.amount.toFixed(2)}`
//       ];

//       columns.forEach((col, index) => {
//         doc.text(rowData[index], col.x + 2, rowY + 3, { 
//           width: col.width - 4, 
//           align: index === 0 ? 'left' : 'center' 
//         });
//       });

//       totalAmount += item.amount;
//       rowY += 15;
//       serialNo++;
//     });

//     rowY += 10;
//     const totalPairs = challan.items.reduce((sum, item) => sum + item.totalPair, 0);
    
//     doc.fontSize(10).font('Helvetica-Bold');
//     doc.text(`Totals c/o`, tableLeft, rowY);
//     doc.text(`${totalCartons} Cart`, tableLeft + 2, rowY, { align: 'center' });
//     doc.text(`${totalPairs}`, tableLeft + 90, rowY, { align: 'center' });
    
//     rowY += 20;
//     doc.fontSize(12).font('Helvetica-Bold');
//     doc.text(`Grand Total: Rs. ${totalAmount.toFixed(2)}`, tableLeft + 350, rowY);

//     doc.end();

//   } catch (err) {
//     console.error('PDF generation error:', err);
//     res.status(500).json({ 
//       success: false, 
//       error: 'Failed to generate PDF' 
//     });
//   }
// });

// // Route 2: Products with Images PDF (Updated with stock report layout)
// router.get('/:id/products', async (req, res) => {
//   try {
//     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
//       return res.status(400).json({
//         success: false,
//         error: "Invalid Challan ID format"
//       });
//     }

//     const challan = await Challan.findById(req.params.id);
//     if (!challan) {
//       return res.status(404).json({ 
//         success: false, 
//         error: 'Challan not found' 
//       });
//     }

//     // Fetch products matching challan items
//     let products = [];
//     for (const item of challan.items) {
//       const prod = await Product.findOne({
//         article: item.article,
//         color: item.color,
//         size: item.size,
//         isDeleted: { $ne: true }
//       }).lean();
//       if (prod) {
//         prod.cartons = item.cartons; // Override with challan quantity
//         products.push(prod);
//       }
//     }

//     products = products.filter(prod => (prod.cartons || 0) > 0);

//     if (products.length === 0) {
//       return res.status(404).json({ 
//         success: false, 
//         error: 'No products found for this challan' 
//       });
//     }

//     // Grouping
//     const grouped = products.reduce((m,p)=>{
//       const key=`${p.article}-${p.gender}`.toUpperCase();
//       (m[key]=m[key]||{...p,variants:[]}).variants.push(p);
//       return m;
//     },{});

//     const groups = Object.entries(grouped).sort((a,b)=>{
//       const A=a[1],B=b[1];
//       const oA=vGroup(A.stockType,A.gender).order,
//             oB=vGroup(B.stockType,B.gender).order;
//       return oA-oB ||
//              (A.series||'').localeCompare(B.series||'') ||
//              A.article.localeCompare(B.article);
//     });

//     // PDF setup
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename="challan-products-${challan.invoiceNo.replace('/', '-')}.pdf"`);

//     const doc = new PDFDocument({
//       size: [595, 665],
//       margins: {top:20,bottom:20,left:20,right:20}
//     });
    
//     doc.pipe(res);

//     // Generate pages for each group
//     for(let i=0;i<groups.length;i++){
//       if(i) doc.addPage();
//       const g = groups[i][1];

//       /* --- background & frame --- */
//       doc.rect(0,0,doc.page.width,doc.page.height)
//          .fillColor('#f0f7ff').fill();
//       doc.rect(10,10,doc.page.width-20,doc.page.height-20)
//          .strokeColor('#2c5530').lineWidth(3).stroke();
//       doc.rect(15,15,doc.page.width-30,doc.page.height-30)
//          .strokeColor('#7ba086').lineWidth(1).stroke();

//       /* --- header --- */
//       doc.font('Helvetica-Bold').fontSize(18).fillColor('#1a237e')
//          .text('GPFAX PVT. LTD.',{align:'center'},35);
//       doc.moveTo(150,60).lineTo(445,60)
//          .lineWidth(2.5).strokeColor('#1a237e').stroke();
//       doc.fontSize(14).fillColor('#2c3e50')
//          .text('Stock Statement',{align:'center'},72);
//       doc.moveTo(220,95).lineTo(375,95)
//          .lineWidth(1).strokeColor('#7f8c8d').stroke();

//       const now = nowIND();
//       doc.rect(25,105,545,22).fillColor('#f5f9ff').fill()
//          .strokeColor('#b8d4f0').lineWidth(1).stroke();
//       doc.font('Helvetica').fontSize(9).fillColor('#495057')
//          .text(`Generated: ${fmtDateT(now)}`,30,113)
//          .text(`Report Date: ${fmtDate(now)}`,{align:'right'},113);

//       /* --- widened info bar --- */
//       doc.rect(20,135,555,48).fillColor('#f8fbff').fill()
//          .strokeColor('#c5d9f1').lineWidth(1).stroke();
//       doc.font('Helvetica-Bold').fontSize(10).fillColor('#2e7d32')
//          .text(`Stock Type: ${g.stockType||'-'}`,25,143)
//          .text(`Series: ${g.series||'-'}`,340,143);
//       doc.fontSize(13).fillColor('#1a237e')
//          .text(`ARTICLE: ${g.article}`,25,158);

//       let info='';
//       // if(g.rate) info+=`Rate: ₹${g.rate||'-'}`;
//       // if(g.mrp) info+=(info?' | ':'')+`MRP: ₹${g.mrp||'-'}`;
//       // info+=(info?' | ':'')+`Pairs/Carton: ${g.pairPerCarton||'-'}`;
//       // doc.font('Helvetica').fontSize(9).fillColor('#424242')
//       //    .text(info,25,172);
// if(g.rate) info+=`Rate: ${g.rate||'-'}`;
// if(g.mrp) info+=(info?' | ':'')+`MRP: ${g.mrp||'-'}`;
// info+=(info?' | ':'')+`Pairs/Carton: ${g.pairPerCarton||'-'}`;
// doc.font('Helvetica').fontSize(9).fillColor('#424242')
//    .text(info,25,172);
//       /* --- container with charcoal background --- */
//       const cTop=195, cH=320;
//       doc.rect(25,cTop,545,cH)
//          .fillColor('#455A64').fill()                    // charcoal background
//          .strokeColor('#d0e0f5').lineWidth(2).stroke();

//       /* --- centred image --- */
//       if(g.image){
//         try{
//           const img = await axios.get(g.image,{responseType:'arraybuffer'});
//           const buf = Buffer.from(img.data,'binary');
//           const w=300,h=240;
//           const x=25+(545-w)/2, y=cTop+20;
//           doc.image(buf,x,y,{fit:[w,h]});
//         }catch{}
//       }

//       /* --- responsive table with full grid --- */
//       const tTop=cTop+(g.image?270:30);
//       let y=tTop,rowH=24,colW=120;
//       const vars = g.variants.filter(v=>(v.cartons||0)>0);
//       const sizes =[...new Set(vars.map(v=>v.size?.trim().toUpperCase()))]
//                      .filter(Boolean).sort((a,b)=>a-b);
//       const colors=[...new Set(vars.map(v=>v.color?.trim()||'-'))];

//       if(vars.length){
//         const sizeW=Math.floor((545-50-colW)/sizes.length);
//         const x0=40, tW=colW+sizes.length*sizeW;

//         /* header */
//         doc.rect(x0,y,tW,rowH).fillColor('#1976d2').fill()
//            .fillColor('white');
//         doc.font('Helvetica-Bold').fontSize(10)
//            .text('COLOR',x0+8,y+7,{width:colW-16});
//         let hx=x0+colW;
//         sizes.forEach(s=>{
//           doc.text(s,hx,y+7,{width:sizeW,align:'center'});
//           hx+=sizeW;
//         });
        
//         /* header borders & vertical lines */
//         doc.moveTo(x0,y).lineTo(x0+tW,y)
//            .strokeColor('#1565c0').lineWidth(2).stroke();
//         let vx=x0;
//         for(let j=0;j<=sizes.length;j++){
//           doc.moveTo(vx,y).lineTo(vx,y+rowH)
//              .strokeColor('#1565c0').stroke();
//           vx+=(j===0)?colW:sizeW;
//         }

//         /* data rows */
//         y+=rowH; doc.font('Helvetica').fontSize(9);
//         colors.forEach((clr,i)=>{
//           doc.rect(x0,y,tW,rowH)
//              .fillColor(i%2?'#ffffff':'#f8fbff').fill();
//           doc.fillColor('#1565c0')
//              .text(clr,x0+8,y+7,{width:colW-16});

//           let cx=x0+colW;
//           sizes.forEach(sz=>{
//             const v=vars.find(v=>v.color?.trim()===clr &&
//                                  v.size?.trim().toUpperCase()===sz);
//             const val=v?.cartons||'-';
//             doc.fillColor(val!=='-'?'#0d47a1':'#90a4ae')
//                .font(val!=='-'?'Helvetica-Bold':'Helvetica')
//                .text(val.toString(),cx,y+7,{width:sizeW,align:'center'});
//             cx+=sizeW;
//           });

//           /* horizontal & vertical grid lines */
//           doc.moveTo(x0,y).lineTo(x0+tW,y)
//              .strokeColor('#90a4ae').lineWidth(1).stroke();
//           let vx2=x0;
//           for(let j=0;j<=sizes.length;j++){
//             doc.moveTo(vx2,y).lineTo(vx2,y+rowH)
//                .strokeColor('#90a4ae').stroke();
//             vx2+=(j===0)?colW:sizeW;
//           }
//           y+=rowH;
//         });
//         /* closing bottom border */
//         doc.moveTo(x0,y).lineTo(x0+tW,y)
//            .strokeColor('#90a4ae').stroke();
//       }

//       /* --- footer --- */
//       doc.fontSize(8).fillColor('#1976d2')
//          .text(`Page ${i+1} of ${groups.length}`,0,doc.page.height-30,{align:'center'});
//     }

//     doc.end();

//   } catch (err) {
//     console.error('PDF generation error:', err);
//     res.status(500).json({ 
//       success: false, 
//       error: 'Failed to generate products PDF' 
//     });
//   }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Challan = require('../models/Challan');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const axios = require('axios');

// Helper functions
const nowIND = () => new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Kolkata'}));
const fmtDate = d => d.toLocaleDateString('en-IN',{day:'2-digit',month:'2-digit',year:'numeric'});
const fmtDateT = d => d.toLocaleString('en-IN',{day:'2-digit',month:'2-digit',year:'numeric',
                                               hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:true});

function getVirtualGroup(stockType, gender) {
  const st = (stockType || '').toLowerCase();
  const gen = (gender || '').toLowerCase();
  if (st === 'pu') {
    if (gen === 'ladies') return { group: 'PU LADIES', order: 7 };
    if (gen === 'kids_ladies') return { group: 'PU KID LADIES', order: 8 };
    if (gen === 'gents') return { group: 'PU GENTS', order: 9 };
    if (gen === 'kids_gents') return { group: 'PU KIDS GENTS', order: 10 };
    return { group: 'PU OTHER', order: 11 };
  }
  if (st === 'eva') {
    if (gen === 'ladies') return { group: 'EVA LADIES', order: 2 };
    if (gen === 'kids_ladies') return { group: 'EVA KID LADIES', order: 3 };
    if (gen === 'gents') return { group: 'EVA GENTS', order: 4 };
    if (gen === 'kids_gents') return { group: 'EVA KIDS GENTS', order: 5 };
    return { group: 'EVA OTHER', order: 6 };
  }
  return { group: 'OTHER', order: 99 };
}

function extractSeriesPref(series) {
  const match = (series || '').match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : Infinity;
}

const vGroup = (t='',g='')=>{
  t=t.toLowerCase(); g=g.toLowerCase();
  if(t==='eva') return {order:2+['ladies','kids_ladies','gents','kids_gents'].indexOf(g)};
  if(t==='pu' ) return {order:7+['ladies','kids_ladies','gents','kids_gents'].indexOf(g)};
  return {order:99};
};

// Route 1: Original Challan PDF (unchanged)
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid Challan ID format"
      });
    }

    const challan = await Challan.findById(req.params.id);
    
    if (!challan) {
      return res.status(404).json({ 
        success: false, 
        error: 'Challan not found' 
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="challan-${challan.invoiceNo.replace('/', '-')}.pdf"`);

    const doc = new PDFDocument({ 
      margin: 40,
      size: 'A4'
    });
    
    doc.pipe(res);

    doc.fontSize(20).font('Helvetica-Bold').text('GPFAX FOOTWEAR', { align: 'center' });
    doc.fontSize(14).font('Helvetica').text('ESTIMATE', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Original Copy', 450, 80);
    doc.moveDown(1.5);

    const leftCol = 50;
    const rightCol = 320;
    let leftY = doc.y;
    let rightY = leftY;

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Party Name', leftCol, leftY, { continued: true });
    doc.font('Helvetica').text(` : ${challan.partyName}`, { 
      width: rightCol - leftCol - 20,
      continued: false 
    });
    leftY = doc.y + 8;
    
    doc.font('Helvetica-Bold').text('L.R. No.', leftCol, leftY, { continued: true });
    doc.font('Helvetica').text(' : ____________________', { continued: false });

    const totalCartons = challan.items.reduce((sum, item) => sum + item.cartons, 0);
    const formattedDate = new Date(challan.date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    const rightFields = [
      { label: 'Date', value: formattedDate },
      { label: 'Invoice No.', value: challan.invoiceNo },
      { label: 'Station', value: challan.station },
      { label: 'Marka', value: challan.marka || 'N/A' },
      { label: 'Transport', value: challan.transport },
      { label: 'Cartons', value: totalCartons.toString() }
    ];

    rightFields.forEach((field, index) => {
      const y = rightY + (index * 16);
      doc.font('Helvetica-Bold').text(field.label, rightCol, y, { continued: true });
      doc.font('Helvetica').text(` : ${field.value}`, { continued: false });
    });

    doc.moveDown(2);

    const tableTop = doc.y + 10;
    const tableLeft = 40;
    
    const columns = [
      { label: 'Article Name', x: tableLeft, width: 100 },
      { label: 'Color', x: tableLeft + 100, width: 70 },
      { label: 'Size', x: tableLeft + 170, width: 45 },
      { label: 'No. of\nCRTN', x: tableLeft + 215, width: 50 },
      { label: 'Pair/\nCRTN', x: tableLeft + 265, width: 50 },
      { label: 'Total\nPair', x: tableLeft + 315, width: 50 },
      { label: 'Rate/\nPair', x: tableLeft + 365, width: 65 },
      { label: 'Amount', x: tableLeft + 430, width: 80 }
    ];

    let headerY = tableTop;
    doc.fontSize(9).font('Helvetica-Bold');

    columns.forEach(col => {
      doc.text(col.label, col.x, headerY, { 
        width: col.width, 
        align: 'center' 
      });
    });

    const tableWidth = columns[columns.length - 1].x + columns[columns.length - 1].width - tableLeft;
    doc.rect(tableLeft, headerY - 5, tableWidth, 25).stroke();
    
    let currentX = tableLeft;
    columns.forEach(col => {
      currentX += col.width;
      if (currentX < tableLeft + tableWidth) {
        doc.moveTo(currentX, headerY - 5).lineTo(currentX, headerY + 20).stroke();
      }
    });

    let rowY = headerY + 25;
    let totalAmount = 0;
    let serialNo = 1;

    doc.font('Helvetica').fontSize(8);

    challan.items.forEach(item => {
      doc.rect(tableLeft, rowY, tableWidth, 15).stroke();
      
      currentX = tableLeft;
      columns.forEach(col => {
        currentX += col.width;
        if (currentX < tableLeft + tableWidth) {
          doc.moveTo(currentX, rowY).lineTo(currentX, rowY + 15).stroke();
        }
      });

      const rowData = [
        `${serialNo}. ${item.article}`,
        item.color,
        item.size,
        item.cartons.toString(),
        item.pairPerCarton.toString(),
        item.totalPair.toString(),
        `Rs. ${item.rate.toFixed(2)}`,
        `Rs. ${item.amount.toFixed(2)}`
      ];

      columns.forEach((col, index) => {
        doc.text(rowData[index], col.x + 2, rowY + 3, { 
          width: col.width - 4, 
          align: index === 0 ? 'left' : 'center' 
        });
      });

      totalAmount += item.amount;
      rowY += 15;
      serialNo++;
    });

    rowY += 10;
    const totalPairs = challan.items.reduce((sum, item) => sum + item.totalPair, 0);
    
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text(`Totals c/o`, tableLeft, rowY);
    doc.text(`${totalCartons} Cart`, tableLeft + 2, rowY, { align: 'center' });
    doc.text(`${totalPairs}`, tableLeft + 90, rowY, { align: 'center' });
    
    rowY += 20;
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text(`Grand Total: Rs. ${totalAmount.toFixed(2)}`, tableLeft + 350, rowY);

    doc.end();

  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate PDF' 
    });
  }
});

// Route 2: Products with Images PDF (Updated with stock report layout)
router.get('/:id/products', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid Challan ID format"
      });
    }

    const challan = await Challan.findById(req.params.id);
    if (!challan) {
      return res.status(404).json({ 
        success: false, 
        error: 'Challan not found' 
      });
    }

    // Fetch products matching challan items
    let products = [];
    for (const item of challan.items) {
      const prod = await Product.findOne({
        article: item.article,
        color: item.color,
        size: item.size,
        isDeleted: { $ne: true }
      }).lean();
      if (prod) {
        prod.cartons = item.cartons; // Override with challan quantity
        products.push(prod);
      }
    }

    // Filter out zero stock products
    products = products.filter(prod => (prod.cartons || 0) > 0);

    if (products.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'No products found for this challan' 
      });
    }

    // Grouping
    const grouped = products.reduce((m,p)=>{
      const key=`${p.article}-${p.gender}`.toUpperCase();
      (m[key]=m[key]||{...p,variants:[]}).variants.push(p);
      return m;
    },{});

    // Filter out groups with zero total stock
    const filteredGroups = Object.entries(grouped).filter(([key,g])=>{
      const totalStock = g.variants.reduce((sum,v)=>(sum+(v.cartons||0)),0);
      return totalStock > 0;  // Only include groups with stock > 0
    });

    const groups = filteredGroups.sort((a,b)=>{
      const A=a[1],B=b[1];
      const oA=vGroup(A.stockType,A.gender).order,
            oB=vGroup(B.stockType,B.gender).order;
      return oA-oB ||
             (A.series||'').localeCompare(B.series||'') ||
             A.article.localeCompare(B.article);
    });

    // PDF setup
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="challan-products-${challan.invoiceNo.replace('/', '-')}.pdf"`);

    const doc = new PDFDocument({
      size: [595, 665],
      margins: {top:20,bottom:20,left:20,right:20}
    });
    
    doc.pipe(res);

    // Generate pages for each group
    for(let i=0;i<groups.length;i++){
      if(i) doc.addPage();
      const g = groups[i][1];

      /* --- background & frame --- */
      doc.rect(0,0,doc.page.width,doc.page.height)
         .fillColor('#f0f7ff').fill();
      doc.rect(10,10,doc.page.width-20,doc.page.height-20)
         .strokeColor('#2c5530').lineWidth(3).stroke();
      doc.rect(15,15,doc.page.width-30,doc.page.height-30)
         .strokeColor('#7ba086').lineWidth(1).stroke();

      /* --- header --- */
      doc.font('Helvetica-Bold').fontSize(18).fillColor('#1a237e')
         .text('GPFAX PVT. LTD.',{align:'center'},35);
      doc.moveTo(150,60).lineTo(445,60)
         .lineWidth(2.5).strokeColor('#1a237e').stroke();
      doc.fontSize(14).fillColor('#2c3e50')
         .text('Stock Statement',{align:'center'},72);
      doc.moveTo(220,95).lineTo(375,95)
         .lineWidth(1).strokeColor('#7f8c8d').stroke();

      const now = nowIND();
      doc.rect(25,105,545,22).fillColor('#f5f9ff').fill()
         .strokeColor('#b8d4f0').lineWidth(1).stroke();
      doc.font('Helvetica').fontSize(9).fillColor('#495057')
         .text(`Generated: ${fmtDateT(now)}`,30,113)
         .text(`Report Date: ${fmtDate(now)}`,{align:'right'},113);

      /* --- widened info bar --- */
      doc.rect(20,135,555,48).fillColor('#f8fbff').fill()
         .strokeColor('#c5d9f1').lineWidth(1).stroke();
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#2e7d32')
         .text(`Stock Type: ${g.stockType||'-'}`,25,143)
         .text(`Series: ${g.series||'-'}`,340,143);
      doc.fontSize(13).fillColor('#1a237e')
         .text(`ARTICLE: ${g.article} - ${g.gender}`,25,158);  // Added gender display

      // let info='';
      // if(g.rate) info+=`Rate: ${g.rate||'-'}`;
      // if(g.mrp) info+=(info?' | ':'')+`MRP: ${g.mrp||'-'}`;
      // info+=(info?' | ':'')+`Pairs/Carton: ${g.pairPerCarton||'-'}`;
      // doc.font('Helvetica').fontSize(9).fillColor('#424242')
      //    .text(info,25,172);
          let info = `Pairs/Carton: ${g.pairPerCarton||'-'}`;
      doc.font('Helvetica').fontSize(9).fillColor('#424242')
         .text(info,25,172);

      /* --- container with charcoal background --- */
      const cTop=195, cH=320;
      doc.rect(25,cTop,545,cH)
         .fillColor('#455A64').fill()                    // charcoal background
         .strokeColor('#d0e0f5').lineWidth(2).stroke();

      /* --- centred image --- */
      if(g.image){
        try{
          const img = await axios.get(g.image,{responseType:'arraybuffer'});
          const buf = Buffer.from(img.data,'binary');
          const w=300,h=240;
          const x=25+(545-w)/2, y=cTop+20;
          doc.image(buf,x,y,{fit:[w,h]});
        }catch{}
      }

      /* --- responsive table with full grid --- */
      const tTop=cTop+(g.image?270:30);
      let y=tTop,rowH=24,colW=120;
      const vars = g.variants.filter(v=>(v.cartons||0)>0);  // Only non-zero stock
      const sizes =[...new Set(vars.map(v=>v.size?.trim().toUpperCase()))]
                     .filter(Boolean).sort((a,b)=>a-b);
      const colors=[...new Set(vars.map(v=>v.color?.trim()||'-'))];

      if(vars.length){
        const sizeW=Math.floor((545-50-colW)/sizes.length);
        const x0=40, tW=colW+sizes.length*sizeW;

        /* header */
        doc.rect(x0,y,tW,rowH).fillColor('#1976d2').fill()
           .fillColor('white');
        doc.font('Helvetica-Bold').fontSize(10)
           .text('COLOR',x0+8,y+7,{width:colW-16});
        let hx=x0+colW;
        sizes.forEach(s=>{
          doc.text(s,hx,y+7,{width:sizeW,align:'center'});
          hx+=sizeW;
        });
        
        /* header borders & vertical lines */
        doc.moveTo(x0,y).lineTo(x0+tW,y)
           .strokeColor('#1565c0').lineWidth(2).stroke();
        let vx=x0;
        for(let j=0;j<=sizes.length;j++){
          doc.moveTo(vx,y).lineTo(vx,y+rowH)
             .strokeColor('#1565c0').stroke();
          vx+=(j===0)?colW:sizeW;
        }

        /* data rows */
        y+=rowH; doc.font('Helvetica').fontSize(9);
        colors.forEach((clr,i)=>{
          doc.rect(x0,y,tW,rowH)
             .fillColor(i%2?'#ffffff':'#f8fbff').fill();
          doc.fillColor('#1565c0')
             .text(clr,x0+8,y+7,{width:colW-16});

          let cx=x0+colW;
          sizes.forEach(sz=>{
            const v=vars.find(v=>v.color?.trim()===clr &&
                                 v.size?.trim().toUpperCase()===sz);
            const val=v?.cartons||'-';
            doc.fillColor(val!=='-'?'#0d47a1':'#90a4ae')
               .font(val!=='-'?'Helvetica-Bold':'Helvetica')
               .text(val.toString(),cx,y+7,{width:sizeW,align:'center'});
            cx+=sizeW;
          });

          /* horizontal & vertical grid lines */
          doc.moveTo(x0,y).lineTo(x0+tW,y)
             .strokeColor('#90a4ae').lineWidth(1).stroke();
          let vx2=x0;
          for(let j=0;j<=sizes.length;j++){
            doc.moveTo(vx2,y).lineTo(vx2,y+rowH)
               .strokeColor('#90a4ae').stroke();
            vx2+=(j===0)?colW:sizeW;
          }
          y+=rowH;
        });
        /* closing bottom border */
        doc.moveTo(x0,y).lineTo(x0+tW,y)
           .strokeColor('#90a4ae').stroke();
      }

      /* --- footer --- */
      doc.fontSize(8).fillColor('#1976d2')
         .text(`Page ${i+1} of ${groups.length}`,0,doc.page.height-30,{align:'center'});
    }

    doc.end();

  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate products PDF' 
    });
  }
});

module.exports = router;

