ALTER TABLE muzakki
  ADD COLUMN sedekah_beras_kg DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER jumlah_uang,
  ADD COLUMN sedekah_uang DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER sedekah_beras_kg;
