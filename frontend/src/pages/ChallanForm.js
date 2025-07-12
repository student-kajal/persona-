// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { toast } from 'react-toastify';
// import { FaPlus, FaTrash, FaSave, FaTimes, FaSpinner } from 'react-icons/fa';
// import api from '../utils/api';
// import './ChallanForm.css';

// const ChallanForm = () => {
//   const navigate = useNavigate();
//   const [saving, setSaving] = useState(false);
//   const [articleVariants, setArticleVariants] = useState({});
//   const [loadingVariants, setLoadingVariants] = useState({});

//   const [formData, setFormData] = useState({
//     partyName: '',
//     date: new Date().toISOString().split('T')[0],
//     invoiceNo: '',
//     station: '',
//     transport: '',
//     marka: '',
//     items: [{
//       article: '',
//       size: '',
//       color: '',
//       cartons: 1,
//       pairPerCarton: 0,
//       rate: 0,
//       totalPair: 0,
//       amount: 0
//     }]
//   });

//   // Auto-generate invoice number
//   useEffect(() => {
//     const fetchLatestInvoice = async () => {
//       try {
//         const res = await api.get('/challans/latest-invoice');
//         const nextNumber = (res.data.invoice || 0) + 1;
//         setFormData(prev => ({
//           ...prev,
//           invoiceNo: `${nextNumber}/${new Date().getFullYear()}`
//         }));
//       } catch (err) {
//         console.error('Invoice error:', err);
//         setFormData(prev => ({
//           ...prev,
//           invoiceNo: `1/${new Date().getFullYear()}`
//         }));
//       }
//     };
//     fetchLatestInvoice();
//   }, []);

//   // Debounced article search
//   const debounce = (func, delay) => {
//     let timeoutId;
//     return (...args) => {
//       clearTimeout(timeoutId);
//       timeoutId = setTimeout(() => func(...args), delay);
//     };
//   };


//  // const debouncedFetch = debounce(fetchArticleVariants, 500);
//  const fetchArticleVariants = async (article, index, isBlur = false) => {
//   if (!article.trim()) {
//     setArticleVariants(prev => ({ ...prev, [index]: [] }));
//     return;
//   }
  
//   setLoadingVariants(prev => ({ ...prev, [index]: true }));

//   try {
//     const response = await api.get(`/challans/article/${article}/variants`);
    
//     // Update variants even if empty array
//     setArticleVariants(prev => ({
//       ...prev,
//       [index]: response.data.data
//     }));

//     // Show warning only if no variants found AND (isBlur OR input hasn't changed)
//     if (response.data.data.length === 0 && (isBlur)) {
//       toast.warning(`"${article}" article not found in database`, {
//         autoClose: 3000,
//         position: 'top-center'
//       });
//     }

//   } catch (err) {
//     // Only show error if input hasn't changed OR on blur
//     if (isBlur) {
//       toast.error(err.response?.data?.error || `"${article}" not found`, {
//         autoClose: 3000,
//         position: 'top-center'
//       });
//     }
//     // Clear variants for this index
//     setArticleVariants(prev => ({ ...prev, [index]: [] }));
    
//   } finally {
//     setLoadingVariants(prev => ({ ...prev, [index]: false }));
//   }
// };

//  const debouncedFetch = debounce(fetchArticleVariants, 500);
//   const handleItemChange = (index, e) => {
//     const { name, value } = e.target;
//     const newItems = [...formData.items];
    
//     if (name === 'article' || name === 'partyName' || name === 'station' || name === 'transport' || name === 'marka') {
//       newItems[index][name] = value.toUpperCase();
//     } else {
//       newItems[index][name] = name === 'cartons' || name === 'rate' ? parseFloat(value) || 0 : value;
//     }

//     if (name === 'article') {
//       //debouncedFetch(value, index);
//         debouncedFetch(value, index);
//       newItems[index].size = '';
//       newItems[index].color = '';
//       newItems[index].pairPerCarton = 0;
//       newItems[index].rate = 0;
//     }

//     if (name === 'size') {
//       newItems[index].color = '';
//       const variants = articleVariants[index] || [];
//       const sizeVariants = variants.filter(v => v.size === value);
//       if (sizeVariants.length === 1) {
//         newItems[index].color = sizeVariants[0].color;
//         newItems[index].pairPerCarton = sizeVariants[0].pairPerCarton;
//         newItems[index].rate = sizeVariants[0].rate;
//       }
//     }

//     if (name === 'color') {
//       const variants = articleVariants[index] || [];
//       const selectedVariant = variants.find(v => 
//         v.size === newItems[index].size && 
//         v.color === value
//       );
      
//       if (selectedVariant) {
//         newItems[index].pairPerCarton = selectedVariant.pairPerCarton;
//         newItems[index].rate = selectedVariant.rate;
//       }
//     }

//     newItems[index].totalPair = newItems[index].cartons * newItems[index].pairPerCarton;
//     newItems[index].amount = newItems[index].totalPair * newItems[index].rate;
    
//     setFormData(prev => ({ ...prev, items: newItems }));
//   };

//   const addItemRow = () => {
//     setFormData(prev => ({
//       ...prev,
//       items: [...prev.items, {
//         article: '',
//         size: '',
//         color: '',
//         cartons: 1,
//         pairPerCarton: 0,
//         rate: 0,
//         totalPair: 0,
//         amount: 0
//       }]
//     }));
//   };

//   const removeItemRow = (index) => {
//     if (formData.items.length > 1) {
//       const newItems = formData.items.filter((_, i) => i !== index);
//       setFormData(prev => ({ ...prev, items: newItems }));
      
//       const newVariants = { ...articleVariants };
//       delete newVariants[index];
//       setArticleVariants(newVariants);
//     }
//   };

//   const calculateTotals = () => {
//     return formData.items.reduce((acc, item) => ({
//       totalCartons: acc.totalCartons + (item.cartons || 0),
//       totalPairs: acc.totalPairs + (item.totalPair || 0),
//       totalAmount: acc.totalAmount + (item.amount || 0)
//     }), { totalCartons: 0, totalPairs: 0, totalAmount: 0 });
//   };


// const handleSubmit = async (e) => {
//   e.preventDefault();
//   setSaving(true);
//   let challanCreated = false;

//   try {
//     // Basic form validation
//     if (!formData.partyName || !formData.station || !formData.transport) {
//       throw new Error('Please fill all required fields');
//     }

//     for (let item of formData.items) {
//       if (!item.article || !item.size || !item.color || !item.cartons || !item.rate) {
//         throw new Error('Please fill all item details');
//       }
//     }

//     // Stock check
//     const stockCheckPayload = formData.items.map(item => ({
//       article: item.article.trim().toUpperCase(),
//       size: item.size.trim(),
//       color: item.color.trim().toUpperCase(),
//       requiredCartons: item.cartons
//     }));

//     const stockResponse = await api.post('/challans/stock-check', stockCheckPayload);
//     if (stockResponse.data.hasErrors) {
//       stockResponse.data.errors.forEach(error => {
//         toast.error(`Stock Issue: ${error.message}`, { 
//           autoClose: 10000,
//           position: 'top-center'
//         });
//       });
//       throw new Error('Cannot create challan due to stock issues');
//     }

//     // Challan creation
//     const payload = {
//       ...formData,
//       items: formData.items.map(item => ({
//         article: item.article.toUpperCase(),
//         color: item.color.toUpperCase(),
//         size: item.size,
//         cartons: Number(item.cartons),
//         pairPerCarton: Number(item.pairPerCarton),
//         rate: Number(item.rate),
//         totalPair: Number(item.cartons) * Number(item.pairPerCarton),
//         amount: Number(item.cartons) * Number(item.pairPerCarton) * Number(item.rate)
//       }))
//     };

//     const response = await api.post('/challans', payload);
//     console.log('Challan creation response:', response.data); // Debug log
    
//     if (!response.data.success) {
//       throw new Error(response.data.error || 'Failed to create challan');
//     }
    
//     challanCreated = true;
//     toast.success('Challan created successfully!');

//     // PDF handling with proper ID extraction
//     try {
//       await new Promise(resolve => setTimeout(resolve, 2000)); // Increased delay
      
//       // ✅ Same ID extraction as ChallanList
//       const challanId = response.data.data?._id || 
//                        response.data.data?.id || 
//                        response.data._id || 
//                        response.data.id;
      
//       console.log('PDF Generation Challan ID:', challanId);
      
//       if (!challanId) {
//         throw new Error('Challan ID not found in response');
//       }

//       const pdfResponse = await api.get(`/challan-pdf/${challanId}`, {
//         responseType: 'blob',
//         timeout: 45000 // Extended timeout
//       });

//       // Enhanced PDF validation
//       if (!pdfResponse.data || pdfResponse.data.size < 1024) {
//         throw new Error('Invalid PDF received from server');
//       }

//       // ✅ Same filename logic as ChallanList
//       const safeInvoiceNo = formData.invoiceNo.replace(/\//g, '-');
//       const filename = `challan-${safeInvoiceNo}.pdf`;

//       const blob = new Blob([pdfResponse.data], { type: 'application/pdf' });
//       const url = window.URL.createObjectURL(blob);
      
//       const link = document.createElement('a');
//       link.href = url;
//       link.setAttribute('download', filename);
//       document.body.appendChild(link);
//       link.click();

//       // Cleanup
//       document.body.removeChild(link);
//       window.URL.revokeObjectURL(url);
      
//       toast.success('PDF downloaded successfully!');
      
//     } catch (pdfErr) {
//       console.error('PDF Error Details:', {
//         message: pdfErr.message,
//         status: pdfErr.response?.status,
//         data: pdfErr.response?.data
//       });
//       toast.warning(pdfErr.response?.status === 404 ? 
//         'PDF generation service unavailable' : 
//         'Challan created but PDF download failed'
//       );
//     }

//     // Form reset logic
//     try {
//       const newInvoiceRes = await api.get('/challans/latest-invoice');
//       const nextNumber = (newInvoiceRes.data.invoice || 0) + 1;
      
//       setFormData({
//         partyName: '',
//         date: new Date().toISOString().split('T')[0],
//         invoiceNo: `${nextNumber}/${new Date().getFullYear()}`,
//         station: '',
//         transport: '',
//         marka: '',
//         items: [{
//           article: '',
//           size: '',
//           color: '',
//           cartons: 1,
//           pairPerCarton: 0,
//           rate: 0,
//           totalPair: 0,
//           amount: 0
//         }]
//       });
//     } catch (resetErr) {
//       console.error('Reset Error:', resetErr);
//       toast.warning('Invoice number reset failed');
//     }

//     navigate('/challans');

//   } catch (err) {
//     console.error('Submit Error:', err);
//     const errorMessage = challanCreated ? 
//       'Challan created but post-creation actions failed' : 
//       err.response?.data?.error || err.message;
      
//     toast.error(errorMessage, { 
//       position: 'top-center',
//       autoClose: 5000
//     });
//   } finally {
//     setSaving(false);
//   }
// };

//   const totals = calculateTotals();

//   return (
//     <div className="container mt-4">
//       <h2>Create New Challan</h2>
//       <form onSubmit={handleSubmit}>
//         <div className="card mb-3">
//           <div className="card-body">
//             <div className="row g-3">
//               <div className="col-md-4">
//                 <label>Party Name *</label>
//                 <input
//                   type="text"
//                   className="form-control"
//                   value={formData.partyName}
//                   onChange={(e) => setFormData(prev => ({...prev, partyName: e.target.value}))}
//                   required
//                 />
//               </div>
              
//               <div className="col-md-4">
//                 <label>Invoice No *</label>
//                 <input
//                   type="text"
//                   className="form-control"
//                   value={formData.invoiceNo}
//                   readOnly
//                 />
//               </div>

//               <div className="col-md-4">
//                 <label>Date *</label>
//                 <input
//                   type="date"
//                   className="form-control"
//                   value={formData.date}
//                   onChange={(e) => setFormData(prev => ({...prev, date: e.target.value}))}
//                   required
//                 />
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="card mb-3">
//           <div className="card-body">
//             <div className="table-responsive">
//               <table className="table table-bordered">
//                 <thead>
//                   <tr>
//                     <th>Article *</th>
//                     <th>Size *</th>
//                     <th>Color *</th>
//                     <th>Cartons *</th>
//                     <th>Pair/Crtn</th>
//                     <th>Rate *</th>
//                     <th>Amount</th>
//                     <th>Action</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {formData.items.map((item, index) => {
//                     const variants = articleVariants[index] || [];
//                     const sizes = [...new Set(variants.map(v => v.size))];
//                     const colors = [...new Set(variants.filter(v => v.size === item.size).map(v => v.color))];

//                     return (
//                       <tr key={index}>
                        
//                          <td>
//   <input
//     type="text"
//     className="form-control"
//     value={item.article}
//     onChange={(e) => handleItemChange(index, e)}
//     onBlur={() => {
//       const article = formData.items[index].article.trim();
//       if (article) {
//         fetchArticleVariants(article, index, true); // isBlur = true
//       }
//     }}
//     name="article"
//     placeholder="Enter article"
//     required
//   />
//   {loadingVariants[index] && <small className="text-info">Loading...</small>}
// </td>

                        
                        
//                         <td>
//                           <select
//                             className="form-select"
//                             value={item.size}
//                             onChange={(e) => handleItemChange(index, e)}
//                             name="size"
//                             required
//                             disabled={!variants.length}
//                           >
//                             <option value="">Select Size</option>
//                             {sizes.map(size => (
//                               <option key={size} value={size}>{size}</option>
//                             ))}
//                           </select>
//                         </td>

//                         <td>
//                           <select
//                             className="form-select"
//                             value={item.color}
//                             onChange={(e) => handleItemChange(index, e)}
//                             name="color"
//                             required
//                             disabled={!item.size}
//                           >
//                             <option value="">Select Color</option>
//                             {colors.map(color => (
//                               <option key={color} value={color}>{color}</option>
//                             ))}
//                           </select>
//                         </td>

//                         <td>
//                           <input
//                             type="number"
//                             className="form-control no-spinner"
//                             value={item.cartons}
//                             onChange={(e) => handleItemChange(index, e)}
//                             name="cartons"
//                             min="1"
//                             required
//                           />
//                         </td>

//                         <td>
//                           <input
//                             type="number"
//                             className="form-control"
//                             value={item.pairPerCarton}
//                             readOnly
//                           />
//                         </td>

//                         <td>
//                           <input
//                             type="number"
//                             className="form-control"
//                             value={item.rate}
//                             onChange={(e) => handleItemChange(index, e)}
//                             name="rate"
//                             step="0.01"
//                             min="0"
//                             required
//                           />
//                         </td>

//                         <td>
//                           <input
//                             type="number"
//                             className="form-control"
//                             value={item.amount.toFixed(2)}
//                             readOnly
//                           />
//                         </td>

//                         <td>
//                           <button
//                             type="button"
//                             className="btn btn-danger btn-sm"
//                             onClick={() => removeItemRow(index)}
//                             disabled={formData.items.length === 1}
//                           >
//                             <FaTrash />
//                           </button>
//                         </td>
//                       </tr>
//                     )
//                   })}
//                 </tbody>
//               </table>
//             </div>
            
//             <button
//               type="button"
//               className="btn btn-primary mt-2"
//               onClick={addItemRow}
//             >
//               <FaPlus /> Add Item
//             </button>
//           </div>
//         </div>

//         <div className="card mb-3">
//           <div className="card-body">
//             <div className="row g-3">
//               <div className="col-md-4">
//                 <label>Station *</label>
//                 <input
//                   type="text"
//                   className="form-control"
//                   value={formData.station}
//                   onChange={(e) => setFormData(prev => ({...prev, station: e.target.value}))}
//                   required
//                 />
//               </div>
              
//               <div className="col-md-4">
//                 <label>Transport *</label>
//                 <input
//                   type="text"
//                   className="form-control"
//                   value={formData.transport}
//                   onChange={(e) => setFormData(prev => ({...prev, transport: e.target.value}))}
//                   required
//                 />
//               </div>

//               <div className="col-md-4">
//                 <label>Marka</label>
//                 <input
//                   type="text"
//                   className="form-control"
//                   value={formData.marka}
//                   onChange={(e) => setFormData(prev => ({...prev, marka: e.target.value}))}
//                 />
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="card mb-3">
//           <div className="card-body">
//             <div className="row">
//               <div className="col-md-4">
//                 <h5>Total Cartons: {totals.totalCartons}</h5>
//               </div>
//               <div className="col-md-4">
//                 <h5>Total Pairs: {totals.totalPairs}</h5>
//               </div>
//               <div className="col-md-4">
//                 <h5>Total Amount: ₹{totals.totalAmount.toFixed(2)}</h5>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="d-flex justify-content-between">
//           <button
//             type="button"
//             className="btn btn-secondary"
//             onClick={() => navigate('/challans')}
//             disabled={saving}
//           >
//             <FaTimes /> Cancel
//           </button>
          
//           <button
//             type="submit"
//             className="btn btn-primary"
//             disabled={saving}
//           >
//             {saving ? (
//               <>
//                 <FaSpinner className="fa-spin me-1" />
//                 Creating...
//               </>
//             ) : (
//               <>
//                 <FaSave className="me-1" />
//                 Create Challan
//               </>
//             )}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default ChallanForm;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaPlus, FaTrash, FaSave, FaTimes, FaSpinner } from 'react-icons/fa';
import api from '../utils/api';
import './ChallanForm.css';

const ChallanForm = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [articleVariants, setArticleVariants] = useState({});
  const [loadingVariants, setLoadingVariants] = useState({});
  const [stockAvailability, setStockAvailability] = useState({});

  const [formData, setFormData] = useState({
    partyName: '',
    date: new Date().toISOString().split('T')[0],
    invoiceNo: '',
    station: '',
    transport: '',
    marka: '',
    items: [{
      article: '',
      size: '',
      color: '',
      cartons: 1,
      pairPerCarton: 0,
      rate: 0,
      totalPair: 0,
      amount: 0
    }]
  });

  // Auto-generate invoice number
  useEffect(() => {
    const fetchLatestInvoice = async () => {
      try {
        const res = await api.get('/challans/latest-invoice');
        const nextNumber = (res.data.invoice || 0) + 1;
        setFormData(prev => ({
          ...prev,
          invoiceNo: `${nextNumber}/${new Date().getFullYear()}`
        }));
      } catch (err) {
        setFormData(prev => ({
          ...prev,
          invoiceNo: `1/${new Date().getFullYear()}`
        }));
      }
    };
    fetchLatestInvoice();
  }, []);

  // Debounce for article search
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Article variants fetch
  const fetchArticleVariants = async (article, index, isBlur = false) => {
    if (!article.trim()) {
      setArticleVariants(prev => ({ ...prev, [index]: [] }));
      return;
    }
    setLoadingVariants(prev => ({ ...prev, [index]: true }));
    try {
      const response = await api.get(`/challans/article/${article}/variants`);
      setArticleVariants(prev => ({
        ...prev,
        [index]: response.data.data
      }));
      if (response.data.data.length === 0 && isBlur) {
        toast.warning(`"${article}" article not found in database`, {
          autoClose: 3000,
          position: 'top-center'
        });
      }
    } catch (err) {
      if (isBlur) {
        toast.error(err.response?.data?.error || `"${article}" not found`, {
          autoClose: 3000,
          position: 'top-center'
        });
      }
      setArticleVariants(prev => ({ ...prev, [index]: [] }));
    } finally {
      setLoadingVariants(prev => ({ ...prev, [index]: false }));
    }
  };

  const debouncedFetch = debounce(fetchArticleVariants, 500);

  // ----------- Available Feature Start -----------
  const fetchStockAvailability = async (article, size, color, index) => {
    if (!article || !size || !color) return;
    try {
      const res = await api.get('/challans/stock-available', {
        params: {
          article: article.trim().toUpperCase(),
          size: size.trim(), // size को बिलकुल unchanged भेजो!
          color: color.trim().toUpperCase()
        }
      });
      setStockAvailability(prev => ({
        ...prev,
        [index]: res.data.availableCartons || 0
      }));
    } catch (err) {
      setStockAvailability(prev => ({
        ...prev,
        [index]: 0
      }));
    }
  };
  // ----------- Available Feature End -------------

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...formData.items];

    if (name === 'article' || name === 'partyName' || name === 'station' || name === 'transport' || name === 'marka') {
      newItems[index][name] = value.toUpperCase();
    } else {
      newItems[index][name] = name === 'cartons' || name === 'rate' ? parseFloat(value) || 0 : value;
    }

    if (name === 'article') {
      debouncedFetch(value, index);
      newItems[index].size = '';
      newItems[index].color = '';
      newItems[index].pairPerCarton = 0;
      newItems[index].rate = 0;
    }

    if (name === 'size') {
      newItems[index].color = '';
      const variants = articleVariants[index] || [];
      const sizeVariants = variants.filter(v => v.size === value);
      if (sizeVariants.length === 1) {
        newItems[index].color = sizeVariants[0].color;
        newItems[index].pairPerCarton = sizeVariants[0].pairPerCarton;
        newItems[index].rate = sizeVariants[0].rate;
      }
    }

    if (name === 'color') {
      const variants = articleVariants[index] || [];
      const selectedVariant = variants.find(v =>
        v.size === newItems[index].size &&
        v.color === value
      );
      if (selectedVariant) {
        newItems[index].pairPerCarton = selectedVariant.pairPerCarton;
        newItems[index].rate = selectedVariant.rate;
      }
    }

    // ----------- Available Feature Call -----------
    if (name === 'article' || name === 'size' || name === 'color') {
      const { article, size, color } = newItems[index];
      fetchStockAvailability(
        (article || '').trim().toUpperCase(),
        (size || '').trim(), // size को unchanged भेजो!
        (color || '').trim().toUpperCase(),
        index
      );
    }
    // ----------------------------------------------

    newItems[index].totalPair = newItems[index].cartons * newItems[index].pairPerCarton;
    newItems[index].amount = newItems[index].totalPair * newItems[index].rate;

    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItemRow = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        article: '',
        size: '',
        color: '',
        cartons: 1,
        pairPerCarton: 0,
        rate: 0,
        totalPair: 0,
        amount: 0
      }]
    }));
  };

  const removeItemRow = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, items: newItems }));

      const newVariants = { ...articleVariants };
      delete newVariants[index];
      setArticleVariants(newVariants);

      const newStock = { ...stockAvailability };
      delete newStock[index];
      setStockAvailability(newStock);
    }
  };

  const calculateTotals = () => {
    return formData.items.reduce((acc, item) => ({
      totalCartons: acc.totalCartons + (item.cartons || 0),
      totalPairs: acc.totalPairs + (item.totalPair || 0),
      totalAmount: acc.totalAmount + (item.amount || 0)
    }), { totalCartons: 0, totalPairs: 0, totalAmount: 0 });
  };
const downloadChallanPDF = async (challanId, invoiceNo) => {
  try {
    const pdfResponse = await api.get(`/challan-pdf/${challanId}`, {
      responseType: 'blob',
      timeout: 45000
    });
    if (!pdfResponse.data || pdfResponse.data.size < 1024) {
      throw new Error('Invalid PDF received from server');
    }
    const safeInvoiceNo = invoiceNo.replace(/\//g, '-');
    const filename = `challan-${safeInvoiceNo}.pdf`;
    const blob = new Blob([pdfResponse.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success('PDF downloaded successfully!');
  } catch (err) {
    toast.warning(
      err.response?.status === 404
        ? 'PDF generation service unavailable'
        : 'Challan created but PDF download failed'
    );
  }
};

  const handleSubmit = async (e) => {
  e.preventDefault();
  setSaving(true);
  let challanCreated = false;

  try {
    // 1. Validation
    if (!formData.partyName || !formData.station || !formData.transport) {
      throw new Error('Please fill all required fields');
    }

    for (let item of formData.items) {
      if (!item.article || !item.size || !item.color || !item.cartons || !item.rate) {
        throw new Error('Please fill all item details');
      }
    }

    // 2. Stock check
    const stockCheckPayload = formData.items.map(item => ({
      article: item.article.trim().toUpperCase(),
      size: item.size.trim(),
      color: item.color.trim().toUpperCase(),
      requiredCartons: item.cartons
    }));

    const stockResponse = await api.post('/challans/stock-check', stockCheckPayload);
    if (stockResponse.data.hasErrors) {
      stockResponse.data.errors.forEach(error => {
        toast.error(`Stock Issue: ${error.message}`, {
          autoClose: 10000,
          position: 'top-center'
        });
      });
      throw new Error('Cannot create challan due to stock issues');
    }

    // 3. Challan creation
    const payload = {
      ...formData,
      items: formData.items.map(item => ({
        article: item.article.toUpperCase(),
        color: item.color.toUpperCase(),
        size: item.size,
        cartons: Number(item.cartons),
        pairPerCarton: Number(item.pairPerCarton),
        rate: Number(item.rate),
        totalPair: Number(item.cartons) * Number(item.pairPerCarton),
        amount: Number(item.cartons) * Number(item.pairPerCarton) * Number(item.rate)
      }))
    };

    const response = await api.post('/challans', payload);
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to create challan');
    }

    challanCreated = true;
    toast.success('Challan created successfully!');

    // 4. PDF Download Logic
    try {
      // 4.1 Challan ID extract karo
      const challanId = response.data.data?._id ||
                        response.data.data?.id ||
                        response.data._id ||
                        response.data.id;
      if (!challanId) {
        throw new Error('Challan ID not found in response');
      }

      // 4.2 PDF download trigger karo
      await downloadChallanPDF(challanId, formData.invoiceNo);
    } catch (pdfErr) {
      // Agar PDF download fail ho jaye toh warning dikhao
      toast.warning(
        pdfErr.response?.status === 404
          ? 'PDF generation service unavailable'
          : 'Challan created but PDF download failed'
      );
    }

    // 5. Form reset logic
    try {
      const newInvoiceRes = await api.get('/challans/latest-invoice');
      const nextNumber = (newInvoiceRes.data.invoice || 0) + 1;

      setFormData({
        partyName: '',
        date: new Date().toISOString().split('T')[0],
        invoiceNo: `${nextNumber}/${new Date().getFullYear()}`,
        station: '',
        transport: '',
        marka: '',
        items: [{
          article: '',
          size: '',
          color: '',
          cartons: 1,
          pairPerCarton: 0,
          rate: 0,
          totalPair: 0,
          amount: 0
        }]
      });
      setStockAvailability({});
      setArticleVariants({});
    } catch (resetErr) {
      toast.warning('Invoice number reset failed');
    }

    navigate('/challans');

  } catch (err) {
    const errorMessage = challanCreated
      ? 'Challan created but post-creation actions failed'
      : err.response?.data?.error || err.message;

    toast.error(errorMessage, {
      position: 'top-center',
      autoClose: 5000
    });
  } finally {
    setSaving(false);
  }
};

  const totals = calculateTotals();

  return (
    <div className="container mt-4">
      <h2>Create New Challan</h2>
      <form onSubmit={handleSubmit}>
        <div className="card mb-3">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label>Party Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.partyName}
                  onChange={(e) => setFormData(prev => ({...prev, partyName: e.target.value}))}
                  required
                />
              </div>
              <div className="col-md-4">
                <label>Invoice No *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.invoiceNo}
                  readOnly
                />
              </div>
              <div className="col-md-4">
                <label>Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({...prev, date: e.target.value}))}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead>
                  <tr>
                    <th>Article *</th>
                    <th>Size *</th>
                    <th>Color *</th>
                    <th>Cartons *</th>
                    <th>Pair/Crtn</th>
                    <th>Rate *</th>
                    <th>Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => {
                    const variants = articleVariants[index] || [];
                    const sizes = [...new Set(variants.map(v => v.size))];
                    const colors = [...new Set(variants.filter(v => v.size === item.size).map(v => v.color))];

                    return (
                      <tr key={index}>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            value={item.article}
                            onChange={(e) => handleItemChange(index, e)}
                            onBlur={() => {
                              const article = formData.items[index].article.trim();
                              if (article) {
                                fetchArticleVariants(article, index, true);
                              }
                            }}
                            name="article"
                            placeholder="Enter article"
                            required
                          />
                          {loadingVariants[index] && <small className="text-info">Loading...</small>}
                        </td>
                        <td>
                          <select
                            className="form-select"
                            value={item.size}
                            onChange={(e) => handleItemChange(index, e)}
                            name="size"
                            required
                            disabled={!variants.length}
                          >
                            <option value="">Select Size</option>
                            {sizes.map(size => (
                              <option key={size} value={size}>{size}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            className="form-select"
                            value={item.color}
                            onChange={(e) => handleItemChange(index, e)}
                            name="color"
                            required
                            disabled={!item.size}
                          >
                            <option value="">Select Color</option>
                            {colors.map(color => (
                              <option key={color} value={color}>{color}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control no-spinner"
                            value={item.cartons}
                            onChange={(e) => handleItemChange(index, e)}
                            name="cartons"
                            min="1"
                            required
                          />
                          {/* ----------- Available Feature UI ----------- */}
                          <small className="text-muted">
                            Available: {stockAvailability[index] ?? '-'}
                          </small>
                          {/* ------------------------------------------ */}
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            value={item.pairPerCarton}
                            readOnly
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            value={item.rate}
                            onChange={(e) => handleItemChange(index, e)}
                            name="rate"
                            step="0.01"
                            min="0"
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            value={item.amount.toFixed(2)}
                            readOnly
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => removeItemRow(index)}
                            disabled={formData.items.length === 1}
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              className="btn btn-primary mt-2"
              onClick={addItemRow}
            >
              <FaPlus /> Add Item
            </button>
          </div>
        </div>

        {/* ...rest of your form code remains the same... */}
        <div className="card mb-3">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label>Station *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.station}
                  onChange={(e) => setFormData(prev => ({...prev, station: e.target.value}))}
                  required
                />
              </div>
              <div className="col-md-4">
                <label>Transport *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.transport}
                  onChange={(e) => setFormData(prev => ({...prev, transport: e.target.value}))}
                  required
                />
              </div>
              <div className="col-md-4">
                <label>Marka</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.marka}
                  onChange={(e) => setFormData(prev => ({...prev, marka: e.target.value}))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-body">
            <div className="row">
              <div className="col-md-4">
                <h5>Total Cartons: {totals.totalCartons}</h5>
              </div>
              <div className="col-md-4">
                <h5>Total Pairs: {totals.totalPairs}</h5>
              </div>
              <div className="col-md-4">
                <h5>Total Amount: ₹{totals.totalAmount.toFixed(2)}</h5>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-between">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/challans')}
            disabled={saving}
          >
            <FaTimes /> Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? (
              <>
                <FaSpinner className="fa-spin me-1" />
                Creating...
              </>
            ) : (
              <>
                <FaSave className="me-1" />
                Create Challan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChallanForm;
