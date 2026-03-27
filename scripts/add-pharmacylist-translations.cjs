/**
 * PharmacyList Page Translations Generator
 * Adds all missing translations from PharmacyList.tsx page to all language files
 */

const fs = require('fs');
const path = require('path');

// Complete pharmacy page translations
const pharmacyPageTranslations = {
  en: {
    // Hero section
    pharmacyNetwork: "Pharmacy Network",
    findNearbyPharmacies: "Find Nearby Pharmacies",
    getPrescriptionsFilled: "Get your prescriptions filled at verified pharmacies near you. Home delivery available.",
    searchPharmaciesPlaceholder: "Search pharmacies by name or location...",
    filters: "Filters",
    clearAll: "Clear All",
    
    // Filter options
    deliveryAvailable: "Delivery Available",
    acceptsPrescriptions: "Accepts Prescriptions",
    verifiedOnly: "Verified Only",
    openNow: "Open Now",
    
    // Results
    pharmaciesFound: "pharmacies found",
    usingYourLocation: "Using your location",
    sortBy: "Sort by",
    topRated: "Top Rated",
    nameAZ: "Name (A-Z)",
    distanceNearest: "Distance (Nearest)",
    
    // Empty state
    noPharmaciesFound: "No Pharmacies Found",
    tryAdjustingSearch: "Try adjusting your search or filters to find what you're looking for.",
    clearAllFilters: "Clear All Filters",
    
    // Pharmacy card
    verified: "Verified",
    delivery: "Delivery",
    open: "Open",
    closed: "Closed",
    acceptInsurance: "Accepts Insurance",
    freeDelivery: "Free Delivery",
    prescriptionServices: "Prescription Services",
    viewDetails: "View Details",
    callPharmacy: "Call Pharmacy",
    getDirections: "Get Directions",
    
    // Loading
    loading: "Loading Pharmacies...",
    findingPharmacies: "Finding nearby pharmacies for you"
  },
  de: {
    pharmacyNetwork: "Apotheken-Netzwerk",
    findNearbyPharmacies: "Apotheken in der Nähe finden",
    getPrescriptionsFilled: "Lassen Sie Ihre Rezepte in verifizierten Apotheken in Ihrer Nähe ausfüllen. Hauslieferung verfügbar.",
    searchPharmaciesPlaceholder: "Apotheken nach Name oder Ort suchen...",
    filters: "Filter",
    clearAll: "Alle löschen",
    deliveryAvailable: "Lieferung verfügbar",
    acceptsPrescriptions: "Akzeptiert Rezepte",
    verifiedOnly: "Nur verifizierte",
    openNow: "Jetzt geöffnet",
    pharmaciesFound: "Apotheken gefunden",
    usingYourLocation: "Ihren Standort verwenden",
    sortBy: "Sortieren nach",
    topRated: "Am besten bewertet",
    nameAZ: "Name (A-Z)",
    distanceNearest: "Entfernung (Nächste)",
    noPharmaciesFound: "Keine Apotheken gefunden",
    tryAdjustingSearch: "Versuchen Sie, Ihre Suche oder Filter anzupassen, um zu finden, was Sie suchen.",
    clearAllFilters: "Alle Filter löschen",
    verified: "Verifiziert",
    delivery: "Lieferung",
    open: "Geöffnet",
    closed: "Geschlossen",
    acceptInsurance: "Akzeptiert Versicherung",
    freeDelivery: "Kostenlose Lieferung",
    prescriptionServices: "Rezept-Service",
    viewDetails: "Details anzeigen",
    callPharmacy: "Apotheke anrufen",
    getDirections: "Wegbeschreibung",
    loading: "Apotheken werden geladen...",
    findingPharmacies: "Apotheken in Ihrer Nähe werden gesucht"
  },
  es: {
    pharmacyNetwork: "Red de Farmacias",
    findNearbyPharmacies: "Buscar farmacias cercanas",
    getPrescriptionsFilled: "Obtén tus recetas en farmacias verificadas cerca de ti. Entrega a domicilio disponible.",
    searchPharmaciesPlaceholder: "Buscar farmacias por nombre o ubicación...",
    filters: "Filtros",
    clearAll: "Limpiar todo",
    deliveryAvailable: "Entrega disponible",
    acceptsPrescriptions: "Acepta recetas",
    verifiedOnly: "Solo verificadas",
    openNow: "Abierto ahora",
    pharmaciesFound: "farmacias encontradas",
    usingYourLocation: "Usando tu ubicación",
    sortBy: "Ordenar por",
    topRated: "Mejor valoradas",
    nameAZ: "Nombre (A-Z)",
    distanceNearest: "Distancia (Más cercana)",
    noPharmaciesFound: "No se encontraron farmacias",
    tryAdjustingSearch: "Intenta ajustar tu búsqueda o filtros para encontrar lo que buscas.",
    clearAllFilters: "Limpiar todos los filtros",
    verified: "Verificado",
    delivery: "Entrega",
    open: "Abierto",
    closed: "Cerrado",
    acceptInsurance: "Acepta seguro",
    freeDelivery: "Entrega gratis",
    prescriptionServices: "Servicios de recetas",
    viewDetails: "Ver detalles",
    callPharmacy: "Llamar a farmacia",
    getDirections: "Obtener direcciones",
    loading: "Cargando farmacias...",
    findingPharmacies: "Buscando farmacias cercanas para ti"
  },
  fr: {
    pharmacyNetwork: "Réseau de Pharmacies",
    findNearbyPharmacies: "Trouver des pharmacies à proximité",
    getPrescriptionsFilled: "Faites remplir vos ordonnances dans des pharmacies vérifiées près de chez vous. Livraison à domicile disponible.",
    searchPharmaciesPlaceholder: "Rechercher des pharmacies par nom ou emplacement...",
    filters: "Filtres",
    clearAll: "Tout effacer",
    deliveryAvailable: "Livraison disponible",
    acceptsPrescriptions: "Accepte les ordonnances",
    verifiedOnly: "Vérifiées uniquement",
    openNow: "Ouvert maintenant",
    pharmaciesFound: "pharmacies trouvées",
    usingYourLocation: "Utilisation de votre position",
    sortBy: "Trier par",
    topRated: "Mieux notées",
    nameAZ: "Nom (A-Z)",
    distanceNearest: "Distance (Plus proche)",
    noPharmaciesFound: "Aucune pharmacie trouvée",
    tryAdjustingSearch: "Essayez d'ajuster votre recherche ou vos filtres pour trouver ce que vous cherchez.",
    clearAllFilters: "Effacer tous les filtres",
    verified: "Vérifié",
    delivery: "Livraison",
    open: "Ouvert",
    closed: "Fermé",
    acceptInsurance: "Accepte les assurances",
    freeDelivery: "Livraison gratuite",
    prescriptionServices: "Services d'ordonnance",
    viewDetails: "Voir les détails",
    callPharmacy: "Appeler la pharmacie",
    getDirections: "Obtenir l'itinéraire",
    loading: "Chargement des pharmacies...",
    findingPharmacies: "Recherche de pharmacies à proximité"
  },
  it: {
    pharmacyNetwork: "Rete di Farmacie",
    findNearbyPharmacies: "Trova farmacie vicine",
    getPrescriptionsFilled: "Riempi le tue ricette presso farmacie verificate vicino a te. Consegna a domicilio disponibile.",
    searchPharmaciesPlaceholder: "Cerca farmacie per nome o posizione...",
    filters: "Filtri",
    clearAll: "Cancella tutto",
    deliveryAvailable: "Consegna disponibile",
    acceptsPrescriptions: "Accetta prescrizioni",
    verifiedOnly: "Solo verificate",
    openNow: "Aperto ora",
    pharmaciesFound: "farmacie trovate",
    usingYourLocation: "Utilizzo della tua posizione",
    sortBy: "Ordina per",
    topRated: "Meglio valutate",
    nameAZ: "Nome (A-Z)",
    distanceNearest: "Distanza (Più vicina)",
    noPharmaciesFound: "Nessuna farmacia trovata",
    tryAdjustingSearch: "Prova ad adattare la tua ricerca o i filtri per trovare ciò che cerchi.",
    clearAllFilters: "Cancella tutti i filtri",
    verified: "Verificato",
    delivery: "Consegna",
    open: "Aperto",
    closed: "Chiuso",
    acceptInsurance: "Accetta assicurazione",
    freeDelivery: "Consegna gratuita",
    prescriptionServices: "Servizi di prescrizione",
    viewDetails: "Vedi dettagli",
    callPharmacy: "Chiama farmacia",
    getDirections: "Ottieni indicazioni",
    loading: "Caricamento farmacie...",
    findingPharmacies: "Ricerca di farmacie vicine"
  },
  ja: {
    pharmacyNetwork: "薬局ネットワーク",
    findNearbyPharmacies: "近くの薬局を探す",
    getPrescriptionsFilled: "お近くの認証された薬局で処方箋を調剤できます。自宅配送も利用可能。",
    searchPharmaciesPlaceholder: "薬局名または場所で検索...",
    filters: "フィルター",
    clearAll: "すべてクリア",
    deliveryAvailable: "配送可能",
    acceptsPrescriptions: "処方箋受付",
    verifiedOnly: "認証済みのみ",
    openNow: "営業中",
    pharmaciesFound: "件の薬局が見つかりました",
    usingYourLocation: "現在地を使用",
    sortBy: "並び替え",
    topRated: "高評価順",
    nameAZ: "名前順 (A-Z)",
    distanceNearest: "距離順 (最寄り)",
    noPharmaciesFound: "薬局が見つかりません",
    tryAdjustingSearch: "検索条件またはフィルターを調整して、お探しのものを見つけてください。",
    clearAllFilters: "すべてのフィルターをクリア",
    verified: "認証済み",
    delivery: "配送",
    open: "営業中",
    closed: "休業中",
    acceptInsurance: "保険利用可能",
    freeDelivery: "無料配送",
    prescriptionServices: "処方箋サービス",
    viewDetails: "詳細を見る",
    callPharmacy: "薬局に電話",
    getDirections: "案内を取得",
    loading: "薬局を読み込んでいます...",
    findingPharmacies: "近くの薬局を検索中"
  },
  ko: {
    pharmacyNetwork: "약국 네트워크",
    findNearbyPharmacies: "주변 약국 찾기",
    getPrescriptionsFilled: "가까운 인증 약국에서 처방전을 조제하세요. 집으로 배송도 가능합니다.",
    searchPharmaciesPlaceholder: "이름 또는 위치로 약국 검색...",
    filters: "필터",
    clearAll: "모두 지우기",
    deliveryAvailable: "배송 가능",
    acceptsPrescriptions: "처방전 수취",
    verifiedOnly: "인증됨만",
    openNow: "영업 중",
    pharmaciesFound: "개의 약국을 찾았습니다",
    usingYourLocation: "현재 위치 사용",
    sortBy: "정렬 기준",
    topRated: "평점 높은 순",
    nameAZ: "이름 (A-Z)",
    distanceNearest: "거리 (가까운 순)",
    noPharmaciesFound: "약국을 찾을 수 없습니다",
    tryAdjustingSearch: "검색 또는 필터를 조정하여 원하는 결과를 찾아보세요.",
    clearAllFilters: "모든 필터 지우기",
    verified: "인증됨",
    delivery: "배송",
    open: "영업 중",
    closed: "휴업",
    acceptInsurance: "보험 가능",
    freeDelivery: "무료 배송",
    prescriptionServices: "처방전 서비스",
    viewDetails: "세부 정보 보기",
    callPharmacy: "약국에 전화",
    getDirections: "오시는 길",
    loading: "약국 로딩 중...",
    findingPharmacies: "주변 약국 검색 중"
  },
  pt: {
    pharmacyNetwork: "Rede de Farmácias",
    findNearbyPharmacies: "Encontrar farmácias próximas",
    getPrescriptionsFilled: "Obtenha suas receitas em farmácias verificadas perto de você. Entrega em domicílio disponível.",
    searchPharmaciesPlaceholder: "Buscar farmácias por nome ou localização...",
    filters: "Filtros",
    clearAll: "Limpar tudo",
    deliveryAvailable: "Entrega disponível",
    acceptsPrescriptions: "Aceita receitas",
    verifiedOnly: "Apenas verificadas",
    openNow: "Aberto agora",
    pharmaciesFound: "farmácias encontradas",
    usingYourLocation: "Usando sua localização",
    sortBy: "Ordenar por",
    topRated: "Melhor avaliadas",
    nameAZ: "Nome (A-Z)",
    distanceNearest: "Distância (Mais próxima)",
    noPharmaciesFound: "Nenhuma farmácia encontrada",
    tryAdjustingSearch: "Tente ajustar sua pesquisa ou filtros para encontrar o que procura.",
    clearAllFilters: "Limpar todos os filtros",
    verified: "Verificado",
    delivery: "Entrega",
    open: "Aberto",
    closed: "Fechado",
    acceptInsurance: "Aceita seguro",
    freeDelivery: "Entrega grátis",
    prescriptionServices: "Serviços de receita",
    viewDetails: "Ver detalhes",
    callPharmacy: "Ligar para farmácia",
    getDirections: "Obter direções",
    loading: "Carregando farmácias...",
    findingPharmacies: "Buscando farmácias próximas"
  },
  ru: {
    pharmacyNetwork: "Сеть аптек",
    findNearbyPharmacies: "Найти аптеки поблизости",
    getPrescriptionsFilled: "Получите лекарства по рецепту в проверенных аптеках рядом с вами. Доступна доставка на дом.",
    searchPharmaciesPlaceholder: "Поиск аптек по названию или местоположению...",
    filters: "Фильтры",
    clearAll: "Очистить все",
    deliveryAvailable: "Доставка доступна",
    acceptsPrescriptions: "Принимает рецепты",
    verifiedOnly: "Только проверенные",
    openNow: "Открыто сейчас",
    pharmaciesFound: "аптек найдено",
    usingYourLocation: "Использование вашего местоположения",
    sortBy: "Сортировать по",
    topRated: "Лучшие по рейтингу",
    nameAZ: "Название (А-Я)",
    distanceNearest: "Расстояние (Ближайшие)",
    noPharmaciesFound: "Аптеки не найдены",
    tryAdjustingSearch: "Попробуйте изменить запрос или фильтры, чтобы найти то, что вы ищете.",
    clearAllFilters: "Очистить все фильтры",
    verified: "Проверено",
    delivery: "Доставка",
    open: "Открыто",
    closed: "Закрыто",
    acceptInsurance: "Принимает страховку",
    freeDelivery: "Бесплатная доставка",
    prescriptionServices: "Услуги по рецептам",
    viewDetails: "Подробнее",
    callPharmacy: "Позвонить в аптеку",
    getDirections: "Как добраться",
    loading: "Загрузка аптек...",
    findingPharmacies: "Поиск аптек поблизости"
  },
  tr: {
    pharmacyNetwork: "Eczane Ağı",
    findNearbyPharmacies: "Yakındaki eczaneleri bul",
    getPrescriptionsFilled: "Reçetelerinizi yakınınızdaki doğrulanmış eczanelerden alın. Eve teslimat mevcut.",
    searchPharmaciesPlaceholder: "Eczaneleri ad veya konuma göre ara...",
    filters: "Filtreler",
    clearAll: "Tümünü temizle",
    deliveryAvailable: "Teslimat mevcut",
    acceptsPrescriptions: "Reçete kabul ediyor",
    verifiedOnly: "Sadece doğrulanmış",
    openNow: "Şimdi açık",
    pharmaciesFound: "eczane bulundu",
    usingYourLocation: "Konumunuz kullanılıyor",
    sortBy: "Sırala",
    topRated: "En yüksek puanlı",
    nameAZ: "Ad (A-Z)",
    distanceNearest: "Mesafe (En yakın)",
    noPharmaciesFound: "Eczane bulunamadı",
    tryAdjustingSearch: "Aradığınızı bulmak için aramanızı veya filtrelerinizi ayarlamayı deneyin.",
    clearAllFilters: "Tüm filtreleri temizle",
    verified: "Doğrulandı",
    delivery: "Teslimat",
    open: "Açık",
    closed: "Kapalı",
    acceptInsurance: "Sigorta kabul ediyor",
    freeDelivery: "Ücretsiz teslimat",
    prescriptionServices: "Reçete hizmetleri",
    viewDetails: "Detayları görüntüle",
    callPharmacy: "Eczaneyi ara",
    getDirections: "Yol tarifi al",
    loading: "Eczaneler yükleniyor...",
    findingPharmacies: "Yakındaki eczaneler aranıyor"
  },
  zh: {
    pharmacyNetwork: "药店网络",
    findNearbyPharmacies: "查找附近药店",
    getPrescriptionsFilled: "在您附近的认证药店配药。提供送货上门服务。",
    searchPharmaciesPlaceholder: "按名称或位置搜索药店...",
    filters: "筛选",
    clearAll: "全部清除",
    deliveryAvailable: "可配送",
    acceptsPrescriptions: "接受处方",
    verifiedOnly: "仅认证",
    openNow: "营业中",
    pharmaciesFound: "家药店",
    usingYourLocation: "使用您的位置",
    sortBy: "排序方式",
    topRated: "评分最高",
    nameAZ: "名称 (A-Z)",
    distanceNearest: "距离 (最近)",
    noPharmaciesFound: "未找到药店",
    tryAdjustingSearch: "尝试调整搜索或筛选条件以找到您想要的内容。",
    clearAllFilters: "清除所有筛选",
    verified: "已认证",
    delivery: "配送",
    open: "营业中",
    closed: "已关闭",
    acceptInsurance: "接受保险",
    freeDelivery: "免费配送",
    prescriptionServices: "处方服务",
    viewDetails: "查看详情",
    callPharmacy: "致电药店",
    getDirections: "获取路线",
    loading: "正在加载药店...",
    findingPharmacies: "正在查找附近药店"
  },
  ar: {
    pharmacyNetwork: "شبكة الصيدليات",
    findNearbyPharmacies: "ابحث عن الصيدليات القريبة",
    getPrescriptionsFilled: "احصل على أدويتك من صيدليات معتمدة بالقرب منك. التوصيل المنزلي متاح.",
    searchPharmaciesPlaceholder: "ابحث عن صيدليات بالاسم أو الموقع...",
    filters: "تصفية",
    clearAll: "مسح الكل",
    deliveryAvailable: "التوصيل متاح",
    acceptsPrescriptions: "يقبل الوصفات الطبية",
    verifiedOnly: "معتمد فقط",
    openNow: "مفتوح الآن",
    pharmaciesFound: "صيدلية وجدت",
    usingYourLocation: "استخدام موقعك",
    sortBy: "ترتيب حسب",
    topRated: "الأعلى تقييماً",
    nameAZ: "الاسم (أ-ي)",
    distanceNearest: "المسافة (الأقرب)",
    noPharmaciesFound: "لم يتم العثور على صيدليات",
    tryAdjustingSearch: "حاول تعديل بحثك أو عوامل التصفية للعثور على ما تبحث عنه.",
    clearAllFilters: "مسح جميع عوامل التصفية",
    verified: "معتمد",
    delivery: "التوصيل",
    open: "مفتوح",
    closed: "مغلق",
    acceptInsurance: "يقبل التأمين",
    freeDelivery: "توصيل مجاني",
    prescriptionServices: "خدمات الوصفات الطبية",
    viewDetails: "عرض التفاصيل",
    callPharmacy: "اتصل بالصيدلية",
    getDirections: "احصل على الاتجاهات",
    loading: "جاري تحميل الصيدليات...",
    findingPharmacies: "البحث عن صيدليات قريبة"
  }
};

// Languages
const languages = {
  en: { name: 'English', flag: '🇬🇧' },
  de: { name: 'German', flag: '🇩🇪' },
  es: { name: 'Spanish', flag: '🇪🇸' },
  fr: { name: 'French', flag: '🇫🇷' },
  it: { name: 'Italian', flag: '🇮🇹' },
  ja: { name: 'Japanese', flag: '🇯🇵' },
  ko: { name: 'Korean', flag: '🇰🇷' },
  pt: { name: 'Portuguese', flag: '🇵🇹' },
  ru: { name: 'Russian', flag: '🇷🇺' },
  tr: { name: 'Turkish', flag: '🇹🇷' },
  zh: { name: 'Chinese', flag: '🇨🇳' },
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

// Main function
function main() {
  console.log('💊 PharmacyList Page Translations Generator\n');
  console.log('Adding pharmacy page translations to all languages...\n');
  
  for (const [langCode, langInfo] of Object.entries(languages)) {
    const filePath = path.join(__dirname, '..', 'public', 'locales', langCode, 'translation.json');
    
    let existingTranslations = {};
    
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      existingTranslations = JSON.parse(fileContent);
    } catch (error) {
      console.log(`⚠ Could not read ${langInfo.name} file, creating new`);
    }
    
    // Merge pharmacy page translations
    const updatedTranslations = mergeTranslations(
      existingTranslations,
      { pharmacy: pharmacyPageTranslations[langCode] || pharmacyPageTranslations.en }
    );
    
    // Write updated file
    fs.writeFileSync(filePath, JSON.stringify(updatedTranslations, null, 2), 'utf-8');
    
    console.log(`✓ Updated ${langInfo.name} ${langInfo.flag}`);
  }
  
  console.log('\n✅ PharmacyList page translations added to all languages!');
  console.log('\n📝 Added keys:');
  console.log('   - pharmacyNetwork, findNearbyPharmacies, getPrescriptionsFilled');
  console.log('   - searchPharmaciesPlaceholder, filters, clearAll');
  console.log('   - deliveryAvailable, acceptsPrescriptions, verifiedOnly, openNow');
  console.log('   - pharmaciesFound, usingYourLocation, sortBy, topRated');
  console.log('   - noPharmaciesFound, tryAdjustingSearch, clearAllFilters');
  console.log('   - And more...');
}

main();
