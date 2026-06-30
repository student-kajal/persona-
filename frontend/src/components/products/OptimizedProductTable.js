import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import ExcelJS from 'exceljs';
import api from '../../utils/api';
import { useOptimizedProducts } from '../../hooks/useOptimizedProducts';
import { useFilterOptions }      from '../../hooks/useFilterOptions';

// ─── export helpers (same logic as old ProductListTable) ─────────────────────
const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.style.display = 'none';
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 800);
};

function getVirtualGroup(stockType, gender) {
  const st  = (stockType || '').toLowerCase();
  const gen = (gender    || '').toLowerCase();
  if (st === 'eva') {
    if (gen === 'ladies')     return { group: 'EVA LADIES',     order: 2 };
    if (gen === 'kids_ladies')return { group: 'EVA KID LADIES', order: 3 };
    if (gen === 'gents')      return { group: 'EVA GENTS',      order: 4 };
    if (gen === 'kids_gents') return { group: 'EVA KIDS GENTS', order: 5 };
    return { group: 'EVA OTHER', order: 6 };
  }
  if (st === 'pu') {
    if (gen === 'ladies')     return { group: 'PU LADIES',          order: 7 };
    if (gen === 'kids_ladies')return { group: 'PU KID LADIES',      order: 8 };
    if (gen === 'gents')      return { group: 'PU GENTS',           order: 9 };
    if (gen === 'kids_gents') return { group: 'PU KIDS GENTS',      order: 10 };
    return { group: 'PU OTHER', order: 11 };
  }
  if (st === 'injection') {
    if (gen === 'ladies')     return { group: 'INJECTION LADIES',     order: 12 };
    if (gen === 'kids_ladies')return { group: 'INJECTION KID LADIES', order: 13 };
    if (gen === 'gents')      return { group: 'INJECTION GENTS',      order: 14 };
    if (gen === 'kids_gents') return { group: 'INJECTION KIDS GENTS', order: 15 };
    return { group: 'INJECTION OTHER', order: 16 };
  }
  return { group: 'OTHER', order: 99 };
}


async function getImageBase64(url) {
  if (!url) return null;
  try {
    const res  = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result.split(',')[1]);
      r.onerror   = reject;
      r.readAsDataURL(blob);
    });
  } catch { return null; }
}

// ─── constants ───────────────────────────────────────────────────────────────
const PAGE_LIMIT = 50;

// ─── category meta ────────────────────────────────────────────────────────────
const CAT_META = {
  'eva-ladies':            { label: 'EVA LADIES',          bg: '#dbeafe', color: '#1d4ed8', dot: '#3b82f6' },
  'eva-gents':             { label: 'EVA GENTS',           bg: '#e0e7ff', color: '#4338ca', dot: '#6366f1' },
  'eva-kids_ladies':       { label: 'EVA KID LADIES',      bg: '#cffafe', color: '#0e7490', dot: '#06b6d4' },
  'eva-kids_gents':        { label: 'EVA KIDS GENTS',      bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  'pu-ladies':             { label: 'PU LADIES',           bg: '#fce7f3', color: '#9d174d', dot: '#ec4899' },
  'pu-gents':              { label: 'PU GENTS',            bg: '#ede9fe', color: '#5b21b6', dot: '#8b5cf6' },
  'pu-kids_ladies':        { label: 'PU KID LADIES',       bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  'pu-kids_gents':         { label: 'PU KIDS GENTS',       bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  'injection-ladies':      { label: 'INJECTION LADIES',    bg: '#ecfdf5', color: '#065f46', dot: '#34d399' },
  'injection-gents':       { label: 'INJECTION GENTS',     bg: '#f0fdf4', color: '#166534', dot: '#4ade80' },
  'injection-kids_ladies': { label: 'INJECTION KID LADIES',bg: '#fefce8', color: '#713f12', dot: '#facc15' },
  'injection-kids_gents':  { label: 'INJECTION KIDS GENTS',bg: '#fff7ed', color: '#7c2d12', dot: '#fb923c' },
};
function getCat(stockType, gender) {
  return CAT_META[`${(stockType || '').toLowerCase()}-${(gender || '').toLowerCase()}`]
    || { label: `${(stockType || '').toUpperCase()} ${(gender || '').toUpperCase()}`, bg: '#f3f4f6', color: '#374151', dot: '#9ca3af' };
}

// ─── debounce ─────────────────────────────────────────────────────────────────
function useDebounce(val, ms) {
  const [v, setV] = useState(val);
  useEffect(() => { const t = setTimeout(() => setV(val), ms); return () => clearTimeout(t); }, [val, ms]);
  return v;
}

// ─── carton badge ─────────────────────────────────────────────────────────────
function CartonBadge({ value }) {
  let bg, color, border;
  if (value < 0)        { bg = '#fef2f2'; color = '#dc2626'; border = '#fca5a5'; }
  else if (value === 0) { bg = '#fff7ed'; color = '#ea580c'; border = '#fdba74'; }
  else if (value <= 5)  { bg = '#fefce8'; color = '#ca8a04'; border = '#fde047'; }
  else                  { bg = '#f0fdf4'; color = '#16a34a'; border = '#86efac'; }
  return (
    <span style={{
      display: 'inline-block', minWidth: 38, textAlign: 'center',
      padding: '2px 9px', borderRadius: 20, fontWeight: 700, fontSize: 12,
      background: bg, color, border: `1px solid ${border}`,
    }}>
      {value}
    </span>
  );
}

// ─── filter dropdown ──────────────────────────────────────────────────────────
function FilterDropdown({ label, name, options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const toggle = useCallback(val =>
    onChange(name, selected.includes(val) ? selected.filter(x => x !== val) : [...selected, val]),
    [name, selected, onChange]);

  const isActive = selected.length > 0;
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 11px', borderRadius: 8, fontSize: 12, fontWeight: 500,
          cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .15s',
          border: isActive ? '1.5px solid #2563eb' : '1.5px solid #e2e8f0',
          background: isActive ? '#eff6ff' : '#fff',
          color: isActive ? '#1d4ed8' : '#475569',
          boxShadow: isActive ? '0 0 0 3px #bfdbfe40' : 'none',
        }}
      >
        {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb', flexShrink: 0 }} />}
        {isActive ? `${label} (${selected.length})` : `All ${label}`}
        <svg width="10" height="6" viewBox="0 0 10 6" style={{ opacity: .5, marginLeft: 2, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 1060,
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
          boxShadow: '0 10px 40px rgba(0,0,0,.12)', minWidth: 180,
          maxHeight: 280, overflowY: 'auto', padding: '4px 0',
        }}>
          <div onClick={() => onChange(name, [])} style={{
            padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            color: selected.length === 0 ? '#2563eb' : '#64748b',
            borderBottom: '1px solid #f1f5f9', background: selected.length === 0 ? '#eff6ff' : 'transparent',
          }}>
            ✓ All {label}
          </div>
          {options.length === 0 && <div style={{ padding: '8px 14px', color: '#94a3b8', fontSize: 12 }}>No options</div>}
          {options.map(opt => {
            const active = selected.includes(opt);
            return (
              <div key={String(opt)} onClick={() => toggle(opt)} style={{
                padding: '7px 14px', cursor: 'pointer', fontSize: 12,
                display: 'flex', alignItems: 'center', gap: 8,
                background: active ? '#eff6ff' : 'transparent', color: active ? '#1d4ed8' : '#334155',
              }}>
                <span style={{
                  width: 15, height: 15, borderRadius: 4, flexShrink: 0,
                  border: active ? '2px solid #2563eb' : '1.5px solid #cbd5e1',
                  background: active ? '#2563eb' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {active && <svg width="9" height="9" viewBox="0 0 9 9"><path d="M1.5 4.5l2 2 4-4" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>}
                </span>
                {String(opt)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
      <style>{`@keyframes gpShimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}`}</style>
      <div style={{ height: 44, background: 'linear-gradient(135deg,#1e293b,#334155)' }} />
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid #f1f5f9', opacity: 1 - i * .08 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '600px 100%', animation: 'gpShimmer 1.5s infinite' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ height: 13, borderRadius: 6, width: '40%', background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '600px 100%', animation: 'gpShimmer 1.5s infinite' }} />
            <div style={{ height: 13, borderRadius: 6, width: '70%', background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '600px 100%', animation: 'gpShimmer 1.5s infinite' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── pagination button ────────────────────────────────────────────────────────
function PagBtn({ label, onClick, disabled, active }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      minWidth: 36, height: 34, padding: '0 10px', borderRadius: 7,
      border: active ? '1.5px solid #2563eb' : '1.5px solid #e2e8f0',
      background: active ? '#2563eb' : disabled ? '#f8fafc' : '#fff',
      color: active ? '#fff' : disabled ? '#cbd5e1' : '#334155',
      fontWeight: active ? 700 : 500, fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: active ? '0 2px 8px #2563eb30' : 'none', transition: 'all .15s',
    }}>
      {label}
    </button>
  );
}

// ─── group checkbox (indeterminate-aware) ────────────────────────────────────
function GroupCheckbox({ variantIds, selected, onToggle }) {
  const ref    = useRef(null);
  const allSel = variantIds.every(id => selected.includes(id));
  const someSel = variantIds.some(id  => selected.includes(id));
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = someSel && !allSel;
  }, [someSel, allSel]);
  return (
    <input ref={ref} type="checkbox" checked={allSel}
      onChange={() => onToggle(variantIds, allSel)}
      style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#2563eb' }}
    />
  );
}

// ─── main component ──────────────────────────────────────────────────────────
export default function OptimizedProductTable({ title = 'Stock Inventory' }) {
  const [page,            setPage]            = useState(1);
  const [searchInput,     setSearchInput]     = useState('');
  const [filters,         setFilters]         = useState({
    article: [], color: [], size: [], gender: [],
    stockType: [], series: [], mrp: [], rate: [], pairPerCarton: [],
  });
  const [matrixExportType, setMatrixExportType] = useState('withoutImage');
  const [pdfExportType,    setPdfExportType]    = useState('withImage');
  const [showRate,         setShowRate]         = useState(false);
  const [showMRP,          setShowMRP]          = useState(false);
  const [excelLoading,     setExcelLoading]     = useState(false);
  const [pdfLoading,       setPdfLoading]       = useState(false);
  const [selected,         setSelected]         = useState([]);

  const debouncedSearch = useDebounce(searchInput, 400);

  useEffect(() => { setPage(1); setSelected([]); }, [debouncedSearch, filters]);
  useEffect(() => { setSelected([]); }, [page]);

  const queryParams = useMemo(() => {
    const p = { page, limit: PAGE_LIMIT };
    if (debouncedSearch.trim()) p.search = debouncedSearch.trim();
    Object.entries(filters).forEach(([k, v]) => { if (v.length) p[k] = v.join(','); });
    return p;
  }, [page, debouncedSearch, filters]);

  const filterQueryParams = useMemo(() => {
    const p = {};
    Object.entries(filters).forEach(([k, v]) => { if (v.length) p[k] = v.join(','); });
    return p;
  }, [filters]);

  const { data, isLoading, isFetching, isError, error, refetch } = useOptimizedProducts(queryParams);
  const { data: optData } = useFilterOptions(filterQueryParams);

  const products   = useMemo(() => data?.products   || [], [data]);
  const total      = data?.total      || 0;
  const totalPages = data?.totalPages || 1;
  const options    = optData?.options  || {};

  // Group products by article+gender keeping server sort order
  const groups = useMemo(() => {
    const map = new Map();
    products.forEach(p => {
      const key = `${p.article}||${p.gender}`;
      if (!map.has(key)) {
        map.set(key, {
          article: p.article,
          gender:  p.gender,
          image:   p.image || null,
          series:  p.series || '',
          stockType: p.stockType,
          variants: [],
        });
      }
      const g = map.get(key);
      if (!g.image && p.image) g.image = p.image;
      g.variants.push(p);
    });
    return Array.from(map.values());
  }, [products]);

  const handleFilter = useCallback((name, val) =>
    setFilters(prev => ({ ...prev, [name]: val })), []);

  const clearAll = useCallback(() => {
    setFilters({ article: [], color: [], size: [], gender: [], stockType: [], series: [], mrp: [], rate: [], pairPerCarton: [] });
    setSearchInput('');
  }, []);

  // ── selection helpers ─────────────────────────────────────────────────────
  const allPageIds     = useMemo(() => products.map(p => p._id), [products]);
  const allPageSelected = allPageIds.length > 0 && allPageIds.every(id => selected.includes(id));
  const someSelected   = selected.length > 0;

  const toggleSelectAll = useCallback(() => {
    if (allPageSelected) setSelected(prev => prev.filter(id => !allPageIds.includes(id)));
    else setSelected(prev => [...new Set([...prev, ...allPageIds])]);
  }, [allPageSelected, allPageIds]);

  const toggleGroup = useCallback((ids, allSelected) => {
    if (allSelected) setSelected(prev => prev.filter(id => !ids.includes(id)));
    else setSelected(prev => [...new Set([...prev, ...ids])]);
  }, []);

  const somePageSelected    = allPageIds.some(id => selected.includes(id));
  const indeterminateHeader = somePageSelected && !allPageSelected;
  const headerCheckRef      = useRef(null);
  useEffect(() => {
    if (headerCheckRef.current) headerCheckRef.current.indeterminate = indeterminateHeader;
  }, [indeterminateHeader]);

  const hasFilters = useMemo(() =>
    searchInput.trim().length > 0 || Object.values(filters).some(v => v.length > 0),
    [searchInput, filters]);

  const activeCount = useMemo(() =>
    Object.values(filters).reduce((s, v) => s + v.length, 0) + (searchInput.trim() ? 1 : 0),
    [filters, searchInput]);

  // ── fetch products for export ─────────────────────────────────────────────
  // If rows are selected: return only those from current page (fast, no API call).
  // If nothing selected: fetch ALL matching filter/search without pagination.
  const fetchAllForExport = useCallback(async () => {
    if (selected.length > 0) {
      return products.filter(p => selected.includes(p._id));
    }
    const params = { limit: 99999, page: 1, export: 'true' };
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    Object.entries(filters).forEach(([k, v]) => { if (v.length) params[k] = v.join(','); });
    const { data } = await api.get('/products/optimized', { params });
    return data?.products || [];
  }, [selected, products, debouncedSearch, filters]);

  // ── Excel matrix export ──────────────────────────────────────────────────
  const handleExportExcel = useCallback(async () => {
    try {
      setExcelLoading(true);
      const exportRows = await fetchAllForExport();
      if (!exportRows.length) { alert('No products to export.'); return; }

      // Group by category → article
      const groupedByCategory = {};
      exportRows.forEach(p => {
        const gi  = getVirtualGroup(p.stockType, p.gender);
        const gk  = gi.group;
        const ak  = `${p.article}-${p.gender}`;
        if (!groupedByCategory[gk]) groupedByCategory[gk] = {};
        if (!groupedByCategory[gk][ak]) {
          groupedByCategory[gk][ak] = { article: p.article, gender: p.gender,
            stockType: p.stockType, series: p.series, order: gi.order, variants: [] };
        }
        groupedByCategory[gk][ak].variants.push(p);
      });

      const categoryOrder = [
        'EVA LADIES','EVA GENTS','EVA KID LADIES','EVA KIDS GENTS',
        'PU LADIES','PU GENTS','PU KID LADIES','PU KIDS GENTS',
        'INJECTION LADIES','INJECTION GENTS','INJECTION KID LADIES','INJECTION KIDS GENTS','INJECTION OTHER',
        'OTHER',
      ];
      const sortedCategories = Object.entries(groupedByCategory).sort(([a],[b]) => {
        const ia = categoryOrder.indexOf(a), ib = categoryOrder.indexOf(b);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1; if (ib !== -1) return 1;
        return a.localeCompare(b);
      });

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Stock Matrix', {
        pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: false, scale: 58, horizontalCentered: true },
        views: [{ zoomScale: 100 }]
      });
      ws.properties.defaultRowHeight = 15;

      const FS = 12, HS = 12, CS = 14, RH = 15, HH = 16, CH = 19;
      const NEG_FILL = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFFF0000' } };
      const HDR_FILL = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFD9E1F2' } };
      const CAT_FILL = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFBDD7EE' } };
      const ART_FILL = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFEDEDED' } };
      const NEG_FONT = { bold:true, color:{ argb:'FFFFFFFF' }, size:FS, name:'Arial' };
      const CAT_FONT = { bold:true, color:{ argb:'FF1A237E' }, size:CS, name:'Arial' };
      const HDR_FONT = { bold:true, size:HS, name:'Arial' };
      const ART_FONT = { bold:true, size:FS, name:'Arial' };
      const CLR_FONT = { size:FS, name:'Arial', italic:true };
      const NUM_FONT = { size:FS, name:'Arial' };
      const cA = { horizontal:'center', vertical:'middle' };
      const lA = { horizontal:'left',   vertical:'middle' };
      const thin = { top:{style:'thin',color:{argb:'FFBDBDBD'}}, bottom:{style:'thin',color:{argb:'FFBDBDBD'}}, left:{style:'thin',color:{argb:'FFBDBDBD'}}, right:{style:'thin',color:{argb:'FFBDBDBD'}} };

      const sc = (cell, value, { isNeg,isArt,isClr,isHdr,isCat } = {}) => {
        cell.value = value === 0 ? '' : value; cell.border = thin;
        if (isCat)      { cell.font = CAT_FONT; cell.fill = CAT_FILL; cell.alignment = lA; }
        else if (isHdr) { cell.font = HDR_FONT; cell.fill = HDR_FILL; cell.alignment = cA; }
        else if (isNeg) { cell.font = NEG_FONT; cell.fill = NEG_FILL; cell.alignment = cA; }
        else if (isArt) { cell.font = ART_FONT; cell.fill = ART_FILL; cell.alignment = lA; }
        else if (isClr) { cell.font = CLR_FONT; cell.alignment = lA; }
        else            { cell.font = NUM_FONT; cell.alignment = cA; }
      };

      // Fetch images
      const articleImages = {};
      if (matrixExportType === 'withImage') {
        const promises = [];
        for (const [, ag] of sortedCategories) {
          for (const grp of Object.values(ag)) {
            const iv = grp.variants.find(v => v.image);
            if (iv?.image) {
              promises.push((async () => {
                const b64 = await getImageBase64(iv.image);
                if (b64) {
                  let ext = 'png';
                  const u = iv.image.toLowerCase();
                  if (u.includes('.jpg')||u.includes('.jpeg')) ext = 'jpeg';
                  else if (u.includes('.webp')) ext = 'webp';
                  articleImages[grp.article] = { base64: b64, ext };
                }
              })());
            }
          }
        }
        await Promise.all(promises);
      }

      const buildBlocks = (ag) => Object.values(ag).map(grp => {
        const colorMap = {};
        grp.variants.forEach(v => {
          const color = v.color?.trim() || 'DEFAULT';
          const size  = v.size?.trim().toUpperCase();
          if (!colorMap[color]) colorMap[color] = {};
          colorMap[color][size] = (colorMap[color][size] || 0) + (v.cartons || 0);
        });
        const colorRows = [];
        let isFirst = true;
        for (const [color, sizeMap] of Object.entries(colorMap)) {
          if (!Object.values(sizeMap).some(q => q !== 0)) continue;
          colorRows.push({ article: isFirst ? grp.article : '', color, sizeMap, isFirst });
          isFirst = false;
        }
        if (!colorRows.length) return null;
        const imgData = articleImages[grp.article];
        return {
          article: grp.article, colorRows, totalRows: colorRows.length,
          imageId: (matrixExportType === 'withImage' && imgData)
            ? wb.addImage({ base64:`data:image/${imgData.ext};base64,${imgData.base64}`, extension: imgData.ext })
            : null
        };
      }).filter(Boolean);

      const MAX_ROWS = 55, COLS_PER_PAGE = 3;
      const packCols = (blocks) => {
        const ideal = Math.ceil(blocks.reduce((s,b) => s+b.totalRows,0) / COLS_PER_PAGE);
        const lim   = Math.min(MAX_ROWS, Math.max(ideal, 10));
        const cols = []; let cur = [], curR = 0;
        for (const b of blocks) {
          if (curR + b.totalRows > lim && cur.length) { cols.push(cur); cur = []; curR = 0; }
          cur.push(b); curR += b.totalRows;
        }
        if (cur.length) cols.push(cur);
        return cols;
      };

      const renderPageSet = (pageCols, groupName) => {
        const catRow = ws.addRow([groupName]); catRow.height = CH;
        sc(catRow.getCell(1), groupName, { isCat: true });

        const colSizes = pageCols.map(col => {
          const sq = {};
          col.forEach(b => b.colorRows.forEach(r =>
            Object.entries(r.sizeMap).forEach(([sz,q]) => { sq[sz] = (sq[sz]||0)+q; })));
          return Object.entries(sq).filter(([,t]) => t !== 0).map(([s]) => s)
            .sort((a,b) => { const na=parseFloat(a),nb=parseFloat(b); return (!isNaN(na)&&!isNaN(nb)) ? na-nb : a.localeCompare(b); });
        });
        const colOff = []; let off = 1;
        pageCols.forEach((_,ci) => {
          colOff.push(off);
          off += matrixExportType === 'withImage' ? 3+colSizes[ci].length : 2+colSizes[ci].length;
        });

        const hdr = ws.addRow([]); hdr.height = HH;
        pageCols.forEach((_,ci) => {
          const base = colOff[ci], sz = colSizes[ci];
          if (matrixExportType === 'withImage') {
            sc(hdr.getCell(base),'ART',{isHdr:true}); sc(hdr.getCell(base+1),'',{isHdr:true});
            sc(hdr.getCell(base+2),'COLOR',{isHdr:true});
            sz.forEach((s,i) => sc(hdr.getCell(base+3+i),s,{isHdr:true}));
          } else {
            sc(hdr.getCell(base),'ART',{isHdr:true}); sc(hdr.getCell(base+1),'COLOR',{isHdr:true});
            sz.forEach((s,i) => sc(hdr.getCell(base+2+i),s,{isHdr:true}));
          }
        });

        const maxR = Math.max(...pageCols.map(c => c.reduce((s,b) => s+b.totalRows,0)));
        const startR = ws.lastRow.number+1;
        const ai = pageCols.map(()=>0), ci2 = pageCols.map(()=>0);

        for (let r=0; r<maxR; r++) {
          const row = ws.addRow([]); row.height = RH;
          pageCols.forEach((col,ci) => {
            const base = colOff[ci], sz = colSizes[ci];
            const emp = matrixExportType==='withImage' ? 3+sz.length : 2+sz.length;
            if (ai[ci] < col.length) {
              const block = col[ai[ci]], cr = block.colorRows[ci2[ci]];
              if (cr) {
                if (matrixExportType==='withImage') {
                  sc(row.getCell(base),cr.article,{isArt:cr.isFirst}); sc(row.getCell(base+1),'',{});
                  sc(row.getCell(base+2),cr.color,{isClr:true});
                  sz.forEach((s,i) => { const q=cr.sizeMap[s]; const v=(q===undefined||q===0)?'':q; sc(row.getCell(base+3+i),v,{isNeg:typeof v==='number'&&v<0}); });
                } else {
                  sc(row.getCell(base),cr.article,{isArt:cr.isFirst}); sc(row.getCell(base+1),cr.color,{isClr:true});
                  sz.forEach((s,i) => { const q=cr.sizeMap[s]; const v=(q===undefined||q===0)?'':q; sc(row.getCell(base+2+i),v,{isNeg:typeof v==='number'&&v<0}); });
                }
                ci2[ci]++; if (ci2[ci]>=block.colorRows.length) { ai[ci]++; ci2[ci]=0; }
              } else { for (let e=0;e<emp;e++) sc(row.getCell(base+e),'',{}); }
            } else { for (let e=0;e<emp;e++) sc(row.getCell(base+e),'',{}); }
          });
        }
        if (matrixExportType === 'withImage') {
          pageCols.forEach((col,ci) => {
            const b0 = colOff[ci]-1; let ro = startR;
            col.forEach(block => {
              if (block.imageId !== null) {
                try { ws.addImage(block.imageId, { tl:{col:b0+1.05,row:ro-0.9}, ext:{width:55,height:55}, editAs:'oneCell' }); }
                catch(e) { console.warn('Image skip:', block.article); }
              }
              ro += block.totalRows;
            });
          });
        }
      };

      const CAT_SUB_FILL = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFBDD7EE' } };
      const CAT_SUB_FONT = { bold:true, size:12, name:'Arial', color:{ argb:'FF1A237E' } };

      let firstCat = true;
      for (const [gName, ag] of sortedCategories) {
        const blocks = buildBlocks(ag); if (!blocks.length) continue;
        const cols = packCols(blocks);

        // Category total — negatives treated as 0
        const catTotal = Object.values(ag).reduce((sum, grp) =>
          sum + grp.variants.reduce((s, v) => s + Math.max(0, v.cartons || 0), 0), 0);

        for (let i=0; i<cols.length; i+=COLS_PER_PAGE) {
          if (!firstCat || i>0) ws.addRow([]);
          renderPageSet(cols.slice(i,i+COLS_PER_PAGE), gName);
          firstCat = false;
        }

        // Category subtotal row
        const stRow = ws.addRow([]);
        stRow.height = 18;
        const stCols = Math.max(ws.columnCount, 4);
        for (let c = 1; c <= stCols; c++) {
          const gc = stRow.getCell(c);
          gc.fill = CAT_SUB_FILL;
          gc.border = thin;
          gc.alignment = { horizontal:'center', vertical:'middle' };
          gc.font = CAT_SUB_FONT;
        }
        stRow.getCell(1).value = `${gName} TOTAL: ${catTotal} Cartons`;
        stRow.getCell(1).alignment = { horizontal:'left', vertical:'middle' };
      }

      // Column widths
      const cml={}, acn=new Set(), ccn=new Set();
      ws.eachRow(row => row.eachCell({includeEmpty:false},(cell,cn) => {
        const v=String(cell.value??'');
        if(v==='ART') acn.add(cn); if(v==='COLOR') ccn.add(cn);
        if(!cml[cn]||v.length>cml[cn]) cml[cn]=v.length;
      }));
      acn.forEach(n => ccn.add(n+1));
      ws.columns.forEach((col,idx) => {
        const cn=idx+1, ml=cml[cn]||3;
        if(acn.has(cn)) col.width=Math.max(ml*1.2+1,12);
        else if(ccn.has(cn)) col.width=Math.max(ml*1.2+1,10);
        else col.width=4;
      });
      ws.pageSetup.margins = { left:.15,right:.15,top:.2,bottom:.2,header:.1,footer:.1 };

      const buf = await wb.xlsx.writeBuffer();
      triggerDownload(new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),'Stock-Matrix-Export.xlsx');
    } catch(err) {
      console.error('Excel export error:', err);
      alert('Excel export failed. Please try again.');
    } finally {
      setExcelLoading(false);
    }
  }, [fetchAllForExport, matrixExportType]);

  // ── PDF export ────────────────────────────────────────────────────────────
  const handleExportPDF = useCallback(async () => {
    try {
      setPdfLoading(true);
      const allProducts = await fetchAllForExport();
      if (!allProducts.length) { alert('No products to export.'); return; }
      const idsToExport = allProducts.map(p => p._id);

      const response = await api.post('/pdf/generate-pdf', {
        productIds: idsToExport,
        includeImages: pdfExportType === 'withImage',
        showRate, showMRP,
        filters: {}
      }, { responseType: 'blob', timeout: 60000 });

      triggerDownload(new Blob([response.data], { type: 'application/pdf' }), 'catalogue.pdf');
    } catch(err) {
      console.error('PDF error:', err);
      if (err.code === 'ECONNABORTED') alert('⏱️ PDF generation timed out. Try fewer products.');
      else alert('❌ PDF download failed. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  }, [fetchAllForExport, pdfExportType, showRate, showMRP]);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>

      {/* ── header card ─────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg,#1e293b 0%,#334155 100%)',
        borderRadius: 14, padding: '16px 22px', marginBottom: 18,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
        boxShadow: '0 4px 24px rgba(30,41,59,.22)',
      }}>
        <div>
          <h5 style={{ margin: 0, color: '#f1f5f9', fontWeight: 700, fontSize: 17, letterSpacing: '-.2px' }}>
            {title}
          </h5>
          <div style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{total.toLocaleString()}</span> products ·{' '}
            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{groups.length}</span> article groups this page
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <style>{`
            @keyframes gpPulse{0%,100%{opacity:1}50%{opacity:.3}}
            @keyframes gpSpin{to{transform:rotate(360deg)}}
          `}</style>

          {/* Refresh button — always visible */}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh stock data"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 13px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: isFetching ? '1.5px solid #475569' : '1.5px solid #38bdf8',
              background: isFetching ? 'rgba(71,85,105,.25)' : 'rgba(56,189,248,.15)',
              color: isFetching ? '#94a3b8' : '#38bdf8',
              cursor: isFetching ? 'not-allowed' : 'pointer',
              transition: 'all .15s',
            }}
          >
            <span style={{
              display: 'inline-block', width: 13, height: 13,
              border: '2px solid currentColor', borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: isFetching ? 'gpSpin .7s linear infinite' : 'none',
            }} />
            {isFetching && !isLoading ? 'Updating…' : 'Refresh Stock'}
          </button>
          {someSelected && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: 'rgba(59,130,246,.18)', border: '1.5px solid #3b82f6', color: '#bfdbfe',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
              {selected.length} selected
              <button
                onClick={() => setSelected([])}
                style={{ background: 'none', border: 'none', color: '#93c5fd', cursor: 'pointer', fontSize: 11, fontWeight: 700, padding: 0, marginLeft: 2 }}
              >✕ Clear</button>
            </span>
          )}
          {hasFilters && (
            <button onClick={clearAll} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: '1.5px solid #ef4444', background: '#fef2f2', color: '#dc2626', cursor: 'pointer',
            }}>
              ✕ Clear {activeCount} filter{activeCount !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      {/* ── search + filters ────────────────────────────────────────────── */}
      <div style={{
        background: '#fff', borderRadius: 12, padding: '14px 18px', marginBottom: 16,
        border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,.04)',
      }}>
        {/* search */}
        <div style={{ position: 'relative', maxWidth: 340, marginBottom: 12 }}>
          <svg width="15" height="15" viewBox="0 0 15 15" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="search" value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by article, color, size, etc."
            style={{
              width: '100%', padding: '8px 12px 8px 32px',
              border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13,
              outline: 'none', background: '#f8fafc', color: '#0f172a',
            }}
            onFocus={e  => { e.target.style.borderColor = '#3b82f6'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px #bfdbfe50'; }}
            onBlur={e   => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        {/* filter dropdowns */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {[
            { name: 'article',       label: 'Article',    opts: options.articles       || [] },
            { name: 'stockType',     label: 'Stock Type', opts: options.stockTypes     || [] },
            { name: 'gender',        label: 'Gender',     opts: options.genders        || [] },
            { name: 'color',         label: 'Color',      opts: options.colors         || [] },
            { name: 'size',          label: 'Size',       opts: options.sizes          || [] },
            { name: 'series',        label: 'Series',     opts: options.series         || [] },
            { name: 'pairPerCarton', label: 'Pair/Ctn',   opts: (options.pairPerCarton || []).map(String) },
            { name: 'mrp',           label: 'MRP',        opts: (options.mrp           || []).map(String) },
            { name: 'rate',          label: 'Rate',       opts: (options.rate          || []).map(String) },
          ].map(f => (
            <FilterDropdown key={f.name} label={f.label} name={f.name}
              options={f.opts} selected={filters[f.name]} onChange={handleFilter} />
          ))}
        </div>
      </div>

      {/* ── export toolbar ──────────────────────────────────────────────── */}
      <div style={{
        background: '#fff', borderRadius: 12, padding: '12px 18px', marginBottom: 16,
        border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,.04)',
        display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10,
      }}>
        {/* Excel section */}
        <select
          value={matrixExportType}
          onChange={e => setMatrixExportType(e.target.value)}
          style={{ padding:'6px 10px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:12, color:'#334155', background:'#f8fafc', cursor:'pointer', outline:'none' }}
        >
          <option value="withoutImage">Excel (No Image)</option>
          <option value="withImage">Excel (With Image)</option>
        </select>
        <button
          onClick={handleExportExcel}
          disabled={excelLoading}
          style={{
            padding:'7px 16px', borderRadius:8, fontSize:13, fontWeight:600, cursor: excelLoading ? 'not-allowed' : 'pointer',
            background: excelLoading ? '#86efac' : '#16a34a', color:'#fff', border:'none',
            display:'flex', alignItems:'center', gap:6, opacity: excelLoading ? .7 : 1,
          }}
        >
          {excelLoading
            ? <><span className="spinner-border spinner-border-sm" role="status" style={{width:13,height:13,borderWidth:2}} /> Exporting…</>
            : '⬇ Export Excel'}
        </button>

        <div style={{ width:1, height:28, background:'#e2e8f0', margin:'0 2px' }} />

        {/* PDF section */}
        <select
          value={pdfExportType}
          onChange={e => setPdfExportType(e.target.value)}
          style={{ padding:'6px 10px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:12, color:'#334155', background:'#f8fafc', cursor:'pointer', outline:'none' }}
        >
          <option value="withImage">PDF (With Image)</option>
          <option value="withoutImage">PDF (No Image)</option>
        </select>
        <button
          onClick={handleExportPDF}
          disabled={pdfLoading}
          style={{
            padding:'7px 16px', borderRadius:8, fontSize:13, fontWeight:600, cursor: pdfLoading ? 'not-allowed' : 'pointer',
            background: pdfLoading ? '#93c5fd' : '#2563eb', color:'#fff', border:'none',
            display:'flex', alignItems:'center', gap:6, opacity: pdfLoading ? .7 : 1,
          }}
        >
          {pdfLoading
            ? <><span className="spinner-border spinner-border-sm" role="status" style={{width:13,height:13,borderWidth:2}} /> Generating…</>
            : '⬇ Export PDF'}
        </button>

        <div style={{ width:1, height:28, background:'#e2e8f0', margin:'0 2px' }} />

        {/* Show Rate / Show MRP toggles */}
        {[{ key:'showRate', val:showRate, set:setShowRate, label:'Show Rate' },
          { key:'showMRP',  val:showMRP,  set:setShowMRP,  label:'Show MRP'  }].map(t => (
          <label key={t.key} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#475569', cursor:'pointer', userSelect:'none' }}>
            <input type="checkbox" checked={t.val} onChange={e => t.set(e.target.checked)}
              style={{ width:14, height:14, cursor:'pointer', accentColor:'#2563eb' }} />
            {t.label}
          </label>
        ))}
      </div>

      {/* ── error ───────────────────────────────────────────────────────── */}
      {isError && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
          padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <span style={{ flex: 1, fontSize: 13, color: '#991b1b' }}>{error?.message || 'Failed to load'}</span>
          <button onClick={refetch} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1.5px solid #dc2626', background: '#fff', color: '#dc2626', cursor: 'pointer' }}>Retry</button>
        </div>
      )}

      {/* ── loading skeleton ────────────────────────────────────────────── */}
      {isLoading && <Skeleton />}

      {/* ── empty ───────────────────────────────────────────────────────── */}
      {!isLoading && !isError && products.length === 0 && (
        <div style={{ textAlign: 'center', padding: '52px 24px', border: '2px dashed #e2e8f0', borderRadius: 14, color: '#94a3b8' }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>📦</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#475569', marginBottom: 6 }}>No products found</div>
          <div style={{ fontSize: 13 }}>Try adjusting or clearing the active filters.</div>
          {hasFilters && (
            <button onClick={clearAll} style={{ marginTop: 14, padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1.5px solid #3b82f6', background: '#eff6ff', color: '#1d4ed8', cursor: 'pointer' }}>
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* ── grouped table ───────────────────────────────────────────────── */}
      {!isLoading && !isError && products.length > 0 && (
        <div style={{
          border: isFetching ? '1.5px solid #38bdf8' : '1px solid #e2e8f0',
          borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 2px 16px rgba(0,0,0,.06)',
          transition: 'border-color .3s',
          opacity: isFetching ? 0.82 : 1,
        }}>
          <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 620 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980, fontSize: 13 }}>

              {/* sticky header */}
              <thead>
                <tr style={{ background: 'linear-gradient(135deg,#1e293b 0%,#2d3f55 100%)' }}>
                  {/* select-all checkbox */}
                  <th style={{
                    width: 44, minWidth: 44, padding: '11px 10px', textAlign: 'center',
                    position: 'sticky', top: 0, zIndex: 2,
                    background: 'linear-gradient(135deg,#1e293b 0%,#2d3f55 100%)',
                    borderBottom: '1px solid #334155',
                  }}>
                    <input ref={headerCheckRef} type="checkbox" checked={allPageSelected}
                      onChange={toggleSelectAll}
                      style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#3b82f6' }}
                    />
                  </th>
                  {[
                    { label: 'ARTICLE',      w: 130 },
                    { label: 'CATEGORY',     w: 130 },
                    { label: 'IMAGE',        w: 64  },
                    { label: 'SERIES',       w: 80  },
                    { label: 'MRP',          w: 70  },
                    { label: 'RATE',         w: 70  },
                    { label: 'COLOR',        w: 110 },
                    { label: 'SIZE',         w: 70  },
                    { label: 'CARTONS',      w: 84  },
                    { label: 'PAIR/CTN',     w: 76  },
                    { label: 'TOT PAIRS',    w: 82  },
                    { label: 'CREATED BY',   w: 100 },
                  ].map(h => (
                    <th key={h.label} style={{
                      padding: '11px 10px', textAlign: 'left',
                      color: '#94a3b8', fontSize: 10.5, fontWeight: 700,
                      letterSpacing: '.8px', whiteSpace: 'nowrap',
                      width: h.w, minWidth: h.w,
                      position: 'sticky', top: 0, zIndex: 2,
                      background: 'linear-gradient(135deg,#1e293b 0%,#2d3f55 100%)',
                      borderBottom: '1px solid #334155',
                    }}>
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {groups.map((grp, gi) => {
                  const cat        = getCat(grp.stockType, grp.gender);
                  const grpSelected = grp.variants.some(v => selected.includes(v._id));
                  const grpBg      = grpSelected ? '#eff6ff' : (gi % 2 === 0 ? '#ffffff' : '#f8fafc');
                  const spanBg     = grpSelected ? '#dbeafe' : (gi % 2 === 0 ? '#f0f7ff' : '#eaf2ff');
                  const count      = grp.variants.length;

                  return grp.variants.map((v, vi) => (
                    <tr
                      key={v._id || `${grp.article}-${vi}`}
                      style={{
                        background: grpBg,
                        borderBottom: vi === count - 1 ? '2px solid #e2e8f0' : '1px solid #f1f5f9',
                        transition: 'background .1s',
                      }}
                      onMouseEnter={e => { if (!grpSelected) e.currentTarget.style.background = '#eff6ff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = grpBg; }}
                    >
                      {/* ── left group cells (rowspan on first row only) ── */}
                      {vi === 0 && (
                        <>
                          {/* Checkbox */}
                          <td rowSpan={count} style={{
                            padding: '8px', background: spanBg,
                            borderRight: '1px solid #dbeafe', verticalAlign: 'middle', textAlign: 'center',
                          }}>
                            <GroupCheckbox
                              variantIds={grp.variants.map(v => v._id)}
                              selected={selected}
                              onToggle={toggleGroup}
                            />
                          </td>

                          {/* Article */}
                          <td rowSpan={count} style={{
                            padding: '10px 12px', background: spanBg,
                            borderRight: '2px solid #dbeafe', verticalAlign: 'middle',
                            fontWeight: 700, color: '#0f172a', fontSize: 13,
                            letterSpacing: '.2px', position: 'relative',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ width: 3, height: 28, borderRadius: 2, background: cat.dot, flexShrink: 0, display: 'block' }} />
                              {grp.article}
                            </div>
                          </td>

                          {/* Category */}
                          <td rowSpan={count} style={{
                            padding: '10px 10px', background: spanBg,
                            borderRight: '1px solid #e2e8f0', verticalAlign: 'middle',
                          }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '4px 10px', borderRadius: 20, fontSize: 10.5, fontWeight: 700,
                              background: cat.bg, color: cat.color, letterSpacing: '.3px', whiteSpace: 'nowrap',
                            }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: cat.dot, flexShrink: 0 }} />
                              {cat.label}
                            </span>
                          </td>

                          {/* Image */}
                          <td rowSpan={count} style={{
                            padding: '10px 8px', background: spanBg,
                            borderRight: '2px solid #dbeafe', verticalAlign: 'middle', textAlign: 'center',
                          }}>
                            {grp.image
                              ? <img src={grp.image} alt={grp.article} loading="lazy"
                                  style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8, boxShadow: '0 2px 6px rgba(0,0,0,.14)' }} />
                              : <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 9, fontWeight: 700, textAlign: 'center', lineHeight: 1.3, margin: '0 auto' }}>NO<br />IMG</div>
                            }
                          </td>

                          {/* Series */}
                          <td rowSpan={count} style={{
                            padding: '10px 10px', background: spanBg,
                            borderRight: '2px solid #dbeafe', verticalAlign: 'middle',
                            color: '#475569', fontSize: 12, fontWeight: 600, textAlign: 'center',
                          }}>
                            {grp.series || <span style={{ color: '#cbd5e1' }}>—</span>}
                          </td>
                        </>
                      )}

                      {/* ── per-variant cells ───────────────────────────── */}
                      <td style={{ padding: '8px 10px', color: '#374151', fontWeight: 500, textAlign: 'right' }}>
                        ₹{v.mrp ?? '—'}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#16a34a', fontWeight: 700, textAlign: 'right' }}>
                        ₹{v.rate ?? '—'}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#0f172a', fontWeight: 500 }}>
                        {v.color || <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <span style={{ background: '#f1f5f9', color: '#334155', fontWeight: 700, fontSize: 12, padding: '2px 8px', borderRadius: 6 }}>
                          {v.size || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <CartonBadge value={v.cartons} />
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748b', fontWeight: 500 }}>
                        {v.pairPerCarton || 0}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: '#475569', fontWeight: 600 }}>
                        {(v.cartons * v.pairPerCarton) || 0}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#6366f1', fontWeight: 600, fontSize: 12 }}>
                        {v.createdBy || <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>

          {/* table footer */}
          <div style={{
            background: '#f8fafc', borderTop: '1px solid #e2e8f0',
            padding: '8px 16px', display: 'flex', gap: 20, flexWrap: 'wrap',
            fontSize: 12, color: '#64748b', alignItems: 'center',
          }}>
            <span>
              Showing <strong style={{ color: '#0f172a' }}>{products.length}</strong> of{' '}
              <strong style={{ color: '#0f172a' }}>{total.toLocaleString()}</strong> products
            </span>
            <span>
              <strong style={{ color: '#0f172a' }}>{groups.length}</strong> article groups
            </span>
            <span style={{ marginLeft: 'auto', color: '#94a3b8' }}>
              Page <strong style={{ color: '#0f172a' }}>{page}</strong> / <strong style={{ color: '#0f172a' }}>{totalPages}</strong>
            </span>
          </div>
        </div>
      )}

      {/* ── pagination ──────────────────────────────────────────────────── */}
      {!isLoading && !isError && totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20, flexWrap: 'wrap' }}>
          <PagBtn label="«" onClick={() => setPage(1)}            disabled={page <= 1 || isFetching} />
          <PagBtn label="‹"  onClick={() => setPage(p => p - 1)} disabled={page <= 1 || isFetching} />
          {(() => {
            const start = Math.max(1, Math.min(page - 2, totalPages - 4));
            return Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i).map(n => (
              <PagBtn key={n} label={n} active={n === page} onClick={() => setPage(n)} disabled={isFetching} />
            ));
          })()}
          <PagBtn label="›"  onClick={() => setPage(p => p + 1)} disabled={page >= totalPages || isFetching} />
          <PagBtn label="»"  onClick={() => setPage(totalPages)} disabled={page >= totalPages || isFetching} />
        </div>
      )}
    </div>
  );
}
