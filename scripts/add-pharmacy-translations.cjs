/**
 * Pharmacy Translations Generator
 * Adds pharmacy-specific translations to all language files
 */

const fs = require("fs");
const path = require("path");

// Pharmacy translations for all languages
const pharmacyTranslations = {
  en: {
    auroraPharmacy: "Aurora Pharmacy",
    tagline: "Your Trusted Medicine Partner",
    findPharmacies: "Find Pharmacies",
    prescriptions: "Prescriptions",
    delivery: "Home Delivery",
    searchPharmacies: "Search pharmacies, medicines...",
    verified: "Verified",
    pharmacy: "Pharmacy",
    registerPharmacy: "Register Pharmacy",
    dashboard: "Dashboard",
    providerDashboard: "Pharmacy Dashboard",
    orders: "Orders",
    inventory: "Inventory",
    uploadPrescription: "Upload Prescription",
    refillMedicine: "Refill Medicine",
    medicineSearch: "Search Medicines",
    nearbyPharmacies: "Nearby Pharmacies",
    deliveryAvailable: "Delivery Available",
    openNow: "Open Now",
    prescriptionRequired: "Prescription Required",
    loading: "Loading Pharmacies...",
    findingPharmacies: "Finding nearby pharmacies for you",
  },
  de: {
    auroraPharmacy: "Aurora Apotheke",
    tagline: "Ihr vertrauenswürdiger Medikamenten-Partner",
    findPharmacies: "Apotheken finden",
    prescriptions: "Rezepte",
    delivery: "Hauslieferung",
    searchPharmacies: "Apotheken, Medikamente suchen...",
    verified: "Verifiziert",
    pharmacy: "Apotheke",
    registerPharmacy: "Apotheke registrieren",
    dashboard: "Dashboard",
    providerDashboard: "Apotheken-Dashboard",
    orders: "Bestellungen",
    inventory: "Inventar",
    uploadPrescription: "Rezept hochladen",
    refillMedicine: "Medikament nachfüllen",
    medicineSearch: "Medikamente suchen",
    nearbyPharmacies: "Apotheken in der Nähe",
    deliveryAvailable: "Lieferung verfügbar",
    openNow: "Jetzt geöffnet",
    prescriptionRequired: "Rezept erforderlich",
    loading: "Apotheken werden geladen...",
    findingPharmacies: "Apotheken in Ihrer Nähe werden gesucht",
  },
  es: {
    auroraPharmacy: "Aurora Farmacia",
    tagline: "Tu socio de confianza para medicamentos",
    findPharmacies: "Buscar farmacias",
    prescriptions: "Recetas",
    delivery: "Entrega a domicilio",
    searchPharmacies: "Buscar farmacias, medicamentos...",
    verified: "Verificado",
    pharmacy: "Farmacia",
    registerPharmacy: "Registrar farmacia",
    dashboard: "Panel de control",
    providerDashboard: "Panel de farmacia",
    orders: "Pedidos",
    inventory: "Inventario",
    uploadPrescription: "Subir receta",
    refillMedicine: "Reponer medicamento",
    medicineSearch: "Buscar medicamentos",
    nearbyPharmacies: "Farmacias cercanas",
    deliveryAvailable: "Entrega disponible",
    openNow: "Abierto ahora",
    prescriptionRequired: "Receta requerida",
    loading: "Cargando farmacias...",
    findingPharmacies: "Buscando farmacias cercanas para ti",
  },
  fr: {
    auroraPharmacy: "Aurora Pharmacie",
    tagline: "Votre partenaire de confiance pour les médicaments",
    findPharmacies: "Trouver des pharmacies",
    prescriptions: "Ordonnances",
    delivery: "Livraison à domicile",
    searchPharmacies: "Rechercher pharmacies, médicaments...",
    verified: "Vérifié",
    pharmacy: "Pharmacie",
    registerPharmacy: "Enregistrer une pharmacie",
    dashboard: "Tableau de bord",
    providerDashboard: "Tableau de bord de pharmacie",
    orders: "Commandes",
    inventory: "Inventaire",
    uploadPrescription: "Télécharger une ordonnance",
    refillMedicine: "Recharger un médicament",
    medicineSearch: "Rechercher des médicaments",
    nearbyPharmacies: "Pharmacies à proximité",
    deliveryAvailable: "Livraison disponible",
    openNow: "Ouvert maintenant",
    prescriptionRequired: "Ordonnance requise",
    loading: "Chargement des pharmacies...",
    findingPharmacies: "Recherche de pharmacies à proximité",
  },
  it: {
    auroraPharmacy: "Aurora Farmacia",
    tagline: "Il tuo partner di fiducia per i farmaci",
    findPharmacies: "Trova farmacie",
    prescriptions: "Prescrizioni",
    delivery: "Consegna a domicilio",
    searchPharmacies: "Cerca farmacie, farmaci...",
    verified: "Verificato",
    pharmacy: "Farmacia",
    registerPharmacy: "Registra farmacia",
    dashboard: "Dashboard",
    providerDashboard: "Dashboard farmacia",
    orders: "Ordini",
    inventory: "Inventario",
    uploadPrescription: "Carica prescrizione",
    refillMedicine: "Ricarica farmaco",
    medicineSearch: "Cerca farmaci",
    nearbyPharmacies: "Farmacie vicine",
    deliveryAvailable: "Consegna disponibile",
    openNow: "Aperto ora",
    prescriptionRequired: "Prescrizione richiesta",
    loading: "Caricamento farmacie...",
    findingPharmacies: "Ricerca di farmacie vicine",
  },
  ja: {
    auroraPharmacy: "オーロラ薬局",
    tagline: "信頼できる医薬品パートナー",
    findPharmacies: "薬局を探す",
    prescriptions: "処方箋",
    delivery: "自宅配送",
    searchPharmacies: "薬局、医薬品を検索...",
    verified: "確認済み",
    pharmacy: "薬局",
    registerPharmacy: "薬局を登録",
    dashboard: "ダッシュボード",
    providerDashboard: "薬局ダッシュボード",
    orders: "注文",
    inventory: "在庫",
    uploadPrescription: "処方箋をアップロード",
    refillMedicine: "薬を補充",
    medicineSearch: "医薬品を検索",
    nearbyPharmacies: "近くの薬局",
    deliveryAvailable: "配送可能",
    openNow: "営業中",
    prescriptionRequired: "処方箋が必要",
    loading: "薬局を読み込んでいます...",
    findingPharmacies: "近くの薬局を検索中",
  },
  ko: {
    auroraPharmacy: "오로라 약국",
    tagline: "신뢰할 수 있는 의약품 파트너",
    findPharmacies: "약국 찾기",
    prescriptions: "처방전",
    delivery: "집으로 배송",
    searchPharmacies: "약국, 의약품 검색...",
    verified: "확인됨",
    pharmacy: "약국",
    registerPharmacy: "약국 등록",
    dashboard: "대시보드",
    providerDashboard: "약국 대시보드",
    orders: "주문",
    inventory: "재고",
    uploadPrescription: "처방전 업로드",
    refillMedicine: "약 재필",
    medicineSearch: "의약품 검색",
    nearbyPharmacies: "주변 약국",
    deliveryAvailable: "배송 가능",
    openNow: "영업 중",
    prescriptionRequired: "처방전 필요",
    loading: "약국 로딩 중...",
    findingPharmacies: "주변 약국 검색 중",
  },
  pt: {
    auroraPharmacy: "Aurora Farmácia",
    tagline: "Seu parceiro confiável de medicamentos",
    findPharmacies: "Encontrar farmácias",
    prescriptions: "Receitas",
    delivery: "Entrega em domicílio",
    searchPharmacies: "Buscar farmácias, medicamentos...",
    verified: "Verificado",
    pharmacy: "Farmácia",
    registerPharmacy: "Registrar farmácia",
    dashboard: "Painel de controle",
    providerDashboard: "Painel da farmácia",
    orders: "Pedidos",
    inventory: "Inventário",
    uploadPrescription: "Enviar receita",
    refillMedicine: "Reabastecer medicamento",
    medicineSearch: "Buscar medicamentos",
    nearbyPharmacies: "Farmácias próximas",
    deliveryAvailable: "Entrega disponível",
    openNow: "Aberto agora",
    prescriptionRequired: "Receita necessária",
    loading: "Carregando farmácias...",
    findingPharmacies: "Buscando farmácias próximas",
  },
  ru: {
    auroraPharmacy: "Аптека Аврора",
    tagline: "Ваш надежный партнер в области лекарств",
    findPharmacies: "Найти аптеки",
    prescriptions: "Рецепты",
    delivery: "Доставка на дом",
    searchPharmacies: "Поиск аптек, лекарств...",
    verified: "Проверено",
    pharmacy: "Аптека",
    registerPharmacy: "Зарегистрировать аптеку",
    dashboard: "Панель управления",
    providerDashboard: "Панель аптеки",
    orders: "Заказы",
    inventory: "Инвентарь",
    uploadPrescription: "Загрузить рецепт",
    refillMedicine: "Пополнить лекарство",
    medicineSearch: "Поиск лекарств",
    nearbyPharmacies: "Аптеки поблизости",
    deliveryAvailable: "Доставка доступна",
    openNow: "Открыто сейчас",
    prescriptionRequired: "Требуется рецепт",
    loading: "Загрузка аптек...",
    findingPharmacies: "Поиск аптек поблизости",
  },
  tr: {
    auroraPharmacy: "Aurora Eczanesi",
    tagline: "Güvenilir ilaç ortağınız",
    findPharmacies: "Eczane bul",
    prescriptions: "Reçeteler",
    delivery: "Eve teslimat",
    searchPharmacies: "Eczane, ilaç ara...",
    verified: "Doğrulandı",
    pharmacy: "Eczane",
    registerPharmacy: "Eczane kaydet",
    dashboard: "Kontrol paneli",
    providerDashboard: "Eczane kontrol paneli",
    orders: "Siparişler",
    inventory: "Envanter",
    uploadPrescription: "Reçete yükle",
    refillMedicine: "İlaç doldur",
    medicineSearch: "İlaç ara",
    nearbyPharmacies: "Yakındaki eczaneler",
    deliveryAvailable: "Teslimat mevcut",
    openNow: "Şimdi açık",
    prescriptionRequired: "Reçete gerekli",
    loading: "Eczaneler yükleniyor...",
    findingPharmacies: "Yakındaki eczaneler aranıyor",
  },
  zh: {
    auroraPharmacy: "极光药店",
    tagline: "您值得信赖的药品合作伙伴",
    findPharmacies: "查找药店",
    prescriptions: "处方",
    delivery: "送货上门",
    searchPharmacies: "搜索药店、药品...",
    verified: "已验证",
    pharmacy: "药店",
    registerPharmacy: "注册药店",
    dashboard: "仪表板",
    providerDashboard: "药店仪表板",
    orders: "订单",
    inventory: "库存",
    uploadPrescription: "上传处方",
    refillMedicine: "补充药品",
    medicineSearch: "搜索药品",
    nearbyPharmacies: "附近药店",
    deliveryAvailable: "可配送",
    openNow: "营业中",
    prescriptionRequired: "需要处方",
    loading: "正在加载药店...",
    findingPharmacies: "正在查找附近药店",
  },
  ar: {
    auroraPharmacy: "أورورا فارما",
    tagline: "شريكك الموثوق للأدوية",
    findPharmacies: "ابحث عن الصيدليات",
    prescriptions: "الوصفات الطبية",
    delivery: "التوصيل المنزلي",
    searchPharmacies: "ابحث عن صيدليات، أدوية...",
    verified: "معتمد",
    pharmacy: "صيدلية",
    registerPharmacy: "تسجيل صيدلية",
    dashboard: "لوحة التحكم",
    providerDashboard: "لوحة تحكم الصيدلية",
    orders: "الطلبات",
    inventory: "المخزون",
    uploadPrescription: "رفع وصفة طبية",
    refillMedicine: "إعادة تعبئة الدواء",
    medicineSearch: "بحث عن أدوية",
    nearbyPharmacies: "صيدليات قريبة",
    deliveryAvailable: "التوصيل متاح",
    openNow: "مفتوح الآن",
    prescriptionRequired: "الوصفة الطبية مطلوبة",
    loading: "جاري تحميل الصيدليات...",
    findingPharmacies: "البحث عن صيدليات قريبة",
  },
};

// Languages
const languages = {
  en: { name: "English", flag: "🇬🇧" },
  de: { name: "German", flag: "🇩🇪" },
  es: { name: "Spanish", flag: "🇪🇸" },
  fr: { name: "French", flag: "🇫🇷" },
  it: { name: "Italian", flag: "🇮🇹" },
  ja: { name: "Japanese", flag: "🇯🇵" },
  ko: { name: "Korean", flag: "🇰🇷" },
  pt: { name: "Portuguese", flag: "🇵🇹" },
  ru: { name: "Russian", flag: "🇷🇺" },
  tr: { name: "Turkish", flag: "🇹🇷" },
  zh: { name: "Chinese", flag: "🇨🇳" },
  ar: { name: "Arabic", flag: "🇸🇦" },
};

// Function to merge translations
function mergeTranslations(existing, newTranslations) {
  const result = { ...existing };

  for (const [key, value] of Object.entries(newTranslations)) {
    if (typeof value === "object" && !Array.isArray(value)) {
      result[key] = result[key] ? mergeTranslations(result[key], value) : value;
    } else {
      result[key] = value;
    }
  }

  return result;
}

// Main function
function main() {
  console.log("💊 Pharmacy Translations Generator\n");
  console.log("Adding pharmacy translations to all languages...\n");

  for (const [langCode, langInfo] of Object.entries(languages)) {
    const filePath = path.join(
      __dirname,
      "..",
      "public",
      "locales",
      langCode,
      "translation.json",
    );

    let existingTranslations = {};

    try {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      existingTranslations = JSON.parse(fileContent);
    } catch (error) {
      console.log(`⚠ Could not read ${langInfo.name} file, creating new`);
    }

    // Merge pharmacy translations
    const updatedTranslations = mergeTranslations(existingTranslations, {
      pharmacy: pharmacyTranslations[langCode] || pharmacyTranslations.en,
    });

    // Write updated file
    fs.writeFileSync(
      filePath,
      JSON.stringify(updatedTranslations, null, 2),
      "utf-8",
    );

    console.log(`✓ Updated ${langInfo.name} ${langInfo.flag}`);
  }

  console.log("\n✅ Pharmacy translations added to all languages!");
}

main();
