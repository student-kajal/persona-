// const express = require('express');
// const router = express.Router();
// const PDFDocument = require('pdfkit');
// const Product = require('../models/Product');
// const path = require('path');
// const fs = require('fs');
// function getVirtualGroup(article, gender, series) {
//   const art = (article || '').toUpperCase().trim();
//   const gen = (gender || '').toUpperCase().trim();
//   const ser = (series || '').toUpperCase().trim();

//   // Example: If article or series contains 'PU', treat as PU group
//   if (art.includes('PU') || ser.includes('PU')) {
//     if (gen === 'LADIES') return { group: 'PU LADIES', order: 7 };
//     if (gen === 'KID LADIES' || gen === 'KIDS LADIES') return { group: 'PU KID LADIES', order: 8 };
//     if (gen === 'GENTS') return { group: 'PU GENTS', order: 9 };
//     if (gen === 'KIDS GENTS' || gen === 'KID GENTS') return { group: 'PU KIDS GENTS', order: 10 };
//     return { group: 'PU OTHER', order: 11 };
//   }
//   // Default to EVA groups
//   if (gen === 'LADIES') return { group: 'EVA LADIES', order: 2 };
//   if (gen === 'KID LADIES' || gen === 'KIDS LADIES') return { group: 'EVA KID LADIES', order: 3 };
//   if (gen === 'GENTS') return { group: 'EVA GENTS', order: 4 };
//   if (gen === 'KIDS GENTS' || gen === 'KID GENTS') return { group: 'EVA KIDS GENTS', order: 5 };
//   return { group: 'OTHER', order: 99 };
// }


// // --- Sorting Helper Functions ---
// function getGroupOrder(article, gender) {
//   const art = (article || '').toUpperCase();
//   const gen = (gender || '').toUpperCase();
//   if (art.startsWith('EVA') && gen === 'LADIES') return 2;
//   if (art.startsWith('EVA') && gen === 'KID LADIES') return 3;
//   if (art.startsWith('EVA') && gen === 'GENTS') return 4;
//   if (art.startsWith('EVA') && gen === 'KIDS GENTS') return 5;
//   if (art.startsWith('EVA')) return 1;
//   if (art.startsWith('PU') && gen === 'LADIES') return 7;
//   if (art.startsWith('PU') && gen === 'KID LADIES') return 8;
//   if (art.startsWith('PU') && gen === 'GENTS') return 9;
//   if (art.startsWith('PU') && gen === 'KIDS GENTS') return 10;
//   if (art.startsWith('PU')) return 6;
//   return 99;
// }
// function extractSeriesPref(series) {
//   const match = (series || '').match(/^(\d+)/);
//   return match ? parseInt(match[1], 10) : Infinity;
// }

// router.post('/generate-pdf', async (req, res) => {
//   try {
//     const { includeImages, filters, showRate, showMRP, productIds } = req.body;
    
//   //  console.log('PDF Parameters:', { includeImages, showRate, showMRP, productIds: productIds?.length });

//     let query = { isDeleted: { $ne: true } };
    
//     if (productIds && productIds.length > 0) {
//       query._id = { $in: productIds };
//     } else {
//       Object.entries(filters || {}).forEach(([key, value]) => {
//         if (value && value !== '' && key !== 'isDeleted') {
//           query[key] = new RegExp(value, 'i');
//         }
//       });
//     }

//     const products = await Product.find(query).lean();
//     const doc = new PDFDocument({
//       margins: { top: 40, bottom: 40, left: 40, right: 40 },
//       size: 'A4'
//     });

//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', 'attachment; filename=products-report.pdf');
//     doc.pipe(res);

//    const groupedProducts = products.reduce((acc, product) => {
//   const key = `${product.article}-${product.gender}`.toUpperCase();
//   if (!acc[key]) {
//     acc[key] = {
//       article: product.article,
//       gender: product.gender,
//       image: null,
//       mrp: product.mrp,
//       rate: product.rate,
//       pairPerCarton: product.pairPerCarton,
//       series: product.series,
//       variants: []
//     };
//   }
//   if (!acc[key].image && product.image) {
//     acc[key].image = product.image;
//   }
//   acc[key].variants.push(product);
//   return acc;
// }, {});

// const filteredGroups = includeImages
//   ? Object.entries(groupedProducts).filter(([_, group]) => group.image)
//   : Object.entries(groupedProducts);
// const sortedFilteredGroups = [...filteredGroups].sort((a, b) => {
//   const [artA, groupA] = a;
//   const [artB, groupB] = b;

//   const groupInfoA = getVirtualGroup(groupA.article, groupA.gender, groupA.series);
//   const groupInfoB = getVirtualGroup(groupB.article, groupB.gender, groupB.series);

//   if (groupInfoA.order !== groupInfoB.order) return groupInfoA.order - groupInfoB.order;

//   // Series: numeric first, then alphabetic
//   const prefA = extractSeriesPref((groupA.series || '').trim());
//   const prefB = extractSeriesPref((groupB.series || '').trim());
//   if (prefA !== prefB) return prefA - prefB;

//   const seriesA = (groupA.series || '').trim().toUpperCase();
//   const seriesB = (groupB.series || '').trim().toUpperCase();
//   if (seriesA < seriesB) return -1;
//   if (seriesA > seriesB) return 1;

//   return (artA < artB) ? -1 : (artA > artB) ? 1 : 0;
// });

// const allSizes = Array.from(new Set(
//   Object.values(groupedProducts).flatMap(g => 
//     (includeImages ? 
//       g.variants.filter(v => (v.cartons || 0) > 0) :
//       g.variants
//     ).map(v => v.size?.trim().toUpperCase())
//   ).filter(Boolean)
// )).sort((a, b) => parseInt(a) - parseInt(b));


// const createConsolidatedTable = () => {
//   const cleanArticleName = (article) =>
//     article
//       .replace(/[-_](GENTS|LADIES|KIDS_GENTS|KIDS_LADIES)$/i, '')
//       .replace(/[-_](MENS|WOMENS|BOYS|GIRLS)$/i, '')
//       .trim();

//   const consolidatedProducts = {};
//   // Object.entries(groupedProducts).forEach(([article, group]) => {
//   //   const cleaned = cleanArticleName(article);
//   //   if (!consolidatedProducts[cleaned]) {
//   //     consolidatedProducts[cleaned] = { variants: [] };
//   //   }
//   //   consolidatedProducts[cleaned].variants.push(...group.variants);
//   // });
// Object.entries(groupedProducts)
//   .sort((a, b) => {
//     const groupA = a[1];
//     const groupB = b[1];
//     const orderA = getGroupOrder(
//       (groupA.article || '').toUpperCase().trim(),
//       (groupA.gender || '').toUpperCase().trim()
//     );
//     const orderB = getGroupOrder(
//       (groupB.article || '').toUpperCase().trim(),
//       (groupB.gender || '').toUpperCase().trim()
//     );
//     if (orderA !== orderB) return orderA - orderB;

//     const prefA = extractSeriesPref((groupA.series || '').trim());
//     const prefB = extractSeriesPref((groupB.series || '').trim());
//     if (prefA !== prefB) return prefA - prefB;

//     const seriesA = (groupA.series || '').trim().toUpperCase();
//     const seriesB = (groupB.series || '').trim().toUpperCase();
//     if (seriesA < seriesB) return -1;
//     if (seriesA > seriesB) return 1;

//     if ((groupA.article || '').toUpperCase().trim() < (groupB.article || '').toUpperCase().trim()) return -1;
//     if ((groupA.article || '').toUpperCase().trim() > (groupB.article || '').toUpperCase().trim()) return 1;
//     return 0;
//   })
//   .forEach(([article, group]) => {
//     const cleaned = cleanArticleName(article);
//     if (!consolidatedProducts[cleaned]) {
//       consolidatedProducts[cleaned] = { variants: [] };
//     }
//     consolidatedProducts[cleaned].variants.push(...group.variants);
//   });

//   const pageMargin = 15;
//   const pageWidth = 595;
//   const pageHeight = 842;
//   const headerHeight = 80;
//   const footerHeight = 20;
//   const rowHeight = 12;
//   const usableHeight = pageHeight - headerHeight - footerHeight - 2 * pageMargin;
//   const maxRows = Math.floor(usableHeight / rowHeight);

//   const productEntries = Object.entries(consolidatedProducts);
// productEntries.sort((a, b) => {
//   const groupA = a[1].variants[0];
//   const groupB = b[1].variants[0];

//   const groupInfoA = getVirtualGroup(groupA.article, groupA.gender, groupA.series);
//   const groupInfoB = getVirtualGroup(groupB.article, groupB.gender, groupB.series);

//   if (groupInfoA.order !== groupInfoB.order) return groupInfoA.order - groupInfoB.order;

//   const prefA = extractSeriesPref((groupA.series || '').trim());
//   const prefB = extractSeriesPref((groupB.series || '').trim());
//   if (prefA !== prefB) return prefA - prefB;

//   const seriesA = (groupA.series || '').trim().toUpperCase();
//   const seriesB = (groupB.series || '').trim().toUpperCase();
//   if (seriesA < seriesB) return -1;
//   if (seriesA > seriesB) return 1;

//   if ((groupA.article || '').toUpperCase().trim() < (groupB.article || '').toUpperCase().trim()) return -1;
//   if ((groupA.article || '').toUpperCase().trim() > (groupB.article || '').toUpperCase().trim()) return 1;
//   return 0;
// });

// console.log('---PRODUCT ENTRIES SORTED ORDER---');
// productEntries.forEach(([article, group], idx) => {
//   const g = group.variants[0];
//   console.log(`${idx + 1}. ${g.article} | ${g.gender} | ${g.series}`);
// });
// console.log('----------------------------');

//   const splitPages = [];
//   let page = [];
//   let rowCount = 0;

//   productEntries.forEach(([article, group]) => {
//     const colors = new Set(group.variants.map(v => v.color?.trim() || 'DEFAULT'));
//     const rowsNeeded = 1 + colors.size;
//     if (rowCount + rowsNeeded > maxRows) {
//       splitPages.push(page);
//       page = [];
//       rowCount = 0;
//     }
//     page.push([article, group]);
//     rowCount += rowsNeeded;
//   });
//   if (page.length) splitPages.push(page);

//   const getSizesForPage = (entries) => {
//     const sizes = new Set();
//     entries.forEach(([_, group]) =>
//       group.variants.forEach(variant => {
//         if (variant.cartons > 0) {
//           const sz = variant.size?.trim().toUpperCase();
//           if (sz) sizes.add(sz);
//         }
//       })
//     );
//     return [...sizes].sort((a, b) => {
//       const ps = s => {
//         const m = s.match(/(\d+)X?(\d+)?/);
//         return m ? parseInt(m[1]) * 100 + (parseInt(m[2]) || 0) : parseInt(s) || 0;
//       };
//       return ps(a) - ps(b);
//     });
//   };

//   const drawHeader = () => {
//     doc.fontSize(12).font('Helvetica-Bold').text('GPFAX PVT. LTD.', { align: 'center' });
//     doc.moveDown(0.2);
//     doc.fontSize(10).text('Stock Statement', { align: 'center' });
//     doc.moveDown(0.5);
//     const now = new Date().toLocaleString();
//     doc.fontSize(8).font('Helvetica').text(`Date-Time: ${now}`, pageMargin, doc.y);
//     doc.moveDown(1);
//     return doc.y;
//   };

//  const drawTable = (entries, includeHeader = false) => {
//   const sizes = getSizesForPage(entries);
//   const availableWidth = pageWidth - 2 * pageMargin;
//   const minArtWidth = 100;
//   const minSizeWidth = 18;
//   const maxSizeWidth = 35;
//   let sizeWidth = Math.floor((availableWidth - minArtWidth) / sizes.length);
//   sizeWidth = Math.max(minSizeWidth, Math.min(maxSizeWidth, sizeWidth));
//   const tableWidth = minArtWidth + sizeWidth * sizes.length;

//   // Draw all vertical lines from top to bottom
//   const drawVerticalLines = (yTop, yBottom) => {
//     // Vertical line after article column
//     doc.moveTo(pageMargin + minArtWidth, yTop).lineTo(pageMargin + minArtWidth, yBottom).stroke();
//     // Vertical lines after each size column
//     for (let i = 1; i < sizes.length; i++) {
//       const x = pageMargin + minArtWidth + i * sizeWidth;
//       doc.moveTo(x, yTop).lineTo(x, yBottom).stroke();
//     }
//     // Vertical line at the end
//     doc.moveTo(pageMargin + tableWidth, yTop).lineTo(pageMargin + tableWidth, yBottom).stroke();
//     // Vertical line at the start (optional, if you want leftmost border)
//     doc.moveTo(pageMargin, yTop).lineTo(pageMargin, yBottom).stroke();
//   };

//   // Draw horizontal lines at y positions
//   const drawHorizontalLine = (y) => {
//     doc.moveTo(pageMargin, y).lineTo(pageMargin + tableWidth, y).stroke();
//   };

//   let y = doc.y;
//   if (includeHeader) y = drawHeader();
//   let yTop = y; // Remember top of table for vertical lines

//   // Draw header row with background
//   doc.rect(pageMargin, y, tableWidth, rowHeight).fill('#e8e8e8');
//   doc.font('Helvetica-Bold').fontSize(8).fillColor('black')
//     .text('ART', pageMargin + 3, y + 3, { width: minArtWidth - 6 });
//   sizes.forEach((sz, i) => {
//     const x = pageMargin + minArtWidth + i * sizeWidth;
//     doc.text(sz.replace('X', 'x'), x + 1, y + 3, {
//       width: sizeWidth - 2,
//       align: 'center',
//       fontSize: sz.length > 4 ? 6 : 7
//     });
//   });
//   drawHorizontalLine(y);
//   drawHorizontalLine(y + rowHeight);
//   y += rowHeight;

//   // For each article and color
//   entries.forEach(([article, group]) => {
//     const colorMap = {};
//     group.variants.forEach(variant => {
//       if (!variant.size || variant.cartons <= 0) return;
//       const sz = variant.size.trim().toUpperCase();
//       const clr = variant.color?.trim() || 'DEFAULT';
//       if (!colorMap[clr]) colorMap[clr] = {};
//       colorMap[clr][sz] = (colorMap[clr][sz] || 0) + variant.cartons;
//     });

//     // Article row
//     doc.rect(pageMargin, y, tableWidth, rowHeight).fill('#f5f5f5');
//     doc.font('Helvetica-Bold').fontSize(8).fillColor('black')
//       .text(article, pageMargin + 3, y + 3, { width: minArtWidth - 6 });
//     drawHorizontalLine(y + rowHeight);
//     y += rowHeight;

//     // Color rows
//     Object.entries(colorMap).forEach(([color, sizeMap]) => {
//       doc.rect(pageMargin, y, tableWidth, rowHeight).fill('#ffffff');
//       doc.font('Helvetica').fontSize(7).fillColor('black')
//         .text(color, pageMargin + 3, y + 3, { width: minArtWidth - 6 });
//       sizes.forEach((sz, i) => {
//         const val = sizeMap[sz] || '-';
//         const x = pageMargin + minArtWidth + i * sizeWidth;
//         doc.text(val, x + 1, y + 3, {
//           width: sizeWidth - 2,
//           align: 'center',
//           fontSize: val.toString().length > 3 ? 6 : 7
//         });
//       });
//       drawHorizontalLine(y + rowHeight);
//       y += rowHeight;
//     });
//   });

//   // Draw all vertical lines from top to bottom
//   drawVerticalLines(yTop, y);

//   // Final bottom line (already drawn in loop)
//   // doc.moveTo(pageMargin, y).lineTo(pageMargin + tableWidth, y).stroke();
//   doc.y = y + 10;
// };

//   // === Main execution ===
//   splitPages.forEach((entries, idx) => {
//     if (idx !== 0) doc.addPage();
//     drawTable(entries, idx === 0);
//   });
// };

   
  
//   if (includeImages) {
//    sortedFilteredGroups.forEach(([article, group], index) => {
//     if (index > 0) doc.addPage();

//     // Header Section
//     doc.fontSize(16).font('Helvetica-Bold').text('GPFAX PVT. LTD.', { align: 'center' });
//     doc.moveDown(0.5);
//     doc.fontSize(14).text('Stock Statement', { align: 'center' });
//     doc.moveDown(1);

//     // Date Information
//     const now = new Date().toLocaleString();
//     const dateOnly = new Date().toLocaleDateString();
//     doc.fontSize(10).font('Helvetica')
//       .text(`Date-Time: ${now}`, 40, doc.y)
//       .text(`As On Date: ${dateOnly}`, { align: 'right' });

//     // Product Information
//     const firstVariant = group.variants[0];
//     doc.text(`Stock Type: ${firstVariant.stockType || ''}`, 40, doc.y + 15)
//       .text(`Series: ${group.series || firstVariant.series || '-'}`, { align: 'right' })
//       .moveDown(1.5);

//     // Pricing Information
//     doc.fontSize(12).font('Helvetica-Bold').text(`ART.: ${article}`);
    
//     if (showRate) doc.text(`Rate: ${group.rate || '-'} /-`);
//     if (showMRP) doc.text(`MRP: ${group.mrp || '-'} /-`);
    
//     doc.moveDown(0.5)
//       .fontSize(10).font('Helvetica')
//       .text(`Pair/Crtn: ${group.pairPerCarton || '-'}`)
//       .moveDown(1);

//     // Enhanced Image Handling
//     let hasImage = false;
//     let imagePath = null;
    
//     if (group.image) {
//       const possiblePaths = [
//         path.join(__dirname, '..', group.image),
//         path.join(__dirname, '..', 'uploads', group.image),
//         path.join(__dirname, '..', 'uploads', 'products', group.image),
//       ];
//       for (let i = 0; i < possiblePaths.length; i++) {
//         if (fs.existsSync(possiblePaths[i])) {
//           imagePath = possiblePaths[i];
//           hasImage = true;
//           break;
//         }
//       }
//     }

//     // Blue Block Container
//     const blockTop = doc.y;
//     const blockHeight = hasImage ? 370 : 140;
//     doc.rect(20, blockTop, 555, blockHeight)
//       .fillColor('#D7F6F8').fill()
//       .fillColor('black');

//     // Add Image if available (CENTERED)
//     if (hasImage && imagePath) {
//       try {
//         // Center the image horizontally in the blue block
//         const imageWidth = 200;
//         const imageHeight = 180;
//         const centerX = 20 + (555 - imageWidth) / 2; // Center in blue block
//         const imageY = blockTop + 20;
        
//         doc.image(imagePath, centerX, imageY, { 
//           fit: [imageWidth, imageHeight],
//           align: 'center',
//           valign: 'center'
//         });
//       } catch (err) {
//         console.error("Image render error:", err);
//       }
//     }

//     // Stock Table Configuration
//     const tableTop = hasImage ? blockTop + 220 : blockTop + 20;
//     let y = tableTop;
//     const rowHeight = 25;
//     const colorColumnWidth = 120;
//     const sizeColumnWidth = 80;

//     // Filter in-stock variants
//     const variants = group.variants.filter(v => (v.cartons || 0) > 0);

//     // Collect sizes and colors (sorted)
//     const sizes = Array.from(new Set(variants.map(v => v.size?.trim().toUpperCase())))
//       .filter(Boolean).sort((a, b) => parseInt(a) - parseInt(b));
//     const colors = Array.from(new Set(variants.map(v => v.color?.trim() || '-')));

//     // Table dimensions
//     const tableStartX = 40;
//     const tableWidth = colorColumnWidth + (sizes.length * sizeColumnWidth);
    
//     // Draw Table Header with complete grid
//     doc.strokeColor('#000').lineWidth(1);
//     doc.font('Helvetica-Bold').fontSize(10);
    
//     // Header background
//     doc.rect(tableStartX, y, tableWidth, rowHeight).fillColor('#f0f0f0').fill().fillColor('black');
    
//     // Header text
//     doc.text('Color', tableStartX + 5, y + 8, { width: colorColumnWidth - 10, align: 'left' });
    
//     let headerX = tableStartX + colorColumnWidth;
//     sizes.forEach(size => {
//       doc.text(size, headerX + 5, y + 8, { width: sizeColumnWidth - 10, align: 'center' });
//       headerX += sizeColumnWidth;
//     });

//     // Draw header grid lines
//     // Horizontal lines
//     doc.moveTo(tableStartX, y).lineTo(tableStartX + tableWidth, y).stroke();
//     doc.moveTo(tableStartX, y + rowHeight).lineTo(tableStartX + tableWidth, y + rowHeight).stroke();
    
//     // Vertical lines
//     doc.moveTo(tableStartX, y).lineTo(tableStartX, y + rowHeight).stroke();
//     doc.moveTo(tableStartX + colorColumnWidth, y).lineTo(tableStartX + colorColumnWidth, y + rowHeight).stroke();
    
//     for (let i = 1; i <= sizes.length; i++) {
//       const lineX = tableStartX + colorColumnWidth + (i * sizeColumnWidth);
//       doc.moveTo(lineX, y).lineTo(lineX, y + rowHeight).stroke();
//     }

//     y += rowHeight;

//     // Draw Data Rows with complete grid
//     doc.font('Helvetica').fontSize(9);
//     colors.forEach((color, colorIndex) => {
//       // Alternate row background
//       if (colorIndex % 2 === 0) {
//         doc.rect(tableStartX, y, tableWidth, rowHeight).fillColor('#f9f9f9').fill().fillColor('black');
//       }

//       // Color text
//       doc.text(color, tableStartX + 5, y + 8, { width: colorColumnWidth - 10, align: 'left' });
      
//       // Size values
//       let cellX = tableStartX + colorColumnWidth;
//       sizes.forEach(size => {
//         const variant = variants.find(v => 
//           v.color?.trim() === color && 
//           v.size?.trim().toUpperCase() === size
//         );
//         const value = variant?.cartons?.toString() || '-';
//         doc.text(value, cellX + 5, y + 8, { width: sizeColumnWidth - 10, align: 'center' });
//         cellX += sizeColumnWidth;
//       });

//       // Draw row grid lines
//       // Horizontal lines
//       doc.moveTo(tableStartX, y).lineTo(tableStartX + tableWidth, y).stroke();
//       doc.moveTo(tableStartX, y + rowHeight).lineTo(tableStartX + tableWidth, y + rowHeight).stroke();
      
//       // Vertical lines
//       doc.moveTo(tableStartX, y).lineTo(tableStartX, y + rowHeight).stroke();
//       doc.moveTo(tableStartX + colorColumnWidth, y).lineTo(tableStartX + colorColumnWidth, y + rowHeight).stroke();
      
//       for (let i = 1; i <= sizes.length; i++) {
//         const lineX = tableStartX + colorColumnWidth + (i * sizeColumnWidth);
//         doc.moveTo(lineX, y).lineTo(lineX, y + rowHeight).stroke();
//       }
      
//       y += rowHeight;
//     });

//     // Draw final bottom border
//     doc.moveTo(tableStartX, y).lineTo(tableStartX + tableWidth, y).stroke();
//   });
// }

//    else {
//       //  WITHOUT IMAGE - CONSOLIDATED TABLE
//       createConsolidatedTable();
//     }

//     doc.end();
//   } catch (err) {
//     console.error('PDF generation error:', err);
//     res.status(500).send('PDF generation failed');
//   }
// });

// module.exports = router;
const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');

// --- Group Mapping: Use stockType and gender (lowercase) ---
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

router.post('/generate-pdf', async (req, res) => {
  try {
    const { includeImages, filters, showRate, showMRP, productIds } = req.body;

    let query = { isDeleted: { $ne: true } };
    if (productIds && productIds.length > 0) {
      query._id = { $in: productIds };
    } else {
      Object.entries(filters || {}).forEach(([key, value]) => {
        if (value && value !== '' && key !== 'isDeleted') {
          query[key] = new RegExp(value, 'i');
        }
      });
    }

    const products = await Product.find(query).lean();
    const doc = new PDFDocument({
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
      size: 'A4'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=products-report.pdf');
    doc.pipe(res);

    // --- Grouping ---
    const groupedProducts = products.reduce((acc, product) => {
      const key = `${product.article}-${product.gender}`.toUpperCase();
      if (!acc[key]) {
        acc[key] = {
          article: product.article,
          gender: product.gender,
          stockType: product.stockType,
          image: null,
          mrp: product.mrp,
          rate: product.rate,
          pairPerCarton: product.pairPerCarton,
          series: product.series,
          variants: []
        };
      }
      if (!acc[key].image && product.image) {
        acc[key].image = product.image;
      }
      acc[key].variants.push(product);
      return acc;
    }, {});

    // --- Sorting ---
    const filteredGroups = includeImages
      ? Object.entries(groupedProducts).filter(([_, group]) => group.image)
      : Object.entries(groupedProducts);

    const sortedFilteredGroups = [...filteredGroups].sort((a, b) => {
      const [_, groupA] = a;
      const [__, groupB] = b;
      const groupInfoA = getVirtualGroup(groupA.stockType, groupA.gender);
      const groupInfoB = getVirtualGroup(groupB.stockType, groupB.gender);
      if (groupInfoA.order !== groupInfoB.order) return groupInfoA.order - groupInfoB.order;
      const prefA = extractSeriesPref((groupA.series || '').trim());
      const prefB = extractSeriesPref((groupB.series || '').trim());
      if (prefA !== prefB) return prefA - prefB;
      const seriesA = (groupA.series || '').trim().toUpperCase();
      const seriesB = (groupB.series || '').trim().toUpperCase();
      if (seriesA < seriesB) return -1;
      if (seriesA > seriesB) return 1;
      return (groupA.article < groupB.article) ? -1 : (groupA.article > groupB.article) ? 1 : 0;
    });

    // --- All Sizes for Table Columns ---
    const allSizes = Array.from(new Set(
      Object.values(groupedProducts).flatMap(g =>
        (includeImages ?
          g.variants.filter(v => (v.cartons || 0) > 0) :
          g.variants
        ).map(v => v.size?.trim().toUpperCase())
      ).filter(Boolean)
    )).sort((a, b) => parseInt(a) - parseInt(b));

    // --- WITH IMAGE ---
    if (includeImages) {
      sortedFilteredGroups.forEach(([article, group], index) => {
        if (index > 0) doc.addPage();

        // Header
        doc.fontSize(16).font('Helvetica-Bold').text('GPFAX PVT. LTD.', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(14).text('Stock Statement', { align: 'center' });
        doc.moveDown(1);

        // Date Info
        const now = new Date().toLocaleString();
        const dateOnly = new Date().toLocaleDateString();
        doc.fontSize(10).font('Helvetica')
          .text(`Date-Time: ${now}`, 40, doc.y)
          .text(`As On Date: ${dateOnly}`, { align: 'right' });

        // Product Info
        const firstVariant = group.variants[0];
        doc.text(`Stock Type: ${firstVariant.stockType || ''}`, 40, doc.y + 15)
          .text(`Series: ${group.series || firstVariant.series || '-'}`, { align: 'right' })
          .moveDown(1.5);

        doc.fontSize(12).font('Helvetica-Bold').text(`ART.: ${article}`);
        if (showRate) doc.text(`Rate: ${group.rate || '-'} /-`);
        if (showMRP) doc.text(`MRP: ${group.mrp || '-'} /-`);
        doc.moveDown(0.5)
          .fontSize(10).font('Helvetica')
          .text(`Pair/Crtn: ${group.pairPerCarton || '-'}`)
          .moveDown(1);

        // Blue Block Container
        let hasImage = false;
        let imagePath = null;
        if (group.image) {
          const possiblePaths = [
            path.join(__dirname, '..', group.image),
            path.join(__dirname, '..', 'uploads', group.image),
            path.join(__dirname, '..', 'uploads', 'products', group.image),
          ];
          for (let i = 0; i < possiblePaths.length; i++) {
            if (fs.existsSync(possiblePaths[i])) {
              imagePath = possiblePaths[i];
              hasImage = true;
              break;
            }
          }
        }
        const blockTop = doc.y;
        const blockHeight = hasImage ? 370 : 140;
        doc.rect(20, blockTop, 555, blockHeight)
          .fillColor('#D7F6F8').fill()
          .fillColor('black');

        // Add Image if available (centered)
        if (hasImage && imagePath) {
          try {
            const imageWidth = 200;
            const imageHeight = 180;
            const centerX = 20 + (555 - imageWidth) / 2;
            const imageY = blockTop + 20;
            doc.image(imagePath, centerX, imageY, {
              fit: [imageWidth, imageHeight],
              align: 'center',
              valign: 'center'
            });
          } catch (err) {}
        }

        // Stock Table
        const tableTop = hasImage ? blockTop + 220 : blockTop + 20;
        let y = tableTop;
        const rowHeight = 25;
        const colorColumnWidth = 120;
        const sizeColumnWidth = 80;

        // Filter in-stock variants
        const variants = group.variants.filter(v => (v.cartons || 0) > 0);
        const sizes = Array.from(new Set(variants.map(v => v.size?.trim().toUpperCase())))
          .filter(Boolean).sort((a, b) => parseInt(a) - parseInt(b));
        const colors = Array.from(new Set(variants.map(v => v.color?.trim() || '-')));

        // Table grid
        const tableStartX = 40;
        const tableWidth = colorColumnWidth + (sizes.length * sizeColumnWidth);

        // Header
        doc.strokeColor('#000').lineWidth(1);
        doc.font('Helvetica-Bold').fontSize(10);
        doc.rect(tableStartX, y, tableWidth, rowHeight).fillColor('#f0f0f0').fill().fillColor('black');
        doc.text('Color', tableStartX + 5, y + 8, { width: colorColumnWidth - 10, align: 'left' });
        let headerX = tableStartX + colorColumnWidth;
        sizes.forEach(size => {
          doc.text(size, headerX + 5, y + 8, { width: sizeColumnWidth - 10, align: 'center' });
          headerX += sizeColumnWidth;
        });
        doc.moveTo(tableStartX, y).lineTo(tableStartX + tableWidth, y).stroke();
        doc.moveTo(tableStartX, y + rowHeight).lineTo(tableStartX + tableWidth, y + rowHeight).stroke();
        doc.moveTo(tableStartX, y).lineTo(tableStartX, y + rowHeight).stroke();
        doc.moveTo(tableStartX + colorColumnWidth, y).lineTo(tableStartX + colorColumnWidth, y + rowHeight).stroke();
        for (let i = 1; i <= sizes.length; i++) {
          const lineX = tableStartX + colorColumnWidth + (i * sizeColumnWidth);
          doc.moveTo(lineX, y).lineTo(lineX, y + rowHeight).stroke();
        }
        y += rowHeight;

        // Data Rows
        doc.font('Helvetica').fontSize(9);
        colors.forEach((color, colorIndex) => {
          if (colorIndex % 2 === 0) {
            doc.rect(tableStartX, y, tableWidth, rowHeight).fillColor('#f9f9f9').fill().fillColor('black');
          }
          doc.text(color, tableStartX + 5, y + 8, { width: colorColumnWidth - 10, align: 'left' });
          let cellX = tableStartX + colorColumnWidth;
          sizes.forEach(size => {
            const variant = variants.find(v =>
              v.color?.trim() === color &&
              v.size?.trim().toUpperCase() === size
            );
            const value = variant?.cartons?.toString() || '-';
            doc.text(value, cellX + 5, y + 8, { width: sizeColumnWidth - 10, align: 'center' });
            cellX += sizeColumnWidth;
          });
          doc.moveTo(tableStartX, y).lineTo(tableStartX + tableWidth, y).stroke();
          doc.moveTo(tableStartX, y + rowHeight).lineTo(tableStartX + tableWidth, y + rowHeight).stroke();
          doc.moveTo(tableStartX, y).lineTo(tableStartX, y + rowHeight).stroke();
          doc.moveTo(tableStartX + colorColumnWidth, y).lineTo(tableStartX + colorColumnWidth, y + rowHeight).stroke();
          for (let i = 1; i <= sizes.length; i++) {
            const lineX = tableStartX + colorColumnWidth + (i * sizeColumnWidth);
            doc.moveTo(lineX, y).lineTo(lineX, y + rowHeight).stroke();
          }
          y += rowHeight;
        });
        doc.moveTo(tableStartX, y).lineTo(tableStartX + tableWidth, y).stroke();
      });
    }
    // --- WITHOUT IMAGE: CONSOLIDATED TABLE ---
    else {
      // --- Table Pagination ---
      const pageMargin = 15;
      const pageWidth = 595;
      const pageHeight = 842;
      const headerHeight = 80;
      const footerHeight = 20;
      const rowHeight = 12;
      const usableHeight = pageHeight - headerHeight - footerHeight - 2 * pageMargin;
      const maxRows = Math.floor(usableHeight / rowHeight);

      // Grouped and sorted for table
      const entries = sortedFilteredGroups.map(([article, group]) => [article, group]);
      let lastGroup = null;
      let rowCount = 0;
      let page = [];
      const splitPages = [];
      entries.forEach(([article, group]) => {
        const g = group.variants[0];
        const groupInfo = getVirtualGroup(g.stockType, g.gender);
        const colors = new Set(group.variants.map(v => v.color?.trim() || 'DEFAULT'));
        const rowsNeeded = 2 + colors.size; // group heading + article + colors
        if (rowCount + rowsNeeded > maxRows && page.length) {
          splitPages.push(page);
          page = [];
          rowCount = 0;
        }
        page.push([article, group]);
        rowCount += rowsNeeded;
      });
      if (page.length) splitPages.push(page);

      // Table draw
      const drawHeader = () => {
        doc.fontSize(12).font('Helvetica-Bold').text('GPFAX PVT. LTD.', { align: 'center' });
        doc.moveDown(0.2);
        doc.fontSize(10).text('Stock Statement', { align: 'center' });
        doc.moveDown(0.5);
        const now = new Date().toLocaleString();
        doc.fontSize(8).font('Helvetica').text(`Date-Time: ${now}`, pageMargin, doc.y);
        doc.moveDown(1);
        return doc.y;
      };
      const drawTable = (entries, includeHeader = false) => {
        const availableWidth = pageWidth - 2 * pageMargin;
        const minArtWidth = 100;
        const minSizeWidth = 18;
        const maxSizeWidth = 35;
        let sizeWidth = Math.floor((availableWidth - minArtWidth) / allSizes.length);
        sizeWidth = Math.max(minSizeWidth, Math.min(maxSizeWidth, sizeWidth));
        const tableWidth = minArtWidth + sizeWidth * allSizes.length;

        let y = doc.y;
        if (includeHeader) y = drawHeader();
        let lastGroupHeading = null;
        entries.forEach(([article, group]) => {
          const g = group.variants[0];
          const groupInfo = getVirtualGroup(g.stockType, g.gender);
          if (groupInfo.group !== lastGroupHeading) {
            doc.font('Helvetica-Bold').fontSize(11).fillColor('#1a237e')
              .text(groupInfo.group, pageMargin, y, { width: tableWidth, align: 'left' });
            y += rowHeight;
            lastGroupHeading = groupInfo.group;
          }
          // Article row
          const colorMap = {};
          group.variants.forEach(variant => {
            if (!variant.size || variant.cartons <= 0) return;
            const sz = variant.size.trim().toUpperCase();
            const clr = variant.color?.trim() || 'DEFAULT';
            if (!colorMap[clr]) colorMap[clr] = {};
            colorMap[clr][sz] = (colorMap[clr][sz] || 0) + variant.cartons;
          });
          doc.rect(pageMargin, y, tableWidth, rowHeight).fill('#f5f5f5');
          doc.font('Helvetica-Bold').fontSize(8).fillColor('black')
            .text(article, pageMargin + 3, y + 3, { width: minArtWidth - 6 });
          allSizes.forEach((sz, i) => {
            const x = pageMargin + minArtWidth + i * sizeWidth;
            doc.text(sz.replace('X', 'x'), x + 1, y + 3, {
              width: sizeWidth - 2,
              align: 'center',
              fontSize: sz.length > 4 ? 6 : 7
            });
          });
          y += rowHeight;
          // Color rows
          Object.entries(colorMap).forEach(([color, sizeMap]) => {
            doc.rect(pageMargin, y, tableWidth, rowHeight).fill('#ffffff');
            doc.font('Helvetica').fontSize(7).fillColor('black')
              .text(color, pageMargin + 3, y + 3, { width: minArtWidth - 6 });
            allSizes.forEach((sz, i) => {
              const val = sizeMap[sz] || '-';
              const x = pageMargin + minArtWidth + i * sizeWidth;
              doc.text(val, x + 1, y + 3, {
                width: sizeWidth - 2,
                align: 'center',
                fontSize: val.toString().length > 3 ? 6 : 7
              });
            });
            y += rowHeight;
          });
        });
        doc.y = y + 10;
      };
      splitPages.forEach((entries, idx) => {
        if (idx !== 0) doc.addPage();
        drawTable(entries, idx === 0);
      });
    }

    doc.end();
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).send('PDF generation failed');
  }
});

module.exports = router;
