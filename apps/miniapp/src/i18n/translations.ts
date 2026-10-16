export type Lang = 'uz' | 'ru';

export const LANGS: { code: Lang; label: string }[] = [
  { code: 'uz', label: "🇺🇿 O'zbek" },
  { code: 'ru', label: '🇷🇺 Русский' },
];

export interface Dictionary {
  cart: string;
  myOrders: string;
  admin: string;
  catalog: string;
  searchPlaceholder: string;
  all: string;
  noProductsFound: string;
  outOfStock: string;
  addToCart: string;
  availability: string;
  inStock: string;
  leftStock: string;
  somethingWentWrong: string;
  pleaseReopen: string;
  couldNotSignIn: string;
  openInTelegram: string;
  openInTelegramDesc: string;
  cartEmptyHeader: string;
  cartEmptyDesc: string;
  total: string;
  checkout: string;
  checkoutWithPrice: string;
  remove: string;
  noOrdersYetHeader: string;
  noOrdersYetDesc: string;
  myOrdersHeader: string;
  orderNumber: string;
  item: string;
  items: string;
  adminsOnly: string;
  allOrders: string;
  noOrders: string;
  fulfill: string;
  cancel: string;
  addProduct: string;
  titleLabel: string;
  slugLabel: string;
  priceLabel: string;
  descriptionLabel: string;
  createProduct: string;
  createdProduct: string;
  failedToCreateProduct: string;
  checkoutFailed: string;
  productNotFound: string;
  launchFromTelegram: string;
  authenticationFailed: string;
  statusPending: string;
  statusAwaitingPayment: string;
  statusPaid: string;
  statusCancelled: string;
  statusFulfilled: string;
  payHeader: string;
  amountToPay: string;
  cardNumberLabel: string;
  cardHolderLabel: string;
  paymentInstructionsLabel: string;
  noCardConfigured: string;
  uploadReceiptLabel: string;
  chooseFile: string;
  submitReceipt: string;
  receiptSubmitted: string;
  receiptSubmitFailed: string;
  orderCreateFailed: string;
  shopSettingsHeader: string;
  cardNumberPlaceholder: string;
  cardHolderPlaceholder: string;
  paymentInstructionsPlaceholder: string;
  saveSettings: string;
  settingsSaved: string;
  saveSettingsFailed: string;
  confirmPayment: string;
  receiptLabel: string;
  adminsHeader: string;
  roleAdmin: string;
  promote: string;
  demote: string;
  addAdminByIdLabel: string;
  telegramIdPlaceholder: string;
  addAdmin: string;
  invalidTelegramId: string;
  roleChangeFailed: string;
  bannersHeader: string;
  addBanner: string;
  bannerLinkProductLabel: string;
  bannerLinkProductPlaceholder: string;
  bannerNoLink: string;
  bannerLinkedProduct: string;
  bannerAddFailed: string;
  tabHome: string;
  tabSearch: string;
  tabCart: string;
  tabProfile: string;
  searchHint: string;
  topRankLabel: string;
  completedOrdersLabel: string;
  pendingOrdersLabel: string;
  totalSpentLabel: string;
  viewAllOrders: string;
  addressHeader: string;
  addressPlaceholder: string;
  saveAddress: string;
  languageHeader: string;
  promoCodeLabel: string;
  promoCodePlaceholder: string;
  applyPromo: string;
  promoApplied: string;
  promoInvalid: string;
  discountLabel: string;
  promoCodesHeader: string;
  addPromoCode: string;
  promoCodeValueLabel: string;
  discountPercentLabel: string;
  maxUsesLabel: string;
  maxUsesPlaceholder: string;
  promoCodeCreateFailed: string;
  usedLabel: string;
  unlimitedLabel: string;
  manageProductsHeader: string;
  editProduct: string;
  deleteProduct: string;
  productUpdateFailed: string;
  productDeleteFailed: string;
  saveChanges: string;
  manageCategoriesHeader: string;
  addCategory: string;
  categorySaveFailed: string;
  categoryDeleteFailed: string;
  productCountLabel: string;
  inactiveLabel: string;
  greetingLabel: string;
  favoriteLabel: string;
  searchResultsFor: string;
  resultsFoundLabel: string;
  ordersTabActive: string;
  ordersTabCompleted: string;
  ordersTabCancelled: string;
  statusAccepted: string;
  statusInDelivery: string;
  statusAtWarehouse: string;
  statusShipped: string;
  statusInChina: string;
  statusAtChinaBorder: string;
  statusDelivered: string;
  categoryLabel: string;
  noCategoryLabel: string;
  productImagesLabel: string;
  addImage: string;
  colorsLabel: string;
  addColor: string;
  colorNamePlaceholder: string;
  sizesLabel: string;
  addSize: string;
  sizePlaceholder: string;
  buyNow: string;
  acceptOrder: string;
  markAtWarehouse: string;
  markShipped: string;
  markInChina: string;
  markAtChinaBorder: string;
  markDelivered: string;
  colorLabel: string;
  sizeLabel: string;
  viewFullscreenLabel: string;
  chooseColorFirst: string;
  chooseSizeFirst: string;
  adminTabProducts: string;
  adminTabPayments: string;
  adminTabOrders: string;
  adminTabStats: string;
  receiptsReviewHeader: string;
  noPendingReceipts: string;
  rejectReceipt: string;
  statsHeader: string;
  totalRevenueLabel: string;
  userCountLabel: string;
  orderCountLabel: string;
  channelSaveFailed: string;
  requiredChannelsHeader: string;
  noRequiredChannels: string;
  channelTitleLabel: string;
  channelTitlePlaceholder: string;
  channelUsernameLabel: string;
  channelUsernamePlaceholder: string;
  addChannel: string;
  viewReceiptLabel: string;
}

export const dictionaries: Record<Lang, Dictionary> = {
  uz: {
    cart: '🛒 Savat',
    myOrders: '📦 Buyurtmalarim',
    admin: '🛠️ Admin',
    catalog: 'Katalog',
    searchPlaceholder: 'Mahsulot qidirish',
    all: 'Hammasi',
    noProductsFound: 'Mahsulot topilmadi',
    outOfStock: 'Tugagan',
    addToCart: "Savatga qo'shish",
    availability: 'Mavjudligi',
    inStock: 'Mavjud',
    leftStock: '{{count}} dona qoldi',
    somethingWentWrong: 'Xatolik yuz berdi',
    pleaseReopen: 'Ilovani qaytadan oching',
    couldNotSignIn: 'Kirish amalga oshmadi',
    openInTelegram: 'Telegram orqali oching',
    openInTelegramDesc: 'Bu Mini App faqat Telegram ilovasi ichida ishlaydi.',
    cartEmptyHeader: 'Savatingiz boʻsh',
    cartEmptyDesc: "Katalogdan mahsulot qo'shing",
    total: 'Jami',
    checkout: 'Buyurtma berish',
    checkoutWithPrice: 'Buyurtma berish · {{price}}',
    remove: "O'chirish",
    noOrdersYetHeader: 'Hali buyurtma yoʻq',
    noOrdersYetDesc: 'Buyurtmalaringiz shu yerda koʻrinadi',
    myOrdersHeader: 'Buyurtmalarim',
    orderNumber: 'Buyurtma #{{id}}',
    item: 'mahsulot',
    items: 'mahsulot',
    adminsOnly: 'Faqat adminlar uchun',
    allOrders: 'Barcha buyurtmalar',
    noOrders: 'Buyurtmalar yoʻq',
    fulfill: 'Bajarildi',
    cancel: 'Bekor qilish',
    addProduct: "Mahsulot qo'shish",
    titleLabel: 'Nomi',
    slugLabel: 'Slug (kebab-case)',
    priceLabel: 'Narxi ({{currency}})',
    descriptionLabel: 'Tavsif',
    createProduct: 'Mahsulot yaratish',
    createdProduct: '"{{title}}" yaratildi',
    failedToCreateProduct: 'Mahsulot yaratishda xatolik',
    checkoutFailed: "To'lov amalga oshmadi",
    productNotFound: 'Mahsulot topilmadi',
    launchFromTelegram: 'Ilovani Telegram orqali oching',
    authenticationFailed: 'Avtorizatsiya amalga oshmadi',
    statusPending: 'Kutilmoqda',
    statusAwaitingPayment: 'Tasdiqlanishi kutilmoqda',
    statusPaid: "To'langan",
    statusCancelled: 'Bekor qilingan',
    statusFulfilled: 'Bajarilgan',
    payHeader: "To'lov",
    amountToPay: "To'lov summasi",
    cardNumberLabel: 'Karta raqami',
    cardHolderLabel: 'Karta egasi',
    paymentInstructionsLabel: "To'lov bo'yicha ko'rsatma",
    noCardConfigured: "To'lov usuli hali sozlanmagan. Admin bilan bog'laning.",
    uploadReceiptLabel: "To'lov chekini (skrinshot) yuklang",
    chooseFile: 'Fayl tanlash',
    submitReceipt: 'Yuborish',
    receiptSubmitted: 'Chek yuborildi. Admin tasdiqlashini kuting.',
    receiptSubmitFailed: 'Chekni yuborib bo‘lmadi',
    orderCreateFailed: 'Buyurtma yaratilmadi',
    shopSettingsHeader: "To'lov sozlamalari",
    cardNumberPlaceholder: 'Masalan: 8600 1234 5678 9012',
    cardHolderPlaceholder: 'Masalan: ISLOM ISLOMOV',
    paymentInstructionsPlaceholder: "Mijozlarga ko'rinadigan qo'shimcha matn",
    saveSettings: 'Saqlash',
    settingsSaved: 'Saqlandi',
    saveSettingsFailed: 'Saqlashda xatolik',
    confirmPayment: "To'lovni tasdiqlash",
    receiptLabel: 'Chek',
    adminsHeader: 'Adminlar',
    roleAdmin: 'Admin',
    promote: 'Admin qilish',
    demote: 'Adminlikdan olish',
    addAdminByIdLabel:
      "Telegram ID orqali admin qo'shish (foydalanuvchi botni kamida bir marta ochgan bo'lishi kerak)",
    telegramIdPlaceholder: 'Masalan: 123456789',
    addAdmin: "Qo'shish",
    invalidTelegramId: "Telegram ID noto'g'ri",
    roleChangeFailed: 'Amal bajarilmadi',
    bannersHeader: 'Bannerlar',
    addBanner: "Banner qo'shish",
    bannerLinkProductLabel: "Mahsulotga bog'lash (ixtiyoriy)",
    bannerLinkProductPlaceholder: 'Mahsulotni tanlang yoki ID kiriting',
    bannerNoLink: "Bog'lanmagan",
    bannerLinkedProduct: 'Mahsulot',
    bannerAddFailed: 'Bannerni saqlab bo‘lmadi',
    tabHome: 'Asosiy',
    tabSearch: 'Qidiruv',
    tabCart: 'Savat',
    tabProfile: 'Profil',
    searchHint: 'Mahsulot nomini yozing',
    topRankLabel: 'Reyting',
    completedOrdersLabel: 'Bajarilgan',
    pendingOrdersLabel: 'Jarayonda',
    totalSpentLabel: 'Jami xarid qilingan',
    viewAllOrders: "Barcha buyurtmalarni ko'rish",
    addressHeader: 'Yetkazib berish manzili',
    addressPlaceholder: "Shahar, ko'cha, uy raqami...",
    saveAddress: 'Manzilni saqlash',
    languageHeader: 'Til',
    promoCodeLabel: 'Promo-kod',
    promoCodePlaceholder: 'Promo-kodni kiriting',
    applyPromo: "Qo'llash",
    promoApplied: "Promo-kod qo'llandi",
    promoInvalid: "Promo-kod noto'g'ri yoki muddati o'tgan",
    discountLabel: 'Chegirma',
    promoCodesHeader: 'Promo-kodlar',
    addPromoCode: "Promo-kod qo'shish",
    promoCodeValueLabel: 'Kod',
    discountPercentLabel: 'Chegirma (%)',
    maxUsesLabel: 'Maksimal ishlatish soni (ixtiyoriy)',
    maxUsesPlaceholder: 'Cheklanmagan',
    promoCodeCreateFailed: 'Promo-kod yaratilmadi',
    usedLabel: 'Ishlatilgan',
    unlimitedLabel: 'Cheksiz',
    manageProductsHeader: 'Mahsulotlarni boshqarish',
    editProduct: 'Tahrirlash',
    deleteProduct: "O'chirish",
    productUpdateFailed: 'Saqlashda xatolik',
    productDeleteFailed: "O'chirishda xatolik",
    saveChanges: 'Saqlash',
    manageCategoriesHeader: 'Kategoriyalar',
    addCategory: "Kategoriya qo'shish",
    categorySaveFailed: 'Saqlashda xatolik',
    categoryDeleteFailed: "O'chirishda xatolik",
    productCountLabel: 'mahsulot',
    inactiveLabel: 'Nofaol',
    greetingLabel: 'Salom!',
    favoriteLabel: 'Sevimlilarga qo‘shish',
    searchResultsFor: 'Natijalar:',
    resultsFoundLabel: '{{count}} ta natija',
    ordersTabActive: 'Faol',
    ordersTabCompleted: 'Bajarilgan',
    ordersTabCancelled: 'Bekor qilingan',
    statusAccepted: 'Qabul qilindi',
    statusInDelivery: 'Yetkazib berish jarayonida',
    statusAtWarehouse: 'Omborga kelib tushdi',
    statusShipped: "Pochtaga jo'natildi",
    categoryLabel: 'Kategoriya',
    noCategoryLabel: 'Kategoriyasiz',
    productImagesLabel: "Qo'shimcha rasmlar",
    addImage: "Rasm qo'shish",
    colorsLabel: 'Ranglar',
    addColor: "Rang qo'shish",
    colorNamePlaceholder: 'Masalan: Oq',
    sizesLabel: "O'lchamlar",
    addSize: "O'lcham qo'shish",
    sizePlaceholder: 'Masalan: M',
    buyNow: 'Sotib olish',
    acceptOrder: 'Qabul qilish',
    markAtWarehouse: 'Bosh omborga keldi',
    markShipped: "Jo'natib yuborildi",
    markInChina: 'Xitoyda',
    markAtChinaBorder: 'Xitoy chegarasida',
    markDelivered: 'Yetkazib berildi',
    colorLabel: 'Rang',
    sizeLabel: "O'lcham",
    viewFullscreenLabel: "To'liq ekranda ko'rish",
    chooseColorFirst: 'Avval rangni tanlang',
    chooseSizeFirst: "Avval o'lchamni tanlang",
    statusInChina: 'Xitoyda',
    statusAtChinaBorder: 'Xitoy chegarasida',
    statusDelivered: 'Yetkazib berildi',
    adminTabProducts: 'Mahsulotlar',
    adminTabPayments: "To'lovlar",
    adminTabOrders: 'Buyurtmalar',
    adminTabStats: 'Statistika',
    receiptsReviewHeader: "To'lov cheklari",
    noPendingReceipts: "Tekshirilishi kerak bo'lgan chek yo'q",
    rejectReceipt: 'Rad etish',
    statsHeader: 'Umumiy statistika',
    totalRevenueLabel: 'Tushgan pul',
    userCountLabel: 'Foydalanuvchilar',
    orderCountLabel: 'Buyurtmalar',
    channelSaveFailed: 'Kanalni saqlab bo‘lmadi',
    requiredChannelsHeader: 'Majburiy obuna kanallari',
    noRequiredChannels: "Hali kanal qo'shilmagan",
    channelTitleLabel: 'Kanal nomi',
    channelTitlePlaceholder: 'Masalan: Elite Ware yangiliklari',
    channelUsernameLabel: 'Kanal username (@siz)',
    channelUsernamePlaceholder: 'eliteware_channel',
    addChannel: "Kanal qo'shish",
    viewReceiptLabel: "Chekni ko'rish",
  },
  ru: {
    cart: '🛒 Корзина',
    myOrders: '📦 Мои заказы',
    admin: '🛠️ Админ',
    catalog: 'Каталог',
    searchPlaceholder: 'Поиск товаров',
    all: 'Все',
    noProductsFound: 'Товары не найдены',
    outOfStock: 'Нет в наличии',
    addToCart: 'Добавить в корзину',
    availability: 'Наличие',
    inStock: 'В наличии',
    leftStock: 'Осталось {{count}}',
    somethingWentWrong: 'Что-то пошло не так',
    pleaseReopen: 'Пожалуйста, откройте приложение снова',
    couldNotSignIn: 'Не удалось войти',
    openInTelegram: 'Откройте в Telegram',
    openInTelegramDesc: 'Это Mini App работает только внутри приложения Telegram.',
    cartEmptyHeader: 'Ваша корзина пуста',
    cartEmptyDesc: 'Добавьте товары из каталога',
    total: 'Итого',
    checkout: 'Оформить заказ',
    checkoutWithPrice: 'Оформить заказ · {{price}}',
    remove: 'Удалить',
    noOrdersYetHeader: 'Пока нет заказов',
    noOrdersYetDesc: 'Ваши заказы появятся здесь',
    myOrdersHeader: 'Мои заказы',
    orderNumber: 'Заказ #{{id}}',
    item: 'товар',
    items: 'товара',
    adminsOnly: 'Только для администраторов',
    allOrders: 'Все заказы',
    noOrders: 'Заказов нет',
    fulfill: 'Выполнен',
    cancel: 'Отменить',
    addProduct: 'Добавить товар',
    titleLabel: 'Название',
    slugLabel: 'Slug (kebab-case)',
    priceLabel: 'Цена ({{currency}})',
    descriptionLabel: 'Описание',
    createProduct: 'Создать товар',
    createdProduct: 'Создан «{{title}}»',
    failedToCreateProduct: 'Не удалось создать товар',
    checkoutFailed: 'Оплата не удалась',
    productNotFound: 'Товар не найден',
    launchFromTelegram: 'Откройте приложение из Telegram',
    authenticationFailed: 'Не удалось авторизоваться',
    statusPending: 'В ожидании',
    statusAwaitingPayment: 'Ожидает подтверждения',
    statusPaid: 'Оплачен',
    statusCancelled: 'Отменён',
    statusFulfilled: 'Выполнен',
    payHeader: 'Оплата',
    amountToPay: 'Сумма к оплате',
    cardNumberLabel: 'Номер карты',
    cardHolderLabel: 'Владелец карты',
    paymentInstructionsLabel: 'Инструкция по оплате',
    noCardConfigured: 'Способ оплаты ещё не настроен. Свяжитесь с администратором.',
    uploadReceiptLabel: 'Загрузите чек (скриншот) об оплате',
    chooseFile: 'Выбрать файл',
    submitReceipt: 'Отправить',
    receiptSubmitted: 'Чек отправлен. Ожидайте подтверждения администратора.',
    receiptSubmitFailed: 'Не удалось отправить чек',
    orderCreateFailed: 'Не удалось создать заказ',
    shopSettingsHeader: 'Настройки оплаты',
    cardNumberPlaceholder: 'Например: 8600 1234 5678 9012',
    cardHolderPlaceholder: 'Например: ISLOM ISLOMOV',
    paymentInstructionsPlaceholder: 'Дополнительный текст для покупателей',
    saveSettings: 'Сохранить',
    settingsSaved: 'Сохранено',
    saveSettingsFailed: 'Ошибка сохранения',
    confirmPayment: 'Подтвердить оплату',
    receiptLabel: 'Чек',
    adminsHeader: 'Администраторы',
    roleAdmin: 'Админ',
    promote: 'Сделать админом',
    demote: 'Убрать права админа',
    addAdminByIdLabel:
      'Добавить админа по Telegram ID (пользователь должен хотя бы раз открыть бота)',
    telegramIdPlaceholder: 'Например: 123456789',
    addAdmin: 'Добавить',
    invalidTelegramId: 'Неверный Telegram ID',
    roleChangeFailed: 'Не удалось выполнить действие',
    bannersHeader: 'Баннеры',
    addBanner: 'Добавить баннер',
    bannerLinkProductLabel: 'Привязать к товару (необязательно)',
    bannerLinkProductPlaceholder: 'Выберите товар или введите ID',
    bannerNoLink: 'Без привязки',
    bannerLinkedProduct: 'Товар',
    bannerAddFailed: 'Не удалось сохранить баннер',
    tabHome: 'Главная',
    tabSearch: 'Поиск',
    tabCart: 'Корзина',
    tabProfile: 'Профиль',
    searchHint: 'Введите название товара',
    topRankLabel: 'Рейтинг',
    completedOrdersLabel: 'Выполнено',
    pendingOrdersLabel: 'В процессе',
    totalSpentLabel: 'Всего куплено',
    viewAllOrders: 'Смотреть все заказы',
    addressHeader: 'Адрес доставки',
    addressPlaceholder: 'Город, улица, дом...',
    saveAddress: 'Сохранить адрес',
    languageHeader: 'Язык',
    promoCodeLabel: 'Промокод',
    promoCodePlaceholder: 'Введите промокод',
    applyPromo: 'Применить',
    promoApplied: 'Промокод применён',
    promoInvalid: 'Промокод неверен или истёк',
    discountLabel: 'Скидка',
    promoCodesHeader: 'Промокоды',
    addPromoCode: 'Добавить промокод',
    promoCodeValueLabel: 'Код',
    discountPercentLabel: 'Скидка (%)',
    maxUsesLabel: 'Максимум использований (необязательно)',
    maxUsesPlaceholder: 'Без ограничений',
    promoCodeCreateFailed: 'Не удалось создать промокод',
    usedLabel: 'Использовано',
    unlimitedLabel: 'Без лимита',
    manageProductsHeader: 'Управление товарами',
    editProduct: 'Редактировать',
    deleteProduct: 'Удалить',
    productUpdateFailed: 'Ошибка сохранения',
    productDeleteFailed: 'Ошибка удаления',
    saveChanges: 'Сохранить',
    manageCategoriesHeader: 'Категории',
    addCategory: 'Добавить категорию',
    categorySaveFailed: 'Ошибка сохранения',
    categoryDeleteFailed: 'Ошибка удаления',
    productCountLabel: 'товаров',
    inactiveLabel: 'Неактивен',
    greetingLabel: 'Привет!',
    favoriteLabel: 'Добавить в избранное',
    searchResultsFor: 'Результаты:',
    resultsFoundLabel: 'Найдено: {{count}}',
    ordersTabActive: 'Активные',
    ordersTabCompleted: 'Завершённые',
    ordersTabCancelled: 'Отменённые',
    statusAccepted: 'Принят',
    statusInDelivery: 'В процессе доставки',
    statusAtWarehouse: 'Поступил на склад',
    statusShipped: 'Отправлен на почту',
    categoryLabel: 'Категория',
    noCategoryLabel: 'Без категории',
    productImagesLabel: 'Дополнительные фото',
    addImage: 'Добавить фото',
    colorsLabel: 'Цвета',
    addColor: 'Добавить цвет',
    colorNamePlaceholder: 'Например: Белый',
    sizesLabel: 'Размеры',
    addSize: 'Добавить размер',
    sizePlaceholder: 'Например: M',
    buyNow: 'Купить',
    acceptOrder: 'Принять',
    markAtWarehouse: 'Поступил на главный склад',
    markShipped: 'Отправлен',
    markInChina: 'В Китае',
    markAtChinaBorder: 'На границе Китая',
    markDelivered: 'Доставлен',
    colorLabel: 'Цвет',
    sizeLabel: 'Размер',
    viewFullscreenLabel: 'Открыть на весь экран',
    chooseColorFirst: 'Сначала выберите цвет',
    chooseSizeFirst: 'Сначала выберите размер',
    statusInChina: 'В Китае',
    statusAtChinaBorder: 'На границе Китая',
    statusDelivered: 'Доставлен',
    adminTabProducts: 'Товары',
    adminTabPayments: 'Оплаты',
    adminTabOrders: 'Заказы',
    adminTabStats: 'Статистика',
    receiptsReviewHeader: 'Чеки оплаты',
    noPendingReceipts: 'Нет чеков на проверке',
    rejectReceipt: 'Отклонить',
    statsHeader: 'Общая статистика',
    totalRevenueLabel: 'Выручка',
    userCountLabel: 'Пользователи',
    orderCountLabel: 'Заказы',
    channelSaveFailed: 'Не удалось сохранить канал',
    requiredChannelsHeader: 'Каналы обязательной подписки',
    noRequiredChannels: 'Каналы ещё не добавлены',
    channelTitleLabel: 'Название канала',
    channelTitlePlaceholder: 'Например: Новости Elite Ware',
    channelUsernameLabel: 'Username канала (без @)',
    channelUsernamePlaceholder: 'eliteware_channel',
    addChannel: 'Добавить канал',
    viewReceiptLabel: 'Посмотреть чек',
  },
};

export function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}
