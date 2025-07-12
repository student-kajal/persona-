import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';

const ChallanList = () => {
  const [challans, setChallans] = useState([]);

  useEffect(() => {
    const fetchChallans = async () => {
      try {
        const response = await api.get('/challans');
        console.log('Challans response:', response.data); // ✅ Debug log
        setChallans(response.data.data || []);
      } catch (err) {
        console.error('Fetch error:', err); // ✅ Debug log
        toast.error('Failed to load challans');
      }
    };
    fetchChallans();
  }, []);

  const downloadPdf = async (challanId, invoiceNo) => {
    try {
      // ✅ Debug logs
      console.log('Download PDF called with:', { challanId, invoiceNo });
      
      if (!challanId) {
        throw new Error('Challan ID is missing');
      }

      const pdfResponse = await api.get(`/challan-pdf/${challanId}`, {
        responseType: 'blob',
        timeout: 30000
      });

      if (!pdfResponse.data || pdfResponse.data.size === 0) {
        throw new Error('Empty PDF received from server');
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
      
      toast.success('PDF downloaded successfully!'); // ✅ Success message

    } catch (err) {
      console.error('PDF Download Error:', err);
      toast.error(err.response?.data?.error || err.message || 'PDF download failed');
    }
  };

  return (
    <div className="container mt-4">
      <h4>All Challans</h4>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Invoice No</th>
            <th>Party Name</th>
            <th>Date</th>
            <th>Station</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {challans.map((challan) => {
            // ✅ Debug: Check challan structure
            console.log('Challan object:', challan);
            
            // ✅ Flexible ID handling (same as ChallanForm)
            const challanId = challan._id || challan.id;
            
            return (
              <tr key={challanId}>
                <td>{challan.invoiceNo}</td>
                <td>{challan.partyName}</td>
                <td>{new Date(challan.date).toLocaleDateString()}</td>
                <td>{challan.station}</td>
                <td>
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => downloadPdf(challanId, challan.invoiceNo)}
                    disabled={!challanId} // ✅ Disable if no ID
                  >
                    Download PDF
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ChallanList;
