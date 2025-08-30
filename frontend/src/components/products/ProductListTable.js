
import React, { useState, useMemo, useEffect, useRef } from 'react';
import api from '../../utils/api';
import ExcelJS from "exceljs";
//import { saveAs } from "file-saver";
const triggerDownload = (blob, filename) => {
  if (window.navigator?.msSaveOrOpenBlob) {
    // पुराने Edge IE-mode
    window.navigator.msSaveOrOpenBlob(blob, filename);
  } else {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.style.display = 'none';
    a.href      = url;
    a.download  = filename;        // mobile Safari/Chrome यही पढ़ते हैं
    document.body.appendChild(a);
    a.click();                     // user-gesture के भीतर
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 800);
  }
};
// Helper functions
function getVirtualGroup(stockType, gender) {
  const st = (stockType || '').toLowerCase();
  const gen = (gender || '').toLowerCase();
  if (st === 'pu') {
    if (gen === 'ladies') return { group: 'PU LADIES', order: 7 };
    if (gen === 'kids_ladies') return { group: 'PU KID LADIES', order: 8 };
    if (gen === 'gents') return { group: 'PU GENTS', order: 9 };
    if (gen === 'kids_gents') return { group: 'PU KIDS GENTS', order: 10 };
    return { group: 'PU OTHER', order: 11 };
  }
  if (st === 'eva') {
    if (gen === 'ladies') return { group: 'EVA LADIES', order: 2 };
    if (gen === 'kids_ladies') return { group: 'EVA KID LADIES', order: 3 };
    if (gen === 'gents') return { group: 'EVA GENTS', order: 4 };
    if (gen === 'kids_gents') return { group: 'EVA KIDS GENTS', order: 5 };
    return { group: 'EVA OTHER', order: 6 };
  }
  return { group: 'OTHER', order: 99 };
}

function extractSeriesPref(series) {
  const match = (series || '').match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : Infinity;
}

const SearchBar = ({ value, onChange, placeholder }) => (
  <input
    type="text"
    className="form-control mb-3 search-bar"
    placeholder={placeholder || "Search by any property..."}
    value={value}
    onChange={onChange}
    style={{ maxWidth: 350 }}
  />
);

const CheckboxFilter = ({
  label, options, selected, onChange, name, openFilter, setOpenFilter, dropdownMenuRef
}) => {
  const isOpen = openFilter === name;

  const handleCheckboxChange = (option) => {
    let updated;
    if (selected.includes(option)) {
      updated = selected.filter(item => item !== option);
    } else {
      updated = [...selected, option];
    }
    onChange(name, updated);
  };

  const handleAllChange = () => {
    onChange(name, []);
  };

  return (
    <div className="dropdown" style={{ maxWidth: 200, position: 'relative' }} data-bs-auto-close="false">
      <button
        className="btn btn-outline-secondary dropdown-toggle w-100 text-start"
        type="button"
        onClick={() => setOpenFilter(isOpen ? null : name)}
      >
        {selected.length === 0 ? `All ${label}` : `${label} (${selected.length})`}
      </button>

      {isOpen && (
        <div className="dropdown-menu show w-100" style={{ maxHeight: 200, overflowY: 'auto' }} ref={dropdownMenuRef} >
          <div className="px-3 py-1">
            <label className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                checked={selected.length === 0}
                onChange={handleAllChange}
                onClick={(e) => e.stopPropagation()}
              />
              <span className="form-check-label">{`All ${label}`}</span>
            </label>
          </div>

          {options.map(option => (
            <div key={option} className="px-3 py-1">
              <label className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={selected.includes(option)}
                  onChange={() => handleCheckboxChange(option)}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="form-check-label">{option}</span>
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ProductListTable = ({ products, loading, title, onRefresh }) => {
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState({
    size: [], color: [], gender: [],
    article: [], stockType: [], pairPerCarton: [],
    mrp: [], rate: [], series: []
  });
  const [matrixExportType, setMatrixExportType] = useState("withoutImage");
  const [pdfExportType, setPdfExportType] = useState("withImage");
  const [showRate, setShowRate] = useState(false);
  const [showMRP, setShowMRP] = useState(false);
  const [openFilter, setOpenFilter] = useState(null);
  const dropdownMenuRef = useRef(null);

  useEffect(() => {
    if (!openFilter) return;

    function handleClickOutside(event) {
      if (dropdownMenuRef.current && !dropdownMenuRef.current.contains(event.target)) {
        setOpenFilter(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openFilter]);

  // Smart filtering for dropdown options
  const uniqueSizes = [
    ...new Set(
      products
        .filter(p =>
          (filter.article.length === 0 || filter.article.includes(p.article)) &&
          (filter.gender.length === 0 || filter.gender.includes(p.gender)) &&
          (filter.stockType.length === 0 || filter.stockType.includes(p.stockType)) &&
          (filter.series.length === 0 || filter.series.includes(p.series)) &&
          (filter.color.length === 0 || filter.color.includes(p.color)) &&
          (filter.pairPerCarton.length === 0 || filter.pairPerCarton.includes(String(p.pairPerCarton))) &&
          (filter.mrp.length === 0 || filter.mrp.includes(String(p.mrp))) &&
          (filter.rate.length === 0 || filter.rate.includes(String(p.rate)))
        )
        .map(p => p.size)
        .filter(Boolean)
    )
  ];

  const uniqueColors = [
    ...new Set(
      products
        .filter(p =>
          (filter.article.length === 0 || filter.article.includes(p.article)) &&
          (filter.gender.length === 0 || filter.gender.includes(p.gender)) &&
          (filter.stockType.length === 0 || filter.stockType.includes(p.stockType)) &&
          (filter.series.length === 0 || filter.series.includes(p.series)) &&
          (filter.size.length === 0 || filter.size.includes(p.size)) &&
          (filter.pairPerCarton.length === 0 || filter.pairPerCarton.includes(String(p.pairPerCarton))) &&
          (filter.mrp.length === 0 || filter.mrp.includes(String(p.mrp))) &&
          (filter.rate.length === 0 || filter.rate.includes(String(p.rate)))
        )
        .map(p => p.color)
        .filter(Boolean)
    )
  ];

  const uniqueGenders = [
    ...new Set(
      products
        .filter(p =>
          (filter.article.length === 0 || filter.article.includes(p.article)) &&
          (filter.stockType.length === 0 || filter.stockType.includes(p.stockType)) &&
          (filter.series.length === 0 || filter.series.includes(p.series)) &&
          (filter.size.length === 0 || filter.size.includes(p.size)) &&
          (filter.color.length === 0 || filter.color.includes(p.color)) &&
          (filter.pairPerCarton.length === 0 || filter.pairPerCarton.includes(String(p.pairPerCarton))) &&
          (filter.mrp.length === 0 || filter.mrp.includes(String(p.mrp))) &&
          (filter.rate.length === 0 || filter.rate.includes(String(p.rate)))
        )
        .map(p => p.gender)
        .filter(Boolean)
    )
  ];

  const uniqueArticles = [
    ...new Set(
      products
        .filter(p =>
          (filter.gender.length === 0 || filter.gender.includes(p.gender)) &&
          (filter.stockType.length === 0 || filter.stockType.includes(p.stockType)) &&
          (filter.series.length === 0 || filter.series.includes(p.series)) &&
          (filter.size.length === 0 || filter.size.includes(p.size)) &&
          (filter.color.length === 0 || filter.color.includes(p.color)) &&
          (filter.pairPerCarton.length === 0 || filter.pairPerCarton.includes(String(p.pairPerCarton))) &&
          (filter.mrp.length === 0 || filter.mrp.includes(String(p.mrp))) &&
          (filter.rate.length === 0 || filter.rate.includes(String(p.rate)))
        )
        .map(p => p.article)
        .filter(Boolean)
    )
  ];

  const uniqueStockTypes = [
    ...new Set(
      products
        .filter(p =>
          (filter.article.length === 0 || filter.article.includes(p.article)) &&
          (filter.gender.length === 0 || filter.gender.includes(p.gender)) &&
          (filter.series.length === 0 || filter.series.includes(p.series)) &&
          (filter.size.length === 0 || filter.size.includes(p.size)) &&
          (filter.color.length === 0 || filter.color.includes(p.color)) &&
          (filter.pairPerCarton.length === 0 || filter.pairPerCarton.includes(String(p.pairPerCarton))) &&
          (filter.mrp.length === 0 || filter.mrp.includes(String(p.mrp))) &&
          (filter.rate.length === 0 || filter.rate.includes(String(p.rate)))
        )
        .map(p => p.stockType)
        .filter(Boolean)
    )
  ];

  const uniquePairPerCartons = [
    ...new Set(
      products
        .filter(p =>
          (filter.article.length === 0 || filter.article.includes(p.article)) &&
          (filter.gender.length === 0 || filter.gender.includes(p.gender)) &&
          (filter.stockType.length === 0 || filter.stockType.includes(p.stockType)) &&
          (filter.series.length === 0 || filter.series.includes(p.series)) &&
          (filter.size.length === 0 || filter.size.includes(p.size)) &&
          (filter.color.length === 0 || filter.color.includes(p.color)) &&
          (filter.mrp.length === 0 || filter.mrp.includes(String(p.mrp))) &&
          (filter.rate.length === 0 || filter.rate.includes(String(p.rate)))
        )
        .map(p => p.pairPerCarton)
        .filter(Boolean)
    )
  ];

  const uniqueMRPs = [
    ...new Set(
      products
        .filter(p =>
          (filter.article.length === 0 || filter.article.includes(p.article)) &&
          (filter.gender.length === 0 || filter.gender.includes(p.gender)) &&
          (filter.stockType.length === 0 || filter.stockType.includes(p.stockType)) &&
          (filter.series.length === 0 || filter.series.includes(p.series)) &&
          (filter.size.length === 0 || filter.size.includes(p.size)) &&
          (filter.color.length === 0 || filter.color.includes(p.color)) &&
          (filter.pairPerCarton.length === 0 || filter.pairPerCarton.includes(String(p.pairPerCarton))) &&
          (filter.rate.length === 0 || filter.rate.includes(String(p.rate)))
        )
        .map(p => p.mrp)
        .filter(Boolean)
    )
  ];

  const uniqueRates = [
    ...new Set(
      products
        .filter(p =>
          (filter.article.length === 0 || filter.article.includes(p.article)) &&
          (filter.gender.length === 0 || filter.gender.includes(p.gender)) &&
          (filter.stockType.length === 0 || filter.stockType.includes(p.stockType)) &&
          (filter.series.length === 0 || filter.series.includes(p.series)) &&
          (filter.size.length === 0 || filter.size.includes(p.size)) &&
          (filter.color.length === 0 || filter.color.includes(p.color)) &&
          (filter.pairPerCarton.length === 0 || filter.pairPerCarton.includes(String(p.pairPerCarton))) &&
          (filter.mrp.length === 0 || filter.mrp.includes(String(p.mrp)))
        )
        .map(p => p.rate)
        .filter(Boolean)
    )
  ];

  const uniqueSeries = [
    ...new Set(
      products
        .filter(p =>
          (filter.article.length === 0 || filter.article.includes(p.article)) &&
          (filter.gender.length === 0 || filter.gender.includes(p.gender)) &&
          (filter.stockType.length === 0 || filter.stockType.includes(p.stockType)) &&
          (filter.size.length === 0 || filter.size.includes(p.size)) &&
          (filter.color.length === 0 || filter.color.includes(p.color)) &&
          (filter.pairPerCarton.length === 0 || filter.pairPerCarton.includes(String(p.pairPerCarton))) &&
          (filter.mrp.length === 0 || filter.mrp.includes(String(p.mrp))) &&
          (filter.rate.length === 0 || filter.rate.includes(String(p.rate)))
        )
        .map(p => p.series)
        .filter(Boolean)
    )
  ];

  const groupedProducts = useMemo(() => {
    const filtered = products.filter(p => {
      const matchesSearch = [
        p.article, p.stockType, p.gender, p.color, p.size, p.series,
        p.pairPerCarton?.toString(), p.createdBy, p.mrp?.toString(), p.rate?.toString()
      ].join(' ').toLowerCase().includes(search.toLowerCase());

      const matchesFilters =
        (filter.size.length === 0 || filter.size.includes(p.size)) &&
        (filter.color.length === 0 || filter.color.includes(p.color)) &&
        (filter.gender.length === 0 || filter.gender.includes(p.gender)) &&
        (filter.article.length === 0 || filter.article.includes(p.article)) &&
        (filter.stockType.length === 0 || filter.stockType.includes(p.stockType)) &&
        (filter.pairPerCarton.length === 0 || filter.pairPerCarton.includes(String(p.pairPerCarton))) &&
        (filter.mrp.length === 0 || filter.mrp.includes(String(p.mrp))) &&
        (filter.rate.length === 0 || filter.rate.includes(String(p.rate))) &&
        (filter.series.length === 0 || filter.series.includes(p.series));
      return matchesSearch && matchesFilters;
    });

    const groups = {};
    filtered.forEach(product => {
      const key = `${product.article}-${product.gender}`;
      if (!groups[key]) {
        groups[key] = {
          article: product.article,
          gender: product.gender,
          image: null,
          variants: []
        };
      }
      if (!groups[key].image && product.image) {
        groups[key].image = product.image;
      }
      groups[key].variants.push(product);
    });
    return groups;
  }, [products, search, filter]);

  const filteredProducts = useMemo(() => {
    return Object.values(groupedProducts).flatMap(group => group.variants);
  }, [groupedProducts]);

  const handleFilterChange = (name, value) => setFilter(prev => ({ ...prev, [name]: value }));
  const handleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  const handleSelectAll = () => setSelected(prev => prev.length === filteredProducts.length ? [] : filteredProducts.map(p => p._id));

  const getImageBase64 = async (url) => {
    if (!url) return null;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new window.FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      return null;
    }
  };

  const handleExportMatrixExcel = async () => {
    const exportRows = selected.length > 0
      ? filteredProducts.filter((p) => selected.includes(p._id))
      : filteredProducts;

    const groupedByCategory = {};
    exportRows.forEach((product) => {
      const groupInfo = getVirtualGroup(product.stockType, product.gender);
      const groupKey = groupInfo.group;
      const articleKey = `${product.article}-${product.gender}`;
      if (!groupedByCategory[groupKey]) groupedByCategory[groupKey] = {};
      if (!groupedByCategory[groupKey][articleKey]) {
        groupedByCategory[groupKey][articleKey] = {
          article: product.article,
          gender: product.gender,
          stockType: product.stockType,
          series: product.series,
          variants: [],
        };
      }
      groupedByCategory[groupKey][articleKey].variants.push(product);
    });

    const categoryOrder = [
      "EVA LADIES", "EVA GENTS", "EVA KID LADIES", "EVA KIDS GENTS",
      "PU LADIES", "PU GENTS", "PU KID LADIES", "PU KIDS GENTS", "OTHER"
    ];

    const sortedCategories = Object.entries(groupedByCategory).sort(([a], [b]) => {
      const idxA = categoryOrder.indexOf(a);
      const idxB = categoryOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Stock Matrix");

    const articleImages = {};
    if (matrixExportType === "withImage") {
      const imagePromises = [];
      for (const [, articles] of sortedCategories) {
        for (const articleGroup of Object.values(articles)) {
          const imgVariant = articleGroup.variants.find((v) => v.image);
          if (imgVariant && imgVariant.image) {
            imagePromises.push(
              (async () => {
                const base64 = await getImageBase64(imgVariant.image);
                if (base64) {
                  let ext = "png";
                  const url = imgVariant.image.toLowerCase();
                  if (url.includes(".jpg") || url.includes(".jpeg")) ext = "jpeg";
                  else if (url.includes(".webp")) ext = "webp";
                  else if (url.includes(".gif")) ext = "gif";
                  articleImages[articleGroup.article] = { base64, ext };
                }
              })()
            );
          }
        }
      }
      await Promise.all(imagePromises);
    }

    for (const [groupName, articleGroups] of sortedCategories) {
      ws.addRow([`${groupName}`]);
      ws.lastRow.font = { bold: true, color: { argb: 'FF1A237E' } };

      const sizeSet = new Set();
      Object.values(articleGroups).forEach((articleGroup) => {
        if (!articleGroup?.variants) return;
        articleGroup.variants.forEach((v) => {
          if (v.size) sizeSet.add(v.size.trim().toUpperCase());
        });
      });
      const sortedSizes = [...sizeSet].sort((a, b) =>
        isNaN(a) || isNaN(b) ? a.localeCompare(b) : parseInt(a) - parseInt(b)
      );

      const headerRow = matrixExportType === "withImage"
        ? ["Article", "Image", "Color", ...sortedSizes]
        : ["Article", "Color", ...sortedSizes];

      const articleBlocks = Object.values(articleGroups).map((articleGroup) => {
        if (!articleGroup) return null;
        const blockRows = [];
        const colorMap = {};
        articleGroup.variants.forEach((v) => {
          const color = v.color?.trim() || "DEFAULT";
          const size = v.size?.trim().toUpperCase();
          if (!colorMap[color]) colorMap[color] = {};
          colorMap[color][size] = (colorMap[color][size] || 0) + (v.cartons || 0);
        });
        let imageHandled = false;
        let imageId = null;
        if (matrixExportType === "withImage" && articleImages[articleGroup.article]) {
          const img = articleImages[articleGroup.article];
          imageId = wb.addImage({
            base64: `data:image/${img.ext};base64,${img.base64}`,
            extension: img.ext,
          });
        }
        for (const [color, sizeMap] of Object.entries(colorMap)) {
          const row = matrixExportType === "withImage"
            ? [imageHandled ? '' : articleGroup.article, '', color]
            : [imageHandled ? '' : articleGroup.article, color];
          sortedSizes.forEach(sz => {
            row.push(sizeMap[sz] !== undefined ? sizeMap[sz] : '');
          });
          blockRows.push(row);
          imageHandled = true;
        }
        return {
          blockRows,
          imageId,
          blockCols: matrixExportType === "withImage" ? 3 + sortedSizes.length : 2 + sortedSizes.length
        };
      }).filter(Boolean);

      const chunkSize = 3;
      let isFirstChunk = true;

      for (let i = 0; i < articleBlocks.length; i += chunkSize) {
        const chunk = articleBlocks.slice(i, i + chunkSize);

        if (isFirstChunk) {
          let chunkHeader = [];
          chunk.forEach(() => {
            chunkHeader.push(...headerRow);
          });
          ws.addRow(chunkHeader);
          ws.lastRow.font = { bold: true };
          isFirstChunk = false;
        }

        const maxBlockRows = Math.max(...chunk.map((b) => b.blockRows.length));
        chunk.forEach((b) => {
          while (b.blockRows.length < maxBlockRows)
            b.blockRows.push(new Array(b.blockCols).fill(""));
        });

        const startRowNum = ws.lastRow.number + 1;
        for (let r = 0; r < maxBlockRows; r++) {
          let bigRow = [];
          chunk.forEach((b) => bigRow.push(...b.blockRows[r]));
          ws.addRow(bigRow);
        }
        ws.addRow([]);

        chunk.forEach((b, idx) => {
          if (matrixExportType === "withImage" && b.imageId) {
            const blockColOffset = idx * b.blockCols + 1;
            ws.mergeCells(startRowNum, blockColOffset + 1, startRowNum + 1, blockColOffset + 2);
            ws.addImage(b.imageId, {
              tl: { col: blockColOffset + 0.1, row: startRowNum - 0.8 },
              ext: { width: 60, height: 60 },
              editAs: "oneCell"
            });
          }
        });
      }
    }

    ws.columns.forEach((col) => { col.width = 14; });
    const buf = await wb.xlsx.writeBuffer();
   // saveAs(new Blob([buf]), "Stock-Matrix-Export.xlsx");
   triggerDownload(
  new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }),
  'Stock-Matrix-Export.xlsx'
);
  };

  const handleGeneratePDF = async () => {
    let idsToExport = [];
    let additionalImageIds = [];
    if (selected.length > 0) {
      idsToExport = selected;
      const selectedGroups = {};
      const selectedProducts = filteredProducts.filter(p => selected.includes(p._id));
      const zeroStockSelected = selectedProducts.filter(
        p => (p.totalPairs || (p.cartons * p.pairPerCarton)) === 0
      );
      if (zeroStockSelected.length > 0) {
        alert('Warning: आपने zero stock वाले products select किए हैं। कृपया valid stock वाले products select करें।');
        return;
      }
      selectedProducts.forEach(p => {
        const groupKey = `${p.article}-${p.gender}`;
        if (!selectedGroups[groupKey]) {
          const group = groupedProducts[groupKey];
          if (group && group.variants) {
            const imageProduct = group.variants.find(v => v.image);
            if (imageProduct && !selected.includes(imageProduct._id)) {
              additionalImageIds.push(imageProduct._id);
            }
          }
          selectedGroups[groupKey] = true;
        }
      });
      idsToExport = [...selected, ...additionalImageIds];
    } else {
      idsToExport = filteredProducts.map(p => p._id);
    }

    if (idsToExport.length === 0) {
      alert('कृपया कम से कम 1 प्रोडक्ट चुनें');
      return;
    }

    try {
      const response = await api.post('/pdf/generate-pdf', {
        productIds: idsToExport,
        includeImages: pdfExportType === "withImage",
        showRate: showRate,
        showMRP: showMRP,
        filters: {}
      }, { responseType: 'blob' });

     triggerDownload(
  new Blob([response.data], { type: 'application/pdf' }),
  'selected-products.pdf'
);

    } catch (err) {
      console.error('PDF Error:', err);
      alert('PDF डाउनलोड नहीं हो पाया');
    }
  };

  const renderTableRows = () => {
    const rows = [];
    const groupEntries = Object.entries(groupedProducts);
    
    // Same sorting order as Excel export
    groupEntries.sort((a, b) => {
      const groupA = a[1];
      const groupB = b[1];
      
      // Use Excel export category order
      const categoryOrder = [
        "EVA LADIES", "EVA GENTS", "EVA KID LADIES", "EVA KIDS GENTS",
        "PU LADIES", "PU GENTS", "PU KID LADIES", "PU KIDS GENTS", "OTHER"
      ];
      
      const groupInfoA = getVirtualGroup(groupA.variants[0]?.stockType, groupA.gender);
      const groupInfoB = getVirtualGroup(groupB.variants[0]?.stockType, groupB.gender);
      
      const orderA = categoryOrder.indexOf(groupInfoA.group);
      const orderB = categoryOrder.indexOf(groupInfoB.group);
      
      if (orderA !== orderB) return (orderA === -1 ? 999 : orderA) - (orderB === -1 ? 999 : orderB);
      
      // Within same category, sort by series number then alphabetically
      const prefA = extractSeriesPref(groupA.variants[0]?.series);
      const prefB = extractSeriesPref(groupB.variants[0]?.series);
      if (prefA !== prefB) return prefA - prefB;
      
      if ((groupA.variants[0]?.series || '') < (groupB.variants[0]?.series || '')) return -1;
      if ((groupA.variants[0]?.series || '') > (groupB.variants[0]?.series || '')) return 1;
      
      if ((groupA.article || '') < (groupB.article || '')) return -1;
      if ((groupA.article || '') > (groupB.article || '')) return 1;
      
      return 0;
    });
    
    groupEntries.forEach(([groupKey, group], groupIndex) => {
      group.variants.forEach((product, index) => {
        const isFirstInGroup = index === 0;
        const groupSize = group.variants.length;

        rows.push(
          <tr key={product._id}>
            <td>
              <input
                type="checkbox"
                checked={selected.includes(product._id)}
                onChange={() => handleSelect(product._id)}
              />
            </td>
            {isFirstInGroup && (
              <td rowSpan={groupSize} className="text-center align-middle bg-light border-span">
                <strong>{group.article}</strong>
              </td>
            )}
            {isFirstInGroup && (
              <td rowSpan={groupSize} className="text-center align-middle border-span">
                {group.gender}
              </td>
            )}
            {isFirstInGroup && (
              <td rowSpan={groupSize} className="text-center align-middle border-span">
                {group.image ? (
                  <img src={group.image} alt={group.article} className="product-image" />
                ) : (
                  <div className="no-image">No Image</div>
                )}
              </td>
            )}
            {isFirstInGroup && (
              <td rowSpan={groupSize} className="text-center align-middle border-span">
                {product.series || '-'}
              </td>
            )}
            {isFirstInGroup && (
              <td rowSpan={groupSize} className="text-center align-middle border-span">
                {product.stockType}
              </td>
            )}
            <td className="text-center">₹{product.mrp}</td>
            <td className="text-center">₹{product.rate}</td>
            <td>{product.color}</td>
            <td>{product.size}</td>
            <td>{product.cartons}</td>
            <td>{product.pairPerCarton}</td>
            <td>{product.createdBy || '-'}</td>
          </tr>
        );
      });
      if (groupIndex < groupEntries.length - 1) {
        rows.push(
          <tr key={`separator-${groupKey}`}>
            <td colSpan="15" style={{ borderBottom: '2px solid #222', background: '#eee', padding: 0 }}></td>
          </tr>
        );
      }
    });
    return rows;
  };

  return (
    <div className="container-fluid py-2 dashboard-bg">
      <style>{`
        .dashboard-bg { background: linear-gradient(135deg, #f8fbfd 0%, #e9eafc 60%, #f1f4fc 100%); min-height: 100vh; }
        .card { box-shadow: 0 8px 32px 0 rgba(85,76,219,0.08), 0 2px 8px rgba(60,72,126,0.12); border-radius: 16px; border: none; }
        .card-body { background: rgba(255,255,255,0.98); border-radius: 12px; }
        .search-bar { background: #f0f4fc; border-radius: 10px; border: 1px solid #d5dcf8; padding: 10px 15px; }
        .table { background: white; border-radius: 10px; overflow: hidden; }
        .table-dark { background: linear-gradient(90deg, #6c7293 0%, #4a5568 100%); color: white; }
        .table-hover tbody tr:hover { background-color: #f5f2ff !important; transition: background-color 0.2s ease; }
        .dropdown-menu.show { box-shadow: 0 4px 16px rgba(60,72,126,0.15); background: #f4f6fd; border: 1px solid #d5dcf8; border-radius: 8px; }
        .border-span { background: #e9eafd !important; border-left: 4px solid #5c6bc0 !important; font-weight: 600; }
        .product-image { width: 56px; height: 56px; border-radius: 10px; object-fit: cover; border: 2px solid #e2e8f0; }
        .no-image { color: #64748b; font-style: italic; padding: 16px 8px; background: #f1f5f9; }
        .btn { border-radius: 8px; font-weight: 500; }
        .btn-outline-secondary { border-color: #d5dcf8; color: #6366f1; }
        .btn-outline-secondary:hover { background: #6366f1; border-color: #6366f1; }
        @media (max-width: 767px) { .d-flex.gap-3 { flex-direction: column !important; gap: 0.75rem !important; } }
      `}</style>

      {title && <h2 className="mb-3 text-center text-primary">{title}</h2>}
      
      <div className="card">
        <div className="card-body">
          <SearchBar value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by article, color, size, etc." />

          <div className="d-flex gap-2 mb-3 flex-wrap">
            <CheckboxFilter label="Sizes" options={uniqueSizes} selected={filter.size} onChange={handleFilterChange} name="size" openFilter={openFilter} setOpenFilter={setOpenFilter} dropdownMenuRef={dropdownMenuRef} />
            <CheckboxFilter label="Colors" options={uniqueColors} selected={filter.color} onChange={handleFilterChange} name="color" openFilter={openFilter} setOpenFilter={setOpenFilter} dropdownMenuRef={dropdownMenuRef} />
            <CheckboxFilter label="Genders" options={uniqueGenders} selected={filter.gender} onChange={handleFilterChange} name="gender" openFilter={openFilter} setOpenFilter={setOpenFilter} dropdownMenuRef={dropdownMenuRef} />
            <CheckboxFilter label="Articles" options={uniqueArticles} selected={filter.article} onChange={handleFilterChange} name="article" openFilter={openFilter} setOpenFilter={setOpenFilter} dropdownMenuRef={dropdownMenuRef} />
            <CheckboxFilter label="Stock Types" options={uniqueStockTypes} selected={filter.stockType} onChange={handleFilterChange} name="stockType" openFilter={openFilter} setOpenFilter={setOpenFilter} dropdownMenuRef={dropdownMenuRef} />
            <CheckboxFilter label="Pair/Carton" options={uniquePairPerCartons.map(String)} selected={filter.pairPerCarton} onChange={handleFilterChange} name="pairPerCarton" openFilter={openFilter} setOpenFilter={setOpenFilter} dropdownMenuRef={dropdownMenuRef} />
            <CheckboxFilter label="MRP" options={uniqueMRPs.map(String)} selected={filter.mrp} onChange={handleFilterChange} name="mrp" openFilter={openFilter} setOpenFilter={setOpenFilter} dropdownMenuRef={dropdownMenuRef} />
            <CheckboxFilter label="Rates" options={uniqueRates.map(String)} selected={filter.rate} onChange={handleFilterChange} name="rate" openFilter={openFilter} setOpenFilter={setOpenFilter} dropdownMenuRef={dropdownMenuRef} />
            <CheckboxFilter label="Series" options={uniqueSeries} selected={filter.series} onChange={handleFilterChange} name="series" openFilter={openFilter} setOpenFilter={setOpenFilter} dropdownMenuRef={dropdownMenuRef} />
          </div>

          <div className="mb-3 d-flex flex-wrap gap-3 align-items-center">
            <div className="d-flex gap-2">
              <select className="form-select" style={{ width: '200px' }} value={matrixExportType} onChange={e => setMatrixExportType(e.target.value)}>
                <option value="withoutImage">Excel (No Image)</option>
                <option value="withImage">Excel (With Image)</option>
              </select>
              <button className="btn btn-success" onClick={handleExportMatrixExcel}>Export Excel</button>
            </div>
            <div className="d-flex gap-2">
              <select className="form-select" style={{ width: '200px' }} value={pdfExportType} onChange={e => setPdfExportType(e.target.value)}>
                <option value="withImage">PDF (With Image)</option>
                <option value="withoutImage">PDF (No Image)</option>
              </select>
              <button className="btn btn-primary" onClick={handleGeneratePDF}>Export PDF</button>
            </div>
            <div className="d-flex gap-3 ps-3 border-start">
              <div className="form-check">
                <input type="checkbox" className="form-check-input" id="showRate" checked={showRate} onChange={e => setShowRate(e.target.checked)} />
                <label className="form-check-label small" htmlFor="showRate">Show Rate</label>
              </div>
              <div className="form-check">
                <input type="checkbox" className="form-check-input" id="showMRP" checked={showMRP} onChange={e => setShowMRP(e.target.checked)} />
                <label className="form-check-label small" htmlFor="showMRP">Show MRP</label>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : Object.keys(groupedProducts).length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-search fs-1 mb-3"></i>
                <h5>No products found</h5>
                <p>Try adjusting your search or filters</p>
              </div>
            ) : (
              <table className="table table-bordered table-hover">
                <thead className="table-dark">
                  <tr>
                    <th><input type="checkbox" checked={selected.length > 0 && selected.length === filteredProducts.length} onChange={handleSelectAll} /></th>
                    <th>Article</th>
                    <th>Gender</th>
                    <th>Image</th>
                    <th>Series</th>
                    <th>Stock Type</th>
                    <th>MRP</th>
                    <th>Rate</th>
                    <th>Color</th>
                    <th>Size</th>
                    <th>Cartons</th>
                    <th>Pair/Carton</th>
                    <th>Created By</th>
                  </tr>
                </thead>
                <tbody>
                  {renderTableRows()}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductListTable;
