-- ============================================
-- HEALTHCARE MODULE - COMPLETE SCHEMA
-- Safe Re-Run (Drops and recreates all objects)
-- ============================================

-- ============================================
-- 1. DOCTOR PROFILES
-- ============================================
DROP TABLE IF EXISTS public.health_doctor_profiles CASCADE;
CREATE TABLE public.health_doctor_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    specialization TEXT NOT NULL,
    license_number TEXT NOT NULL,
    license_document_url TEXT,
    consultation_fee NUMERIC(10,2) NOT NULL,
    emergency_fee NUMERIC(10,2) NOT NULL,
    availability_schedule JSONB DEFAULT '[]'::jsonb,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.health_doctor_profiles ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.health_doctor_profiles IS 'Doctor profiles for healthcare module';

-- ============================================
-- 2. PATIENT PROFILES
-- ============================================
DROP TABLE IF EXISTS public.health_patient_profiles CASCADE;
CREATE TABLE public.health_patient_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date_of_birth DATE,
    blood_type TEXT,
    medical_history JSONB DEFAULT '[]'::jsonb,
    total_visits INTEGER DEFAULT 0,
    last_visit_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.health_patient_profiles ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.health_patient_profiles IS 'Patient profiles for healthcare module';

-- ============================================
-- 3. PHARMACY PROFILES
-- ============================================
DROP TABLE IF EXISTS public.health_pharmacy_profiles CASCADE;
CREATE TABLE public.health_pharmacy_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    license_number TEXT NOT NULL,
    location_address JSONB,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.health_pharmacy_profiles ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.health_pharmacy_profiles IS 'Pharmacy profiles for healthcare module';

-- ============================================
-- 4. APPOINTMENTS
-- ============================================
DROP TABLE IF EXISTS public.health_appointments CASCADE;
CREATE TABLE public.health_appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id UUID NOT NULL REFERENCES public.health_doctor_profiles(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.health_patient_profiles(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    slot_type TEXT DEFAULT 'regular' CHECK (slot_type IN ('regular', 'emergency')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled', 'no_show')),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    payment_amount NUMERIC(10,2),
    payment_intent_id TEXT,
    notes TEXT,
    prescription_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT future_time_check CHECK (scheduled_at > NOW())
);
ALTER TABLE public.health_appointments ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.health_appointments IS 'Medical appointments between doctors and patients';

-- ============================================
-- 5. HEALTH CONVERSATIONS
-- ============================================
DROP TABLE IF EXISTS public.health_conversations CASCADE;
CREATE TABLE public.health_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    appointment_id UUID NOT NULL REFERENCES public.health_appointments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.health_conversations ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.health_conversations IS 'Private conversations for medical consultations';

-- ============================================
-- 6. HEALTH MESSAGES
-- ============================================
DROP TABLE IF EXISTS public.health_messages CASCADE;
CREATE TABLE public.health_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.health_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.health_messages ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.health_messages IS 'Messages within health consultations';

-- ============================================
-- 7. PRESCRIPTIONS
-- ============================================
DROP TABLE IF EXISTS public.health_prescriptions CASCADE;
CREATE TABLE public.health_prescriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    appointment_id UUID NOT NULL REFERENCES public.health_appointments(id) ON DELETE CASCADE,
    medicine_name TEXT NOT NULL,
    dosage_instructions TEXT NOT NULL,
    duration_days INTEGER,
    is_dispensed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.health_prescriptions ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.health_prescriptions IS 'Medical prescriptions from appointments';

-- ============================================
-- INDEXES
-- ============================================
DROP INDEX IF EXISTS idx_health_appt_doctor;
CREATE INDEX idx_health_appt_doctor ON public.health_appointments(doctor_id);

DROP INDEX IF EXISTS idx_health_appt_patient;
CREATE INDEX idx_health_appt_patient ON public.health_appointments(patient_id);

DROP INDEX IF EXISTS idx_health_appt_status;
CREATE INDEX idx_health_appt_status ON public.health_appointments(status);

DROP INDEX IF EXISTS idx_health_appt_scheduled;
CREATE INDEX idx_health_appt_scheduled ON public.health_appointments(scheduled_at);

DROP INDEX IF EXISTS idx_health_msg_conv;
CREATE INDEX idx_health_msg_conv ON public.health_messages(conversation_id, created_at);

DROP INDEX IF EXISTS idx_health_doctor_user;
CREATE INDEX idx_health_doctor_user ON public.health_doctor_profiles(user_id);

DROP INDEX IF EXISTS idx_health_patient_user;
CREATE INDEX idx_health_patient_user ON public.health_patient_profiles(user_id);

DROP INDEX IF EXISTS idx_health_prescription_appt;
CREATE INDEX idx_health_prescription_appt ON public.health_prescriptions(appointment_id);

-- ============================================
-- TRIGGERS - Timestamp Updates
-- ============================================
CREATE OR REPLACE FUNCTION public.update_health_timestamps() 
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_health_doctor_timestamp ON public.health_doctor_profiles;
CREATE TRIGGER update_health_doctor_timestamp 
    BEFORE UPDATE ON public.health_doctor_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_health_timestamps();

DROP TRIGGER IF EXISTS update_health_patient_timestamp ON public.health_patient_profiles;
CREATE TRIGGER update_health_patient_timestamp 
    BEFORE UPDATE ON public.health_patient_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_health_timestamps();

DROP TRIGGER IF EXISTS update_health_appt_timestamp ON public.health_appointments;
CREATE TRIGGER update_health_appt_timestamp 
    BEFORE UPDATE ON public.health_appointments 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_health_timestamps();

DROP TRIGGER IF EXISTS update_health_conv_timestamp ON public.health_conversations;
CREATE TRIGGER update_health_conv_timestamp 
    BEFORE UPDATE ON public.health_conversations 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_health_timestamps();

-- ============================================
-- TRIGGERS - Patient Visit Count
-- ============================================
CREATE OR REPLACE FUNCTION public.update_patient_visit_count() 
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE public.health_patient_profiles
        SET total_visits = total_visits + 1,
            last_visit_date = NEW.scheduled_at,
            updated_at = NOW()
        WHERE id = NEW.patient_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_patient_visits ON public.health_appointments;
CREATE TRIGGER trigger_update_patient_visits 
    AFTER UPDATE ON public.health_appointments 
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_patient_visit_count();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Doctor Profiles Policies
DROP POLICY IF EXISTS "Public view verified doctors" ON public.health_doctor_profiles;
CREATE POLICY "Public view verified doctors" 
    ON public.health_doctor_profiles 
    FOR SELECT 
    TO authenticated 
    USING (is_verified = true);

DROP POLICY IF EXISTS "Doctors manage own profile" ON public.health_doctor_profiles;
CREATE POLICY "Doctors manage own profile" 
    ON public.health_doctor_profiles 
    FOR ALL 
    TO authenticated 
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins view all doctors" ON public.health_doctor_profiles;
CREATE POLICY "Admins view all doctors" 
    ON public.health_doctor_profiles 
    FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.user_id = auth.uid()
        )
    );

-- Patient Profiles Policies
DROP POLICY IF EXISTS "Patients manage own profile" ON public.health_patient_profiles;
CREATE POLICY "Patients manage own profile" 
    ON public.health_patient_profiles 
    FOR ALL 
    TO authenticated 
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Doctors view patient profiles" ON public.health_patient_profiles;
CREATE POLICY "Doctors view patient profiles" 
    ON public.health_patient_profiles 
    FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM health_appointments 
            WHERE health_appointments.patient_id = health_patient_profiles.id 
            AND health_appointments.doctor_id = auth.uid()
        )
    );

-- Appointments Policies
DROP POLICY IF EXISTS "Users view own appointments" ON public.health_appointments;
CREATE POLICY "Users view own appointments" 
    ON public.health_appointments 
    FOR SELECT 
    TO authenticated 
    USING (doctor_id = auth.uid() OR patient_id = auth.uid());

DROP POLICY IF EXISTS "Doctors update own appointments" ON public.health_appointments;
CREATE POLICY "Doctors update own appointments" 
    ON public.health_appointments 
    FOR UPDATE 
    TO authenticated 
    USING (doctor_id = auth.uid());

DROP POLICY IF EXISTS "Patients create appointments" ON public.health_appointments;
CREATE POLICY "Patients create appointments" 
    ON public.health_appointments 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (patient_id = auth.uid());

DROP POLICY IF EXISTS "Admins view all appointments" ON public.health_appointments;
CREATE POLICY "Admins view all appointments" 
    ON public.health_appointments 
    FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.user_id = auth.uid()
        )
    );

-- Conversations Policies
DROP POLICY IF EXISTS "Chat view participants" ON public.health_conversations;
CREATE POLICY "Chat view participants" 
    ON public.health_conversations 
    FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM health_appointments 
            WHERE health_appointments.id = health_conversations.appointment_id 
            AND (health_appointments.doctor_id = auth.uid() OR health_appointments.patient_id = auth.uid())
        )
    );

-- Messages Policies
DROP POLICY IF EXISTS "Messages view participants" ON public.health_messages;
CREATE POLICY "Messages view participants" 
    ON public.health_messages 
    FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM health_conversations hc 
            JOIN health_appointments ha ON hc.appointment_id = ha.id 
            WHERE hc.id = health_messages.conversation_id 
            AND (ha.doctor_id = auth.uid() OR ha.patient_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Messages insert participants" ON public.health_messages;
CREATE POLICY "Messages insert participants" 
    ON health_messages 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (sender_id = auth.uid());

-- Prescriptions Policies
DROP POLICY IF EXISTS "Patients view own prescriptions" ON public.health_prescriptions;
CREATE POLICY "Patients view own prescriptions" 
    ON public.health_prescriptions 
    FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM health_appointments ha 
            JOIN health_patient_profiles hp ON ha.patient_id = hp.id 
            WHERE ha.id = health_prescriptions.appointment_id 
            AND hp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Doctors manage prescriptions" ON public.health_prescriptions;
CREATE POLICY "Doctors manage prescriptions" 
    ON public.health_prescriptions 
    FOR ALL 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM health_appointments ha 
            JOIN health_doctor_profiles hd ON ha.doctor_id = hd.id 
            WHERE ha.id = health_prescriptions.appointment_id 
            AND hd.user_id = auth.uid()
        )
    );

-- Pharmacy Profiles Policies
DROP POLICY IF EXISTS "Public view verified pharmacies" ON public.health_pharmacy_profiles;
CREATE POLICY "Public view verified pharmacies" 
    ON public.health_pharmacy_profiles 
    FOR SELECT 
    TO authenticated 
    USING (is_verified = true);

DROP POLICY IF EXISTS "Pharmacies manage own profile" ON public.health_pharmacy_profiles;
CREATE POLICY "Pharmacies manage own profile" 
    ON public.health_pharmacy_profiles 
    FOR ALL 
    TO authenticated 
    USING (user_id = auth.uid());

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON COLUMN health_doctor_profiles.verification_status IS 'pending: awaiting review, verified: approved, rejected: denied';
COMMENT ON COLUMN health_appointments.slot_type IS 'regular: standard appointment, emergency: urgent care';
COMMENT ON COLUMN health_appointments.status IS 'pending: waiting confirmation, confirmed: scheduled, active: in progress, completed: finished, cancelled: aborted, no_show: patient absent';
COMMENT ON COLUMN health_messages.message_type IS 'text: plain text, image: image file, file: document attachment';

-- ============================================
-- SAMPLE DATA (Optional - Comment out in production)
-- ============================================
-- Uncomment to insert test data
-- INSERT INTO health_doctor_profiles (user_id, specialization, license_number, consultation_fee, emergency_fee, is_verified, verification_status, bio)
-- VALUES 
--     ('00000000-0000-0000-0000-000000000000', 'Cardiology', 'LIC-001', 100.00, 200.00, true, 'verified', 'Experienced cardiologist'),
--     ('00000000-0000-0000-0000-000000000000', 'Pediatrics', 'LIC-002', 80.00, 160.00, true, 'verified', 'Caring pediatrician');
