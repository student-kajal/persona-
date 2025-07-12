const SalaryEntry = require('../models/SalaryEntry');

exports.getSalaryReport = async (req, res) => {
  try {
    const { from, to, worker } = req.query;

    const query = {
      createdAt: {
        $gte: new Date(from),
        $lte: new Date(to + 'T23:59:59.999Z')
      }
    };

    if (worker && worker !== 'all') {
      query.createdBy = worker.toUpperCase();
    }

    const records = await SalaryEntry.find(query)
      .select('createdBy article cartons pairPerCarton totalPairs createdAt');

    const workerContributions = {};

    records.forEach(record => {
      const w = record.createdBy;
      const art = record.article;
      const dateStr = record.createdAt.toISOString().split('T')[0];

      if (!workerContributions[w]) {
        workerContributions[w] = { worker: w, articles: [] };
      }

      workerContributions[w].articles.push({
        article: art,
        cartons: record.cartons,
        pairs: record.totalPairs,
        date: dateStr // ✅ Needed by frontend
      });
    });

    const report = Object.values(workerContributions);

    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
