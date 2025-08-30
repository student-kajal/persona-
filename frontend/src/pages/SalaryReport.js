
import React, { useState, useEffect, useCallback } from "react";
import Select from "react-select";

const SalaryReport = () => {
  const [worker, setWorker] = useState({ value: "all", label: "All Workers" });
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [report, setReport] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [rates, setRates] = useState({});

  // Fetch Salary Report
  const fetchReport = useCallback(async () => {
    if (!fromDate || !toDate) return;
    try {
    const res = await fetch(
      `/api/salary/salary-report?from=${fromDate}&to=${toDate}&worker=${worker.value}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token') // ✅ Manual token add
        }
      }
    );
      const data = await res.json();
      const allData = data.data || [];

      const uniqueWorkers = [...new Set(allData.map((item) => item.worker))];
      const workerOptions = [
        { value: "all", label: "All Workers" },
        ...uniqueWorkers.map((w) => ({ value: w, label: w })),
      ];

      setWorkers(workerOptions);

      if (worker.value === "all") {
        setReport(allData);
      } else {
        setReport(allData.filter((item) => item.worker === worker.value));
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setReport([]);
      setWorkers([]);
    }
  }, [fromDate, toDate, worker]);

  useEffect(() => {
    if (fromDate && toDate) {
      fetchReport();
    }
  }, [fetchReport, fromDate, toDate]);

  const handleFromDateChange = (e) => {
    const newFromDate = e.target.value;
    setFromDate(newFromDate);
    if (toDate && new Date(toDate) < new Date(newFromDate)) {
      setToDate("");
    }
  };

  const handleToDateChange = (e) => {
    const newToDate = e.target.value;
    if (new Date(newToDate) < new Date(fromDate)) {
      alert("⚠️ To Date cannot be earlier than From Date!");
      return;
    }
    setToDate(newToDate);
  };

  const handleRateChange = (article, gender, rate) => {
    let value = parseFloat(rate) || 0;
    if (value > 10000) value = 10000;
    value = Math.floor(value * 100) / 100;
    setRates((prev) => ({ ...prev, [`${article}_${gender}`]: value }));
  };

  const getSalaryForArticle = (article, gender, cartons, pairPerCarton) => {
    const rate = rates[`${article}_${gender}`] || 0;
    return (cartons * pairPerCarton * rate).toFixed(2);
  };

  const getTotalSalaryForWorker = (workerData) => {
    return workerData.articles
      .reduce(
        (acc, article) =>
          acc +
          parseFloat(
            getSalaryForArticle(
              article.article,
              article.gender,
              article.cartons,
              article.pairPerCarton
            )
          ),
        0
      )
      .toFixed(2);
  };

  const totalSalary = report
    .reduce((acc, worker) => acc + parseFloat(getTotalSalaryForWorker(worker)), 0)
    .toFixed(2);

  const handlePrint = () => window.print();

  const formatDateRange = () => {
    if (!fromDate || !toDate) return "";
    const fromFormatted = new Date(fromDate).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
    const toFormatted = new Date(toDate).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
    return `${fromFormatted} to ${toFormatted}`;
  };

  return (
    <div className="salary-report-container">
      <style jsx>{`
        .salary-report-container {
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          padding: 2rem 1rem;
        }

        .report-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1.5rem;
          border-radius: 20px 20px 0 0;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .company-logo {
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          border: 3px solid rgba(255, 255, 255, 0.3);
        }

        .company-logo img {
          width: 70%;
          height: 70%;
          object-fit: contain;
          border-radius: 50%;
        }

        .main-card {
          background: white;
          border-radius: 0 0 20px 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          max-width: 1400px;
          margin: 0 auto;
        }

        .filter-section {
          background: #f8faff;
          padding: 2rem;
          border-bottom: 2px solid #e2e8f0;
        }

        .filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          align-items: end;
          margin-bottom: 1rem;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
        }

        .filter-label {
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .modern-input {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 0.75rem 1rem;
          font-size: 1rem;
          transition: all 0.3s ease;
          font-weight: 500;
        }

        .modern-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          transform: translateY(-1px);
        }

        .action-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1rem;
        }

        .print-button {
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .print-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }

        .report-content {
          padding: 2rem;
        }

        .no-data-card {
          background: white;
          padding: 3rem;
          text-align: center;
          border-radius: 16px;
          border: 2px dashed #cbd5e0;
          color: #718096;
        }

        /* ============ SINGLE PAGE CHALLAN FORMAT ============ */
        .challan-format {
          background: white;
          width: 100%;
        }

        .challan-header {
          background: #fff;
          padding: 1rem;
          border-bottom: 3px solid #667eea;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .company-section {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .company-logo-print {
          width: 60px;
          height: 60px;
          background: rgba(102, 126, 234, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #667eea;
        }

        .company-logo-print img {
          width: 70%;
          height: 70%;
          object-fit: contain;
          border-radius: 50%;
        }

        .company-info h2 {
          margin: 0;
          font-size: 1.8rem;
          color: #2d3748;
          font-weight: 800;
        }

        .report-info {
          text-align: right;
        }

        .report-info h3 {
          margin: 0;
          color: #667eea;
          font-size: 1.4rem;
          font-weight: 700;
        }

        .report-info p {
          margin: 0;
          color: #718096;
          font-size: 1rem;
        }

        .main-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
          font-size: 1rem;
        }

        .main-table th {
          background: linear-gradient(90deg, #667eea, #764ba2);
          color: white;
          padding: 0.8rem 0.6rem;
          text-align: center;
          font-weight: 700;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: 1px solid #5a6fd8;
        }

        .main-table td {
          padding: 0.7rem 0.6rem;
          text-align: center;
          border: 1px solid #e2e8f0;
          vertical-align: middle;
          font-weight: 500;
        }

        .main-table tbody tr:nth-child(even) {
          background: #f8faff;
        }

        .worker-name {
          background: #edf2f7;
          font-weight: 700;
          color: #2d3748;
          text-align: left;
          padding: 0.8rem;
          font-size: 1rem;
        }

        .rate-input-mini {
          width: 70px;
          padding: 0.4rem;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          text-align: center;
          font-size: 0.9rem;
        }

        .salary-value {
          font-weight: 700;
          color: #22c55e;
        }

        .worker-total {
          background: #f0fff4 !important;
          font-weight: 700;
          color: #065f46;
        }

        .grand-total-row {
          background: linear-gradient(90deg, #22c55e, #16a34a) !important;
          color: white;
        }

        .grand-total-row td {
          font-weight: 800;
          font-size: 1rem;
          padding: 1rem 0.6rem;
        }

        /* ============ PRINT FIXES ============ */
        @media print {
          .no-print,
          nav, 
          .navbar, 
          header.site-header,
          .site-header,
          footer,
          .site-footer,
          .footer,
          .copyright,
          .all-rights-reserved {
            display: none !important;
            visibility: hidden !important;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
            font-size: 14px !important;
          }
          
          .salary-report-container {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          .main-card {
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          
          .challan-format {
            page-break-inside: avoid;
            page-break-after: avoid;
            max-width: 100%;
            margin: 0;
            padding: 0;
          }
          
          @page {
            size: A4 landscape;
            margin: 10mm 8mm;
          }
          
          .challan-header {
            padding: 1rem !important;
            margin-bottom: 0.8rem;
          }
          
          .company-info h2 {
            font-size: 1.6rem !important;
          }
          
          .report-info h3 {
            font-size: 1.3rem !important;
          }
          
          .report-info p {
            font-size: 0.9rem !important;
          }
          
          .main-table {
            font-size: 12px !important;
            margin-top: 0.8rem !important;
          }
          
          .main-table th {
            padding: 6px 4px !important;
            font-size: 11px !important;
            background: #666 !important;
            color: white !important;
          }
          
          .main-table td {
            padding: 5px 4px !important;
            font-size: 11px !important;
          }
          
          .worker-name {
            padding: 6px 8px !important;
            font-size: 12px !important;
            font-weight: 800 !important;
          }
          
          .rate-input-mini {
            width: 50px !important;
            padding: 2px !important;
            font-size: 10px !important;
          }
          
          .grand-total-row {
            background: #333 !important;
            color: white !important;
          }
          
          .grand-total-row td {
            font-size: 13px !important;
            font-weight: 800 !important;
            padding: 7px 4px !important;
          }
          
          .main-table,
          .challan-format {
            transform: scale(0.98);
            transform-origin: top left;
          }
        }

        @media (max-width: 768px) {
          .salary-report-container {
            padding: 1rem 0.5rem;
          }
          .filter-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .action-buttons {
            justify-content: center;
          }
          .challan-header {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }
        }
      `}</style>

      <div className="main-card">
        {/* Clean Header - Only Logo */}
        <div className="report-header">
          <div className="company-logo">
            <img src="/logo.png" alt="Company Logo" />
          </div>
        </div>

        {/* Filter Section */}
        <div className="filter-section no-print">
          <div className="filter-grid">
            <div className="filter-group">
              <label className="filter-label">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={handleFromDateChange}
                required
                className="modern-input"
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">To Date</label>
              <input
                type="date"
                min={fromDate}
                value={toDate}
                onChange={handleToDateChange}
                required
                className="modern-input"
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Worker Selection</label>
              <Select
                options={workers}
                value={worker}
                onChange={(selected) => setWorker(selected)}
                isSearchable={true}
                isClearable={false}
                placeholder="Select worker..."
                styles={{
                  control: (base) => ({
                    ...base,
                    background: 'white',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '0.25rem 0.5rem',
                    fontSize: '1rem',
                    fontWeight: '500',
                    boxShadow: 'none',
                    '&:hover': { borderColor: '#667eea' }
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected ? '#667eea' : state.isFocused ? '#f8faff' : 'white',
                    color: state.isSelected ? 'white' : '#2d3748',
                    fontWeight: '500'
                  })
                }}
              />
            </div>
          </div>

          <div className="action-buttons">
            <button onClick={handlePrint} className="print-button">
              🖨️ Print Salary Report
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="report-content">
          {report.length > 0 ? (
            <div className="challan-format">
              {/* Challan Header */}
              <div className="challan-header">
                <div className="company-section">
                  <div className="company-logo-print">
                    <img src="/logo.png" alt="Logo" />
                  </div>
                  <div className="company-info">
                    <h2>GPFAX FOOTWEAR</h2>
                  </div>
                </div>
                <div className="report-info">
                  <h3>SALARY REPORT</h3>
                  <p>Period: {formatDateRange()}</p>
                  <p>Generated: {new Date().toLocaleDateString('en-IN')}</p>
                  <p>Grand Total: ₹{totalSalary}</p>
                </div>
              </div>

              {/* ✅ Clean Table - No Extra Worker Column */}
              <table className="main-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Article</th>
                    <th>Gender</th>
                    <th>Cartons</th>
                    <th>Pair/Crtn</th>
                    <th>Rate (₹)</th>
                    <th>Earnings (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {report.map((workerData) => (
                    <React.Fragment key={workerData.worker}>
                      {/* Worker Header Row */}
                      <tr>
                        <td colSpan="7" className="worker-name">
                          👤 {workerData.worker}
                        </td>
                      </tr>
                      
                      {/* Worker Articles */}
                      {workerData.articles.map((article, idx) => (
                        <tr key={`${workerData.worker}_${idx}`}>
                          <td>{article.date}</td>
                          <td style={{ fontWeight: '600' }}>{article.article}</td>
                          <td>{article.gender || "-"}</td>
                          <td style={{ fontWeight: '600', color: '#3b82f6' }}>{article.cartons}</td>
                          <td>{article.pairPerCarton}</td>
                          <td>
                            <input
                              type="number"
                              step="0.01"
                              max="10000"
                              value={rates[`${article.article}_${article.gender}`] || ""}
                              onChange={(e) =>
                                handleRateChange(article.article, article.gender, e.target.value)
                              }
                              min="0"
                              className="rate-input-mini"
                              placeholder="0"
                            />
                          </td>
                          <td className="salary-value">
                            ₹{getSalaryForArticle(
                              article.article,
                              article.gender,
                              article.cartons,
                              article.pairPerCarton
                            )}
                          </td>
                        </tr>
                      ))}
                      
                      {/* Worker Total Row */}
                      <tr className="worker-total">
                        <td colSpan="6" style={{ textAlign: 'right', fontWeight: '700' }}>
                          Total for {workerData.worker}:
                        </td>
                        <td style={{ fontWeight: '700' }}>
                          ₹{getTotalSalaryForWorker(workerData)}
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                  
                  {/* Grand Total Row */}
                  <tr className="grand-total-row">
                    <td colSpan="6" style={{ textAlign: 'right' }}>
                      🏆 GRAND TOTAL - ALL WORKERS:
                    </td>
                    <td>
                      ₹{totalSalary}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-data-card">
              <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: '0.5' }}>📊</div>
              <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                {fromDate && toDate
                  ? "No production records found"
                  : "Select Date Range to Generate Report"}
              </div>
              <div style={{ opacity: '0.7' }}>
                {fromDate && toDate
                  ? "Try adjusting your date range or worker selection"
                  : "Please select both from and to dates to view salary data"}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalaryReport;
