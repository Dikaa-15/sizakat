CREATE DATABASE IF NOT EXISTS sizakat;
USE sizakat;

CREATE TABLE IF NOT EXISTS master_rt_rw (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rt VARCHAR(5) NOT NULL,
  rw VARCHAR(5) NOT NULL,
  nama_ketua_rt VARCHAR(100) NULL,
  jumlah_kk INT NULL,
  keterangan TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  nama VARCHAR(100) NOT NULL,
  role ENUM('admin', 'petugas') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pengaturan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tahun_hijriah VARCHAR(10) NOT NULL,
  nama_masjid VARCHAR(200) NOT NULL,
  alamat_masjid TEXT NULL,
  harga_beras_per_kg DECIMAL(15,2) NOT NULL,
  zakat_per_jiwa_kg DECIMAL(5,2) NOT NULL DEFAULT 2.50,
  zakat_per_jiwa_uang DECIMAL(15,2) NOT NULL DEFAULT 47000.00,
  ketua_dkm VARCHAR(100) NULL,
  sekretaris VARCHAR(100) NULL,
  bendahara VARCHAR(100) NULL
);

CREATE TABLE IF NOT EXISTS muzakki (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  rt_rw_id INT NOT NULL,
  alamat_detail VARCHAR(200) NULL,
  no_hp VARCHAR(20) NULL,
  jumlah_jiwa INT NOT NULL,
  jenis_zakat ENUM('beras', 'uang') NOT NULL,
  jumlah_beras_kg DECIMAL(10,2) NULL,
  jumlah_uang DECIMAL(15,2) NULL,
  sedekah_beras_kg DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  sedekah_uang DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  tanggal_bayar DATE NOT NULL,
  keterangan TEXT NULL,
  created_by INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_muzakki_rt_rw FOREIGN KEY (rt_rw_id) REFERENCES master_rt_rw(id),
  CONSTRAINT fk_muzakki_user FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS mustahik (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  kategori ENUM('Fakir', 'Miskin', 'Amil', 'Mualaf', 'Riqab', 'Gharimin', 'Fisabilillah', 'Ibnu Sabil') NOT NULL,
  rt_rw_id INT NULL,
  alamat_detail VARCHAR(200) NULL,
  no_hp VARCHAR(20) NULL,
  jumlah_jiwa INT NOT NULL,
  hak_beras_kg DECIMAL(10,2) NOT NULL,
  hak_uang DECIMAL(15,2) NOT NULL,
  created_by INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_mustahik_rt_rw FOREIGN KEY (rt_rw_id) REFERENCES master_rt_rw(id),
  CONSTRAINT fk_mustahik_user FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS distribusi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mustahik_id INT NOT NULL,
  jenis_distribusi ENUM('beras', 'uang') NOT NULL,
  jumlah_beras_kg DECIMAL(10,2) NULL,
  jumlah_uang DECIMAL(15,2) NULL,
  tanggal_salur DATE NOT NULL,
  status ENUM('tersalurkan', 'batal') NOT NULL,
  catatan TEXT NULL,
  disalurkan_oleh INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_distribusi_mustahik FOREIGN KEY (mustahik_id) REFERENCES mustahik(id),
  CONSTRAINT fk_distribusi_user FOREIGN KEY (disalurkan_oleh) REFERENCES users(id)
);
