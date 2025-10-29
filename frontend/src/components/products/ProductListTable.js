
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
  const [pdfLoading, setPdfLoading] = useState(false);
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
        order: groupInfo.order,
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

  for (const [, articleGroups] of sortedCategories) {
    const articles = Object.values(articleGroups);
    articles.sort((a, b) => {
      const prefA = extractSeriesPref(a.series);
      const prefB = extractSeriesPref(b.series);
      if (prefA !== prefB) return prefA - prefB;
      if ((a.series || '') < (b.series || '')) return -1;
      if ((a.series || '') > (b.series || '')) return 1;
      if ((a.article || '') < (b.article || '')) return -1;
      if ((a.article || '') > (b.article || '')) return 1;
      return 0;
    });
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Stock Matrix", {
    pageSetup: { 
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      scale: 50, // ✅ 50% zoom
      horizontalCentered: true
    },
    views: [{ zoomScale: 50 }]
  });

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

  // ✅ Process each category
  for (const [groupName, articleGroups] of sortedCategories) {
    // ✅ Category heading only once at start
    ws.addRow([`${groupName}`]);
    ws.lastRow.font = { bold: true, color: { argb: 'FF1A237E' }, size: 14 };
    ws.lastRow.height = 20;

    const articles = Object.values(articleGroups);
    const MAX_ROWS_PER_COLUMN = 65;
    const COLUMNS_PER_PAGE = 3;

    const articleBlocks = articles.map((articleGroup) => {
      const colorMap = {};
      articleGroup.variants.forEach((v) => {
        const color = v.color?.trim() || "DEFAULT";
        const size = v.size?.trim().toUpperCase();
        if (!colorMap[color]) colorMap[color] = {};
        colorMap[color][size] = (colorMap[color][size] || 0) + (v.cartons || 0);
      });

      const colorRows = [];
      let isFirstColor = true;
      for (const [color, sizeMap] of Object.entries(colorMap)) {
        colorRows.push({
          article: isFirstColor ? articleGroup.article : '',
          color,
          sizeMap,
          isFirst: isFirstColor
        });
        isFirstColor = false;
      }

      return {
        article: articleGroup.article,
        colorRows,
        totalRows: colorRows.length,
        imageId: matrixExportType === "withImage" && articleImages[articleGroup.article]
          ? wb.addImage({
              base64: `data:image/${articleImages[articleGroup.article].ext};base64,${articleImages[articleGroup.article].base64}`,
              extension: articleImages[articleGroup.article].ext,
            })
          : null
      };
    });

    const columns = [];
    let currentColumn = [];
    let currentRowCount = 0;

    for (const block of articleBlocks) {
      const blockRows = block.totalRows;

      if (currentRowCount + blockRows > MAX_ROWS_PER_COLUMN) {
        if (currentColumn.length > 0) {
          columns.push(currentColumn);
          currentColumn = [];
          currentRowCount = 0;
        }
      }

      currentColumn.push(block);
      currentRowCount += blockRows;
    }

    if (currentColumn.length > 0) {
      columns.push(currentColumn);
    }

    // ✅ Process columns in sets of 3
    for (let pageStart = 0; pageStart < columns.length; pageStart += COLUMNS_PER_PAGE) {
      const pageColumns = columns.slice(pageStart, pageStart + COLUMNS_PER_PAGE);

      // ✅ Calculate sizes per column (only non-zero quantities)
      const columnSizes = pageColumns.map(col => {
        const sizeSet = new Set();
        col.forEach(block => {
          block.colorRows.forEach(row => {
            Object.entries(row.sizeMap).forEach(([size, qty]) => {
              if (qty > 0) sizeSet.add(size);
            });
          });
        });
        return [...sizeSet].sort((a, b) =>
          isNaN(a) || isNaN(b) ? a.localeCompare(b) : parseInt(a) - parseInt(b)
        );
      });

      // ✅ Column headers (ART, COLOR, sizes) - NOT category name
      const headerRow = [];
      columnSizes.forEach(sizes => {
        if (matrixExportType === "withImage") {
          headerRow.push("ART", "", "COLOR", ...sizes);
        } else {
          headerRow.push("ART", "COLOR", ...sizes);
        }
      });
      ws.addRow(headerRow);
      ws.lastRow.font = { bold: true, size: 10 };

      const maxRows = Math.max(...pageColumns.map(col =>
        col.reduce((sum, block) => sum + block.totalRows, 0)
      ));

      const startRowNum = ws.lastRow.number + 1;
      let colArticleIdx = pageColumns.map(() => 0);
      let colColorIdx = pageColumns.map(() => 0);

      // Fill rows
      for (let rowIdx = 0; rowIdx < maxRows; rowIdx++) {
        const dataRow = [];

        pageColumns.forEach((col, colIdx) => {
          if (colArticleIdx[colIdx] < col.length) {
            const block = col[colArticleIdx[colIdx]];
            const colorRow = block.colorRows[colColorIdx[colIdx]];

            if (colorRow) {
              const sizes = columnSizes[colIdx];
              if (matrixExportType === "withImage") {
                dataRow.push(
                  colorRow.article,
                  '',
                  colorRow.color,
                  ...sizes.map(sz => colorRow.sizeMap[sz] || '')
                );
              } else {
                dataRow.push(
                  colorRow.article,
                  colorRow.color,
                  ...sizes.map(sz => colorRow.sizeMap[sz] || '')
                );
              }

              colColorIdx[colIdx]++;
              if (colColorIdx[colIdx] >= block.colorRows.length) {
                colArticleIdx[colIdx]++;
                colColorIdx[colIdx] = 0;
              }
            } else {
              const emptyCols = matrixExportType === "withImage" 
                ? 3 + columnSizes[colIdx].length 
                : 2 + columnSizes[colIdx].length;
              dataRow.push(...new Array(emptyCols).fill(''));
            }
          } else {
            const emptyCols = matrixExportType === "withImage" 
              ? 3 + columnSizes[colIdx].length 
              : 2 + columnSizes[colIdx].length;
            dataRow.push(...new Array(emptyCols).fill(''));
          }
        });

        ws.addRow(dataRow);
      }

      // Images
      if (matrixExportType === "withImage") {
        pageColumns.forEach((col, colIdx) => {
          let colOffset = 0;
          for (let i = 0; i < colIdx; i++) {
            colOffset += 3 + columnSizes[i].length;
          }

          let rowOffset = startRowNum;
          col.forEach(block => {
            if (block.imageId) {
              try {
                ws.mergeCells(rowOffset, colOffset + 2, rowOffset + 1, colOffset + 3);
                ws.addImage(block.imageId, {
                  tl: { col: colOffset + 1.1, row: rowOffset - 0.8 },
                  ext: { width: 60, height: 60 },
                  editAs: "oneCell"
                });
              } catch (err) {
                console.warn(`Image skip: ${block.article}`);
              }
            }
            rowOffset += block.totalRows;
          });
        });
      }

      // ✅ Page break after every 3 columns
      if (pageStart + COLUMNS_PER_PAGE < columns.length) {
        ws.addRow([]);
        ws.lastRow.addPageBreak();
      } else {
        ws.addRow([]);
      }
    }
  }

  ws.columns.forEach((col) => { col.width = 9; });
  const buf = await wb.xlsx.writeBuffer();
  triggerDownload(
    new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }),
    'Stock-Matrix-Export.xlsx'
  );
};


//   const handleGeneratePDF = async () => {
//     let idsToExport = [];
//     let additionalImageIds = [];
//     if (selected.length > 0) {
//       idsToExport = selected;
//       const selectedGroups = {};
//       const selectedProducts = filteredProducts.filter(p => selected.includes(p._id));
//       const zeroStockSelected = selectedProducts.filter(
//         p => (p.totalPairs || (p.cartons * p.pairPerCarton)) === 0
//       );
//       if (zeroStockSelected.length > 0) {
//         alert('Warning: आपने zero stock वाले products select किए हैं। कृपया valid stock वाले products select करें।');
//         return;
//       }
//       selectedProducts.forEach(p => {
//         const groupKey = `${p.article}-${p.gender}`;
//         if (!selectedGroups[groupKey]) {
//           const group = groupedProducts[groupKey];
//           if (group && group.variants) {
//             const imageProduct = group.variants.find(v => v.image);
//             if (imageProduct && !selected.includes(imageProduct._id)) {
//               additionalImageIds.push(imageProduct._id);
//             }
//           }
//           selectedGroups[groupKey] = true;
//         }
//       });
//       idsToExport = [...selected, ...additionalImageIds];
//     } else {
//       idsToExport = filteredProducts.map(p => p._id);
//     }

//     if (idsToExport.length === 0) {
//       alert('कृपया कम से कम 1 प्रोडक्ट चुनें');
//       return;
//     }

//     try {
//       const response = await api.post('/pdf/generate-pdf', {
//         productIds: idsToExport,
//         includeImages: pdfExportType === "withImage",
//         showRate: showRate,
//         showMRP: showMRP,
//         filters: {}
//       }, { responseType: 'blob' });

//      triggerDownload(
//   new Blob([response.data], { type: 'application/pdf' }),
//   'selected-products.pdf'
// );

//     } catch (err) {
//       console.error('PDF Error:', err);
//       alert('PDF डाउनलोड नहीं हो पाया');
//     }
//   };
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
    setPdfLoading(true); // ✅ Start loading
    
    const response = await api.post('/pdf/generate-pdf', {
      productIds: idsToExport,
      includeImages: pdfExportType === "withImage",
      showRate: showRate,
      showMRP: showMRP,
      filters: {}
    }, { 
      responseType: 'blob',
      timeout: 60000 // ✅ 60 second timeout
    });

    triggerDownload(
      new Blob([response.data], { type: 'application/pdf' }),
      'catalogue.pdf'
    );
  } catch (err) {
    console.error('PDF Error:', err);
    if (err.code === 'ECONNABORTED') {
      alert('⏱️ PDF generation is taking longer than expected. Please try selecting fewer products or try again.');
    } else {
      alert('❌ PDF download failed. Please try again.');
    }
  } finally {
    setPdfLoading(false); // ✅ Stop loading
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
            <div className="d-flex gap-2 align-items-center">
  <select 
    className="form-select" 
    style={{ width: '200px' }} 
    value={pdfExportType} 
    onChange={e => setPdfExportType(e.target.value)}
    disabled={pdfLoading}
  >
    <option value="withImage">PDF (With Image)</option>
  </select>
  <button 
    className="btn btn-primary" 
    onClick={handleGeneratePDF}
    disabled={pdfLoading}
    style={{ minWidth: '140px' }}
  >
    {pdfLoading ? (
      <>
        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        Generating...
      </>
    ) : 'Export PDF'}
  </button>
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
