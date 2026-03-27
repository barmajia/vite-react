/**
 * Translation Generator Script
 * 
 * This script generates complete translation files for all supported languages
 * by using the English translation as a base and creating localized versions.
 * 
 * Usage: node scripts/generate-translations.cjs
 */

const fs = require('fs');
const path = require('path');

// Professional translations for health section (manually curated)
const healthTranslations = {
  de: {
    tagline: "Ihre Gesundheit, unsere Priorität",
    findDoctor: "Arzt finden",
    pharmacies: "Apotheken",
    hospitals: "Krankenhäuser",
    dashboard: "Dashboard",
    appointments: "Termine",
    records: "Gesundheitsakten",
    patients: "Patienten",
    verifyDoctors: "Ärzte verifizieren",
    auditLogs: "Prüfprotokolle",
    doctorDashboard: "Arzt-Dashboard",
    searchDoctors: "Ärzte, Fachrichtungen suchen...",
    verified: "Verifiziert",
    doctor: "Arzt",
    patient: "Patient",
    admin: "Administrator",
    doctorSignup: "Als Arzt registrieren"
  },
  es: {
    tagline: "Tu salud, nuestra prioridad",
    findDoctor: "Buscar médico",
    pharmacies: "Farmacias",
    hospitals: "Hospitales",
    dashboard: "Panel de control",
    appointments: "Citas",
    records: "Expedientes de salud",
    patients: "Pacientes",
    verifyDoctors: "Verificar médicos",
    auditLogs: "Registros de auditoría",
    doctorDashboard: "Panel del médico",
    searchDoctors: "Buscar médicos, especialidades...",
    verified: "Verificado",
    doctor: "Médico",
    patient: "Paciente",
    admin: "Administrador",
    doctorSignup: "Registrarse como médico"
  },
  fr: {
    tagline: "Votre santé, notre priorité",
    findDoctor: "Trouver un médecin",
    pharmacies: "Pharmacies",
    hospitals: "Hôpitaux",
    dashboard: "Tableau de bord",
    appointments: "Rendez-vous",
    records: "Dossiers de santé",
    patients: "Patients",
    verifyDoctors: "Vérifier les médecins",
    auditLogs: "Journaux d'audit",
    doctorDashboard: "Tableau de bord du médecin",
    searchDoctors: "Rechercher médecins, spécialités...",
    verified: "Vérifié",
    doctor: "Médecin",
    patient: "Patient",
    admin: "Administrateur",
    doctorSignup: "S'inscrire comme médecin"
  },
  it: {
    tagline: "La tua salute, la nostra priorità",
    findDoctor: "Trova un medico",
    pharmacies: "Farmacie",
    hospitals: "Ospedali",
    dashboard: "Dashboard",
    appointments: "Appuntamenti",
    records: "Cartelle cliniche",
    patients: "Pazienti",
    verifyDoctors: "Verifica medici",
    auditLogs: "Registri di controllo",
    doctorDashboard: "Dashboard del medico",
    searchDoctors: "Cerca medici, specializzazioni...",
    verified: "Verificato",
    doctor: "Medico",
    patient: "Paziente",
    admin: "Amministratore",
    doctorSignup: "Registrati come medico"
  },
  ja: {
    tagline: "あなたの健康、私たちの優先事項",
    findDoctor: "医師を探す",
    pharmacies: "薬局",
    hospitals: "病院",
    dashboard: "ダッシュボード",
    appointments: "予約",
    records: "健康記録",
    patients: "患者",
    verifyDoctors: "医師の確認",
    auditLogs: "監査ログ",
    doctorDashboard: "医師ダッシュボード",
    searchDoctors: "医師、専門科目を検索...",
    verified: "確認済み",
    doctor: "医師",
    patient: "患者",
    admin: "管理者",
    doctorSignup: "医師として登録"
  },
  ko: {
    tagline: "당신의 건강, 우리의 우선순위",
    findDoctor: "의사 찾기",
    pharmacies: "약국",
    hospitals: "병원",
    dashboard: "대시보드",
    appointments: "예약",
    records: "건강 기록",
    patients: "환자",
    verifyDoctors: "의사 확인",
    auditLogs: "감사 로그",
    doctorDashboard: "의사 대시보드",
    searchDoctors: "의사, 전문과목 검색...",
    verified: "확인됨",
    doctor: "의사",
    patient: "환자",
    admin: "관리자",
    doctorSignup: "의사로 등록"
  },
  pt: {
    tagline: "Sua saúde, nossa prioridade",
    findDoctor: "Encontrar médico",
    pharmacies: "Farmácias",
    hospitals: "Hospitais",
    dashboard: "Painel de controle",
    appointments: "Consultas",
    records: "Registros de saúde",
    patients: "Pacientes",
    verifyDoctors: "Verificar médicos",
    auditLogs: "Registros de auditoria",
    doctorDashboard: "Painel do médico",
    searchDoctors: "Buscar médicos, especialidades...",
    verified: "Verificado",
    doctor: "Médico",
    patient: "Paciente",
    admin: "Administrador",
    doctorSignup: "Registrar-se como médico"
  },
  ru: {
    tagline: "Ваше здоровье - наш приоритет",
    findDoctor: "Найти врача",
    pharmacies: "Аптеки",
    hospitals: "Больницы",
    dashboard: "Панель управления",
    appointments: "Приемы",
    records: "Медицинские записи",
    patients: "Пациенты",
    verifyDoctors: "Проверить врачей",
    auditLogs: "Журналы аудита",
    doctorDashboard: "Панель врача",
    searchDoctors: "Поиск врачей, специальностей...",
    verified: "Проверено",
    doctor: "Врач",
    patient: "Пациент",
    admin: "Администратор",
    doctorSignup: "Зарегистрироваться как врач"
  },
  tr: {
    tagline: "Sağlığınız, önceliğimizdir",
    findDoctor: "Doktor bul",
    pharmacies: "Eczaneler",
    hospitals: "Hastaneler",
    dashboard: "Kontrol paneli",
    appointments: "Randevular",
    records: "Sağlık kayıtları",
    patients: "Hastalar",
    verifyDoctors: "Doktorları doğrula",
    auditLogs: "Denetim kayıtları",
    doctorDashboard: "Doktor kontrol paneli",
    searchDoctors: "Doktor, uzmanlık ara...",
    verified: "Doğrulandı",
    doctor: "Doktor",
    patient: "Hasta",
    admin: "Yönetici",
    doctorSignup: "Doktor olarak kaydol"
  },
  zh: {
    tagline: "您的健康，我们的优先事项",
    findDoctor: "查找医生",
    pharmacies: "药店",
    hospitals: "医院",
    dashboard: "仪表板",
    appointments: "预约",
    records: "健康记录",
    patients: "患者",
    verifyDoctors: "验证医生",
    auditLogs: "审计日志",
    doctorDashboard: "医生仪表板",
    searchDoctors: "搜索医生、专科...",
    verified: "已验证",
    doctor: "医生",
    patient: "患者",
    admin: "管理员",
    doctorSignup: "注册为医生"
  }
};

// Categories translations
const categoriesTranslations = {
  de: { health: "Gesundheit & Wellness" },
  es: { health: "Salud y bienestar" },
  fr: { health: "Santé et bien-être" },
  it: { health: "Salute e benessere" },
  ja: { health: "健康・ウェルネス" },
  ko: { health: "건강 및 웰니스" },
  pt: { health: "Saúde e bem-estar" },
  ru: { health: "Здоровье и благополучие" },
  tr: { health: "Sağlık ve wellness" },
  zh: { health: "健康与保健" }
};

// Target languages
const languages = {
  de: { name: 'German', flag: '🇩🇪' },
  es: { name: 'Spanish', flag: '🇪🇸' },
  fr: { name: 'French', flag: '🇫🇷' },
  it: { name: 'Italian', flag: '🇮🇹' },
  ja: { name: 'Japanese', flag: '🇯🇵' },
  ko: { name: 'Korean', flag: '🇰🇷' },
  pt: { name: 'Portuguese', flag: '🇵🇹' },
  ru: { name: 'Russian', flag: '🇷🇺' },
  tr: { name: 'Turkish', flag: '🇹🇷' },
  zh: { name: 'Chinese (Simplified)', flag: '🇨🇳' },
  ar: { name: 'Arabic', flag: '🇸🇦' }
};

// Function to merge translations
function mergeTranslations(existing, newTranslations) {
  const result = { ...existing };
  
  for (const [key, value] of Object.entries(newTranslations)) {
    if (typeof value === 'object' && !Array.isArray(value)) {
      result[key] = result[key] ? mergeTranslations(result[key], value) : value;
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

// Function to generate translation file for a language
function generateTranslationFile(langCode, langInfo) {
  const existingPath = path.join(__dirname, '..', 'public', 'locales', langCode, 'translation.json');
  
  let existingTranslations = {};
  
  try {
    const fileContent = fs.readFileSync(existingPath, 'utf-8');
    existingTranslations = JSON.parse(fileContent);
    console.log(`✓ Loaded existing ${langInfo.name} translations`);
  } catch (error) {
    console.log(`⚠ No existing ${langInfo.name} translations found, creating new file`);
  }
  
  // Merge with health and categories translations
  const updatedTranslations = { ...existingTranslations };
  
  if (healthTranslations[langCode]) {
    updatedTranslations.health = mergeTranslations(
      updatedTranslations.health || {},
      healthTranslations[langCode]
    );
  }
  
  if (categoriesTranslations[langCode]) {
    updatedTranslations.categories = mergeTranslations(
      updatedTranslations.categories || {},
      categoriesTranslations[langCode]
    );
  }
  
  // Write updated file
  fs.writeFileSync(existingPath, JSON.stringify(updatedTranslations, null, 2), 'utf-8');
  
  console.log(`✓ Updated ${langInfo.name} ${langInfo.flag} translation file`);
}

// Main function
function main() {
  console.log('🌍 Translation Generator\n');
  console.log('Generating translations for all languages...\n');
  
  for (const [langCode, langInfo] of Object.entries(languages)) {
    generateTranslationFile(langCode, langInfo);
  }
  
  console.log('\n✅ Translation generation complete!');
  console.log('\n📝 Note: This script adds key translations. For complete translations,');
  console.log('   consider using a professional translation service or API.');
}

// Run the script
main();
