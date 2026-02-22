const mustahikModel = require('../models/mustahik.model');
const masterRtRwModel = require('../models/masterRtRw.model');
const pengaturanModel = require('../models/pengaturan.model');
const { HttpError } = require('../utils/http-error');

const ALLOWED_KATEGORI = new Set([
  'Fakir',
  'Miskin',
  'Amil',
  'Mualaf',
  'Riqab',
  'Gharimin',
  'Fisabilillah',
  'Ibnu Sabil'
]);

function parsePositiveInt(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, `${fieldName} must be a positive integer`);
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

function parseOptionalPositiveInt(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return parsePositiveInt(value, fieldName);
}

async function validateRtRw(rtRwId) {
  if (!rtRwId) {
    return;
  }

  const data = await masterRtRwModel.findById(rtRwId);
  if (!data || Number(data.is_active) !== 1) {
    throw new HttpError(400, 'rt_rw_id must reference an active RT/RW');
  }
}

async function buildPayload(body, userId) {
  const nama = parseOptionalString(body.nama);
  if (!nama) {
    throw new HttpError(400, 'nama is required');
  }

  const kategori = parseOptionalString(body.kategori);
  if (!kategori || !ALLOWED_KATEGORI.has(kategori)) {
    throw new HttpError(400, 'kategori must be one of the 8 golongan mustahik');
  }

  const rtRwId = parseOptionalPositiveInt(body.rt_rw_id, 'rt_rw_id');
  await validateRtRw(rtRwId);

  const jumlahJiwa = parsePositiveInt(body.jumlah_jiwa, 'jumlah_jiwa');

  const config = await pengaturanModel.getCurrent();
  if (!config) {
    throw new HttpError(400, 'pengaturan belum tersedia');
  }

  const hakBerasKg = Number((jumlahJiwa * Number(config.zakat_per_jiwa_kg)).toFixed(2));
  const hakUang = Number((jumlahJiwa * Number(config.zakat_per_jiwa_uang)).toFixed(2));

  return {
    nama,
    kategori,
    rtRwId,
    alamatDetail: parseOptionalString(body.alamat_detail),
    noHp: parseOptionalString(body.no_hp),
    jumlahJiwa,
    hakBerasKg,
    hakUang,
    createdBy: userId
  };
}

async function list(req, res, next) {
  try {
    const filters = {
      search: parseOptionalString(req.query.search),
      rtRwId: req.query.rt_rw_id ? parsePositiveInt(req.query.rt_rw_id, 'rt_rw_id') : null,
      kategori: parseOptionalString(req.query.kategori)
    };

    if (filters.kategori && !ALLOWED_KATEGORI.has(filters.kategori)) {
      throw new HttpError(400, 'kategori filter is invalid');
    }

    const data = await mustahikModel.list(filters);

    return res.json({ data });
  } catch (error) {
    return next(error);
  }
}

async function detail(req, res, next) {
  try {
    const id = parsePositiveInt(req.params.id, 'id');
    const data = await mustahikModel.findById(id);

    if (!data) {
      throw new HttpError(404, 'Mustahik not found');
    }

    return res.json({ data });
  } catch (error) {
    return next(error);
  }
}

async function create(req, res, next) {
  try {
    const payload = await buildPayload(req.body, req.user?.sub || null);
    const data = await mustahikModel.create(payload);

    return res.status(201).json({
      message: 'Mustahik created',
      data
    });
  } catch (error) {
    return next(error);
  }
}

async function update(req, res, next) {
  try {
    const id = parsePositiveInt(req.params.id, 'id');
    const existing = await mustahikModel.findById(id);

    if (!existing) {
      throw new HttpError(404, 'Mustahik not found');
    }

    const payload = await buildPayload(req.body, existing.created_by);
    const data = await mustahikModel.update(id, payload);

    return res.json({
      message: 'Mustahik updated',
      data
    });
  } catch (error) {
    return next(error);
  }
}

async function remove(req, res, next) {
  try {
    const id = parsePositiveInt(req.params.id, 'id');
    const existing = await mustahikModel.findById(id);

    if (!existing) {
      throw new HttpError(404, 'Mustahik not found');
    }

    await mustahikModel.remove(id);
    return res.json({ message: 'Mustahik deleted' });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  list,
  detail,
  create,
  update,
  remove,
  ALLOWED_KATEGORI: Array.from(ALLOWED_KATEGORI)
};
