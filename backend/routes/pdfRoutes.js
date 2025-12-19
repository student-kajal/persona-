

// const express = require('express');
// const router  = express.Router();
// const PDFKit  = require('pdfkit');
// const Product = require('../models/Product');
// const axios   = require('axios');

// /* ---------- helpers ---------- */
// const nowIND  = () => new Date(new Date()
//                   .toLocaleString('en-US',{timeZone:'Asia/Kolkata'}));
// const fmtDate = d => d.toLocaleDateString('en-IN',
//                   {day:'2-digit',month:'2-digit',year:'numeric'});
// const fmtDateT = d => d.toLocaleString('en-IN',
//                   {day:'2-digit',month:'2-digit',year:'numeric',
//                    hour:'2-digit',minute:'2-digit',second:'2-digit',
//                    hour12:true});
// const vGroup = (t='',g='')=>{
//   t=t.toLowerCase(); g=g.toLowerCase();
//   if(t==='eva') return {order:2+['ladies','kids_ladies','gents','kids_gents'].indexOf(g)};
//   if(t==='pu' ) return {order:7+['ladies','kids_ladies','gents','kids_gents'].indexOf(g)};
//   return {order:99};
// };

// /* ---------- route ---------- */
// router.post('/generate-pdf', async (req,res)=>{
//   try{
//     const { includeImages, filters={}, showRate, showMRP, productIds=[] } = req.body;

//     /* query --------------------------------------------------------- */
//     const q = productIds.length
//       ? { _id:{ $in:productIds }, isDeleted:{ $ne:true } }
//       : { isDeleted:{ $ne:true },
//           ...Object.fromEntries(
//               Object.entries(filters)
//                     .filter(([k,v])=>v)
//                     .map(([k,v])=>[k,new RegExp(v,'i')])) };

//     const prods = await Product.find(q).lean();

//     /* pdf ----------------------------------------------------------- */
//     const doc = new PDFKit({ size:[595,688], margins:{top:20,bottom:20,left:20,right:20} });
//     res.setHeader('Content-Type','application/pdf');
//     res.setHeader('Content-Disposition','attachment; filename=stock-report.pdf');
//     doc.pipe(res);

//     /* group --------------------------------------------------------- */
//     // const grouped = prods.reduce((m,p)=>{
//     //   const key=`${p.article}-${p.gender}`.toUpperCase();
//     //   (m[key]=m[key]||{...p,variants:[]}).variants.push(p);
//     //   return m;
//     // },{});
//     const grouped = prods.reduce((m, p) => {
//   const key = `${p.article}-${p.gender}`.toUpperCase();

//   if (!m[key]) {
//     m[key] = { ...p, variants: [] };
//     m[key].image = p.image || null;   // pehla variant agar image de to use
//   }

//   m[key].variants.push(p);

//   // ✅ agar pehle wale me image nahi thi, lekin is variant me hai, to ab set karo
//   if (!m[key].image && p.image) {
//     m[key].image = p.image;
//   }

//   return m;
// }, {});

//     // Filter out groups with zero total stock
//     const filteredGroups = Object.entries(grouped).filter(([key,g])=>{
//       const totalStock = g.variants.reduce((sum,v)=>(sum+(v.cartons||0)),0);
//       return totalStock > 0;  // Only include groups with stock > 0
//     });
    
//     const groups = filteredGroups.sort((a,b)=>{
//       const A=a[1],B=b[1];
//       const oA=vGroup(A.stockType,A.gender).order,
//             oB=vGroup(B.stockType,B.gender).order;
//       return oA-oB ||
//              (A.series||'').localeCompare(B.series||'') ||
//              A.article.localeCompare(B.article);
//     });

//     /* loop ---------------------------------------------------------- */
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
//          .text(`ARTICLE: ${g.article} - ${g.gender}`,25,158);

//       /* --- conditional rate/MRP display based on flags --- */
//       let info = '';
//       if(showRate && g.rate) {
//         info += `Rate: ${g.rate}`;
//       }
//       if(showMRP && g.mrp) {
//         info += (info ? ' | ' : '') + `MRP: ${g.mrp}`;
//       }
//       // Always show Pairs/Carton
//       info += (info ? ' | ' : '') + `Pairs/Carton: ${g.pairPerCarton||'-'}`;
      
//       doc.font('Helvetica').fontSize(9).fillColor('#424242')
//          .text(info,25,172);

//       /* --- container --- */
//       const cTop = 195, cH = 320;
//       const containerX = 25, containerW = 545;
//       doc.rect(containerX, cTop, containerW, cH)
//          .fillColor('#455A64')              // charcoal background
//          .fill()
//          .strokeColor('#d0e0f5')
//          .lineWidth(2)
//          .stroke();

//       /* --- perfectly centered image --- */
//       if(includeImages && g.image){
//         try{
//           const img = await axios.get(g.image,{responseType:'arraybuffer'});
//           const buf = Buffer.from(img.data,'binary');
          
//           // Image dimensions
//           const imgW = 280, imgH = 200;  // Slightly smaller for better fit
          
//           // Calculate center position within the charcoal container
//           const imgX = containerX + (containerW - imgW) / 2;  // Horizontal center
//           const imgY = cTop + 30;  // Fixed from top of container
          
//           doc.image(buf, imgX, imgY, {
//             fit: [imgW, imgH],
//             align: 'center',
//             valign: 'center'
//           });
//         }catch{}
//       }

//       /* --- responsive table with full grid lines --- */
//       const tTop=cTop+(includeImages?250:30);  // Adjusted table position
//       let y=tTop,row=24,colW=120;
//       const vars = g.variants.filter(v=>(v.cartons||0)>0);
//       const sizes =[...new Set(vars.map(v=>v.size?.trim().toUpperCase()))]
//                       .filter(Boolean).sort((a,b)=>a-b);
//       const colors=[...new Set(vars.map(v=>v.color?.trim()||'-'))];

//       if(vars.length){
//         const sizeW=Math.floor((containerW-50-colW)/sizes.length);
//         const x0=40, tW=colW+sizes.length*sizeW;

//         /* header */
//         doc.rect(x0,y,tW,row).fillColor('#1976d2').fill()
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
//           doc.moveTo(vx,y).lineTo(vx,y+row)
//              .strokeColor('#1565c0').stroke();
//           vx+=(j===0)?colW:sizeW;
//         }

//         /* data rows */
//         y+=row; doc.font('Helvetica').fontSize(9);
//         colors.forEach((clr,i)=>{
//           doc.rect(x0,y,tW,row)
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
//             doc.moveTo(vx2,y).lineTo(vx2,y+row)
//                .strokeColor('#90a4ae').stroke();
//             vx2+=(j===0)?colW:sizeW;
//           }
//           y+=row;
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
//   }catch(e){
//     console.error(e);
//     res.status(500).send('PDF generation failed');
//   }
// });

// module.exports = router;




// const express = require('express');
// const router  = express.Router();
// const PDFKit  = require('pdfkit');
// const Product = require('../models/Product');
// const axios   = require('axios');

// const nowIND  = () =>
//   new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

// const fmtDate = d =>
//   d.toLocaleDateString('en-IN', {
//     day: '2-digit',
//     month: '2-digit',
//     year: 'numeric'
//   });

// const fmtDateT = d =>
//   d.toLocaleString('en-IN', {
//     day: '2-digit',
//     month: '2-digit',
//     year: 'numeric',
//     hour: '2-digit',
//     minute: '2-digit',
//     second: '2-digit',
//     hour12: true
//   });

// const vGroup = (t = '', g = '') => {
//   t = t.toLowerCase();
//   g = g.toLowerCase();
//   if (t === 'eva')
//     return { order: 2 + ['ladies', 'kids_ladies', 'gents', 'kids_gents'].indexOf(g) };
//   if (t === 'pu')
//     return { order: 7 + ['ladies', 'kids_ladies', 'gents', 'kids_gents'].indexOf(g) };
//   return { order: 99 };
// };

// router.post('/generate-pdf', async (req, res) => {
//   try {
//     const { includeImages, filters = {}, showRate, showMRP, productIds = [] } =
//       req.body;

//     // query
//     const q = productIds.length
//       ? { _id: { $in: productIds }, isDeleted: { $ne: true } }
//       : {
//           isDeleted: { $ne: true },
//           ...Object.fromEntries(
//             Object.entries(filters)
//               .filter(([k, v]) => v)
//               .map(([k, v]) => [k, new RegExp(v, 'i')])
//           )
//         };

//     const prods = await Product.find(q).lean();

//     // pdf
//     const doc = new PDFKit({
//       size: [595, 688],
//       margins: { top: 20, bottom: 20, left: 20, right: 20 }
//     });
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader(
//       'Content-Disposition',
//       'attachment; filename=stock-report.pdf'
//     );
//     doc.pipe(res);

//     // group
//     const grouped = prods.reduce((m, p) => {
//       const key = `${p.article}-${p.gender}`.toUpperCase();

//       if (!m[key]) {
//         m[key] = { ...p, variants: [] };
//         m[key].image = p.image || null;
//       }

//       m[key].variants.push(p);

//       if (!m[key].image && p.image) {
//         m[key].image = p.image;
//       }
//       return m;
//     }, {});

//     const filteredGroups = Object.entries(grouped).filter(([key, g]) => {
//       const totalStock = g.variants.reduce(
//         (sum, v) => sum + (v.cartons || 0),
//         0
//       );
//       return totalStock > 0;
//     });

//     const groups = filteredGroups.sort((a, b) => {
//       const A = a[1],
//         B = b[1];
//       const oA = vGroup(A.stockType, A.gender).order,
//         oB = vGroup(B.stockType, B.gender).order;
//       return (
//         oA - oB ||
//         (A.series || '').localeCompare(B.series || '') ||
//         A.article.localeCompare(B.article)
//       );
//     });

//     // loop
//     for (let i = 0; i < groups.length; i++) {
//       if (i) doc.addPage();
//       const g = groups[i][1];

//       // background + outer frame
//       doc
//         .rect(0, 0, doc.page.width, doc.page.height)
//         .fillColor('#f0f7ff')
//         .fill();
//       doc
//         .rect(10, 10, doc.page.width - 20, doc.page.height - 20)
//         .strokeColor('#2c5530')
//         .lineWidth(3)
//         .stroke();
//       doc
//         .rect(15, 15, doc.page.width - 30, doc.page.height - 30)
//         .strokeColor('#7ba086')
//         .lineWidth(1)
//         .stroke();

//         doc
//   .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
//   .fillColor('#455A64')      // wahi dark color
//   .fill();

//       // TOP heading GPFAX / "Stock Statement" HATA DIYA
//       const now = nowIND();
//       doc
//         .rect(25, 40, 545, 22)
//         .fillColor('#f5f9ff')
//         .fill()
//         .strokeColor('#b8d4f0')
//         .lineWidth(1)
//         .stroke();
//       doc
//         .font('Helvetica')
//         .fontSize(9)
//         .fillColor('#495057')
//         .text(`Generated: ${fmtDateT(now)}`, 30, 48)
//         .text(`Report Date: ${fmtDate(now)}`, { align: 'right' }, 48);

//       // info bar
//       doc
//         .rect(20, 70, 555, 48)
//         .fillColor('#f8fbff')
//         .fill()
//         .strokeColor('#c5d9f1')
//         .lineWidth(1)
//         .stroke();
//       doc
//         .font('Helvetica-Bold')
//         .fontSize(10)
//         .fillColor('#2e7d32')
//         .text(`Stock Type: ${g.stockType || '-'}`, 25, 78)
//         .text(`Series: ${g.series || '-'}`, 340, 78);
//       doc
//         .fontSize(13)
//         .fillColor('#1a237e')
//         .text(`ARTICLE: ${g.article} - ${g.gender}`, 25, 93);

//       let info = '';
//       if (showRate && g.rate) info += `Rate: ${g.rate}`;
//       if (showMRP && g.mrp) info += (info ? ' | ' : '') + `MRP: ${g.mrp}`;
//       info += (info ? ' | ' : '') + `Pairs/Carton: ${g.pairPerCarton || '-'}`;

//       doc
//         .font('Helvetica')
//         .fontSize(9)
//         .fillColor('#424242')
//         .text(info, 25, 107);

//       /* -------- big image (same size as abhi) -------- */
//       const imgTop = 135;   // heading kam hua to thoda upar
//       const maxW  = 520;
//       const maxH  = 340;
//       const imgX  = (doc.page.width - maxW) / 2;

//       if (includeImages && g.image) {
//         try {
//           const img = await axios.get(g.image, { responseType: 'arraybuffer' });
//           const buf = Buffer.from(img.data, 'binary');

//           doc.image(buf, imgX, imgTop, {
//             fit: [maxW, maxH],
//             align: 'center',
//             valign: 'top'
//           });
//         } catch (e) {
//           console.error('image error', e.message);
//         }
//       }

//       /* -------- table: max 7 color-rows -------- */
//       const containerW = 545;
//       const tTop = imgTop + maxH + 10;
//       let y = tTop,
//         row = 24,
//         colW = 120;

//       const vars = g.variants.filter(v => (v.cartons || 0) > 0);

//       const sizes = [...new Set(
//         vars.map(v => v.size?.trim().toUpperCase())
//       )]
//         .filter(Boolean)
//         .sort((a, b) => a - b);

//       let colors = [...new Set(vars.map(v => v.color?.trim() || '-'))];
//       colors = colors.slice(0, 7); // MAX 7 ROWS

//       if (vars.length && colors.length) {
//         const sizeW = Math.floor((containerW - 50 - colW) / sizes.length);
//         const x0 = 40,
//           tW = colW + sizes.length * sizeW;

//         // header
//         doc
//           .rect(x0, y, tW, row)
//           .fillColor('#1976d2')
//           .fill()
//           .fillColor('white');
//         doc
//           .font('Helvetica-Bold')
//           .fontSize(10)
//           .text('COLOR', x0 + 8, y + 7, { width: colW - 16 });

//         let hx = x0 + colW;
//         sizes.forEach(s => {
//           doc.text(s, hx, y + 7, { width: sizeW, align: 'center' });
//           hx += sizeW;
//         });

//         doc
//           .moveTo(x0, y)
//           .lineTo(x0 + tW, y)
//           .strokeColor('#1565c0')
//           .lineWidth(2)
//           .stroke();

//         let vx = x0;
//         for (let j = 0; j <= sizes.length; j++) {
//           doc
//             .moveTo(vx, y)
//             .lineTo(vx, y + row)
//             .strokeColor('#1565c0')
//             .stroke();
//           vx += j === 0 ? colW : sizeW;
//         }

//         // data rows (max 7)
//         y += row;
//         doc.font('Helvetica').fontSize(9);

//         colors.forEach((clr, i2) => {
//           doc
//             .rect(x0, y, tW, row)
//             .fillColor(i2 % 2 ? '#ffffff' : '#f8fbff')
//             .fill();
//           doc
//             .fillColor('#1565c0')
//             .text(clr, x0 + 8, y + 7, { width: colW - 16 });

//           let cx = x0 + colW;
//           sizes.forEach(sz => {
//             const v = vars.find(
//               v2 =>
//                 v2.color?.trim() === clr &&
//                 v2.size?.trim().toUpperCase() === sz
//             );
//             const val = v?.cartons || '-';

//             doc
//               .fillColor(val !== '-' ? '#0d47a1' : '#90a4ae')
//               .font(val !== '-' ? 'Helvetica-Bold' : 'Helvetica')
//               .text(val.toString(), cx, y + 7, {
//                 width: sizeW,
//                 align: 'center'
//               });
//             cx += sizeW;
//           });

//           doc
//             .moveTo(x0, y)
//             .lineTo(x0 + tW, y)
//             .strokeColor('#90a4ae')
//             .lineWidth(1)
//             .stroke();

//           let vx2 = x0;
//           for (let j = 0; j <= sizes.length; j++) {
//             doc
//               .moveTo(vx2, y)
//               .lineTo(vx2, y + row)
//               .strokeColor('#90a4ae')
//               .stroke();
//             vx2 += j === 0 ? colW : sizeW;
//           }

//           y += row;
//         });

//         doc
//           .moveTo(x0, y)
//           .lineTo(x0 + tW, y)
//           .strokeColor('#90a4ae')
//           .stroke();
//       }

//       // simple footer (optional)
//       doc
//         .fontSize(8)
//         .fillColor('#1976d2')
//         .text(`Page ${i + 1} of ${groups.length}`, 0, doc.page.height - 30, {
//           align: 'center'
//         });
//     }

//     doc.end();
//   } catch (e) {
//     console.error(e);
//     res.status(500).send('PDF generation failed');
//   }
// });

// module.exports = router;

const express = require('express');
const router  = express.Router();
const PDFKit  = require('pdfkit');
const Product = require('../models/Product');
const axios   = require('axios');

/* ---------- helpers ---------- */
const nowIND = () =>
  new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

const fmtDate = d =>
  d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

const fmtDateT = d =>
  d.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

const vGroup = (t = '', g = '') => {
  t = t.toLowerCase();
  g = g.toLowerCase();
  if (t === 'eva')
    return { order: 2 + ['ladies', 'kids_ladies', 'gents', 'kids_gents'].indexOf(g) };
  if (t === 'pu')
    return { order: 7 + ['ladies', 'kids_ladies', 'gents', 'kids_gents'].indexOf(g) };
  return { order: 99 };
};

/* ---------- route ---------- */
router.post('/generate-pdf', async (req, res) => {
  try {
    const { includeImages, filters = {}, showRate, showMRP, productIds = [] } =
      req.body;

    /* query -------------------------------------------------------- */
    const q = productIds.length
      ? { _id: { $in: productIds }, isDeleted: { $ne: true } }
      : {
          isDeleted: { $ne: true },
          ...Object.fromEntries(
            Object.entries(filters)
              .filter(([k, v]) => v)
              .map(([k, v]) => [k, new RegExp(v, 'i')])
          )
        };

    const prods = await Product.find(q).lean();

    /* pdf ---------------------------------------------------------- */
    const doc = new PDFKit({
      size: [595, 688],
      margins: { top: 20, bottom: 20, left: 20, right: 20 }
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=stock-report.pdf'
    );
    doc.pipe(res);

    /* group -------------------------------------------------------- */
    const grouped = prods.reduce((m, p) => {
      const key = `${p.article}-${p.gender}`.toUpperCase();

      if (!m[key]) {
        m[key] = { ...p, variants: [] };
        m[key].image = p.image || null;
      }
      m[key].variants.push(p);

      if (!m[key].image && p.image) {
        m[key].image = p.image;
      }
      return m;
    }, {});

    const filteredGroups = Object.entries(grouped).filter(([key, g]) => {
      const totalStock = g.variants.reduce(
        (sum, v) => sum + (v.cartons || 0),
        0
      );
      return totalStock > 0;
    });

    const groups = filteredGroups.sort((a, b) => {
      const A = a[1],
        B = b[1];
      const oA = vGroup(A.stockType, A.gender).order,
        oB = vGroup(B.stockType, B.gender).order;
      return (
        oA - oB ||
        (A.series || '').localeCompare(B.series || '') ||
        A.article.localeCompare(B.article)
      );
    });

    /* loop --------------------------------------------------------- */
    for (let i = 0; i < groups.length; i++) {
      if (i) doc.addPage();
      const g = groups[i][1];

      /* background + borders */
      doc
        .rect(0, 0, doc.page.width, doc.page.height)
        .fillColor('white')
        .fill();
      doc
        .rect(10, 10, doc.page.width - 20, doc.page.height - 20)
        .strokeColor('#2c5530')
        .lineWidth(3)
        .stroke();
      doc
        .rect(15, 15, doc.page.width - 30, doc.page.height - 30)
        .strokeColor('#7ba086')
        .lineWidth(1)
        .stroke();
      doc
        .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
        .fillColor('#455A64')
        .fill();

      const now = nowIND();

      /* info bar: Stock Type + Series | Report */
      doc
        .rect(20, 40, 555, 48)
        .fillColor('#f8fbff')
        .fill()
        .strokeColor('#c5d9f1')
        .lineWidth(1)
        .stroke();

      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#2e7d32')
        .text(`Stock Type: ${g.stockType || '-'}`, 25, 48);

      const rightInfo = `Series: ${g.series || '-'}   |   Report: ${fmtDate(now)}`;
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#2e7d32')
        .text(rightInfo, 0, 48, {
          width: doc.page.width - 40,
          align: 'right'
        });

      /* article line */
      doc
        .fontSize(13)
        .fillColor('#1a237e')
        .text(`ARTICLE: ${g.article} - ${g.gender}`, 25, 63);

      /* rate / mrp / pairs info */
      let info = '';
      if (showRate && g.rate) info += `Rate: ${g.rate}`;
      if (showMRP && g.mrp) info += (info ? ' | ' : '') + `MRP: ${g.mrp}`;
      info += (info ? ' | ' : '') + `Pairs/Carton: ${g.pairPerCarton || '-'}`;

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#424242')
        .text(info, 25, 77);

      /* big image */
      const imgTop = 105;
      const maxW = 535;
      const maxH = 360;
      const imgX = (doc.page.width - maxW) / 2;

      if (includeImages && g.image) {
        try {
          const img = await axios.get(g.image, { responseType: 'arraybuffer' });
          const buf = Buffer.from(img.data, 'binary');

          doc.image(buf, imgX, imgTop, {
            fit: [maxW, maxH],
            align: 'center',
            valign: 'top'
          });
        } catch (e) {
          console.error('image error', e.message);
        }
      }

      /* table: max 7 color rows */
      const containerW = 545;
      const tTop = imgTop + maxH + 10;
      let y = tTop,
        row = 24,
        colW = 120;

      const vars = g.variants.filter(v => (v.cartons || 0) > 0);

      const sizes = [...new Set(
        vars.map(v => v.size?.trim().toUpperCase())
      )]
        .filter(Boolean)
        .sort((a, b) => a - b);

      let colors = [...new Set(vars.map(v => v.color?.trim() || '-'))];
      colors = colors.slice(0, 7); // max 7

      if (vars.length && colors.length) {
        const sizeW = Math.floor((containerW - 50 - colW) / sizes.length);
        const x0 = 40,
          tW = colW + sizes.length * sizeW;

        // header row
        doc
          .rect(x0, y, tW, row)
          .fillColor('#1976d2')
          .fill()
          .fillColor('white');
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .text('COLOR', x0 + 8, y + 7, { width: colW - 16 });

        let hx = x0 + colW;
        sizes.forEach(s => {
          doc.text(s, hx, y + 7, { width: sizeW, align: 'center' });
          hx += sizeW;
        });

        doc
          .moveTo(x0, y)
          .lineTo(x0 + tW, y)
          .strokeColor('#1565c0')
          .lineWidth(2)
          .stroke();

        let vx = x0;
        for (let j = 0; j <= sizes.length; j++) {
          doc
            .moveTo(vx, y)
            .lineTo(vx, y + row)
            .strokeColor('#1565c0')
            .stroke();
          vx += j === 0 ? colW : sizeW;
        }

        // data rows
        y += row;
        doc.font('Helvetica').fontSize(9);

        colors.forEach((clr, i2) => {
          doc
            .rect(x0, y, tW, row)
            .fillColor(i2 % 2 ? '#ffffff' : '#f8fbff')
            .fill();
          doc
            .fillColor('#1565c0')
            .text(clr, x0 + 8, y + 7, { width: colW - 16 });

          let cx = x0 + colW;
          sizes.forEach(sz => {
            const v = vars.find(
              v2 =>
                v2.color?.trim() === clr &&
                v2.size?.trim().toUpperCase() === sz
            );
            const val = v?.cartons || '-';

            doc
              .fillColor(val !== '-' ? '#0d47a1' : '#90a4ae')
              .font(val !== '-' ? 'Helvetica-Bold' : 'Helvetica')
              .text(val.toString(), cx, y + 7, {
                width: sizeW,
                align: 'center'
              });
            cx += sizeW;
          });

          doc
            .moveTo(x0, y)
            .lineTo(x0 + tW, y)
            .strokeColor('#90a4ae')
            .lineWidth(1)
            .stroke();

          let vx2 = x0;
          for (let j = 0; j <= sizes.length; j++) {
            doc
              .moveTo(vx2, y)
              .lineTo(vx2, y + row)
              .strokeColor('#90a4ae')
              .stroke();
            vx2 += j === 0 ? colW : sizeW;
          }

          y += row;
        });

        doc
          .moveTo(x0, y)
          .lineTo(x0 + tW, y)
          .strokeColor('#90a4ae')
          .stroke();
      }

      /* footer ------------------------------------------------------ */
      doc
        .fontSize(8)
        .fillColor('#1976d2')
        .text(`Page ${i + 1} of ${groups.length}`, 0, doc.page.height - 30, {
          align: 'center'
        });
    }

    doc.end();
  } catch (e) {
    console.error(e);
    res.status(500).send('PDF generation failed');
  }
});

module.exports = router;
