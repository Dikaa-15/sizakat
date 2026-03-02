const muzakkiModel = require('../models/muzakki.model');
const masterRtRwModel = require('../models/masterRtRw.model');
const pengaturanModel = require('../models/pengaturan.model');
const { HttpError } = require('../utils/http-error');

const ALLOWED_JENIS_ZAKAT = new Set(['beras', 'uang']);

function parsePositiveInt(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, `${fieldName} harus berupa bilangan bulat positif`);
  }

  return parsed;
}

function parseOptionalString(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
}

function parseOptionalDecimal(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new HttpError(400, `${fieldName} harus berupa angka dan >= 0`);
  }

  return parsed;
}

function normalizeDate(value) {
  if (!value) {
    throw new HttpError(400, 'tanggal_bayar wajib diisi');
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new HttpError(400, 'tanggal_bayar tidak valid');
  }

  return String(value).slice(0, 10);
}

function calculatePayment({ jumlahJiwa, jenisZakat, config, requestedBeras, requestedUang }) {
  const autoBeras = Number((jumlahJiwa * Number(config.zakat_per_jiwa_kg)).toFixed(2));
  const autoUang = Number((jumlahJiwa * Number(config.zakat_per_jiwa_uang)).toFixed(2));

  if (jenisZakat === 'beras') {
    const dibayarBeras = requestedBeras !== null ? requestedBeras : autoBeras;
    if (dibayarBeras < autoBeras) {
      throw new HttpError(400, 'total bayar beras tidak boleh kurang dari kewajiban zakat');
    }

    return {
      jumlahBerasKg: autoBeras,
      jumlahUang: null,
      sedekahBerasKg: Number((dibayarBeras - autoBeras).toFixed(2)),
      sedekahUang: 0
    };
  }

  const dibayarUang = requestedUang !== null ? requestedUang : autoUang;
  if (dibayarUang < autoUang) {
    throw new HttpError(400, 'total bayar uang tidak boleh kurang dari kewajiban zakat');
  }

  return {
    jumlahBerasKg: null,
    jumlahUang: autoUang,
    sedekahBerasKg: 0,
    sedekahUang: Number((dibayarUang - autoUang).toFixed(2))
  };
}

async function validateRtRw(rtRwId) {
  const data = await masterRtRwModel.findById(rtRwId);

  if (!data || Number(data.is_active) !== 1) {
    throw new HttpError(400, 'rt_rw_id harus mengacu ke RT/RW aktif');
  }
}

async function buildPayload(body, userId) {
  const nama = parseOptionalString(body.nama);
  if (!nama) {
    throw new HttpError(400, 'nama wajib diisi');
  }

  const rtRwId = parsePositiveInt(body.rt_rw_id, 'rt_rw_id');
  const jumlahJiwa = parsePositiveInt(body.jumlah_jiwa, 'jumlah_jiwa');

  const jenisZakat = parseOptionalString(body.jenis_zakat);
  if (!jenisZakat || !ALLOWED_JENIS_ZAKAT.has(jenisZakat)) {
    throw new HttpError(400, 'jenis_zakat harus beras atau uang');
  }

  await validateRtRw(rtRwId);

  const config = await pengaturanModel.getCurrent();
  if (!config) {
    throw new HttpError(400, 'pengaturan belum tersedia');
  }

  const requestedBeras = parseOptionalDecimal(body.jumlah_beras_kg, 'jumlah_beras_kg');
  const requestedUang = parseOptionalDecimal(body.jumlah_uang, 'jumlah_uang');

  const calculated = calculatePayment({
    jumlahJiwa,
    jenisZakat,
    config,
    requestedBeras,
    requestedUang
  });

  return {
    nama,
    rtRwId,
    alamatDetail: parseOptionalString(body.alamat_detail),
    noHp: parseOptionalString(body.no_hp),
    jumlahJiwa,
    jenisZakat,
    jumlahBerasKg: calculated.jumlahBerasKg,
    jumlahUang: calculated.jumlahUang,
    sedekahBerasKg: calculated.sedekahBerasKg,
    sedekahUang: calculated.sedekahUang,
    tanggalBayar: normalizeDate(body.tanggal_bayar),
    keterangan: parseOptionalString(body.keterangan),
    createdBy: userId
  };
}

async function list(req, res, next) {
  try {
    const filters = {
      search: parseOptionalString(req.query.search),
      rtRwId: req.query.rt_rw_id ? parsePositiveInt(req.query.rt_rw_id, 'rt_rw_id') : null,
      jenisZakat: parseOptionalString(req.query.jenis_zakat),
      dateFrom: parseOptionalString(req.query.date_from),
      dateTo: parseOptionalString(req.query.date_to)
    };

    if (filters.jenisZakat && !ALLOWED_JENIS_ZAKAT.has(filters.jenisZakat)) {
      throw new HttpError(400, 'filter jenis_zakat harus beras atau uang');
    }

    const rows = await muzakkiModel.list(filters);

    return res.json({ data: rows });
  } catch (error) {
    return next(error);
  }
}

async function detail(req, res, next) {
  try {
    const id = parsePositiveInt(req.params.id, 'id');
    const data = await muzakkiModel.findById(id);

    if (!data) {
      throw new HttpError(404, 'Data muzakki tidak ditemukan');
    }

    return res.json({ data });
  } catch (error) {
    return next(error);
  }
}

async function create(req, res, next) {
  try {
    const payload = await buildPayload(req.body, req.user?.sub || null);
    const data = await muzakkiModel.create(payload);

    return res.status(201).json({
      message: 'Data muzakki berhasil ditambahkan',
      data
    });
  } catch (error) {
    return next(error);
  }
}

async function update(req, res, next) {
  try {
    const id = parsePositiveInt(req.params.id, 'id');
    const existing = await muzakkiModel.findById(id);

    if (!existing) {
      throw new HttpError(404, 'Data muzakki tidak ditemukan');
    }

    const payload = await buildPayload(req.body, existing.created_by);
    const data = await muzakkiModel.update(id, payload);

    return res.json({
      message: 'Data muzakki berhasil diperbarui',
      data
    });
  } catch (error) {
    return next(error);
  }
}

async function remove(req, res, next) {
  try {
    const id = parsePositiveInt(req.params.id, 'id');
    const existing = await muzakkiModel.findById(id);

    if (!existing) {
      throw new HttpError(404, 'Data muzakki tidak ditemukan');
    }

    await muzakkiModel.remove(id);

    return res.json({ message: 'Data muzakki berhasil dihapus' });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  list,
  detail,
  create,
  update,
  remove
};
