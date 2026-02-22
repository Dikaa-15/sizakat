(function initDistribusiPage() {
  const modal = document.getElementById('modal');
  const form = document.getElementById('distribusiForm');
  const formError = document.getElementById('formError');

  const openCreateBtn = document.getElementById('openCreateModal');
  const closeBtn = document.getElementById('closeModal');
  const logoutBtn = document.getElementById('logoutBtn');

  const fields = {
    mustahik_id: document.getElementById('mustahik_id'),
    jenis_distribusi: document.getElementById('jenis_distribusi'),
    tanggal_salur: document.getElementById('tanggal_salur'),
    jumlah_beras_kg: document.getElementById('jumlah_beras_kg'),
    jumlah_uang: document.getElementById('jumlah_uang'),
    catatan: document.getElementById('catatan')
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
    fields.tanggal_salur.value = new Date().toISOString().slice(0, 10);
  }

  function getPayload() {
    return {
      mustahik_id: fields.mustahik_id.value,
      jenis_distribusi: fields.jenis_distribusi.value,
      tanggal_salur: fields.tanggal_salur.value,
      jumlah_beras_kg: fields.jumlah_beras_kg.value,
      jumlah_uang: fields.jumlah_uang.value,
      catatan: fields.catatan.value
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

  document.querySelectorAll('.salurkanBtn').forEach((button) => {
    button.addEventListener('click', () => {
      const item = JSON.parse(button.dataset.item);
      resetForm();
      fields.mustahik_id.value = item.id;
      openModal();
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    formError.classList.add('hidden');
    formError.textContent = '';

    if (!confirm('Konfirmasi distribusi ini?')) {
      return;
    }

    const response = await fetch('/api/distribusi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(getPayload())
    });

    const result = await response.json();

    if (!response.ok) {
      formError.textContent = result.message || 'Gagal menyimpan distribusi';
      formError.classList.remove('hidden');
      return;
    }

    window.location.reload();
  });

  document.querySelectorAll('.cancelBtn').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!confirm('Batalkan distribusi ini?')) {
        return;
      }

      const id = button.dataset.id;
      const response = await fetch(`/api/distribusi/${id}/batal`, { method: 'PUT' });
      const result = await response.json();

      if (!response.ok) {
        alert(result.message || 'Gagal membatalkan distribusi');
        return;
      }

      window.location.reload();
    });
  });

  logoutBtn.addEventListener('click', async () => {
    const response = await fetch('/auth/logout', { method: 'POST' });
    if (response.ok) {
      window.location.href = '/login';
    }
  });
})();
