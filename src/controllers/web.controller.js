const masterRtRwModel = require('../models/masterRtRw.model');
const muzakkiModel = require('../models/muzakki.model');
const mustahikModel = require('../models/mustahik.model');
const distribusiModel = require('../models/distribusi.model');
const reportingModel = require('../models/reporting.model');
const { ALLOWED_KATEGORI } = require('./mustahik.controller');

function normalizeQuery(query) {
  return {
    search: query.search ? String(query.search).trim() : '',
    rt_rw_id: query.rt_rw_id ? String(query.rt_rw_id).trim() : '',
    jenis_zakat: query.jenis_zakat ? String(query.jenis_zakat).trim() : '',
    date_from: query.date_from ? String(query.date_from).trim() : '',
    date_to: query.date_to ? String(query.date_to).trim() : ''
  };
}

function normalizeMustahikQuery(query) {
  return {
    search: query.search ? String(query.search).trim() : '',
    rt_rw_id: query.rt_rw_id ? String(query.rt_rw_id).trim() : '',
    kategori: query.kategori ? String(query.kategori).trim() : ''
  };
}

function normalizeMasterQuery(query) {
  return {
    search: query.search ? String(query.search).trim() : '',
    status: query.status ? String(query.status).trim() : ''
  };
}

function normalizeDistribusiQuery(query) {
  return {
    search: query.search ? String(query.search).trim() : '',
    status: query.status ? String(query.status).trim() : ''
  };
}

async function loginPage(_req, res) {
  return res.render('auth/login', {
    title: 'Login SiZakat'
  });
}

async function dashboardPage(req, res, next) {
  try {
    const [penerimaan, distribusi, sisa, kategoriMustahik] = await Promise.all([
      reportingModel.getPenerimaanSummary(),
      reportingModel.getDistribusiSummary(),
      reportingModel.getSisaZakat(),
      reportingModel.getMustahikKategoriCounts()
    ]);

    return res.render('dashboard/index', {
      title: 'Dashboard',
      user: req.user,
      activePage: 'dashboard',
      summary: { penerimaan, distribusi, sisa },
      kategoriMustahik
    });
  } catch (error) {
    return next(error);
  }
}

async function masterRtRwPage(req, res, next) {
  try {
    const query = normalizeMasterQuery(req.query);
    const list = await masterRtRwModel.listAll();

    const filtered = list.filter((item) => {
      const bySearch =
        !query.search ||
        `${item.rt}/${item.rw}`.includes(query.search) ||
        String(item.nama_ketua_rt || '').toLowerCase().includes(query.search.toLowerCase());

      const byStatus =
        !query.status ||
        (query.status === 'aktif' && Number(item.is_active) === 1) ||
        (query.status === 'nonaktif' && Number(item.is_active) === 0);

      return bySearch && byStatus;
    });

    return res.render('master-rt-rw/index', {
      title: 'Master Data RT/RW',
      user: req.user,
      activePage: 'master-rt-rw',
      filters: query,
      rtRwList: filtered
    });
  } catch (error) {
    return next(error);
  }
}

async function muzakkiPage(req, res, next) {
  try {
    const query = normalizeQuery(req.query);

    const [rtRwList, muzakkiList] = await Promise.all([
      masterRtRwModel.listAll(),
      muzakkiModel.list({
        search: query.search || null,
        rtRwId: query.rt_rw_id ? Number(query.rt_rw_id) : null,
        jenisZakat: query.jenis_zakat || null,
        dateFrom: query.date_from || null,
        dateTo: query.date_to || null
      })
    ]);

    return res.render('muzakki/index', {
      title: 'Data Muzakki',
      user: req.user,
      activePage: 'muzakki',
      filters: query,
      rtRwList: rtRwList.filter((item) => Number(item.is_active) === 1),
      muzakkiList
    });
  } catch (error) {
    return next(error);
  }
}

async function mustahikPage(req, res, next) {
  try {
    const query = normalizeMustahikQuery(req.query);

    const [rtRwList, mustahikList] = await Promise.all([
      masterRtRwModel.listAll(),
      mustahikModel.list({
        search: query.search || null,
        rtRwId: query.rt_rw_id ? Number(query.rt_rw_id) : null,
        kategori: query.kategori || null
      })
    ]);

    return res.render('mustahik/index', {
      title: 'Data Mustahik',
      user: req.user,
      activePage: 'mustahik',
      filters: query,
      kategoriList: ALLOWED_KATEGORI,
      rtRwList: rtRwList.filter((item) => Number(item.is_active) === 1),
      mustahikList
    });
  } catch (error) {
    return next(error);
  }
}

async function distribusiPage(req, res, next) {
  try {
    const query = normalizeDistribusiQuery(req.query);

    const [mustahikList, distribusiList, stock] = await Promise.all([
      distribusiModel.listMustahikDistributionStatus(),
      distribusiModel.list({
        search: query.search || null,
        status: query.status || null,
        jenisDistribusi: null
      }),
      distribusiModel.getStockSummary()
    ]);

    return res.render('distribusi/index', {
      title: 'Distribusi Zakat',
      user: req.user,
      activePage: 'distribusi',
      filters: query,
      mustahikList,
      distribusiList,
      stock
    });
  } catch (error) {
    return next(error);
  }
}

async function laporanPage(req, res, next) {
  try {
    const [penerimaanSummary, distribusiSummary, sisa, distribusiPerKategori, penerimaanPerRtRw, distribusiPerRtRw] =
      await Promise.all([
        reportingModel.getPenerimaanSummary(),
        reportingModel.getDistribusiSummary(),
        reportingModel.getSisaZakat(),
        reportingModel.getDistribusiPerKategori(),
        reportingModel.getPenerimaanPerRtRw(),
        reportingModel.getDistribusiPerRtRw()
      ]);

    return res.render('laporan/index', {
      title: 'Laporan',
      user: req.user,
      activePage: 'laporan',
      penerimaanSummary,
      distribusiSummary,
      sisa,
      distribusiPerKategori,
      penerimaanPerRtRw,
      distribusiPerRtRw
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  loginPage,
  dashboardPage,
  masterRtRwPage,
  muzakkiPage,
  mustahikPage,
  distribusiPage,
  laporanPage
};
