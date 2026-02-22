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
    fields.jumlah_beras_kg.value = totalBeras || '';
    fields.jumlah_uang.value = totalUang || '';
    fields.alamat_detail.value = item.alamat_detail || '';
    fields.no_hp.value = item.no_hp || '';
    fields.keterangan.value = item.keterangan || '';
  }

  function getPayload() {
    return {
      nama: fields.nama.value,
      rt_rw_id: fields.rt_rw_id.value,
      jumlah_jiwa: fields.jumlah_jiwa.value,
      jenis_zakat: fields.jenis_zakat.value,
      tanggal_bayar: fields.tanggal_bayar.value,
      jumlah_beras_kg: fields.jumlah_beras_kg.value,
      jumlah_uang: fields.jumlah_uang.value,
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

  logoutBtn.addEventListener('click', async () => {
    const response = await fetch('/auth/logout', { method: 'POST' });
    if (!response.ok) {
      return;
    }

    window.location.href = '/login';
  });
})();
