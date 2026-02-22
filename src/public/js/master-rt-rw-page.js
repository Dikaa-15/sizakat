(function initMasterRtRwPage() {
  const logoutBtn = document.getElementById('logoutBtn');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      const response = await fetch('/auth/logout', { method: 'POST' });
      if (response.ok) {
        window.location.href = '/login';
      }
    });
  }

  if (!window.SIZAKAT || window.SIZAKAT.userRole !== 'admin') {
    return;
  }

  const modal = document.getElementById('modal');
  const form = document.getElementById('rtRwForm');
  const formError = document.getElementById('formError');
  const modalTitle = document.getElementById('modalTitle');
  const idInput = document.getElementById('rtRwId');

  const openCreateBtn = document.getElementById('openCreateModal');
  const closeBtn = document.getElementById('closeModal');

  const fields = {
    rt: document.getElementById('rt'),
    rw: document.getElementById('rw'),
    nama_ketua_rt: document.getElementById('nama_ketua_rt'),
    jumlah_kk: document.getElementById('jumlah_kk'),
    is_active: document.getElementById('is_active'),
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
    modalTitle.textContent = 'Tambah RT/RW';
    fields.is_active.value = '1';
  }

  function fillForm(item) {
    idInput.value = item.id;
    modalTitle.textContent = 'Edit RT/RW';

    fields.rt.value = item.rt || '';
    fields.rw.value = item.rw || '';
    fields.nama_ketua_rt.value = item.nama_ketua_rt || '';
    fields.jumlah_kk.value = item.jumlah_kk ?? '';
    fields.is_active.value = String(item.is_active ?? 1);
    fields.keterangan.value = item.keterangan || '';
  }

  function getPayload() {
    return {
      rt: fields.rt.value,
      rw: fields.rw.value,
      nama_ketua_rt: fields.nama_ketua_rt.value,
      jumlah_kk: fields.jumlah_kk.value,
      is_active: fields.is_active.value,
      keterangan: fields.keterangan.value
    };
  }

  openCreateBtn.addEventListener('click', function onCreateClick() {
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

  document.querySelectorAll('.deactivateBtn').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!confirm('Nonaktifkan RT/RW ini?')) {
        return;
      }

      const id = button.dataset.id;
      const response = await fetch(`/api/master/rt-rw/${id}`, { method: 'DELETE' });
      const result = await response.json();

      if (!response.ok) {
        alert(result.message || 'Gagal menonaktifkan data');
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
    const endpoint = id ? `/api/master/rt-rw/${id}` : '/api/master/rt-rw';

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
})();
