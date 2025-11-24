export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  twitterTitle: string;
  twitterDescription: string;
  schemaName: string;
  schemaDescription: string;
}

/**
 * 更新页面的所有SEO相关meta标签
 */
export function updateSEOMetadata(metadata: SEOMetadata, lang: string, baseUrl: string = 'https://crop.nipao.com') {
  // 更新 html lang 属性
  document.documentElement.lang = lang;

  // 更新 title
  document.title = metadata.title;

  // 更新或创建 meta 标签的辅助函数
  const setMetaTag = (selector: string, content: string) => {
    let element = document.querySelector(selector);
    if (!element) {
      element = document.createElement('meta');
      const [attr, value] = selector.match(/\[(.*?)="(.*?)"\]/)?.slice(1, 3) || [];
      if (attr && value) {
        element.setAttribute(attr, value);
        document.head.appendChild(element);
      }
    }
    element.setAttribute('content', content);
  };

  // 基础 meta 标签
  setMetaTag('meta[name="description"]', metadata.description);
  setMetaTag('meta[name="keywords"]', metadata.keywords);

  // Open Graph 标签
  setMetaTag('meta[property="og:title"]', metadata.ogTitle);
  setMetaTag('meta[property="og:description"]', metadata.ogDescription);
  setMetaTag('meta[property="og:url"]', `${baseUrl}/?lang=${lang}`);

  // Twitter 标签
  setMetaTag('meta[property="twitter:title"]', metadata.twitterTitle);
  setMetaTag('meta[property="twitter:description"]', metadata.twitterDescription);
  setMetaTag('meta[property="twitter:url"]', `${baseUrl}/?lang=${lang}`);

  // 更新 Schema.org 结构化数据
  updateStructuredData(metadata, lang, baseUrl);

  // 更新 hreflang 标签
  updateHreflangTags(baseUrl);
}

/**
 * 更新 Schema.org 结构化数据
 */
function updateStructuredData(metadata: SEOMetadata, lang: string, baseUrl: string) {
  const schemaScript = document.querySelector('script[type="application/ld+json"]');
  if (schemaScript) {
    const schemaData = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": metadata.schemaName,
      "alternateName": lang === 'zh' ? "Sticker Grid Slicer" : "表情包切图工具",
      "description": metadata.schemaDescription,
      "url": `${baseUrl}/?lang=${lang}`,
      "inLanguage": lang,
      "applicationCategory": "UtilityApplication",
      "operatingSystem": "Web Browser",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "featureList": lang === 'zh' 
        ? ["自定义网格切割", "批量导出ZIP", "本地处理保护隐私", "支持多种图片格式"]
        : ["Custom grid slicing", "Batch export to ZIP", "Local processing for privacy", "Support for multiple image formats"]
    };
    schemaScript.textContent = JSON.stringify(schemaData, null, 2);
  }
}

/**
 * 更新 hreflang 标签
 */
function updateHreflangTags(baseUrl: string) {
  // 移除现有的 hreflang 标签
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());

  // 添加新的 hreflang 标签
  const languages = [
    { lang: 'zh', url: `${baseUrl}/?lang=zh` },
    { lang: 'en', url: `${baseUrl}/?lang=en` },
    { lang: 'x-default', url: baseUrl }
  ];

  languages.forEach(({ lang, url }) => {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = lang;
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * 从 URL 获取语言参数
 */
export function getLanguageFromURL(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('lang');
}

/**
 * 更新 URL 的语言参数
 */
export function updateLanguageInURL(lang: string) {
  const url = new URL(window.location.href);
  url.searchParams.set('lang', lang);
  window.history.pushState({}, '', url.toString());
}

/**
 * 检测浏览器语言
 */
export function detectBrowserLanguage(): 'en' | 'zh' {
  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith('zh') ? 'zh' : 'en';
}
