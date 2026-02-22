const masterRtRwModel = require('../models/masterRtRw.model');
const { HttpError } = require('../utils/http-error');

function toNullableInt(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function validatePayload(payload, isUpdate = false) {
  const rt = payload.rt?.toString().trim();
  const rw = payload.rw?.toString().trim();

  if (!isUpdate || payload.rt !== undefined) {
    if (!rt) throw new HttpError(400, 'rt is required');
  }

  if (!isUpdate || payload.rw !== undefined) {
    if (!rw) throw new HttpError(400, 'rw is required');
  }

  const jumlahKk = toNullableInt(payload.jumlah_kk);
  if (payload.jumlah_kk !== undefined && payload.jumlah_kk !== '' && jumlahKk === null) {
    throw new HttpError(400, 'jumlah_kk must be numeric');
  }

  return {
    rt,
    rw,
    namaKetuaRt: payload.nama_ketua_rt,
    jumlahKk,
    keterangan: payload.keterangan,
    isActive: payload.is_active === undefined ? 1 : Number(payload.is_active) === 1 ? 1 : 0
  };
}

async function list(req, res, next) {
  try {
    const rows = await masterRtRwModel.listAll();
    return res.json({ data: rows });
  } catch (error) {
    return next(error);
  }
}

async function detail(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new HttpError(400, 'invalid id');
    }
    const item = await masterRtRwModel.findById(id);

    if (!item) {
      throw new HttpError(404, 'RT/RW data not found');
    }

    return res.json({ data: item });
  } catch (error) {
    return next(error);
  }
}

async function create(req, res, next) {
  try {
    const payload = validatePayload(req.body);
    const item = await masterRtRwModel.create(payload);

    return res.status(201).json({
      message: 'RT/RW created',
      data: item
    });
  } catch (error) {
    return next(error);
  }
}

async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new HttpError(400, 'invalid id');
    }
    const existing = await masterRtRwModel.findById(id);

    if (!existing) {
      throw new HttpError(404, 'RT/RW data not found');
    }

    const payload = validatePayload(req.body, true);
    const merged = {
      rt: payload.rt || existing.rt,
      rw: payload.rw || existing.rw,
      namaKetuaRt: payload.namaKetuaRt ?? existing.nama_ketua_rt,
      jumlahKk: payload.jumlahKk ?? existing.jumlah_kk,
      keterangan: payload.keterangan ?? existing.keterangan,
      isActive: payload.isActive
    };

    const item = await masterRtRwModel.update(id, merged);

    return res.json({
      message: 'RT/RW updated',
      data: item
    });
  } catch (error) {
    return next(error);
  }
}

async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new HttpError(400, 'invalid id');
    }
    const existing = await masterRtRwModel.findById(id);

    if (!existing) {
      throw new HttpError(404, 'RT/RW data not found');
    }

    const item = await masterRtRwModel.softDelete(id);

    return res.json({
      message: 'RT/RW deactivated',
      data: item
    });
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
