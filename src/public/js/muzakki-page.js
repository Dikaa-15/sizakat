(function initMuzakkiPage() {
  const modal = document.getElementById('modal');
  const form = document.getElementById('muzakkiForm');
  const formError = document.getElementById('formError');
  const modalTitle = document.getElementById('modalTitle');
  const idInput = document.getElementById('muzakkiId');

  const openCreateBtn = document.getElementById('openCreateModal');
  const closeBtn = document.getElementById('closeModal');
  const logoutBtn = document.getElementById('logoutBtn');

  const fields = {
    nama: document.getElementById('nama'),
    rt_rw_id: document.getElementById('rt_rw_id'),
    jumlah_jiwa: document.getElementById('jumlah_jiwa'),
    jenis_zakat: document.getElementById('jenis_zakat'),
    tanggal_bayar: document.getElementById('tanggal_bayar'),
    jumlah_beras_kg: document.getElementById('jumlah_beras_kg'),
    jumlah_uang: document.getElementById('jumlah_uang'),
    alamat_detail: document.getElementById('alamat_detail'),
    no_hp: document.getElementById('no_hp'),
    keterangan: document.getElementById('keterangan')
  };
  const wrappers = {
    beras: document.getElementById('pembayaran_beras_wrapper'),
    uang: document.getElementById('pembayaran_uang_wrapper')
  };
  const infoPerhitungan = document.getElementById('info_perhitungan');

  const zakatPerJiwaKg = Number(window.SIZAKAT?.zakatPerJiwaKg || 3.5);
  const zakatPerJiwaUang = Number(window.SIZAKAT?.zakatPerJiwaUang || 50000);

  function extractDigits(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function extractWeightNumber(value) {
    const normalized = String(value || '')
      .replace(/kg/gi, '')
      .replace(',', '.')
      .replace(/[^0-9.]/g, '');
    if (!normalized) {
      return '';
    }

    const parsed = Number(normalized);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return '';
    }

    return String(parsed);
  }

  function formatRupiah(value) {
    const digits = extractDigits(value);
    if (!digits) {
      return '';
    }

    return `Rp${Number(digits).toLocaleString('id-ID')}`;
  }

  function formatKg(value) {
    const numeric = extractWeightNumber(value);
    if (!numeric) {
      return '';
    }

    const parsed = Number(numeric);
    const formatted = Number.isInteger(parsed)
      ? String(parsed)
      : parsed.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

    return `${formatted}kg`;
  }

  function openModal() {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  function closeModal() {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    formError.classList.add('hidden');
    formError.textContent = '';
  }

  function resetForm() {
    form.reset();
    idInput.value = '';
    modalTitle.textContent = 'Tambah Muzakki';
    fields.tanggal_bayar.value = new Date().toISOString().slice(0, 10);
    fields.jumlah_uang.value = '';
    updateJenisZakatUI();
    updateInfoPerhitungan();
  }

  function fillForm(item) {
    idInput.value = item.id;
    modalTitle.textContent = 'Edit Muzakki';

    fields.nama.value = item.nama || '';
    fields.rt_rw_id.value = item.rt_rw_id || '';
    fields.jumlah_jiwa.value = item.jumlah_jiwa || '';
    fields.jenis_zakat.value = item.jenis_zakat || 'beras';
    fields.tanggal_bayar.value = String(item.tanggal_bayar || '').slice(0, 10);
    const totalBeras = Number(item.jumlah_beras_kg || 0) + Number(item.sedekah_beras_kg || 0);
    const totalUang = Number(item.jumlah_uang || 0) + Number(item.sedekah_uang || 0);
    fields.jumlah_beras_kg.value = totalBeras ? formatKg(totalBeras) : '';
    fields.jumlah_uang.value = totalUang ? formatRupiah(totalUang) : '';
    fields.alamat_detail.value = item.alamat_detail || '';
    fields.no_hp.value = item.no_hp || '';
    fields.keterangan.value = item.keterangan || '';
    updateJenisZakatUI();
    updateInfoPerhitungan();
  }

  function updateJenisZakatUI() {
    const jenis = fields.jenis_zakat.value;

    if (jenis === 'beras') {
      wrappers.beras.classList.remove('hidden');
      wrappers.uang.classList.add('hidden');
      fields.jumlah_uang.value = '';
      return;
    }

    wrappers.uang.classList.remove('hidden');
    wrappers.beras.classList.add('hidden');
    fields.jumlah_beras_kg.value = '';
  }

  function updateInfoPerhitungan() {
    const jumlahJiwa = Number(fields.jumlah_jiwa.value || 0);
    const jenis = fields.jenis_zakat.value;

    if (!jumlahJiwa || jumlahJiwa <= 0) {
      infoPerhitungan.textContent = 'Masukkan jumlah jiwa untuk melihat hitungan kewajiban zakat.';
      return;
    }

    const wajibBeras = Number((jumlahJiwa * zakatPerJiwaKg).toFixed(2));
    const wajibUang = Number((jumlahJiwa * zakatPerJiwaUang).toFixed(0));

    if (jenis === 'beras') {
      infoPerhitungan.textContent = `Kewajiban zakat beras: ${jumlahJiwa} jiwa x ${zakatPerJiwaKg} kg = ${wajibBeras.toFixed(2)} kg. Jika dibayar lebih, selisih dihitung sedekah.`;
      return;
    }

    infoPerhitungan.textContent = `Kewajiban zakat uang: ${jumlahJiwa} jiwa x Rp${zakatPerJiwaUang.toLocaleString('id-ID')} = Rp${wajibUang.toLocaleString('id-ID')}. Jika dibayar lebih, selisih dihitung sedekah.`;
  }

  function getPayload() {
    const jenis = fields.jenis_zakat.value;

    return {
      nama: fields.nama.value,
      rt_rw_id: fields.rt_rw_id.value,
      jumlah_jiwa: fields.jumlah_jiwa.value,
      jenis_zakat: jenis,
      tanggal_bayar: fields.tanggal_bayar.value,
      jumlah_beras_kg: jenis === 'beras' ? extractWeightNumber(fields.jumlah_beras_kg.value) : '',
      jumlah_uang: jenis === 'uang' ? extractDigits(fields.jumlah_uang.value) : '',
      alamat_detail: fields.alamat_detail.value,
      no_hp: fields.no_hp.value,
      keterangan: fields.keterangan.value
    };
  }

  openCreateBtn.addEventListener('click', function onClickCreate() {
    resetForm();
    openModal();
  });

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', function onOverlayClick(event) {
    if (event.target === modal) {
      closeModal();
    }
  });

  document.querySelectorAll('.editBtn').forEach((button) => {
    button.addEventListener('click', () => {
      const item = JSON.parse(button.dataset.item);
      fillForm(item);
      openModal();
    });
  });

  document.querySelectorAll('.deleteBtn').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!confirm('Hapus data muzakki ini?')) {
        return;
      }

      const id = button.dataset.id;
      const response = await fetch(`/api/muzakki/${id}`, { method: 'DELETE' });
      const result = await response.json();

      if (!response.ok) {
        alert(result.message || 'Gagal menghapus data');
        return;
      }

      window.location.reload();
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    formError.classList.add('hidden');
    formError.textContent = '';

    const id = idInput.value;
    const method = id ? 'PUT' : 'POST';
    const endpoint = id ? `/api/muzakki/${id}` : '/api/muzakki';

    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(getPayload())
    });

    const result = await response.json();

    if (!response.ok) {
      formError.textContent = result.message || 'Gagal menyimpan data';
      formError.classList.remove('hidden');
      return;
    }

    window.location.reload();
  });

  fields.jumlah_uang.addEventListener('input', () => {
    fields.jumlah_uang.value = formatRupiah(fields.jumlah_uang.value);
  });
  fields.jumlah_beras_kg.addEventListener('input', () => {
    fields.jumlah_beras_kg.value = formatKg(fields.jumlah_beras_kg.value);
  });
  fields.jenis_zakat.addEventListener('change', () => {
    updateJenisZakatUI();
    updateInfoPerhitungan();
  });
  fields.jumlah_jiwa.addEventListener('input', updateInfoPerhitungan);

  updateJenisZakatUI();
  updateInfoPerhitungan();

  logoutBtn.addEventListener('click', async () => {
    const response = await fetch('/auth/logout', { method: 'POST' });
    if (!response.ok) {
      return;
    }

    window.location.href = '/login';
  });
})();
