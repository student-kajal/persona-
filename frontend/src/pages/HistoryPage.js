// import React, { useEffect, useState } from 'react';
// import { fetchProductLogs, fetchChallanSummary, fetchSalarySummary } from '../utils/historyApi';
// import Tabs from '../components/Tabs';

// const HistoryPage = () => {
//   const [tab, setTab] = useState('Product Logs');
//   const [productLogs, setProductLogs] = useState([]);
//   const [challans, setChallans] = useState([]);
//   const [salaries, setSalaries] = useState([]);
//   const [filters, setFilters] = useState({
//     party: '',
//     article: '',
//     startDate: '',
//     endDate: '',
//     worker: ''
//   });
//   const [rateMap, setRateMap] = useState({});

//   useEffect(() => {
//     fetchProductLogs().then(res => setProductLogs(res.data.data));
//   }, []);

//   useEffect(() => {
//     if (tab === 'Challan Summary') {
//       fetchChallanSummary(filters).then(res => setChallans(res.data.data));
//     } else if (tab === 'Salary Summary') {
//       fetchSalarySummary(filters).then(res => setSalaries(res.data.data));
//     }
//   }, [tab, filters]);

//   const handleFilterChange = (e) => {
//     const { name, value } = e.target;
//     const updatedValue = name === 'worker' ? value.toUpperCase() : value;
//     setFilters(prev => ({ ...prev, [name]: updatedValue }));
//   };

//   const handleFilterApply = () => {
//     if (tab === 'Challan Summary') {
//       fetchChallanSummary(filters).then(res => setChallans(res.data.data));
//     } else if (tab === 'Salary Summary') {
//       fetchSalarySummary(filters).then(res => setSalaries(res.data.data));
//     }
//   };

//   const handleResetFilters = () => {
//     const empty = { party: '', article: '', startDate: '', endDate: '', worker: '' };
//     setFilters(empty);
//     if (tab === 'Challan Summary') {
//       fetchChallanSummary(empty).then(res => setChallans(res.data.data));
//     } else if (tab === 'Salary Summary') {
//       fetchSalarySummary(empty).then(res => setSalaries(res.data.data));
//     }
//   };

//   const totalCartons = challans.reduce((sum, c) => sum + (c.totalCartons || 0), 0);
//   const totalAmount = challans.reduce((sum, c) => sum + (c.totalAmount || 0), 0);

//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-bold mb-4">📜 History & Reports</h1>
//       <Tabs tabs={['Product Logs', 'Challan Summary', 'Salary Summary']} current={tab} onChange={setTab} />

//       {(tab === 'Challan Summary' || tab === 'Salary Summary') && (
//         <div className="flex flex-wrap gap-3 mb-4">
//           {tab === 'Challan Summary' && (
//             <>
//               <input type="text" name="party" placeholder="Party" value={filters.party} onChange={handleFilterChange} className="border px-2 py-1 rounded" />
//               <input type="text" name="article" placeholder="Article" value={filters.article} onChange={handleFilterChange} className="border px-2 py-1 rounded" />
//             </>
//           )}
//           {tab === 'Salary Summary' && (
//             <input
//               type="text"
//               name="worker"
//               placeholder="Worker Name"
//               value={filters.worker}
//               onChange={handleFilterChange}
//               className="border px-2 py-1 rounded uppercase"
//             />
//           )}
//           <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="border px-2 py-1 rounded" />
//           <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="border px-2 py-1 rounded" />
//           <button onClick={handleFilterApply} className="bg-blue-500 text-white px-4 py-1 rounded">Apply Filter</button>
//           <button onClick={handleResetFilters} className="bg-gray-300 px-4 py-1 rounded">Reset</button>
//         </div>
//       )}

//       {/* Product Logs */}
//       {tab === 'Product Logs' && (
//         <table className="w-full text-sm border border-black">
//           <thead className="bg-gray-100">
//             <tr>
//               <th className="border border-black px-2 py-1">Action</th>
//               <th className="border border-black px-2 py-1">Article</th>
//               <th className="border border-black px-2 py-1">Gender</th>
//               <th className="border border-black px-2 py-1">Size</th>
//               <th className="border border-black px-2 py-1">Color</th>
//               <th className="border border-black px-2 py-1">Updated By</th>
//               <th className="border border-black px-2 py-1">Time</th>
//             </tr>
//           </thead>
//           <tbody>
//             {productLogs.map((log, i) => (
//               <tr key={i}>
//                 <td className="border border-black px-2 py-1">{log.action}</td>
//                 <td className="border border-black px-2 py-1">{log.article}</td>
//                 <td className="border border-black px-2 py-1">{log.gender}</td>
//                 <td className="border border-black px-2 py-1">{log.size}</td>
//                 <td className="border border-black px-2 py-1">{log.color}</td>
//                 <td className="border border-black px-2 py-1">{log.updatedBy}</td>
//                 <td className="border border-black px-2 py-1">{new Date(log.timestamp).toLocaleString()}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}

//       {/* Challan Summary */}
//       {tab === 'Challan Summary' && (
//         <table className="w-full text-sm border border-black">
//           <thead className="bg-gray-100">
//             <tr>
//               <th className="border border-black px-2 py-1">Party</th>
//               <th className="border border-black px-2 py-1">Date</th>
//               <th className="border border-black px-2 py-1">Invoice No</th>
//               <th className="border border-black px-2 py-1">Articles</th>
//               <th className="border border-black px-2 py-1">Total Cartons</th>
//               <th className="border border-black px-2 py-1">Total Amount</th>
//               <th className="border border-black px-2 py-1">Created By</th>
//             </tr>
//           </thead>
//           <tbody>
//             {challans.map((row, i) => (
//               <tr key={i}>
//                 <td className="border border-black px-2 py-1">{row.party}</td>
//                 <td className="border border-black px-2 py-1">{new Date(row.date).toLocaleDateString()}</td>
//                 <td className="border border-black px-2 py-1">{row.invoiceNo}</td>
//                 <td className="border border-black px-2 py-1">{row.articles || '-'}</td>
//                 <td className="border border-black px-2 py-1">{row.totalCartons}</td>
//                 <td className="border border-black px-2 py-1">₹{row.totalAmount.toFixed(2)}</td>
//                 <td className="border border-black px-2 py-1">{row.createdBy}</td>
//               </tr>
//             ))}
//             <tr className="bg-yellow-100 font-semibold">
//               <td colSpan="4" className="text-right border border-black px-2 py-1">Grand Total</td>
//               <td className="border border-black px-2 py-1">{totalCartons}</td>
//               <td className="border border-black px-2 py-1">₹{totalAmount.toFixed(2)}</td>
//               <td className="border border-black px-2 py-1"></td>
//             </tr>
//           </tbody>
//         </table>
//       )}

//       {/* Salary Summary */}
//       {tab === 'Salary Summary' && (
//         <div>
//           {salaries.map((worker, i) => {
//             let totalAmount = 0;
//             const rows = worker.records.map((entry, j) => {
//               const key = `${worker.createdByName || worker.createdBy}_${entry.article}`;

//               const rate = rateMap[key] || 0;
//               const amount = entry.pairs * rate;
//               totalAmount += amount;
//               return (
//                 <tr key={j}>
//                   <td className="border border-black px-2 py-1">{entry.article}</td>
//                   <td className="border border-black px-2 py-1">{entry.cartons}</td>
//                   <td className="border border-black px-2 py-1">{entry.pairs}</td>
//                   <td className="border border-black px-2 py-1">{new Date(entry.date).toLocaleString()}</td>
//                   <td className="border border-black px-2 py-1">
//                     <input
//                       type="number"
//                       className="w-20 border px-1"
//                       value={rateMap[key] || ''}
//                       onChange={(e) =>
//                         setRateMap(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))
//                       }
//                     />
//                   </td>
//                   <td className="border border-black px-2 py-1">₹{amount.toFixed(2)}</td>
//                 </tr>
//               );
//             });

//             return (
//               <div key={i} className="mb-6 border p-4 rounded shadow-sm">
//                <h2 className="font-semibold text-lg mb-2">
//   👷 {worker.createdByName?.toUpperCase() || worker.createdBy.toUpperCase()} - {worker.totalCartons} Cartons / {worker.totalPairs} Pairs
// </h2>

//                 <table className="w-full text-sm border border-black">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="border border-black px-2 py-1">Article</th>
//                       <th className="border border-black px-2 py-1">Cartons</th>
//                       <th className="border border-black px-2 py-1">Pairs</th>
//                       <th className="border border-black px-2 py-1">Date</th>
//                       <th className="border border-black px-2 py-1">Rate</th>
//                       <th className="border border-black px-2 py-1">Amount</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {rows}
//                     <tr className="bg-yellow-100 font-semibold">
//                       <td colSpan="5" className="text-right border border-black px-2 py-1">Total</td>
//                       <td className="border border-black px-2 py-1">₹{totalAmount.toFixed(2)}</td>
//                     </tr>
//                   </tbody>
//                 </table>
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// };

// export default HistoryPage;
import React, { useEffect, useState } from 'react';
import { fetchProductLogs, fetchChallanSummary, fetchSalarySummary } from '../utils/historyApi';
import Tabs from '../components/Tabs';

const HistoryPage = () => {
  const [tab, setTab] = useState('Product Logs');
  const [productLogs, setProductLogs] = useState([]);
  const [challans, setChallans] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [filters, setFilters] = useState({
    party: '',
    article: '',
    startDate: '',
    endDate: '',
    worker: ''
  });
  const [rateMap, setRateMap] = useState({});

  useEffect(() => {
    fetchProductLogs().then(res => setProductLogs(res.data.data));
  }, []);

  useEffect(() => {
    if (tab === 'Challan Summary') {
      fetchChallanSummary(filters).then(res => setChallans(res.data.data));
    } else if (tab === 'Salary Summary') {
      fetchSalarySummary(filters).then(res => setSalaries(res.data.data));
    }
  }, [tab, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const updatedValue = name === 'worker' ? value.toUpperCase() : value;
    setFilters(prev => ({ ...prev, [name]: updatedValue }));
  };

  const handleFilterApply = () => {
    if (tab === 'Challan Summary') {
      fetchChallanSummary(filters).then(res => setChallans(res.data.data));
    } else if (tab === 'Salary Summary') {
      fetchSalarySummary(filters).then(res => setSalaries(res.data.data));
    }
  };

  const handleResetFilters = () => {
    const empty = { party: '', article: '', startDate: '', endDate: '', worker: '' };
    setFilters(empty);
    if (tab === 'Challan Summary') {
      fetchChallanSummary(empty).then(res => setChallans(res.data.data));
    } else if (tab === 'Salary Summary') {
      fetchSalarySummary(empty).then(res => setSalaries(res.data.data));
    }
  };

  const totalCartons = challans.reduce((sum, c) => sum + (c.totalCartons || 0), 0);
  const totalAmount = challans.reduce((sum, c) => sum + (c.totalAmount || 0), 0);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📜 History & Reports</h1>
      <Tabs tabs={['Product Logs', 'Challan Summary', 'Salary Summary']} current={tab} onChange={setTab} />

      {(tab === 'Challan Summary' || tab === 'Salary Summary') && (
        <div className="flex flex-wrap gap-3 mb-4">
          {tab === 'Challan Summary' && (
            <>
              <input type="text" name="party" placeholder="Party" value={filters.party} onChange={handleFilterChange} className="border px-2 py-1 rounded" />
              <input type="text" name="article" placeholder="Article" value={filters.article} onChange={handleFilterChange} className="border px-2 py-1 rounded" />
            </>
          )}
          {tab === 'Salary Summary' && (
            <input
              type="text"
              name="worker"
              placeholder="Worker Name"
              value={filters.worker}
              onChange={handleFilterChange}
              className="border px-2 py-1 rounded uppercase"
            />
          )}
          <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="border px-2 py-1 rounded" />
          <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="border px-2 py-1 rounded" />
          <button onClick={handleFilterApply} className="bg-blue-500 text-white px-4 py-1 rounded">Apply Filter</button>
          <button onClick={handleResetFilters} className="bg-gray-300 px-4 py-1 rounded">Reset</button>
        </div>
      )}

      {/* Product Logs */}
      {tab === 'Product Logs' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-black min-w-[600px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-black px-2 py-1">Action</th>
                <th className="border border-black px-2 py-1">Article</th>
                <th className="border border-black px-2 py-1">Gender</th>
                <th className="border border-black px-2 py-1">Size</th>
                <th className="border border-black px-2 py-1">Color</th>
                <th className="border border-black px-2 py-1">Updated By</th>
                <th className="border border-black px-2 py-1">Time</th>
              </tr>
            </thead>
            <tbody>
              {productLogs.map((log, i) => (
                <tr key={i}>
                  <td className="border border-black px-2 py-1">{log.action}</td>
                  <td className="border border-black px-2 py-1">{log.article}</td>
                  <td className="border border-black px-2 py-1">{log.gender}</td>
                  <td className="border border-black px-2 py-1">{log.size}</td>
                  <td className="border border-black px-2 py-1">{log.color}</td>
                  <td className="border border-black px-2 py-1">{log.updatedBy}</td>
                  <td className="border border-black px-2 py-1">{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Challan Summary */}
      {tab === 'Challan Summary' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-black min-w-[700px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-black px-2 py-1">Party</th>
                <th className="border border-black px-2 py-1">Date</th>
                <th className="border border-black px-2 py-1">Invoice No</th>
                <th className="border border-black px-2 py-1">Articles</th>
                <th className="border border-black px-2 py-1">Total Cartons</th>
                <th className="border border-black px-2 py-1">Total Amount</th>
                <th className="border border-black px-2 py-1">Created By</th>
              </tr>
            </thead>
            <tbody>
              {challans.map((row, i) => (
                <tr key={i}>
                  <td className="border border-black px-2 py-1">{row.party}</td>
                  <td className="border border-black px-2 py-1">{new Date(row.date).toLocaleDateString()}</td>
                  <td className="border border-black px-2 py-1">{row.invoiceNo}</td>
                  <td className="border border-black px-2 py-1">{row.articles || '-'}</td>
                  <td className="border border-black px-2 py-1">{row.totalCartons}</td>
                  <td className="border border-black px-2 py-1">₹{row.totalAmount.toFixed(2)}</td>
                  <td className="border border-black px-2 py-1">{row.createdBy}</td>
                </tr>
              ))}
              <tr className="bg-yellow-100 font-semibold">
                <td colSpan="4" className="text-right border border-black px-2 py-1">Grand Total</td>
                <td className="border border-black px-2 py-1">{totalCartons}</td>
                <td className="border border-black px-2 py-1">₹{totalAmount.toFixed(2)}</td>
                <td className="border border-black px-2 py-1"></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Salary Summary */}
      {tab === 'Salary Summary' && (
        <div>
          {salaries.map((worker, i) => {
            let totalAmount = 0;
            const rows = worker.records.map((entry, j) => {
              const key = `${worker.createdByName || worker.createdBy}_${entry.article}`;
              const rate = rateMap[key] || 0;
              const amount = entry.pairs * rate;
              totalAmount += amount;
              return (
                <tr key={j}>
                  <td className="border border-black px-2 py-1">{entry.article}</td>
                  <td className="border border-black px-2 py-1">{entry.cartons}</td>
                  <td className="border border-black px-2 py-1">{entry.pairs}</td>
                  <td className="border border-black px-2 py-1">{new Date(entry.date).toLocaleString()}</td>
                  <td className="border border-black px-2 py-1">
                    <input
                      type="number"
                      className="w-20 border px-1"
                      value={rateMap[key] || ''}
                      onChange={(e) =>
                        setRateMap(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))
                      }
                    />
                  </td>
                  <td className="border border-black px-2 py-1">₹{amount.toFixed(2)}</td>
                </tr>
              );
            });

            return (
              <div key={i} className="mb-6 border p-4 rounded shadow-sm">
                <h2 className="font-semibold text-lg mb-2">
                  👷 {worker.createdByName?.toUpperCase() || worker.createdBy.toUpperCase()} - {worker.totalCartons} Cartons / {worker.totalPairs} Pairs
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-black min-w-[600px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border border-black px-2 py-1">Article</th>
                        <th className="border border-black px-2 py-1">Cartons</th>
                        <th className="border border-black px-2 py-1">Pairs</th>
                        <th className="border border-black px-2 py-1">Date</th>
                        <th className="border border-black px-2 py-1">Rate</th>
                        <th className="border border-black px-2 py-1">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows}
                      <tr className="bg-yellow-100 font-semibold">
                        <td colSpan="5" className="text-right border border-black px-2 py-1">Total</td>
                        <td className="border border-black px-2 py-1">₹{totalAmount.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
