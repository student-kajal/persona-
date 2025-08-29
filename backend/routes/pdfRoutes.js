

const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
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
    // const filteredGroups = includeImages
    //   ? Object.entries(groupedProducts).filter(([_, group]) => group.image)
    //   : Object.entries(groupedProducts);
    const filteredGroups = Object.entries(groupedProducts);
// Ab har article/group jayega table ke liye, chahe image ho ya na ho!


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


    if (includeImages) {
  for (let index = 0; index < sortedFilteredGroups.length; index++) {
    const [article, group] = sortedFilteredGroups[index];
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

    // Blue Block Container + Image download logic
    let hasImage = false;
    let imageBuffer = null;
    if (group.image && group.image.startsWith('http')) {
      try {
        const response = await axios.get(group.image, { responseType: 'arraybuffer' });
        imageBuffer = Buffer.from(response.data, 'binary');
        hasImage = true;
      } catch (err) {
        hasImage = false;
        imageBuffer = null;
      }
    }

    const blockTop = doc.y;
    const blockHeight = 370;
    doc.rect(20, blockTop, 555, blockHeight)
      .fillColor('#D7F6F8').fill()
      .fillColor('black');

    // --- Always show blue container and table, image only if found ---
    if (hasImage && imageBuffer) {
      try {
        const imageWidth = 200;
        const imageHeight = 180;
        const centerX = 20 + (555 - imageWidth) / 2;
        const imageY = blockTop + 20;
        doc.image(imageBuffer, centerX, imageY, {
          fit: [imageWidth, imageHeight],
          align: 'center',
          valign: 'center'
        });
      } catch (err) {}
    }

    // Stock Table
    // Table y-position: with image or without image, always inside blue block!
    const tableTop = blockTop + (hasImage ? 220 : 20); // with image: below image, else near top
    let y = tableTop;
    const rowHeight = 25;
    const colorColumnWidth = 120;
    const sizeColumnWidth = 80;

    // Filter in-stock variants
    const variants = group.variants.filter(v => (v.cartons || 0) > 0);
    const sizes = Array.from(new Set(variants.map(v => v.size?.trim().toUpperCase())))
      .filter(Boolean).sort((a, b) => parseInt(a) - parseInt(b));
    const colors = Array.from(new Set(variants.map(v => v.color?.trim() || '-')));

    // Table grid setup
    const tableStartX = 40;
    const tableWidth = colorColumnWidth + (sizes.length * sizeColumnWidth);

    // Header row
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

    // Data rows
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
  }
}
    // --- WITHOUT IMAGE: CONSOLIDATED (NEW CATEGORY-WISE) TABLE ---
    else {
      // Category-wise preparation
      const categoryMap = {};
      for (const [_, group] of sortedFilteredGroups) {
        const groupInfo = getVirtualGroup(group.stockType, group.gender);
        if (!categoryMap[groupInfo.group]) {
          categoryMap[groupInfo.group] = { sizes: new Set(), articles: [] };
        }
        for (let v of group.variants) {
          if (v.cartons && v.size) categoryMap[groupInfo.group].sizes.add(v.size.trim().toUpperCase());
        }
        categoryMap[groupInfo.group].articles.push(group);
      }

      // Table rendering
      Object.entries(categoryMap).forEach(([groupName, { sizes, articles }], catIndex) => {
        if (catIndex > 0) doc.addPage();
        // HEADER
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#1a237e')
          .text('GPFAX PVT. LTD.', { align: 'center' });
        doc.moveDown(0.2);
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#1a237e')
          .text(groupName, 20, doc.y + 5);

        const sizesArr = Array.from(sizes).sort((a, b) => parseInt(a) - parseInt(b));
        let y = doc.y + 20;
        const colWidths = { article: 90, color: 70, size: 30 };
        doc.rect(20, y, colWidths.article + colWidths.color + sizesArr.length * colWidths.size, 15)
          .fill('#e0e0ff').fillColor('black');
        doc.font('Helvetica-Bold').fontSize(9).fillColor('black')
          .text('Article', 23, y + 3, { width: colWidths.article-3 })
          .text('Color', 20 + colWidths.article + 3, y + 3, { width: colWidths.color-3 });
        let x = 20 + colWidths.article + colWidths.color;
        sizesArr.forEach(sz => {
          doc.text(sz, x + 2, y + 3, { width: colWidths.size-4, align: 'center' });
          x += colWidths.size;
        });
        y += 15;

        articles.forEach(articleGroup => {
          const colorMap = {};
          articleGroup.variants.forEach(variant => {
            if (!variant.size || variant.cartons <= 0) return;
            const sz = variant.size.trim().toUpperCase();
            const clr = variant.color?.trim() || 'DEFAULT';
            if (!colorMap[clr]) colorMap[clr] = {};
            colorMap[clr][sz] = (colorMap[clr][sz] || 0) + variant.cartons;
          });

          Object.entries(colorMap).forEach(([color, sizeMap], i) => {
            doc.font('Helvetica').fontSize(8).fillColor('black');
            doc.text(i === 0 ? articleGroup.article : '', 23, y + 2, { width: colWidths.article-3 });
            doc.text(color, 20 + colWidths.article + 3, y + 2, { width: colWidths.color-3 });
            let xData = 20 + colWidths.article + colWidths.color;
            sizesArr.forEach(sz => {
              const val = sizeMap[sz] || '-';
              doc.text(val, xData + 4, y + 2, { width: colWidths.size-8, align: 'center' });
              xData += colWidths.size;
            });
            y += 12;
          });
        });
        doc.moveDown(1.5);
      });
    }

    doc.end();
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).send('PDF generation failed');
  }
});

module.exports = router;
