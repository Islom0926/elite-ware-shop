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
    pleaseReopen: "Ilovani qaytadan oching",
    couldNotSignIn: 'Kirish amalga oshmadi',
    openInTelegram: "Telegram orqali oching",
    openInTelegramDesc: "Bu Mini App faqat Telegram ilovasi ichida ishlaydi.",
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
    createProduct: "Mahsulot yaratish",
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
  },
};

export function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}
