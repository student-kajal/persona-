
// // // /*  routes/pdf.js  */
// // // const express = require('express');
// // // const router  = express.Router();
// // // const PDFKit  = require('pdfkit');
// // // const Product = require('../models/Product');
// // // const axios   = require('axios');

// // // /* ---------- helpers ---------- */
// // // const nowIND  = () => new Date(new Date()
// // //                   .toLocaleString('en-US',{timeZone:'Asia/Kolkata'}));
// // // const fmtDate = d => d.toLocaleDateString('en-IN',
// // //                   {day:'2-digit',month:'2-digit',year:'numeric'});
// // // const fmtDateT = d => d.toLocaleString('en-IN',
// // //                   {day:'2-digit',month:'2-digit',year:'numeric',
// // //                    hour:'2-digit',minute:'2-digit',second:'2-digit',
// // //                    hour12:true});
// // // const vGroup = (t='',g='')=>{
// // //   t=t.toLowerCase(); g=g.toLowerCase();
// // //   if(t==='eva') return {order:2+['ladies','kids_ladies','gents','kids_gents'].indexOf(g)};
// // //   if(t==='pu' ) return {order:7+['ladies','kids_ladies','gents','kids_gents'].indexOf(g)};
// // //   return {order:99};
// // // };

// // // /* ---------- route ---------- */
// // // router.post('/generate-pdf', async (req,res)=>{
// // //   try{
// // //     const { includeImages, filters={}, showRate, showMRP, productIds=[] } = req.body;

// // //     /* query --------------------------------------------------------- */
// // //     const q = productIds.length
// // //       ? { _id:{ $in:productIds }, isDeleted:{ $ne:true } }
// // //       : { isDeleted:{ $ne:true },
// // //           ...Object.fromEntries(
// // //               Object.entries(filters)
// // //                     .filter(([k,v])=>v)
// // //                     .map(([k,v])=>[k,new RegExp(v,'i')])) };

// // //     const prods = await Product.find(q).lean();

// // //     /* pdf ----------------------------------------------------------- */
// // //     const doc = new PDFKit({ size:[595,680], margins:{top:20,bottom:20,left:20,right:20} });
// // //     res.setHeader('Content-Type','application/pdf');
// // //     res.setHeader('Content-Disposition','attachment; filename=stock-report.pdf');
// // //     doc.pipe(res);

// // //     /* group --------------------------------------------------------- */
// // //     const grouped = prods.reduce((m,p)=>{
// // //       const key=`${p.article}-${p.gender}`.toUpperCase();
// // //       (m[key]=m[key]||{...p,variants:[]}).variants.push(p);
// // //       return m;
// // //     },{});
// // //     const groups = Object.entries(grouped).sort((a,b)=>{
// // //       const A=a[1],B=b[1];
// // //       const oA=vGroup(A.stockType,A.gender).order,
// // //             oB=vGroup(B.stockType,B.gender).order;
// // //       return oA-oB ||
// // //              (A.series||'').localeCompare(B.series||'') ||
// // //              A.article.localeCompare(B.article);
// // //     });

// // //     /* loop ---------------------------------------------------------- */
// // //     for(let i=0;i<groups.length;i++){
// // //       if(i) doc.addPage();
// // //       const g = groups[i][1];

// // //       /* --- background & frame --- */
// // //       doc.rect(0,0,doc.page.width,doc.page.height)
// // //          .fillColor('#f0f7ff').fill();
// // //       doc.rect(10,10,doc.page.width-20,doc.page.height-20)
// // //          .strokeColor('#2c5530').lineWidth(3).stroke();
// // //       doc.rect(15,15,doc.page.width-30,doc.page.height-30)
// // //          .strokeColor('#7ba086').lineWidth(1).stroke();

// // //       /* --- header --- */
// // //       doc.font('Helvetica-Bold').fontSize(18).fillColor('#1a237e')
// // //          .text('GPFAX PVT. LTD.',{align:'center'},35);
// // //       doc.moveTo(150,60).lineTo(445,60)
// // //          .lineWidth(2.5).strokeColor('#1a237e').stroke();
// // //       doc.fontSize(14).fillColor('#2c3e50')
// // //          .text('Stock Statement',{align:'center'},72);
// // //       doc.moveTo(220,95).lineTo(375,95)
// // //          .lineWidth(1).strokeColor('#7f8c8d').stroke();

// // //       const now = nowIND();
// // //       doc.rect(25,105,545,22).fillColor('#f5f9ff').fill()
// // //          .strokeColor('#b8d4f0').lineWidth(1).stroke();
// // //       doc.font('Helvetica').fontSize(9).fillColor('#495057')
// // //          .text(`Generated: ${fmtDateT(now)}`,30,113)
// // //          .text(`Report Date: ${fmtDate(now)}`,{align:'right'},113);

// // //       /* --- widened info bar --- */
// // //       doc.rect(20,135,555,48).fillColor('#f8fbff').fill()
// // //          .strokeColor('#c5d9f1').lineWidth(1).stroke();
// // //       doc.font('Helvetica-Bold').fontSize(10).fillColor('#2e7d32')
// // //          .text(`Stock Type: ${g.stockType||'-'}`,25,143)
// // //          .text(`Series: ${g.series||'-'}`,340,143);          // left-shifted
// // //       doc.fontSize(13).fillColor('#1a237e')
// // //          .text(`ARTICLE: ${g.article}`,25,158);

// // //        let info='';
// // //       // if(showRate) info+=`Rate: ₹${g.rate||'-'}`;
// // //       // if(showMRP) info+=(info?' | ':'')+`MRP: ₹${g.mrp||'-'}`;
// // //       // info+=(info?' | ':'')+`Pairs/Carton: ${g.pairPerCarton||'-'}`;
// // //       // doc.font('Helvetica').fontSize(9).fillColor('#424242')
// // //       //    .text(info,25,172);
// // //       if(g.rate) info+=`Rate: ${g.rate||'-'}`;
// // // if(g.mrp) info+=(info?' | ':'')+`MRP: ${g.mrp||'-'}`;
// // // info+=(info?' | ':'')+`Pairs/Carton: ${g.pairPerCarton||'-'}`;
// // // doc.font('Helvetica').fontSize(9).fillColor('#424242')
// // //    .text(info,25,172);

// // //       /* --- container --- */
// // //       // const cTop=195, cH=320;
// // //       // doc.rect(25,cTop,545,cH).fillColor('#fcfdff').fill()
// // //       //    .strokeColor('#d0e0f5').lineWidth(2).stroke();
// // //       /* --- container --- */
// // // const cTop = 195, cH = 320;
// // // doc.rect(25, cTop, 545, cH)          // outer box
// // //    .fillColor('#455A64')              // charcoal background
// // //    .fill()                            // draw fill first
// // //    .strokeColor('#d0e0f5')            // thin light border
// // //    .lineWidth(2)
// // //    .stroke();


// // //       /* --- centred image inside dark-grey block --- */
// // //       if(includeImages && g.image){
// // //         try{
// // //           const img = await axios.get(g.image,{responseType:'arraybuffer'});
// // //           const buf = Buffer.from(img.data,'binary');
// // //           const w=300,h=240;
// // //           const x=25+(545-w)/2, y=cTop+20;
// // //           doc.rect(x-8,y-8,w+16,h+16)
// // //              .fillColor('#455A64').fill();                   // dark-grey frame
// // //           doc.image(buf,x,y,{fit:[w,h],align:'center',valign:'center'});
// // //         }catch{}
// // //       }

// // //       /* --- responsive table with full grid lines --- */
// // //       const tTop=cTop+(includeImages?270:30);
// // //       let y=tTop,row=24,colW=120;
// // //       const vars = g.variants.filter(v=>(v.cartons||0)>0);
// // //       const sizes =[...new Set(vars.map(v=>v.size?.trim().toUpperCase()))]
// // //                       .filter(Boolean).sort((a,b)=>a-b);
// // //       const colors=[...new Set(vars.map(v=>v.color?.trim()||'-'))];

// // //       if(vars.length){
// // //         const sizeW=Math.floor((545-50-colW)/sizes.length);
// // //         const x0=40, tW=colW+sizes.length*sizeW;

// // //         /* header */
// // //         doc.rect(x0,y,tW,row).fillColor('#1976d2').fill()
// // //            .fillColor('white');
// // //         doc.font('Helvetica-Bold').fontSize(10)
// // //            .text('COLOR',x0+8,y+7,{width:colW-16});
// // //         let hx=x0+colW;
// // //         sizes.forEach(s=>{
// // //           doc.text(s,hx,y+7,{width:sizeW,align:'center'});
// // //           hx+=sizeW;
// // //         });
// // //         /* top border & vertical header lines */
// // //         doc.moveTo(x0,y).lineTo(x0+tW,y)
// // //            .strokeColor('#1565c0').lineWidth(2).stroke();
// // //         let vx=x0;
// // //         for(let j=0;j<=sizes.length;j++){
// // //           doc.moveTo(vx,y).lineTo(vx,y+row)
// // //              .strokeColor('#1565c0').stroke();
// // //           vx+=(j===0)?colW:sizeW;
// // //         }

// // //         /* rows */
// // //         y+=row; doc.font('Helvetica').fontSize(9);
// // //         colors.forEach((clr,i)=>{
// // //           doc.rect(x0,y,tW,row)
// // //              .fillColor(i%2?'#ffffff':'#f8fbff').fill();
// // //           doc.fillColor('#1565c0')
// // //              .text(clr,x0+8,y+7,{width:colW-16});

// // //           let cx=x0+colW;
// // //           sizes.forEach(sz=>{
// // //             const v=vars.find(v=>v.color?.trim()===clr &&
// // //                                  v.size?.trim().toUpperCase()===sz);
// // //             const val=v?.cartons||'-';
// // //             doc.fillColor(val!=='-'?'#0d47a1':'#90a4ae')
// // //                .font(val!=='-'?'Helvetica-Bold':'Helvetica')
// // //                .text(val.toString(),cx,y+7,{width:sizeW,align:'center'});
// // //             cx+=sizeW;
// // //           });

// // //           /* horizontal line */
// // //           doc.moveTo(x0,y).lineTo(x0+tW,y)
// // //              .strokeColor('#90a4ae').lineWidth(1).stroke();
// // //           /* vertical lines */
// // //           let vx2=x0;
// // //           for(let j=0;j<=sizes.length;j++){
// // //             doc.moveTo(vx2,y).lineTo(vx2,y+row)
// // //                .strokeColor('#90a4ae').stroke();
// // //             vx2+=(j===0)?colW:sizeW;
// // //           }
// // //           y+=row;
// // //         });
// // //         /* closing bottom border */
// // //         doc.moveTo(x0,y).lineTo(x0+tW,y)
// // //            .strokeColor('#90a4ae').stroke();
// // //       }

// // //       /* --- footer --- */
// // //       doc.fontSize(8).fillColor('#1976d2')
// // //          .text(`Page ${i+1} of ${groups.length}`,0,doc.page.height-30,{align:'center'});
// // //     }

// // //     doc.end();
// // //   }catch(e){
// // //     console.error(e);
// // //     res.status(500).send('PDF generation failed');
// // //   }
// // // });

// // // module.exports = router;
// // /*  routes/pdf.js  */
// // const express = require('express');
// // const router  = express.Router();
// // const PDFKit  = require('pdfkit');
// // const Product = require('../models/Product');
// // const axios   = require('axios');

// // /* ---------- helpers ---------- */
// // const nowIND  = () => new Date(new Date()
// //                   .toLocaleString('en-US',{timeZone:'Asia/Kolkata'}));
// // const fmtDate = d => d.toLocaleDateString('en-IN',
// //                   {day:'2-digit',month:'2-digit',year:'numeric'});
// // const fmtDateT = d => d.toLocaleString('en-IN',
// //                   {day:'2-digit',month:'2-digit',year:'numeric',
// //                    hour:'2-digit',minute:'2-digit',second:'2-digit',
// //                    hour12:true});
// // const vGroup = (t='',g='')=>{
// //   t=t.toLowerCase(); g=g.toLowerCase();
// //   if(t==='eva') return {order:2+['ladies','kids_ladies','gents','kids_gents'].indexOf(g)};
// //   if(t==='pu' ) return {order:7+['ladies','kids_ladies','gents','kids_gents'].indexOf(g)};
// //   return {order:99};
// // };

// // /* ---------- route ---------- */
// // router.post('/generate-pdf', async (req,res)=>{
// //   try{
// //     const { includeImages, filters={}, showRate, showMRP, productIds=[] } = req.body;

// //     /* query --------------------------------------------------------- */
// //     const q = productIds.length
// //       ? { _id:{ $in:productIds }, isDeleted:{ $ne:true } }
// //       : { isDeleted:{ $ne:true },
// //           ...Object.fromEntries(
// //               Object.entries(filters)
// //                     .filter(([k,v])=>v)
// //                     .map(([k,v])=>[k,new RegExp(v,'i')])) };

// //     const prods = await Product.find(q).lean();

// //     /* pdf ----------------------------------------------------------- */
// //     const doc = new PDFKit({ size:[595,688], margins:{top:20,bottom:20,left:20,right:20} });
// //     res.setHeader('Content-Type','application/pdf');
// //     res.setHeader('Content-Disposition','attachment; filename=stock-report.pdf');
// //     doc.pipe(res);

// //     /* group --------------------------------------------------------- */
// //     const grouped = prods.reduce((m,p)=>{
// //       const key=`${p.article}-${p.gender}`.toUpperCase();
// //       (m[key]=m[key]||{...p,variants:[]}).variants.push(p);
// //       return m;
// //     },{});
    
// //     // Filter out groups with zero total stock
// //     const filteredGroups = Object.entries(grouped).filter(([key,g])=>{
// //       const totalStock = g.variants.reduce((sum,v)=>(sum+(v.cartons||0)),0);
// //       return totalStock > 0;  // Only include groups with stock > 0
// //     });
    
// //     const groups = filteredGroups.sort((a,b)=>{
// //       const A=a[1],B=b[1];
// //       const oA=vGroup(A.stockType,A.gender).order,
// //             oB=vGroup(B.stockType,B.gender).order;
// //       return oA-oB ||
// //              (A.series||'').localeCompare(B.series||'') ||
// //              A.article.localeCompare(B.article);
// //     });

// //     /* loop ---------------------------------------------------------- */
// //     for(let i=0;i<groups.length;i++){
// //       if(i) doc.addPage();
// //       const g = groups[i][1];

// //       /* --- background & frame --- */
// //       doc.rect(0,0,doc.page.width,doc.page.height)
// //          .fillColor('#f0f7ff').fill();
// //       doc.rect(10,10,doc.page.width-20,doc.page.height-20)
// //          .strokeColor('#2c5530').lineWidth(3).stroke();
// //       doc.rect(15,15,doc.page.width-30,doc.page.height-30)
// //          .strokeColor('#7ba086').lineWidth(1).stroke();

// //       /* --- header --- */
// //       doc.font('Helvetica-Bold').fontSize(18).fillColor('#1a237e')
// //          .text('GPFAX PVT. LTD.',{align:'center'},35);
// //       doc.moveTo(150,60).lineTo(445,60)
// //          .lineWidth(2.5).strokeColor('#1a237e').stroke();
// //       doc.fontSize(14).fillColor('#2c3e50')
// //          .text('Stock Statement',{align:'center'},72);
// //       doc.moveTo(220,95).lineTo(375,95)
// //          .lineWidth(1).strokeColor('#7f8c8d').stroke();

// //       const now = nowIND();
// //       doc.rect(25,105,545,22).fillColor('#f5f9ff').fill()
// //          .strokeColor('#b8d4f0').lineWidth(1).stroke();
// //       doc.font('Helvetica').fontSize(9).fillColor('#495057')
// //          .text(`Generated: ${fmtDateT(now)}`,30,113)
// //          .text(`Report Date: ${fmtDate(now)}`,{align:'right'},113);

// //       /* --- widened info bar --- */
// //       doc.rect(20,135,555,48).fillColor('#f8fbff').fill()
// //          .strokeColor('#c5d9f1').lineWidth(1).stroke();
// //       doc.font('Helvetica-Bold').fontSize(10).fillColor('#2e7d32')
// //          .text(`Stock Type: ${g.stockType||'-'}`,25,143)
// //          .text(`Series: ${g.series||'-'}`,340,143);
// //       doc.fontSize(13).fillColor('#1a237e')
// //          .text(`ARTICLE: ${g.article} - ${g.gender}`,25,158);  // Added gender display

// //       let info='';
// //       if(g.rate) info+=`Rate: ${g.rate||'-'}`;
// //       if(g.mrp) info+=(info?' | ':'')+`MRP: ${g.mrp||'-'}`;
// //       info+=(info?' | ':'')+`Pairs/Carton: ${g.pairPerCarton||'-'}`;
// //       doc.font('Helvetica').fontSize(9).fillColor('#424242')
// //          .text(info,25,172);

// //       /* --- container --- */
// //       const cTop = 195, cH = 320;
// //       doc.rect(25, cTop, 545, cH)
// //          .fillColor('#455A64')              // charcoal background
// //          .fill()
// //          .strokeColor('#d0e0f5')
// //          .lineWidth(2)
// //          .stroke();

// //       /* --- centred image --- */
// //       if(includeImages && g.image){
// //         try{
// //           const img = await axios.get(g.image,{responseType:'arraybuffer'});
// //           const buf = Buffer.from(img.data,'binary');
// //           const w=300,h=240;
// //           const x=25+(545-w)/2, y=cTop+20;
// //           doc.image(buf,x,y,{fit:[w,h]});
// //         }catch{}
// //       }

// //       /* --- responsive table with full grid lines --- */
// //       const tTop=cTop+(includeImages?270:30);
// //       let y=tTop,row=24,colW=120;
// //       const vars = g.variants.filter(v=>(v.cartons||0)>0);  // Only non-zero stock
// //       const sizes =[...new Set(vars.map(v=>v.size?.trim().toUpperCase()))]
// //                       .filter(Boolean).sort((a,b)=>a-b);
// //       const colors=[...new Set(vars.map(v=>v.color?.trim()||'-'))];

// //       if(vars.length){
// //         const sizeW=Math.floor((545-50-colW)/sizes.length);
// //         const x0=40, tW=colW+sizes.length*sizeW;

// //         /* header */
// //         doc.rect(x0,y,tW,row).fillColor('#1976d2').fill()
// //            .fillColor('white');
// //         doc.font('Helvetica-Bold').fontSize(10)
// //            .text('COLOR',x0+8,y+7,{width:colW-16});
// //         let hx=x0+colW;
// //         sizes.forEach(s=>{
// //           doc.text(s,hx,y+7,{width:sizeW,align:'center'});
// //           hx+=sizeW;
// //         });
        
// //         /* header borders & vertical lines */
// //         doc.moveTo(x0,y).lineTo(x0+tW,y)
// //            .strokeColor('#1565c0').lineWidth(2).stroke();
// //         let vx=x0;
// //         for(let j=0;j<=sizes.length;j++){
// //           doc.moveTo(vx,y).lineTo(vx,y+row)
// //              .strokeColor('#1565c0').stroke();
// //           vx+=(j===0)?colW:sizeW;
// //         }

// //         /* data rows */
// //         y+=row; doc.font('Helvetica').fontSize(9);
// //         colors.forEach((clr,i)=>{
// //           doc.rect(x0,y,tW,row)
// //              .fillColor(i%2?'#ffffff':'#f8fbff').fill();
// //           doc.fillColor('#1565c0')
// //              .text(clr,x0+8,y+7,{width:colW-16});

// //           let cx=x0+colW;
// //           sizes.forEach(sz=>{
// //             const v=vars.find(v=>v.color?.trim()===clr &&
// //                                  v.size?.trim().toUpperCase()===sz);
// //             const val=v?.cartons||'-';
// //             doc.fillColor(val!=='-'?'#0d47a1':'#90a4ae')
// //                .font(val!=='-'?'Helvetica-Bold':'Helvetica')
// //                .text(val.toString(),cx,y+7,{width:sizeW,align:'center'});
// //             cx+=sizeW;
// //           });

// //           /* horizontal & vertical grid lines */
// //           doc.moveTo(x0,y).lineTo(x0+tW,y)
// //              .strokeColor('#90a4ae').lineWidth(1).stroke();
// //           let vx2=x0;
// //           for(let j=0;j<=sizes.length;j++){
// //             doc.moveTo(vx2,y).lineTo(vx2,y+row)
// //                .strokeColor('#90a4ae').stroke();
// //             vx2+=(j===0)?colW:sizeW;
// //           }
// //           y+=row;
// //         });
// //         /* closing bottom border */
// //         doc.moveTo(x0,y).lineTo(x0+tW,y)
// //            .strokeColor('#90a4ae').stroke();
// //       }

// //       /* --- footer --- */
// //       doc.fontSize(8).fillColor('#1976d2')
// //          .text(`Page ${i+1} of ${groups.length}`,0,doc.page.height-30,{align:'center'});
// //     }

// //     doc.end();
// //   }catch(e){
// //     console.error(e);
// //     res.status(500).send('PDF generation failed');
// //   }
// // });

// // module.exports = router;

// /*  routes/pdf.js  */
// /*  routes/pdf.js  */
// /*  routes/pdf.js  */
const express = require('express');
const router  = express.Router();
const PDFKit  = require('pdfkit');
const Product = require('../models/Product');
const axios   = require('axios');

/* ---------- helpers ---------- */
const nowIND  = () => new Date(new Date()
                  .toLocaleString('en-US',{timeZone:'Asia/Kolkata'}));
const fmtDate = d => d.toLocaleDateString('en-IN',
                  {day:'2-digit',month:'2-digit',year:'numeric'});
const fmtDateT = d => d.toLocaleString('en-IN',
                  {day:'2-digit',month:'2-digit',year:'numeric',
                   hour:'2-digit',minute:'2-digit',second:'2-digit',
                   hour12:true});
const vGroup = (t='',g='')=>{
  t=t.toLowerCase(); g=g.toLowerCase();
  if(t==='eva') return {order:2+['ladies','kids_ladies','gents','kids_gents'].indexOf(g)};
  if(t==='pu' ) return {order:7+['ladies','kids_ladies','gents','kids_gents'].indexOf(g)};
  return {order:99};
};

/* ---------- route ---------- */
router.post('/generate-pdf', async (req,res)=>{
  try{
    const { includeImages, filters={}, showRate, showMRP, productIds=[] } = req.body;

    /* query --------------------------------------------------------- */
    const q = productIds.length
      ? { _id:{ $in:productIds }, isDeleted:{ $ne:true } }
      : { isDeleted:{ $ne:true },
          ...Object.fromEntries(
              Object.entries(filters)
                    .filter(([k,v])=>v)
                    .map(([k,v])=>[k,new RegExp(v,'i')])) };

    const prods = await Product.find(q).lean();

    /* pdf ----------------------------------------------------------- */
    const doc = new PDFKit({ size:[595,688], margins:{top:20,bottom:20,left:20,right:20} });
    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition','attachment; filename=stock-report.pdf');
    doc.pipe(res);

    /* group --------------------------------------------------------- */
    // const grouped = prods.reduce((m,p)=>{
    //   const key=`${p.article}-${p.gender}`.toUpperCase();
    //   (m[key]=m[key]||{...p,variants:[]}).variants.push(p);
    //   return m;
    // },{});
    const grouped = prods.reduce((m, p) => {
  const key = `${p.article}-${p.gender}`.toUpperCase();

  if (!m[key]) {
    m[key] = { ...p, variants: [] };
    m[key].image = p.image || null;   // pehla variant agar image de to use
  }

  m[key].variants.push(p);

  // ✅ agar pehle wale me image nahi thi, lekin is variant me hai, to ab set karo
  if (!m[key].image && p.image) {
    m[key].image = p.image;
  }

  return m;
}, {});

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

    /* loop ---------------------------------------------------------- */
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
         .text(`ARTICLE: ${g.article} - ${g.gender}`,25,158);

      /* --- conditional rate/MRP display based on flags --- */
      let info = '';
      if(showRate && g.rate) {
        info += `Rate: ${g.rate}`;
      }
      if(showMRP && g.mrp) {
        info += (info ? ' | ' : '') + `MRP: ${g.mrp}`;
      }
      // Always show Pairs/Carton
      info += (info ? ' | ' : '') + `Pairs/Carton: ${g.pairPerCarton||'-'}`;
      
      doc.font('Helvetica').fontSize(9).fillColor('#424242')
         .text(info,25,172);

      /* --- container --- */
      const cTop = 195, cH = 320;
      const containerX = 25, containerW = 545;
      doc.rect(containerX, cTop, containerW, cH)
         .fillColor('#455A64')              // charcoal background
         .fill()
         .strokeColor('#d0e0f5')
         .lineWidth(2)
         .stroke();

      /* --- perfectly centered image --- */
      if(includeImages && g.image){
        try{
          const img = await axios.get(g.image,{responseType:'arraybuffer'});
          const buf = Buffer.from(img.data,'binary');
          
          // Image dimensions
          const imgW = 280, imgH = 200;  // Slightly smaller for better fit
          
          // Calculate center position within the charcoal container
          const imgX = containerX + (containerW - imgW) / 2;  // Horizontal center
          const imgY = cTop + 30;  // Fixed from top of container
          
          doc.image(buf, imgX, imgY, {
            fit: [imgW, imgH],
            align: 'center',
            valign: 'center'
          });
        }catch{}
      }

      /* --- responsive table with full grid lines --- */
      const tTop=cTop+(includeImages?250:30);  // Adjusted table position
      let y=tTop,row=24,colW=120;
      const vars = g.variants.filter(v=>(v.cartons||0)>0);
      const sizes =[...new Set(vars.map(v=>v.size?.trim().toUpperCase()))]
                      .filter(Boolean).sort((a,b)=>a-b);
      const colors=[...new Set(vars.map(v=>v.color?.trim()||'-'))];

      if(vars.length){
        const sizeW=Math.floor((containerW-50-colW)/sizes.length);
        const x0=40, tW=colW+sizes.length*sizeW;

        /* header */
        doc.rect(x0,y,tW,row).fillColor('#1976d2').fill()
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
          doc.moveTo(vx,y).lineTo(vx,y+row)
             .strokeColor('#1565c0').stroke();
          vx+=(j===0)?colW:sizeW;
        }

        /* data rows */
        y+=row; doc.font('Helvetica').fontSize(9);
        colors.forEach((clr,i)=>{
          doc.rect(x0,y,tW,row)
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
            doc.moveTo(vx2,y).lineTo(vx2,y+row)
               .strokeColor('#90a4ae').stroke();
            vx2+=(j===0)?colW:sizeW;
          }
          y+=row;
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
  }catch(e){
    console.error(e);
    res.status(500).send('PDF generation failed');
  }
});

module.exports = router;





// /*  routes/pdf.js - ULTRA-FAST WITH IMAGES  */
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
// const fmtTime = d => d.toLocaleTimeString('en-IN',
//                   {hour:'2-digit',minute:'2-digit',hour12:true});
// const vGroup = (t='',g='')=>{
//   t=t.toLowerCase(); g=g.toLowerCase();
//   if(t==='eva') return {order:2+['ladies','kids_ladies','gents','kids_gents'].indexOf(g)};
//   if(t==='pu' ) return {order:7+['ladies','kids_ladies','gents','kids_gents'].indexOf(g)};
//   return {order:99};
// };

// /* ✅ ULTRA-FAST IMAGE FETCH - Skip slow ones */
// const fetchImage = async (url) => {
//   if (!url) return null;
  
//   const controller = new AbortController();
//   const timeout = setTimeout(() => controller.abort(), 1500); // ✅ 1.5s max per image
  
//   try {
//     const response = await axios.get(url, {
//       responseType: 'arraybuffer',
//       signal: controller.signal,
//       timeout: 1500,
//       maxContentLength: 800 * 1024, // ✅ Max 800KB
//       maxRedirects: 0, // ✅ No redirects
//       headers: {
//         'Accept': 'image/*'
//       }
//     });
//     clearTimeout(timeout);
//     return Buffer.from(response.data);
//   } catch (err) {
//     clearTimeout(timeout);
//     return null; // ✅ Skip slow/failed images silently
//   }
// };

// /* ✅ MAIN ROUTE */
// router.post('/generate-pdf', async (req,res)=>{
//   const startTime = Date.now();
  
//   try{
//     const { includeImages, filters={}, showRate, showMRP, productIds=[] } = req.body;

//     /* query */
//     const q = productIds.length
//       ? { _id:{ $in:productIds }, isDeleted:{ $ne:true } }
//       : { isDeleted:{ $ne:true },
//           ...Object.fromEntries(
//               Object.entries(filters)
//                     .filter(([k,v])=>v)
//                     .map(([k,v])=>[k,new RegExp(v,'i')])) };

//     const prods = await Product.find(q).lean();
//     console.log(`📊 Found ${prods.length} products`);

//     /* pdf setup */
//     const doc = new PDFKit({ 
//       size:[595,688], 
//       margins:{top:20,bottom:20,left:20,right:20},
//       compress: true, // ✅ Enable PDF compression
//       autoFirstPage: false
//     });
    
//     res.setHeader('Content-Type','application/pdf');
//     res.setHeader('Content-Disposition','attachment; filename=catalogue.pdf');
//     res.setHeader('Cache-Control', 'no-cache');
//     doc.pipe(res);

//     /* group */
//     const grouped = prods.reduce((m,p)=>{
//       const key=`${p.article}-${p.gender}`.toUpperCase();
//       (m[key]=m[key]||{...p,variants:[]}).variants.push(p);
//       return m;
//     },{});
    
//     const filteredGroups = Object.entries(grouped).filter(([key,g])=>{
//       const totalStock = g.variants.reduce((sum,v)=>(sum+(v.cartons||0)),0);
//       return totalStock > 0;
//     });
    
//     const groups = filteredGroups.sort((a,b)=>{
//       const A=a[1],B=b[1];
//       const oA=vGroup(A.stockType,A.gender).order,
//             oB=vGroup(B.stockType,B.gender).order;
//       return oA-oB ||
//              (A.series||'').localeCompare(B.series||'') ||
//              A.article.localeCompare(B.article);
//     });

//     /* ✅ AGGRESSIVE PARALLEL IMAGE FETCH - Max 10 at a time */
//     let imageCache = {};
//     if(includeImages) {
//       console.log('🖼️  Fetching images...');
//       const imageStart = Date.now();
      
//       const imageUrls = groups.map(([,g]) => g.image).filter(Boolean);
//       const uniqueUrls = [...new Set(imageUrls)];
      
//       // ✅ Batch fetch (10 concurrent max to avoid overwhelming server)
//       const BATCH_SIZE = 10;
//       for(let i = 0; i < uniqueUrls.length; i += BATCH_SIZE) {
//         const batch = uniqueUrls.slice(i, i + BATCH_SIZE);
//         const batchPromises = batch.map(async (url) => {
//           const buf = await fetchImage(url);
//           return { url, buf };
//         });
        
//         const results = await Promise.allSettled(batchPromises);
//         results.forEach(result => {
//           if (result.status === 'fulfilled' && result.value.buf) {
//             imageCache[result.value.url] = result.value.buf;
//           }
//         });
//       }
      
//       console.log(`✅ Loaded ${Object.keys(imageCache).length}/${uniqueUrls.length} images in ${Date.now()-imageStart}ms`);
//     }

//     /* loop */
//     const now = nowIND();
    
//     for(let i=0;i<groups.length;i++){
//       doc.addPage();
//       const g = groups[i][1];

//       /* background & frame */
//       doc.rect(0,0,doc.page.width,doc.page.height)
//          .fillColor('#f0f7ff').fill();
//       doc.rect(10,10,doc.page.width-20,doc.page.height-20)
//          .strokeColor('#2c5530').lineWidth(3).stroke();
//       doc.rect(15,15,doc.page.width-30,doc.page.height-30)
//          .strokeColor('#7ba086').lineWidth(1).stroke();

//       /* header - only first page */
//       if(i === 0) {
//         doc.font('Helvetica-Bold').fontSize(22).fillColor('#1a237e')
//            .text('CATALOGUE',{align:'center'},50);
//         doc.moveTo(220,82).lineTo(375,82)
//            .lineWidth(2.5).strokeColor('#1a237e').stroke();
        
//         doc.font('Helvetica').fontSize(9).fillColor('#424242')
//            .text(`${fmtDate(now)} | ${fmtTime(now)}`,{align:'center'},90);
//       }

//       /* info bar */
//       const infoTop = i === 0 ? 110 : 35;
      
//       doc.rect(20,infoTop,555,48).fillColor('#f8fbff').fill()
//          .strokeColor('#c5d9f1').lineWidth(1).stroke();
//       doc.font('Helvetica-Bold').fontSize(10).fillColor('#2e7d32')
//          .text(`Stock Type: ${g.stockType||'-'}`,25,infoTop+8)
//          .text(`Series: ${g.series||'-'}`,340,infoTop+8);
//       doc.fontSize(13).fillColor('#1a237e')
//          .text(`ARTICLE: ${g.article} - ${g.gender}`,25,infoTop+23);

//       let info = '';
//       if(showRate && g.rate) info += `Rate: ${g.rate}`;
//       if(showMRP && g.mrp) info += (info ? ' | ' : '') + `MRP: ${g.mrp}`;
//       info += (info ? ' | ' : '') + `Pairs/Carton: ${g.pairPerCarton||'-'}`;
      
//       doc.font('Helvetica').fontSize(9).fillColor('#424242')
//          .text(info,25,infoTop+37);

//       /* container */
//       const cTop = i === 0 ? 170 : 95;
//       const cH = 320;
//       const containerX = 25, containerW = 545;
//       doc.rect(containerX, cTop, containerW, cH)
//          .fillColor('#455A64')
//          .fill()
//          .strokeColor('#d0e0f5')
//          .lineWidth(2)
//          .stroke();

//       /* ✅ OPTIMIZED IMAGE RENDERING */
//       if(includeImages && g.image && imageCache[g.image]){
//         try{
//           const imgW = 260, imgH = 180; // ✅ Slightly smaller = faster
//           const imgX = containerX + (containerW - imgW) / 2;
//           const imgY = cTop + 35;
          
//           doc.image(imageCache[g.image], imgX, imgY, {
//             fit: [imgW, imgH],
//             align: 'center',
//             valign: 'center'
//           });
//         }catch(e){
//           // Silent fail - just skip image
//         }
//       }

//       /* table */
//       const tTop=cTop+(includeImages?240:30);
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
//         doc.moveTo(x0,y).lineTo(x0+tW,y)
//            .strokeColor('#90a4ae').stroke();
//       }

//       /* footer */
//       doc.fontSize(8).fillColor('#1976d2')
//          .text(`Page ${i+1} of ${groups.length}`,0,doc.page.height-30,{align:'center'});
//     }

//     doc.end();
//     console.log(`✅ PDF generated in ${Date.now()-startTime}ms`);
    
//   }catch(e){
//     console.error('❌ PDF Error:', e);
//     if(!res.headersSent) {
//       res.status(500).send('PDF generation failed');
//     }
//   }
// });

// module.exports = router;
