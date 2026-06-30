import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';

// WhatsApp green icon SVG
const WaIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.886 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const Spinner = () => (
  <span style={{
    display: 'inline-block', width: 11, height: 11,
    border: '2px solid currentColor', borderTopColor: 'transparent',
    borderRadius: '50%', animation: 'clSpin .7s linear infinite', flexShrink: 0,
  }} />
);

export default function ChallanList() {
  const [challans, setChallans]       = useState([]);
  const [loading, setLoadingMap]      = useState({});

  useEffect(() => {
    api.get('/challans')
      .then(r => setChallans(r.data.data || []))
      .catch(() => toast.error('Failed to load challans'));
  }, []);

  const setKey = (key, val) => setLoadingMap(prev => ({ ...prev, [key]: val }));

  const fetchPdfBlob = async (url) => {
    const res = await api.get(url, { responseType: 'blob', timeout: 40000 });
    if (!res.data || res.data.size === 0) throw new Error('Empty PDF received');
    return new Blob([res.data], { type: 'application/pdf' });
  };

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownload = async (challanId, invoiceNo, type) => {
    const key     = `${challanId}_${type}_dl`;
    const safeNo  = invoiceNo.replace(/\//g, '-');
    const apiUrl  = type === 'challan' ? `/challan-pdf/${challanId}` : `/challan-pdf/${challanId}/products`;
    const fname   = type === 'challan' ? `challan-${safeNo}.pdf` : `catalogue-${safeNo}.pdf`;
    setKey(key, true);
    try {
      const blob = await fetchPdfBlob(apiUrl);
      triggerDownload(blob, fname);
      toast.success('PDF downloaded!');
    } catch (err) {
      toast.error(err.message || 'Download failed');
    } finally {
      setKey(key, false);
    }
  };

  const handleWhatsApp = async (challanId, invoiceNo, type) => {
    const key    = `${challanId}_${type}_wa`;
    const safeNo = invoiceNo.replace(/\//g, '-');
    const apiUrl = type === 'challan' ? `/challan-pdf/${challanId}` : `/challan-pdf/${challanId}/products`;
    const fname  = type === 'challan' ? `challan-${safeNo}.pdf` : `catalogue-${safeNo}.pdf`;
    setKey(key, true);
    try {
      const blob = await fetchPdfBlob(apiUrl);
      const file = new File([blob], fname, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: fname, text: `Invoice: ${invoiceNo}` });
      } else {
        // Desktop fallback — download + hint
        triggerDownload(blob, fname);
        toast.info('PDF downloaded. Attach it manually in WhatsApp.');
      }
    } catch (err) {
      if (err.name !== 'AbortError') toast.error('Share failed. PDF downloaded instead.');
    } finally {
      setKey(key, false);
    }
  };

  return (
    <div className="container mt-4">
      <style>{`
        @keyframes clSpin { to { transform: rotate(360deg); } }
        .cl-btn { display:inline-flex; align-items:center; gap:5px; padding:4px 10px;
          border-radius:6px; font-size:12px; font-weight:600; cursor:pointer;
          border:none; transition:opacity .15s; white-space:nowrap; }
        .cl-btn:disabled { opacity:.55; cursor:not-allowed; }
        .cl-dl  { background:#16a34a; color:#fff; }
        .cl-dl-blue { background:#2563eb; color:#fff; }
        .cl-wa  { background:#25D366; color:#fff; }
      `}</style>

      <h4 style={{ marginBottom: 18, fontWeight: 700 }}>All Challans</h4>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#1e293b', color: '#e2e8f0' }}>
              {['Invoice No', 'Party Name', 'Date', 'Station', 'Total Cartons', 'Challan PDF', 'Catalogue PDF'].map(h => (
                <th key={h} style={{
                  padding: '11px 14px', fontWeight: 700, fontSize: 11.5,
                  letterSpacing: '.5px', whiteSpace: 'nowrap',
                  textAlign: ['Total Cartons','Challan PDF','Catalogue PDF'].includes(h) ? 'center' : 'left',
                  borderBottom: '2px solid #334155',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {challans.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign:'center', padding:32, color:'#94a3b8' }}>No challans found</td></tr>
            )}
            {challans.map((challan, idx) => {
              const id           = challan._id || challan.id;
              const totalCartons = challan.totalCartons
                ?? (challan.items || []).reduce((s, i) => s + (i.cartons || 0), 0);
              const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';

              return (
                <tr key={id} style={{ background: rowBg, borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a' }}>
                    {challan.invoiceNo}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#334155' }}>
                    {challan.partyName}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#475569', whiteSpace: 'nowrap' }}>
                    {new Date(challan.date).toLocaleDateString('en-IN')}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#475569' }}>
                    {challan.station}
                  </td>

                  {/* Total Cartons */}
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      background: '#dbeafe', color: '#1e40af',
                      fontWeight: 700, borderRadius: 20,
                      padding: '2px 14px', fontSize: 13,
                      minWidth: 38, textAlign: 'center',
                    }}>
                      {totalCartons}
                    </span>
                  </td>

                  {/* Challan PDF */}
                  <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button
                        className="cl-btn cl-dl"
                        onClick={() => handleDownload(id, challan.invoiceNo, 'challan')}
                        disabled={!!loading[`${id}_challan_dl`]}
                        title="Download Challan PDF"
                      >
                        {loading[`${id}_challan_dl`] ? <Spinner /> : <DownloadIcon />}
                        PDF
                      </button>
                      <button
                        className="cl-btn cl-wa"
                        onClick={() => handleWhatsApp(id, challan.invoiceNo, 'challan')}
                        disabled={!!loading[`${id}_challan_wa`]}
                        title="Share Challan PDF on WhatsApp"
                      >
                        {loading[`${id}_challan_wa`] ? <Spinner /> : <WaIcon />}
                        Share
                      </button>
                    </div>
                  </td>

                  {/* Catalogue PDF */}
                  <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button
                        className="cl-btn cl-dl-blue"
                        onClick={() => handleDownload(id, challan.invoiceNo, 'catalogue')}
                        disabled={!!loading[`${id}_catalogue_dl`]}
                        title="Download Catalogue PDF"
                      >
                        {loading[`${id}_catalogue_dl`] ? <Spinner /> : <DownloadIcon />}
                        PDF
                      </button>
                      <button
                        className="cl-btn cl-wa"
                        onClick={() => handleWhatsApp(id, challan.invoiceNo, 'catalogue')}
                        disabled={!!loading[`${id}_catalogue_wa`]}
                        title="Share Catalogue PDF on WhatsApp"
                      >
                        {loading[`${id}_catalogue_wa`] ? <Spinner /> : <WaIcon />}
                        Share
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
