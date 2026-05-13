
const Product = require('../models/Product');
const SalaryEntry = require('../models/SalaryEntry');
const History = require('../models/History');

// Fixed hierarchical sort priority for stockType + gender combinations.
// This expression is used inside MongoDB $addFields and never mutates data.
const SORT_PRIORITY_EXPR = {
  $switch: {
    branches: [
      { case: { $and: [{ $eq: ['$stockType', 'eva'] }, { $eq: ['$gender', 'ladies'] }] },      then: 1 },
      { case: { $and: [{ $eq: ['$stockType', 'eva'] }, { $eq: ['$gender', 'gents'] }] },       then: 2 },
      { case: { $and: [{ $eq: ['$stockType', 'eva'] }, { $eq: ['$gender', 'kids_ladies'] }] }, then: 3 },
      { case: { $and: [{ $eq: ['$stockType', 'eva'] }, { $eq: ['$gender', 'kids_gents'] }] },  then: 4 },
      { case: { $and: [{ $eq: ['$stockType', 'pu'] },  { $eq: ['$gender', 'ladies'] }] },      then: 5 },
      { case: { $and: [{ $eq: ['$stockType', 'pu'] },  { $eq: ['$gender', 'gents'] }] },       then: 6 },
      { case: { $and: [{ $eq: ['$stockType', 'pu'] },  { $eq: ['$gender', 'kids_ladies'] }] }, then: 7 },
      { case: { $and: [{ $eq: ['$stockType', 'pu'] },  { $eq: ['$gender', 'kids_gents'] }] },  then: 8 },
    ],
    default: 99
  }
};

// Converts comma-separated query string values to an array, with optional transform fn.
function splitParam(value, transform) {
  if (!value) return [];
  return value.split(',').map(v => transform ? transform(v.trim()) : v.trim()).filter(Boolean);
}

// Builds the MongoDB $match query from request query parameters.
// Supports multi-value comma-separated filters for every field.
function buildMatchQuery(query) {
  const {
    search,
    article, stockType, gender, color, size, series,
    mrp, rate, pairPerCarton,
    minCartons, maxCartons
  } = query;

  const match = { isDeleted: false };

  if (search && search.trim()) {
    match.$or = [
      { article:   { $regex: search.trim(), $options: 'i' } },
      { color:     { $regex: search.trim(), $options: 'i' } },
      { series:    { $regex: search.trim(), $options: 'i' } },
      { gender:    { $regex: search.trim(), $options: 'i' } },
      { stockType: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  const articles   = splitParam(article);
  const types      = splitParam(stockType, s => s.toLowerCase());
  const genders    = splitParam(gender, s => s.toLowerCase());
  const colors     = splitParam(color);
  const sizes      = splitParam(size);
  const seriesArr  = splitParam(series);
  const mrpArr     = splitParam(mrp, Number).filter(n => !isNaN(n));
  const rateArr    = splitParam(rate, Number).filter(n => !isNaN(n));
  const ppcArr     = splitParam(pairPerCarton, Number).filter(n => !isNaN(n));

  if (articles.length)   match.article       = { $in: articles };
  if (types.length)      match.stockType     = { $in: types };
  if (genders.length)    match.gender        = { $in: genders };
  if (colors.length)     match.color         = { $in: colors };
  if (sizes.length)      match.size          = { $in: sizes };
  if (seriesArr.length)  match.series        = { $in: seriesArr };
  if (mrpArr.length)     match.mrp           = { $in: mrpArr };
  if (rateArr.length)    match.rate          = { $in: rateArr };
  if (ppcArr.length)     match.pairPerCarton = { $in: ppcArr };

  // Carton range filters operate on the denormalized Product.cartons field.
  // The exact per-page values are recalculated from SalaryEntry after pagination.
  if (minCartons !== undefined && minCartons !== '') {
    match.cartons = { ...(match.cartons || {}), $gte: Number(minCartons) };
  }
  if (maxCartons !== undefined && maxCartons !== '') {
    match.cartons = { ...(match.cartons || {}), $lte: Number(maxCartons) };
  }

  return match;
}

// ---------------------------------------------------------------------------
// GET /api/products/optimized
// Server-side pagination + filtering + hierarchical sorting.
// Sort order:
//   1. Category  – EVA LADIES → EVA GENTS → EVA KIDS LADIES → EVA KIDS GENTS
//                  → PU LADIES → PU GENTS → PU KIDS LADIES → PU KIDS GENTS
//   2. Article   – numeric articles first (3000, 3001…) then alphabetic (A…, B…)
//   3. Cartons   – highest stock first within the same article
// ---------------------------------------------------------------------------
exports.getOptimizedProducts = async (req, res) => {
  try {
    const page     = Math.max(parseInt(req.query.page,  10) || 1, 1);
    const isExport = req.query.export === 'true';
    const limit    = isExport
      ? Math.min(parseInt(req.query.limit, 10) || 9999, 50000)
      : Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const skip  = (page - 1) * limit;

    const matchQuery = buildMatchQuery(req.query);

    // Single aggregation with $facet to get count + paginated data in one round-trip.
    const pipeline = [
      { $match: matchQuery },
      {
        $addFields: {
          // Category priority: EVA LADIES=1 … PU KIDS_GENTS=8
          _sp: SORT_PRIORITY_EXPR,
          // Strip any leading special characters (parentheses, spaces, etc.) before
          // deciding the sort prefix, so "(B) CHINA-1" sorts as "B…" not before "A…".
          // Numeric articles get prefix "0_" (3000, 3001 …) then letter articles "1_".
          _ak: {
            $let: {
              vars: {
                // $ltrim removes leading chars from the given set, stopping at the first
                // character NOT in that set — so "(B) CHINA-1" becomes "B) CHINA-1".
                trimmed: {
                  $ltrim: { input: '$article', chars: '()[]{} -./\\' }
                }
              },
              in: {
                $cond: [
                  { $regexMatch: { input: '$$trimmed', regex: /^[0-9]/ } },
                  { $concat: ['0_', '$$trimmed'] },
                  { $concat: ['1_', '$$trimmed'] }
                ]
              }
            }
          }
        }
      },
      // 1st: category  (EVA LADIES → EVA GENTS → EVA KIDS LADIES → EVA KIDS GENTS
      //                 → PU LADIES → PU GENTS → PU KIDS LADIES → PU KIDS GENTS)
      // 2nd: article   (numeric articles first: 3000, 3001 … then A…, B…)
      // 3rd: cartons   (highest stock first within the same article)
      { $sort: { _sp: 1, _ak: 1, cartons: -1 } },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $skip: skip },
            { $limit: limit },
            // Strip internal sort fields and heavy embedded history array from response.
            { $project: { _sp: 0, _ak: 0, history: 0 } }
          ]
        }
      }
    ];

    const [result] = await Product.aggregate(pipeline).allowDiskUse(true);

    const products   = result.data     || [];
    const total      = result.metadata[0]?.total || 0;
    const productIds = products.map(p => p._id);

    // Recalculate accurate cartons for this small page of 50 docs only.
    // Uses the same formula as the rest of the app: SalaryEntry - CHALLAN_OUT.
    const [salaryTotals, challanTotals] = await Promise.all([
      SalaryEntry.aggregate([
        { $match: { product: { $in: productIds } } },
        { $group: { _id: '$product', total: { $sum: '$cartons' } } }
      ]),
      History.aggregate([
        { $match: { product: { $in: productIds }, action: 'CHALLAN_OUT' } },
        { $group: { _id: '$product', totalOut: { $sum: { $abs: '$quantityChanged' } } } }
      ])
    ]);

    const salaryMap  = new Map(salaryTotals.map(s => [s._id.toString(), s.total]));
    const challanMap = new Map(challanTotals.map(c => [c._id.toString(), c.totalOut]));

    const finalProducts = products.map(product => {
      const idStr      = product._id.toString();
      const salary     = salaryMap.get(idStr)  || 0;
      const challan    = challanMap.get(idStr) || 0;
      const available  = salary - challan;
      return {
        ...product,
        cartons: available,
        warning: available < 0
      };
    });

    const totalPages = Math.ceil(total / limit);

    res.json({
      success:     true,
      products:    finalProducts,
      total,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages
    });
  } catch (err) {
    console.error('getOptimizedProducts error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/products/filter-options
// Returns available dropdown values for each filter dimension.
// Each dimension is computed against all OTHER active filters so that
// selecting one filter immediately narrows the options in the others.
// ---------------------------------------------------------------------------
exports.getFilterOptions = async (req, res) => {
  try {
    const {
      article, stockType, gender, color, size, series, mrp, rate, pairPerCarton
    } = req.query;

    const base = { isDeleted: false };

    // Build a partial match that excludes one field at a time.
    // This lets us return all valid options for that field given the other selections.
    const matchWithout = (excludeField) => {
      const m = { ...base };

      const a = splitParam(article);
      if (a.length && excludeField !== 'article') m.article = { $in: a };

      const st = splitParam(stockType, s => s.toLowerCase());
      if (st.length && excludeField !== 'stockType') m.stockType = { $in: st };

      const g = splitParam(gender, s => s.toLowerCase());
      if (g.length && excludeField !== 'gender') m.gender = { $in: g };

      const c = splitParam(color);
      if (c.length && excludeField !== 'color') m.color = { $in: c };

      const s2 = splitParam(size);
      if (s2.length && excludeField !== 'size') m.size = { $in: s2 };

      const sr = splitParam(series);
      if (sr.length && excludeField !== 'series') m.series = { $in: sr };

      const m2 = splitParam(mrp, Number).filter(n => !isNaN(n));
      if (m2.length && excludeField !== 'mrp') m.mrp = { $in: m2 };

      const r = splitParam(rate, Number).filter(n => !isNaN(n));
      if (r.length && excludeField !== 'rate') m.rate = { $in: r };

      const p = splitParam(pairPerCarton, Number).filter(n => !isNaN(n));
      if (p.length && excludeField !== 'pairPerCarton') m.pairPerCarton = { $in: p };

      return m;
    };

    // All 9 distinct queries run in parallel – one DB round-trip each.
    const [
      articles, stockTypes, genders, colors,
      sizes, seriesList, mrpList, rateList, ppcList
    ] = await Promise.all([
      Product.distinct('article',       matchWithout('article')),
      Product.distinct('stockType',     matchWithout('stockType')),
      Product.distinct('gender',        matchWithout('gender')),
      Product.distinct('color',         matchWithout('color')),
      Product.distinct('size',          matchWithout('size')),
      Product.distinct('series',        matchWithout('series')),
      Product.distinct('mrp',           matchWithout('mrp')),
      Product.distinct('rate',          matchWithout('rate')),
      Product.distinct('pairPerCarton', matchWithout('pairPerCarton')),
    ]);

    res.json({
      success: true,
      options: {
        articles:      articles.filter(Boolean).sort(),
        stockTypes:    stockTypes.filter(Boolean).sort(),
        genders:       genders.filter(Boolean).sort(),
        colors:        colors.filter(Boolean).sort(),
        sizes:         sizes.filter(Boolean).sort(),
        series:        seriesList.filter(Boolean).sort(),
        mrp:           mrpList.filter(n => n != null).sort((a, b) => a - b),
        rate:          rateList.filter(n => n != null).sort((a, b) => a - b),
        pairPerCarton: ppcList.filter(n => n != null).sort((a, b) => a - b),
      }
    });
  } catch (err) {
    console.error('getFilterOptions error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
