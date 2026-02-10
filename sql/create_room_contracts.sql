-- =====================================================
-- SQL Script untuk membuat tabel room_contracts
-- Jalankan script ini di Supabase SQL Editor
-- =====================================================

-- Buat tabel room_contracts
CREATE TABLE IF NOT EXISTS room_contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    jenis_dokumen VARCHAR(255),
    judul_dokumen TEXT,
    no_tgl_dokumen VARCHAR(255),
    link_dok_evidence TEXT,
    contract_start DATE,
    contract_end DATE,
    contract_duration_months INTEGER,
    br_area DECIMAL(15, 2),
    sc_area DECIMAL(15, 2),
    satuan VARCHAR(50),
    br_price_per_m2 DECIMAL(15, 2),
    sc_price_per_m2 DECIMAL(15, 2),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'upcoming')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Buat index untuk mempercepat query
CREATE INDEX IF NOT EXISTS idx_room_contracts_room_id ON room_contracts(room_id);
CREATE INDEX IF NOT EXISTS idx_room_contracts_status ON room_contracts(status);
CREATE INDEX IF NOT EXISTS idx_room_contracts_contract_end ON room_contracts(contract_end);

-- Enable Row Level Security (RLS)
ALTER TABLE room_contracts ENABLE ROW LEVEL SECURITY;

-- Buat policy untuk akses publik (sesuaikan dengan kebutuhan keamanan Anda)
CREATE POLICY "Allow public read access on room_contracts" 
    ON room_contracts FOR SELECT 
    USING (true);

CREATE POLICY "Allow public insert on room_contracts" 
    ON room_contracts FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow public update on room_contracts" 
    ON room_contracts FOR UPDATE 
    USING (true);

CREATE POLICY "Allow public delete on room_contracts" 
    ON room_contracts FOR DELETE 
    USING (true);

-- Trigger untuk auto-update updated_at
CREATE OR REPLACE FUNCTION update_room_contracts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_room_contracts_updated_at
    BEFORE UPDATE ON room_contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_room_contracts_updated_at();

-- =====================================================
-- MIGRASI DATA: Pindahkan data kontrak dari tabel rooms
-- ke tabel room_contracts (opsional)
-- =====================================================

-- INSERT INTO room_contracts (
--     room_id,
--     jenis_dokumen,
--     judul_dokumen,
--     no_tgl_dokumen,
--     link_dok_evidence,
--     contract_start,
--     contract_end,
--     contract_duration_months,
--     br_area,
--     sc_area,
--     satuan,
--     br_price_per_m2,
--     sc_price_per_m2,
--     status
-- )
-- SELECT 
--     id as room_id,
--     jenis_dokumen,
--     judul_dokumen,
--     no_tgl_dokumen,
--     link_dok_evidence,
--     contract_start,
--     contract_end,
--     contract_duration_months,
--     br_area,
--     sc_area,
--     satuan,
--     br_price_per_m2,
--     sc_price_per_m2,
--     CASE 
--         WHEN contract_end < CURRENT_DATE THEN 'expired'
--         WHEN contract_start > CURRENT_DATE THEN 'upcoming'
--         ELSE 'active'
--     END as status
-- FROM rooms
-- WHERE contract_start IS NOT NULL OR contract_end IS NOT NULL;

-- =====================================================
-- CONTOH: Insert data kontrak Bank Mandiri (7.C & 7.D)
-- =====================================================

-- Asumsikan room_id untuk Bank Mandiri sudah ada
-- INSERT INTO room_contracts (room_id, jenis_dokumen, judul_dokumen, no_tgl_dokumen, link_dok_evidence, contract_start, contract_end, contract_duration_months, br_area, sc_area, satuan, br_price_per_m2, sc_price_per_m2, notes, status)
-- VALUES 
-- ('your-room-uuid-here', 'Akta Notaris', 'PERPANJANGAN PERJANJIAN SEWA MENYEWA', 'AKTA NOTARIS DESIYANA CHAFSAH, SH No. 6 Tanggal 28 Mei 2024', 'https://drive.google.com/file/d/1BafQq8wXmfPhdiUdwlRcqQrIiiYKXSDs/view', '2024-01-05', '2025-04-30', 12, 375.51, 375.51, 'm²', 241241, 126114, NULL, 'expired'),
-- ('your-room-uuid-here', 'Akta Notaris', 'PERPANJANGAN PERJANJIAN SEWA MENYEWA', 'AKTA NOTARIS DESIYANA CHAFSAH, SH No. 7 Tanggal 12 Maret 2024', 'https://drive.google.com/open?id=1Qm_y3TL-I0w4hJx43K2PTKz0K6J2DIVx&usp=drive_copy', '2025-01-05', '2027-04-30', 24, 375.51, 375.51, 'm²', 249542, 127996, NULL, 'active');
