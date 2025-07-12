

const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Challan = require('../models/Challan');
const mongoose = require('mongoose');

router.get('/:id', async (req, res) => {
  try {
    // ID validation
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

    // PDF headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="challan-${challan.invoiceNo.replace('/', '-')}.pdf"`);

    // Create PDF document
    const doc = new PDFDocument({ 
      margin: 40,
      size: 'A4'
    });
    
    doc.pipe(res);

    // ✅ HEADER SECTION
    doc.fontSize(20).font('Helvetica-Bold').text('GPFAX FOOTWEAR', { align: 'center' });
    doc.fontSize(14).font('Helvetica').text('ESTIMATE', { align: 'center' });
    
    // Original Copy (top right)
    doc.fontSize(10).font('Helvetica').text('Original Copy', 450, 80);
    
    doc.moveDown(1.5);

    // ✅ PARTY DETAILS SECTION - Improved Layout
    const leftCol = 50;
    const rightCol = 320;
    let leftY = doc.y;
    let rightY = leftY;

    // Left column with dynamic width handling
    doc.fontSize(10).font('Helvetica-Bold');
    
    // Party Name with proper wrapping
    doc.text('Party Name', leftCol, leftY, { continued: true });
    doc.font('Helvetica').text(` : ${challan.partyName}`, { 
      width: rightCol - leftCol - 20,
      continued: false 
    });
    leftY = doc.y + 8;
    
    // L.R. No.
    doc.font('Helvetica-Bold').text('L.R. No.', leftCol, leftY, { continued: true });
    doc.font('Helvetica').text(' : ____________________', { continued: false });

    // Right column - Calculate total cartons first
    const totalCartons = challan.items.reduce((sum, item) => sum + item.cartons, 0);
    
    const formattedDate = new Date(challan.date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    // Right column fields with consistent spacing
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

    // ✅ TABLE SECTION - Improved positioning
    const tableTop = doc.y + 10;
    const tableLeft = 40;
    
    // Column definitions (adjusted widths to match your image)
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

    // Draw table header with improved styling
    let headerY = tableTop;
    doc.fontSize(9).font('Helvetica-Bold'); // ✅ Fixed syntax error

    columns.forEach(col => {
      doc.text(col.label, col.x, headerY, { 
        width: col.width, 
        align: 'center' 
      });
    });

    // Header border
    const tableWidth = columns[columns.length - 1].x + columns[columns.length - 1].width - tableLeft;
    doc.rect(tableLeft, headerY - 5, tableWidth, 25).stroke();
    
    // Vertical lines for header
    let currentX = tableLeft;
    columns.forEach(col => {
      currentX += col.width;
      if (currentX < tableLeft + tableWidth) {
        doc.moveTo(currentX, headerY - 5).lineTo(currentX, headerY + 20).stroke();
      }
    });

    // ✅ TABLE ROWS
    let rowY = headerY + 25;
    let totalAmount = 0;
    let serialNo = 1;

    doc.font('Helvetica').fontSize(8);

    challan.items.forEach(item => {
      // Row border
      doc.rect(tableLeft, rowY, tableWidth, 15).stroke();
      
      // Vertical lines
      currentX = tableLeft;
      columns.forEach(col => {
        currentX += col.width;
        if (currentX < tableLeft + tableWidth) {
          doc.moveTo(currentX, rowY).lineTo(currentX, rowY + 15).stroke();
        }
      });

      // Row data
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

    // ✅ TOTALS SECTION
    rowY += 10;
    
    // Total cartons and pairs
    const totalPairs = challan.items.reduce((sum, item) => sum + item.totalPair, 0);
    
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text(`Totals c/o`, tableLeft, rowY);
    doc.text(`${totalCartons} Cart`, tableLeft + 2, rowY, { align: 'center' });
    doc.text(`${totalPairs}`, tableLeft + 90, rowY, { align: 'center' });
    
    // Final total amount
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

module.exports = router;
