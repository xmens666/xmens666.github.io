// i18n translation system for ZenCode.jp
// Supports: zh (default), en, ja
// Usage: t('key') returns translation based on current lang

const I18N = {
  // Nav
  nav_home:        { zh: '首页',     en: 'Home',       ja: 'ホーム' },
  nav_solutions:   { zh: '解决方案', en: 'Solutions',   ja: 'ソリューション' },
  nav_pricing:     { zh: '服务定价', en: 'Pricing',     ja: '料金プラン' },
  nav_tech:        { zh: '技术栈',   en: 'Tech Stack',  ja: '技術スタック' },
  nav_cases:       { zh: '成功案例', en: 'Case Studies', ja: '実績' },
  nav_demo:        { zh: '小程序演示', en: 'Mini-app Demo', ja: 'ミニアプリ' },
  nav_about:       { zh: '关于我们', en: 'About Us',    ja: '私たちについて' },
  nav_cta:         { zh: '免费咨询方案', en: 'Free Consultation', ja: '無料相談' },
  nav_lang_switch: { zh: 'Switch to English', en: '日本語に切替', ja: '切换到中文' },

  // Loading
  loading_text: { zh: '构建未来的数字资产', en: 'Building Future Digital Assets', ja: 'デジタル資産を構築中' },

  // Hero Slide 0
  hero_badge_0:    { zh: '世界已进入代码纪元', en: 'THE WORLD RUNS ON CODE', ja: 'コードの時代へ' },
  hero_title_0a:   { zh: '以「你」为原点',     en: 'Center on YOU',        ja: '「あなた」を起点に' },
  hero_title_0b:   { zh: '数字化链接世界',     en: 'Digitally Connect the World', ja: 'デジタルで世界とつながる' },
  hero_desc_0:     { zh: '人肉沟通的时代已经过去。', en: 'The era of manual communication is over.', ja: '手作業の時代は終わりました。' },
  hero_desc_0b:    { zh: '用代码构建你的数字宇宙，让客户 24 小时触手可及。', en: 'Build your digital universe with code, and make your customers reachable 24/7.', ja: 'コードでデジタル世界を構築し、24時間顧客にリーチ。' },
  hero_cta_cases:  { zh: '查看成功案例', en: 'View Case Studies', ja: '実績を見る' },
  hero_cta_demo:   { zh: '线上功能体验', en: 'Try Demo',          ja: 'デモ体験' },
  hero_loading:    { zh: '品牌资产构建中...', en: 'BUILDING ASSETS...', ja: 'ブランド資産構築中...' },

  // Hero Slide 1
  hero_badge_1:    { zh: '核心品牌资产', en: 'CORE BRAND ASSET', ja: 'コアブランド資産' },
  hero_title_1:    { zh: '原生定制开发', en: 'Native APP Development', ja: 'ネイティブアプリ開発' },
  hero_desc_1:     { zh: '苹果和安卓同时构建,帮您上架 Apple Store 和 Google Play', en: 'Listed on App Store & Google Play for ultimate brand trust and retention.', ja: 'App StoreとGoogle Playに同時掲載、ブランド信頼度を最大化' },
  feat_perf:       { zh: '极致性能', en: 'Peak Performance', ja: '極限性能' },
  feat_perf_desc:  { zh: '秒开、流畅、稳定', en: 'Fast & stable', ja: '高速・安定' },
  feat_reach:      { zh: '精准触达', en: 'Precise Reach', ja: '精密リーチ' },
  feat_reach_desc: { zh: '推送唤醒用户', en: 'Push notifications', ja: 'プッシュ通知' },
  feat_data:       { zh: '私有数据', en: 'Private Data', ja: 'プライベートデータ' },
  feat_data_desc:  { zh: '完全掌握数据', en: 'Full data control', ja: 'データ完全管理' },
  hero_cta_1:      { zh: '即用方案', en: 'Solutions', ja: 'ソリューション' },

  // Hero Slide 2
  hero_badge_2:    { zh: '把"点赞之交" 变成 "下单铁粉"', en: 'CONVERT TRAFFIC TO SALES', ja: 'いいねを売上に変える' },
  hero_time:       { zh: '24小时', en: '24/7', ja: '24時間' },
  hero_system:     { zh: '自动接单系统', en: 'Auto Sales System', ja: '自動受注システム' },
  hero_desc_2:     { zh: '还在手动回微信报价？还在用 Excel 记账？<br>用小程序实现 <span class="text-emerald-400 font-medium">自助下单、自动结算、会员管理</span>。<br>省下一个人工的钱，就是 <span class="font-bold text-red-500">纯利润</span>。', en: 'Still quoting manually? Automate ordering & billing. Saving labor cost is pure profit.', ja: 'まだ手動で見積もり？注文・決済を自動化。人件費削減がそのまま純利益に。' },
  hero_cta_2:      { zh: '体验演示版', en: 'Try Demo', ja: 'デモ体験' },

  // Hero Slide 3
  hero_badge_3:    { zh: '不仅写代码，还是懂技术的合伙人', en: 'YOUR TECH PARTNER', ja: '技術パートナー' },
  hero_title_3:    { zh: '更懂在日华人的生意', en: 'We Know Your Business', ja: '在日中国人のビジネスを熟知' },
  hero_loc:        { zh: '坐标东京/大阪 · 随时可约面谈', en: 'BASED IN TOKYO/OSAKA', ja: '東京/大阪拠点 · いつでも面談可能' },
  hero_desc_3:     { zh: '我们不仅仅是开发商，更是您的<span class="text-emerald-400 font-normal">数字化战略顾问</span>。从服务器搭建到支付接口对接（<span class="text-emerald-400">微信/支付宝/PayPay</span>），我们帮您搞定一切技术难题，您只管<span class="text-red-500 font-medium">安心赚钱</span>。', en: 'We\'re not just developers — we\'re your <span class="text-emerald-400 font-normal">digital strategy consultants</span>. From servers to payment integration (<span class="text-emerald-400">WeChat Pay / Alipay / PayPay</span>), we handle all tech so you can <span class="text-red-500 font-medium">focus on revenue</span>.', ja: '開発会社ではなく、<span class="text-emerald-400 font-normal">デジタル戦略パートナー</span>。サーバー構築から決済連携（<span class="text-emerald-400">WeChat Pay/Alipay/PayPay</span>）まで、技術課題をすべて解決。<span class="text-red-500 font-medium">安心して収益に集中</span>してください。' },
  hero_cta_3:      { zh: '预约面谈', en: 'Book a Meeting', ja: '面談予約' },

  // Target Audience Section
  target_badge:    { zh: '打破平台束缚', en: 'BREAK FREE FROM PLATFORMS', ja: 'プラットフォームの束縛を打破' },
  target_title:    { zh: '拥有自己的小程序', en: 'Own Your Mini-Program', ja: '自分のミニプログラムを持つ' },
  target_desc:     { zh: '做生意的终局，不是靠短信电话，而是拥有自己的 <span class="font-bold text-blue-600">预约系统</span>。别让您的客户只沉淀在"认识你"。拥有 <span class="font-bold text-blue-600">独立的 APP 与官网</span>，意味着您可以把客户关系、服务流程与定价逻辑，真正 <span class="font-bold text-emerald-500">掌握在自己手中</span>。', en: 'The end game of business isn\'t phone calls — it\'s owning your <span class="font-bold text-blue-600">booking system</span>. With your own <span class="font-bold text-blue-600">APP and website</span>, you truly <span class="font-bold text-emerald-500">control</span> customer relationships, workflows, and pricing.', ja: 'ビジネスの最終形は電話営業ではなく、自分の<span class="font-bold text-blue-600">予約システム</span>を持つこと。<span class="font-bold text-blue-600">独自のAPPと公式サイト</span>で、顧客関係・業務フロー・価格設定を<span class="font-bold text-emerald-500">完全にコントロール</span>。' },

  // Audience Cards
  card1_title:     { zh: '跨境电商 / 品牌主理人', en: 'Cross-border E-commerce', ja: '越境EC / ブランドオーナー' },
  card1_f1:        { zh: '建立专业独立商城', en: 'Professional online store', ja: '独立ECサイト構築' },
  card1_f2:        { zh: '多币种 & 自动汇率', en: 'Multi-currency & auto rates', ja: '多通貨対応' },
  card1_f3:        { zh: '客户自助查物流', en: 'Self-serve tracking', ja: '物流セルフ追跡' },
  card1_f4:        { zh: '私域客户沉淀', en: 'Private customer retention', ja: '顧客データ蓄積' },

  card2_title:     { zh: '专业车队 / 旅游地接', en: 'Fleet & Travel Services', ja: '車両 / 旅行サービス' },
  card2_f1:        { zh: '拒绝平台高抽成', en: 'No platform fees', ja: 'プラットフォーム手数料なし' },
  card2_f2:        { zh: '自主定价接单', en: 'Set your own prices', ja: '自由な価格設定' },
  card2_f3:        { zh: '智能排班调度', en: 'Smart scheduling', ja: 'スマート配車' },
  card2_f4:        { zh: '承接海外大单', en: 'Handle overseas orders', ja: '海外大口受注' },

  card3_title:     { zh: '实体连锁 / 餐饮名店', en: 'Retail & Restaurants', ja: '小売・飲食チェーン' },
  card3_f1:        { zh: '扫码点单系统', en: 'QR code ordering', ja: 'QRコード注文' },
  card3_f2:        { zh: '会员储值体系', en: 'Member prepaid system', ja: '会員プリペイド' },
  card3_f3:        { zh: '自动营销发券', en: 'Auto marketing coupons', ja: '自動クーポン配信' },
  card3_f4:        { zh: '线上线下联动', en: 'Online-offline integration', ja: 'オンライン・オフライン連携' },

  card4_title:     { zh: '不动产 / 留学教育', en: 'Real Estate & Education', ja: '不動産 / 留学教育' },
  card4_f1:        { zh: '信息库自助筛选', en: 'Self-serve database', ja: 'データベース検索' },
  card4_f2:        { zh: '预约 & CRM 系统', en: 'Booking & CRM', ja: '予約 & CRM' },
  card4_f3:        { zh: '展示成功案例', en: 'Showcase success stories', ja: '実績紹介' },
  card4_f4:        { zh: '打造行业标杆', en: 'Set industry benchmarks', ja: '業界ベンチマーク' },

  // Portfolio Section
  portfolio_badge: { zh: '我们的交付标准', en: 'OUR DELIVERY STANDARD', ja: '納品基準' },
  portfolio_title: { zh: '稳住本盘、收割新流量', en: 'Retain & Grow', ja: '既存顧客を守り、新規を獲得' },
  portfolio_desc:  { zh: '别让您的生意只有"回头客"。APP 既是老客户的 <span class="font-bold text-blue-600">专属服务区</span>，也是陌生客户的 <span class="font-bold text-blue-600">流量捕获器</span>。老客不流失，新客源源不断，生意自然越做越大。', en: 'Don\'t rely only on repeat customers. Your APP is both a <span class="font-bold text-blue-600">VIP service zone</span> for loyal clients and a <span class="font-bold text-blue-600">traffic magnet</span> for new ones.', ja: 'リピーターだけに頼らない。APPは既存顧客の<span class="font-bold text-blue-600">専用サービス</span>であり、新規顧客の<span class="font-bold text-blue-600">集客ツール</span>でもあります。' },

  port_app_title:  { zh: '原生 APP 开发', en: 'Native APP Development', ja: 'ネイティブAPP開発' },
  port_web_title:  { zh: '品牌官网落地页', en: 'Brand Landing Page', ja: 'ブランド公式サイト' },
  port_web_desc:   { zh: '既然要做，就做最好。让日本客户在 Google 搜索到的瞬间，就被您的企业形象折服。', en: 'If you\'re going to do it, do it right. Impress Japanese customers the moment they find you on Google.', ja: 'やるなら最高のものを。Google検索の瞬間にお客様を魅了する企業イメージを。' },
  port_wx_title:   { zh: '微信小程序矩阵', en: 'WeChat Mini-Program Ecosystem', ja: 'WeChatミニプログラム' },
  port_wx_desc:    { zh: '连接微信生态内的十亿用户。无需安装、扫码即用、社交裂变，是在日华人圈获客成本最低、传播速度最快的渠道。', en: 'Connect with 1 billion WeChat users. No install needed, scan & use, viral growth — the cheapest acquisition channel for Chinese communities in Japan.', ja: 'WeChat10億ユーザーとつながる。インストール不要、スキャンで即利用、バイラル成長。在日中国人コミュニティで最もコスパの高い集客チャネル。' },

  // Footer
  footer_slogan:   { zh: '赋能在日华商，让生意更简单。', en: 'Empowering Chinese merchants in Japan.', ja: '在日中国人ビジネスを支援。' },
  footer_trust:    { zh: '信任保障', en: 'Trust & Security', ja: '信頼と安全' },
  footer_ssl:      { zh: 'SSL安全认证', en: 'SSL Certification', ja: 'SSL証明書' },
  footer_payment:  { zh: '聚合支付对接', en: 'Payment Integration', ja: '決済連携' },
  footer_contact:  { zh: '联系我们', en: 'Contact Us', ja: 'お問い合わせ' },
  footer_nav:      { zh: '快速导航', en: 'Quick Links', ja: 'クイックナビ' },

  // WeChat
  wechat_contact:  { zh: '微信联系', en: 'WeChat', ja: 'WeChat連絡' },
  wechat_copy:     { zh: '点击复制微信号', en: 'Copy WeChat ID', ja: 'WeChat IDをコピー' },
  wechat_copied:   { zh: '已复制!', en: 'Copied!', ja: 'コピー済み!' },

  // App Preview Section (dongyingyouxia)
  app_coming:      { zh: '即将上线', en: 'Coming Soon', ja: '近日公開' },
  app_title:       { zh: '「东瀛游侠」APP', en: 'Dongyingyouxia APP', ja: '「東瀛遊侠」APP' },
  app_subtitle:    { zh: '在日华人一站式生活平台，连接服务、交易、社交与社区', en: 'All-in-one lifestyle platform for Chinese in Japan', ja: '在日中国人のワンストップ生活プラットフォーム' },
  app_expand:      { zh: '点击展开', en: 'Click to expand', ja: 'クリックで展開' },
  app_collapse:    { zh: '收起', en: 'Collapse', ja: '閉じる' },
  app_download:    { zh: '立即下载体验', en: 'Download Now', ja: '今すぐダウンロード' },
  app_ios:         { zh: 'iOS 下载', en: 'iOS Download', ja: 'iOSダウンロード' },
  app_android:     { zh: 'Android 下载', en: 'Android Download', ja: 'Androidダウンロード' },
  app_status:      { zh: '当前状态：上架审核中', en: 'Status: Under Review', ja: 'ステータス：審査中' },
  app_android_only:{ zh: '当前仅支持安卓手机测试使用', en: 'Currently Android only for testing', ja: '現在Androidのみテスト利用可能' },
  app_visit:       { zh: '访问官网', en: 'Visit Website', ja: '公式サイト' },
  app_collapse_detail: { zh: '收起详情', en: 'Collapse', ja: '詳細を閉じる' },
  app_start_dl:    { zh: '开始下载', en: 'Start Download', ja: 'ダウンロード開始' },
  app_cancel:      { zh: '取消', en: 'Cancel', ja: 'キャンセル' },

  // RoastDuck Section
  duck_badge:      { zh: '正在开发', en: 'In Development', ja: '開発中' },
  duck_title:      { zh: '「徐记烤鸭」APP+网页', en: 'XuJi Roast Duck APP+Web', ja: '「徐記ロースダック」APP+Web' },
  duck_desc:       { zh: '北京果木挂炉烤鸭，传承百年技艺，地道北京味', en: 'Authentic Beijing wood-fired roast duck, century-old tradition', ja: '北京伝統の薪窯ローストダック、百年の技' },
  duck_cta:        { zh: '访问网站', en: 'Visit Website', ja: 'サイトを見る' },
};

// Current language state
let _currentLang = 'zh';

// Get translation by key
function t(key) {
  const entry = I18N[key];
  if (!entry) return key;
  return entry[_currentLang] || entry.zh || key;
}

// Apply all translations to elements with data-i18n attribute
function applyTranslations(lang) {
  _currentLang = lang || 'zh';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (val) {
      // Use innerHTML for entries containing HTML tags
      if (val.includes('<')) {
        el.innerHTML = val;
      } else {
        el.textContent = val;
      }
    }
  });
  // Update page title
  document.title = `ZenCode - ${t('nav_cta')}`;
}

// Cycle language: zh → en → ja → zh
function nextLang(current) {
  const order = ['zh', 'en', 'ja'];
  const idx = order.indexOf(current);
  return order[(idx + 1) % 3];
}

// Language display label
function langLabel(lang) {
  return { zh: '中文', en: 'EN', ja: '日本語' }[lang] || 'EN';
}
