import React, { useState, useEffect, useCallback } from 'react';

const SalaryReport = () => {
  const [worker, setWorker] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [report, setReport] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [rates, setRates] = useState({});

  const fetchReport = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/salary/salary-report?from=${fromDate}&to=${toDate}&worker=${worker}`
      );
      const data = await res.json();
      setReport(data.data || []);
      const uniqueWorkers = [...new Set(data.data?.map(item => item.worker) || [])];
      setWorkers(uniqueWorkers);
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

  const handleRateChange = (article, rate) => {
    setRates(prev => ({ ...prev, [article]: Number(rate) }));
  };

  const getSalaryForArticle = (article, pairs) => {
    return (rates[article] || 0) * pairs;
  };

  const getTotalSalaryForWorker = (workerData) => {
    return workerData.articles.reduce(
      (acc, article) => acc + getSalaryForArticle(article.article, article.pairs),
      0
    );
  };

  const totalSalary = report.reduce(
    (acc, worker) => acc + getTotalSalaryForWorker(worker),
    0
  );

  return (
    <div className="salary-report">
      <h2>Salary Slip Generator</h2>

      <div className="filter-form">
        <select 
          value={worker} 
          onChange={(e) => setWorker(e.target.value)}
          className="worker-select"
        >
          <option value="all">All Workers</option>
          {workers.map((w, index) => (
            <option key={index} value={w}>
              {w}
            </option>
          ))}
        </select>
        
        <input 
          type="date" 
          value={fromDate} 
          onChange={(e) => setFromDate(e.target.value)} 
          required
          className="date-input"
        />
        <input 
          type="date" 
          value={toDate} 
          onChange={(e) => setToDate(e.target.value)} 
          required
          className="date-input"
        />
      </div>

      {report.length > 0 ? (
        <div className="table-container">
          {report.map(workerData => (
            <div key={workerData.worker} className="worker-section">
              <h3>{workerData.worker}</h3>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Article</th>
                    <th>Cartons</th>
                    <th>Pairs</th>
                    <th>Rate/Pair (₹)</th>
                    <th>Salary (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {workerData.articles.map((article, idx) => (
                    <tr key={`${workerData.worker}_${article.article}_${idx}`}>
                      <td>{article.date}</td>
                      <td>{article.article}</td>
                      <td>{article.cartons}</td>
                      <td>{article.pairs}</td>
                      <td>
                        <input
                          type="number"
                          value={rates[article.article] || ''}
                          onChange={(e) => handleRateChange(article.article, e.target.value)}
                          min="0"
                        />
                      </td>
                      <td>₹{getSalaryForArticle(article.article, article.pairs)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="5" className="total-label">Total for {workerData.worker}:</td>
                    <td className="total-amount">₹{getTotalSalaryForWorker(workerData)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ))}
          <div className="overall-total">
            <strong>Grand Total Salary: ₹{totalSalary}</strong>
          </div>
        </div>
      ) : (
        <p className="no-data">
          {fromDate && toDate ? 'No production records found' : 'Please select date range'}
        </p>
      )}

      <style jsx>{`
        .salary-report {
          padding: 20px;
          font-family: Arial, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
        }
        .filter-form {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
          align-items: center;
        }
        .worker-select, .date-input {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          height: 40px;
        }
        .worker-select {
          min-width: 180px;
        }
        .worker-section {
          margin-bottom: 2rem;
          border: 1px solid #eee;
          padding: 1rem;
          border-radius: 8px;
        }
        .report-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .report-table th, .report-table td {
          border: 1px solid #ddd;
          padding: 10px 15px;
          text-align: center;
        }
        .report-table th {
          background-color: #2c3e50;
          color: white;
        }
        .report-table input[type="number"] {
          width: 80px;
          padding: 5px;
          text-align: center;
        }
        .total-label {
          text-align: right;
          font-weight: bold;
        }
        .total-amount {
          font-weight: bold;
          text-align: center;
        }
        .no-data {
          padding: 20px;
          text-align: center;
          color: #666;
        }
        .overall-total {
          margin-top: 1rem;
          padding: 1rem;
          background-color: #f8f9fa;
          text-align: right;
          font-size: 1.2rem;
        }
        .table-container {
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
};

export default SalaryReport;
