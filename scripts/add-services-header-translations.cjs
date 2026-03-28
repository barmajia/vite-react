/**
 * Add missing ServicesHeader translations
 */

const fs = require('fs');
const path = require('path');

// Missing translations
const missingTranslations = {
  en: {
    services: {
      tech: "Technology",
      techDesc: "Software, web development, IT services",
      home: "Home",
      homeDesc: "Start here",
      providerDashboard: "Provider Dashboard",
      searchServices: "Search services...",
      servicesFound: "services found"
    }
  },
  de: {
    services: {
      tech: "Technologie",
      techDesc: "Software, Webentwicklung, IT-Dienste",
      home: "Startseite",
      homeDesc: "Hier beginnen",
      providerDashboard: "Anbieter-Dashboard",
      searchServices: "Dienste suchen...",
      servicesFound: "Dienste gefunden"
    }
  },
  es: {
    services: {
      tech: "Tecnología",
      techDesc: "Software, desarrollo web, servicios de TI",
      home: "Inicio",
      homeDesc: "Comienza aquí",
      providerDashboard: "Panel de proveedor",
      searchServices: "Buscar servicios...",
      servicesFound: "servicios encontrados"
    }
  },
  fr: {
    services: {
      tech: "Technologie",
      techDesc: "Logiciels, développement web, services IT",
      home: "Accueil",
      homeDesc: "Commencez ici",
      providerDashboard: "Tableau de bord du prestataire",
      searchServices: "Rechercher des services...",
      servicesFound: "services trouvés"
    }
  },
  it: {
    services: {
      tech: "Tecnologia",
      techDesc: "Software, sviluppo web, servizi IT",
      home: "Home",
      homeDesc: "Inizia qui",
      providerDashboard: "Dashboard del fornitore",
      searchServices: "Cerca servizi...",
      servicesFound: "servizi trovati"
    }
  },
  ja: {
    services: {
      tech: "テクノロジー",
      techDesc: "ソフトウェア、Web 開発、IT サービス",
      home: "ホーム",
      homeDesc: "ここから始める",
      providerDashboard: "プロバイダーダッシュボード",
      searchServices: "サービスを検索...",
      servicesFound: "件のサービスが見つかりました"
    }
  },
  ko: {
    services: {
      tech: "기술",
      techDesc: "소프트웨어, 웹 개발, IT 서비스",
      home: "홈",
      homeDesc: "여기서 시작",
      providerDashboard: "제공자 대시보드",
      searchServices: "서비스 검색...",
      servicesFound: "개의 서비스 발견"
    }
  },
  pt: {
    services: {
      tech: "Tecnologia",
      techDesc: "Software, desenvolvimento web, serviços de TI",
      home: "Início",
      homeDesc: "Comece aqui",
      providerDashboard: "Painel do provedor",
      searchServices: "Buscar serviços...",
      servicesFound: "serviços encontrados"
    }
  },
  ru: {
    services: {
      tech: "Технологии",
      techDesc: "ПО, веб-разработка, ИТ-услуги",
      home: "Главная",
      homeDesc: "Начните здесь",
      providerDashboard: "Панель провайдера",
      searchServices: "Поиск услуг...",
      servicesFound: "услуг найдено"
    }
  },
  tr: {
    services: {
      tech: "Teknoloji",
      techDesc: "Yazılım, web geliştirme, BT hizmetleri",
      home: "Ana Sayfa",
      homeDesc: "Buradan başlayın",
      providerDashboard: "Sağlayıcı kontrol paneli",
      searchServices: "Hizmet ara...",
      servicesFound: "hizmet bulundu"
    }
  },
  zh: {
    services: {
      tech: "技术",
      techDesc: "软件、Web 开发、IT 服务",
      home: "首页",
      homeDesc: "从这里开始",
      providerDashboard: "服务提供商仪表板",
      searchServices: "搜索服务...",
      servicesFound: "个服务"
    }
  },
  ar: {
    services: {
      tech: "التكنولوجيا",
      techDesc: "البرمجيات، تطوير الويب، خدمات تكنولوجيا المعلومات",
      home: "الرئيسية",
      homeDesc: "ابدأ من هنا",
      providerDashboard: "لوحة تحكم مقدم الخدمة",
      searchServices: "بحث عن خدمات...",
      servicesFound: "خدمات وجدت"
    }
  }
};

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

function main() {
  console.log('🔧 Adding missing ServicesHeader translations\n');
  
  for (const [langCode, langInfo] of Object.entries(languages)) {
    const filePath = path.join(__dirname, '..', 'public', 'locales', langCode, 'translation.json');
    
    let existingTranslations = {};
    
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      existingTranslations = JSON.parse(fileContent);
    } catch (error) {
      console.log(`⚠ Could not read ${langInfo.name} file`);
      continue;
    }
    
    const updatedTranslations = mergeTranslations(
      existingTranslations,
      missingTranslations[langCode] || missingTranslations.en
    );
    
    fs.writeFileSync(filePath, JSON.stringify(updatedTranslations, null, 2), 'utf-8');
    
    console.log(`✓ Updated ${langInfo.name} ${langInfo.flag}`);
  }
  
  console.log('\n✅ ServicesHeader translations added to all languages!');
}

main();
