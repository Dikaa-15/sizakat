const reportingModel = require('../models/reporting.model');
const { HttpError } = require('../utils/http-error');

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('id-ID');
}

function formatWeight(value) {
  return Number(value || 0).toFixed(2);
}

function normalizeDateFilter(value, fieldName) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpError(400, `${fieldName} tidak valid`);
  }

  return String(value).slice(0, 10);
}

function getDateFilters(query) {
  const dateFrom = normalizeDateFilter(query.date_from, 'date_from');
  const dateTo = normalizeDateFilter(query.date_to, 'date_to');

  if (dateFrom && dateTo && dateFrom > dateTo) {
    throw new HttpError(400, 'date_from tidak boleh lebih besar dari date_to');
  }

  return { dateFrom, dateTo };
}

function buildLaporanHtml({ penerimaanSummary, distribusiSummary, sisa, perKategori, penerimaanRtRw, distribusiRtRw, includePrintScript }) {
  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Laporan SiZakat</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
    h1, h2 { margin: 0 0 8px; }
    h2 { margin-top: 24px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; text-align: left; }
    th { background: #f3f4f6; }
    .row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .card { border: 1px solid #d1d5db; padding: 10px; border-radius: 6px; }
  </style>
</head>
<body>
  <h1>Laporan SiZakat</h1>
  <p>Tanggal cetak: ${new Date().toISOString().slice(0, 10)}</p>

  <div class="row">
    <div class="card">
      <strong>Penerimaan</strong>
      <div>Total Muzakki: ${penerimaanSummary.total_muzakki}</div>
      <div>Total Zakat Beras: ${formatWeight(penerimaanSummary.total_beras_kg)} kg</div>
      <div>Total Zakat Uang: Rp ${formatCurrency(penerimaanSummary.total_uang)}</div>
      <div>Total Sedekah Beras: ${formatWeight(penerimaanSummary.total_sedekah_beras_kg)} kg</div>
      <div>Total Sedekah Uang: Rp ${formatCurrency(penerimaanSummary.total_sedekah_uang)}</div>
    </div>
    <div class="card">
      <strong>Distribusi</strong>
      <div>Total Transaksi: ${distribusiSummary.total_transaksi}</div>
      <div>Total Beras: ${formatWeight(distribusiSummary.total_beras_kg)} kg</div>
      <div>Total Uang: Rp ${formatCurrency(distribusiSummary.total_uang)}</div>
    </div>
  </div>

  <h2>Sisa Zakat</h2>
  <p>Beras: ${formatWeight(sisa.sisa_beras_kg)} kg | Uang: Rp ${formatCurrency(sisa.sisa_uang)}</p>

  <h2>Distribusi per Kategori Mustahik</h2>
  <table>
    <thead><tr><th>Kategori</th><th>Total</th><th>Beras (kg)</th><th>Uang (Rp)</th></tr></thead>
    <tbody>
      ${perKategori
        .map(
          (row) =>
            `<tr><td>${row.kategori}</td><td>${row.total_transaksi}</td><td>${formatWeight(
              row.total_beras_kg
            )}</td><td>${formatCurrency(row.total_uang)}</td></tr>`
        )
        .join('')}
    </tbody>
  </table>

  <h2>Penerimaan per RT/RW</h2>
  <table>
    <thead><tr><th>RT/RW</th><th>Muzakki</th><th>Zakat Beras (kg)</th><th>Zakat Uang (Rp)</th><th>Sedekah Beras (kg)</th><th>Sedekah Uang (Rp)</th></tr></thead>
    <tbody>
      ${penerimaanRtRw
        .map(
          (row) =>
            `<tr><td>RT ${row.rt} / RW ${row.rw}</td><td>${row.total_muzakki}</td><td>${formatWeight(
              row.total_beras_kg
            )}</td><td>${formatCurrency(row.total_uang)}</td><td>${formatWeight(
              row.total_sedekah_beras_kg
            )}</td><td>${formatCurrency(row.total_sedekah_uang)}</td></tr>`
        )
        .join('')}
    </tbody>
  </table>

  <h2>Distribusi per RT/RW</h2>
  <table>
    <thead><tr><th>RT/RW</th><th>Distribusi</th><th>Beras (kg)</th><th>Uang (Rp)</th></tr></thead>
    <tbody>
      ${distribusiRtRw
        .map(
          (row) =>
            `<tr><td>RT ${row.rt} / RW ${row.rw}</td><td>${row.total_distribusi}</td><td>${formatWeight(
              row.total_beras_kg
            )}</td><td>${formatCurrency(row.total_uang)}</td></tr>`
        )
        .join('')}
    </tbody>
  </table>

  ${includePrintScript ? '<script>window.print();</script>' : ''}
</body>
</html>`;
}

async function getLaporanData(filters) {
  const [penerimaanSummary, distribusiSummary, sisa, perKategori, penerimaanRtRw, distribusiRtRw] = await Promise.all([
    reportingModel.getPenerimaanSummary(filters),
    reportingModel.getDistribusiSummary(filters),
    reportingModel.getSisaZakat(filters),
    reportingModel.getDistribusiPerKategori(filters),
    reportingModel.getPenerimaanPerRtRw(filters),
    reportingModel.getDistribusiPerRtRw(filters)
  ]);

  return {
    penerimaanSummary,
    distribusiSummary,
    sisa,
    perKategori,
    penerimaanRtRw,
    distribusiRtRw
  };
}

async function penerimaan(req, res, next) {
  try {
    const filters = getDateFilters(req.query);
    const [summary, perRtRw] = await Promise.all([
      reportingModel.getPenerimaanSummary(filters),
      reportingModel.getPenerimaanPerRtRw(filters)
    ]);

    return res.json({ data: { summary, per_rt_rw: perRtRw, filters } });
  } catch (error) {
    return next(error);
  }
}

async function distribusi(req, res, next) {
  try {
    const filters = getDateFilters(req.query);
    const [summary, perKategori, perRtRw] = await Promise.all([
      reportingModel.getDistribusiSummary(filters),
      reportingModel.getDistribusiPerKategori(filters),
      reportingModel.getDistribusiPerRtRw(filters)
    ]);

    return res.json({ data: { summary, per_kategori: perKategori, per_rt_rw: perRtRw, filters } });
  } catch (error) {
    return next(error);
  }
}

async function cetak(req, res, next) {
  try {
    const filters = getDateFilters(req.query);
    const data = await getLaporanData(filters);

    const html = buildLaporanHtml({
      ...data,
      includePrintScript: true
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (error) {
    return next(error);
  }
}

async function exportExcel(req, res, next) {
  try {
    const filters = getDateFilters(req.query);
    const data = await getLaporanData(filters);

    const html = buildLaporanHtml({
      ...data,
      includePrintScript: false
    });

    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="laporan-sizakat-${new Date().toISOString().slice(0, 10)}.xls"`);
    return res.send(html);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  penerimaan,
  distribusi,
  cetak,
  exportExcel
};
