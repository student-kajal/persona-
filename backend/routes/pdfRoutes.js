
/*  routes/pdf.js  */
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
    const doc = new PDFKit({ size:[595,665], margins:{top:20,bottom:20,left:20,right:20} });
    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition','attachment; filename=stock-report.pdf');
    doc.pipe(res);

    /* group --------------------------------------------------------- */
    const grouped = prods.reduce((m,p)=>{
      const key=`${p.article}-${p.gender}`.toUpperCase();
      (m[key]=m[key]||{...p,variants:[]}).variants.push(p);
      return m;
    },{});
    const groups = Object.entries(grouped).sort((a,b)=>{
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
         .text(`Series: ${g.series||'-'}`,340,143);          // left-shifted
      doc.fontSize(13).fillColor('#1a237e')
         .text(`ARTICLE: ${g.article}`,25,158);

       let info='';
      // if(showRate) info+=`Rate: ₹${g.rate||'-'}`;
      // if(showMRP) info+=(info?' | ':'')+`MRP: ₹${g.mrp||'-'}`;
      // info+=(info?' | ':'')+`Pairs/Carton: ${g.pairPerCarton||'-'}`;
      // doc.font('Helvetica').fontSize(9).fillColor('#424242')
      //    .text(info,25,172);
      if(g.rate) info+=`Rate: ${g.rate||'-'}`;
if(g.mrp) info+=(info?' | ':'')+`MRP: ${g.mrp||'-'}`;
info+=(info?' | ':'')+`Pairs/Carton: ${g.pairPerCarton||'-'}`;
doc.font('Helvetica').fontSize(9).fillColor('#424242')
   .text(info,25,172);

      /* --- container --- */
      // const cTop=195, cH=320;
      // doc.rect(25,cTop,545,cH).fillColor('#fcfdff').fill()
      //    .strokeColor('#d0e0f5').lineWidth(2).stroke();
      /* --- container --- */
const cTop = 195, cH = 320;
doc.rect(25, cTop, 545, cH)          // outer box
   .fillColor('#455A64')              // charcoal background
   .fill()                            // draw fill first
   .strokeColor('#d0e0f5')            // thin light border
   .lineWidth(2)
   .stroke();


      /* --- centred image inside dark-grey block --- */
      if(includeImages && g.image){
        try{
          const img = await axios.get(g.image,{responseType:'arraybuffer'});
          const buf = Buffer.from(img.data,'binary');
          const w=300,h=240;
          const x=25+(545-w)/2, y=cTop+20;
          doc.rect(x-8,y-8,w+16,h+16)
             .fillColor('#455A64').fill();                   // dark-grey frame
          doc.image(buf,x,y,{fit:[w,h],align:'center',valign:'center'});
        }catch{}
      }

      /* --- responsive table with full grid lines --- */
      const tTop=cTop+(includeImages?270:30);
      let y=tTop,row=24,colW=120;
      const vars = g.variants.filter(v=>(v.cartons||0)>0);
      const sizes =[...new Set(vars.map(v=>v.size?.trim().toUpperCase()))]
                      .filter(Boolean).sort((a,b)=>a-b);
      const colors=[...new Set(vars.map(v=>v.color?.trim()||'-'))];

      if(vars.length){
        const sizeW=Math.floor((545-50-colW)/sizes.length);
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
        /* top border & vertical header lines */
        doc.moveTo(x0,y).lineTo(x0+tW,y)
           .strokeColor('#1565c0').lineWidth(2).stroke();
        let vx=x0;
        for(let j=0;j<=sizes.length;j++){
          doc.moveTo(vx,y).lineTo(vx,y+row)
             .strokeColor('#1565c0').stroke();
          vx+=(j===0)?colW:sizeW;
        }

        /* rows */
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

          /* horizontal line */
          doc.moveTo(x0,y).lineTo(x0+tW,y)
             .strokeColor('#90a4ae').lineWidth(1).stroke();
          /* vertical lines */
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
