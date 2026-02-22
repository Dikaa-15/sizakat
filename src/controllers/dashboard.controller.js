const reportingModel = require('../models/reporting.model');

async function summary(req, res, next) {
  try {
    const [penerimaan, distribusi, kategoriMustahik, sisa] = await Promise.all([
      reportingModel.getPenerimaanSummary(),
      reportingModel.getDistribusiSummary(),
      reportingModel.getMustahikKategoriCounts(),
      reportingModel.getSisaZakat()
    ]);

    const response = {
      penerimaan,
      distribusi,
      sisa,
      kategori_mustahik: kategoriMustahik
    };

    return res.json({ data: response });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  summary
};
