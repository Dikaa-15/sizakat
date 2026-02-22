(function initMustahikPage() {
  const modal = document.getElementById('modal');
  const form = document.getElementById('mustahikForm');
  const formError = document.getElementById('formError');
  const modalTitle = document.getElementById('modalTitle');
  const idInput = document.getElementById('mustahikId');

  const openCreateBtn = document.getElementById('openCreateModal');
  const closeBtn = document.getElementById('closeModal');
  const logoutBtn = document.getElementById('logoutBtn');

  const fields = {
    nama: document.getElementById('nama'),
    kategori: document.getElementById('kategori'),
    rt_rw_id: document.getElementById('rt_rw_id'),
    jumlah_jiwa: document.getElementById('jumlah_jiwa'),
    alamat_detail: document.getElementById('alamat_detail'),
    no_hp: document.getElementById('no_hp')
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
    modalTitle.textContent = 'Tambah Mustahik';
  }

  function fillForm(item) {
    idInput.value = item.id;
    modalTitle.textContent = 'Edit Mustahik';

    fields.nama.value = item.nama || '';
    fields.kategori.value = item.kategori || 'Fakir';
    fields.rt_rw_id.value = item.rt_rw_id || '';
    fields.jumlah_jiwa.value = item.jumlah_jiwa || '';
    fields.alamat_detail.value = item.alamat_detail || '';
    fields.no_hp.value = item.no_hp || '';
  }

  function getPayload() {
    return {
      nama: fields.nama.value,
      kategori: fields.kategori.value,
      rt_rw_id: fields.rt_rw_id.value,
      jumlah_jiwa: fields.jumlah_jiwa.value,
      alamat_detail: fields.alamat_detail.value,
      no_hp: fields.no_hp.value
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
      if (!confirm('Hapus data mustahik ini?')) {
        return;
      }

      const id = button.dataset.id;
      const response = await fetch(`/api/mustahik/${id}`, { method: 'DELETE' });
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
    const endpoint = id ? `/api/mustahik/${id}` : '/api/mustahik';

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
