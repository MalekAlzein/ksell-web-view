// Lightweight i18n for the ksell web view.
//
// The native app opens this WebView with `?lang=` (or `#/plans?lang=`) carrying
// its current language code. The app uses three codes — and note that Kurdish
// is represented by `fa` (see the Flutter `supportedLanguages` map):
//   en → English (LTR)
//   ar → Arabic  (RTL)
//   fa → Kurdish (RTL)
// API-driven content (plan names, messages) is already localized via the
// Accept-Language header; this module only covers the static UI labels.

import { getLang } from './api';

export type Lang = 'en' | 'ar' | 'fa';

const RTL_LANGS: Lang[] = ['ar', 'fa'];

/** Normalize whatever arrives in `?lang=` to one of our three codes. */
export function currentLang(): Lang {
  const raw = (getLang() || 'en').toLowerCase();
  if (raw.startsWith('ar')) return 'ar';
  // Kurdish: locale `fa`, but the backend code is `fr` — accept either here.
  if (
    raw.startsWith('fa') ||
    raw.startsWith('fr') ||
    raw.startsWith('ku') ||
    raw.startsWith('ckb')
  ) {
    return 'fa';
  }
  return 'en';
}

export function isRtl(): boolean {
  return RTL_LANGS.includes(currentLang());
}

type Dict = Record<string, string>;

const en: Dict = {
  selectAdPlan: 'Select Ad Plan',
  payment: 'Payment',
  transactionHistory: 'Transaction History',
  pay: 'Pay',
  payNow: 'Pay Now',
  howItWorks: 'How it works',
  price: 'Price:',
  walletBalance: 'Wallet Balance',
  forPay: 'For Pay',
  paymentMethod: 'Payment Method',
  wallet: 'Wallet',
  direct: 'Direct',
  topUp: 'Top-up',
  payFromWalletDesc: 'Pay directly from your available wallet balance.',
  amountToTopUp: 'Amount to Top-up (IQD)',
  amountPlaceholder: 'e.g. 50000',
  selectTransferCompany: 'Select Transfer Company',
  chooseCompany: 'Choose a company...',
  transferNumber: 'Transfer Number',
  directHint:
    'Transfer the exact amount to the number above, then press Pay to submit it for review.',
  topUpHint:
    'Enter an amount and transfer it to the number above, then press Pay to submit it for review.',
  paymentUnderReview: 'Payment Under Review',
  underReviewDetail:
    'Your transfer has been submitted and is currently being reviewed by our team. This usually takes a few minutes.',
  numberCopied: 'Number copied to clipboard',
  paymentSuccess: 'Payment successful!',
  insufficientBalance: 'Insufficient Balance',
  enterValidAmount: 'Please enter a valid amount',
  selectCompanyError: 'Please select a transfer company',
  topUpFailed: 'Could not submit top-up',
  planLinkFailed: 'Could not select this plan, please try again',
  totalBalance: 'Total Balance',
  noTransactions: 'No transactions yet.',
  credit: 'Credit',
  debit: 'Debit',
  adLabel: 'Ad:',
  companyLabel: 'Company:',
  loadMore: 'Load more',
};

const ar: Dict = {
  selectAdPlan: 'اختر خطة الإعلان',
  payment: 'الدفع',
  transactionHistory: 'سجل المعاملات',
  pay: 'دفع',
  payNow: 'ادفع الآن',
  howItWorks: 'كيف يعمل التطبيق',
  price: 'السعر:',
  walletBalance: 'رصيد المحفظة',
  forPay: 'المطلوب للدفع',
  paymentMethod: 'طريقة الدفع',
  wallet: 'المحفظة',
  direct: 'مباشر',
  topUp: 'شحن',
  payFromWalletDesc: 'ادفع مباشرة من رصيد محفظتك المتاح.',
  amountToTopUp: 'مبلغ الشحن (دينار)',
  amountPlaceholder: 'مثال: 50000',
  selectTransferCompany: 'اختر شركة التحويل',
  chooseCompany: 'اختر شركة...',
  transferNumber: 'رقم التحويل',
  directHint: 'حوّل المبلغ المطلوب بالضبط إلى الرقم أعلاه، ثم اضغط دفع لإرساله للمراجعة.',
  topUpHint: 'أدخل مبلغًا وحوّله إلى الرقم أعلاه، ثم اضغط دفع لإرساله للمراجعة.',
  paymentUnderReview: 'الدفعة قيد المراجعة',
  underReviewDetail:
    'تم إرسال تحويلك وهو قيد المراجعة من قبل فريقنا. عادةً يستغرق ذلك بضع دقائق.',
  numberCopied: 'تم نسخ الرقم',
  paymentSuccess: 'تم الدفع بنجاح',
  insufficientBalance: 'الرصيد غير كافٍ',
  enterValidAmount: 'الرجاء إدخال مبلغ صحيح',
  selectCompanyError: 'الرجاء اختيار شركة تحويل',
  topUpFailed: 'تعذّر إرسال الشحن',
  planLinkFailed: 'تعذّر اختيار هذه الخطة، حاول مرة أخرى',
  totalBalance: 'إجمالي الرصيد',
  noTransactions: 'لا توجد معاملات بعد.',
  credit: 'وارد',
  debit: 'صادر',
  adLabel: 'إعلان:',
  companyLabel: 'شركة:',
  loadMore: 'تحميل المزيد',
};

// Kurdish (Sorani) — carried under the `fa` code, matching the Flutter app.
const fa: Dict = {
  selectAdPlan: 'پلانی ڕیکلام هەڵبژێرە',
  payment: 'پارەدان',
  transactionHistory: 'مێژووی مامەڵەکان',
  pay: 'پارەدان',
  payNow: 'ئێستا بدە',
  howItWorks: 'چۆن کاردەکات',
  price: 'نرخ:',
  walletBalance: 'باڵانسی جزدان',
  forPay: 'بۆ پارەدان',
  paymentMethod: 'شێوازی پارەدان',
  wallet: 'جزدان',
  direct: 'ڕاستەوخۆ',
  topUp: 'پڕکردنەوە',
  payFromWalletDesc: 'ڕاستەوخۆ لە باڵانسی بەردەستی جزدانەکەت پارە بدە.',
  amountToTopUp: 'بڕی پڕکردنەوە (دینار)',
  amountPlaceholder: 'نموونە: 50000',
  selectTransferCompany: 'کۆمپانیای گواستنەوە هەڵبژێرە',
  chooseCompany: 'کۆمپانیایەک هەڵبژێرە...',
  transferNumber: 'ژمارەی گواستنەوە',
  directHint:
    'هەمان بڕ بنێرە بۆ ژمارەکەی سەرەوە، پاشان کلیک لە پارەدان بکە بۆ ناردنی بۆ پێداچوونەوە.',
  topUpHint:
    'بڕێک بنووسە و بیگوازەوە بۆ ژمارەکەی سەرەوە، پاشان کلیک لە پارەدان بکە بۆ ناردنی بۆ پێداچوونەوە.',
  paymentUnderReview: 'پارەدان لە ژێر پێداچوونەوەدایە',
  underReviewDetail:
    'گواستنەوەکەت نێردرا و ئێستا لەلایەن تیمەکەمانەوە پێداچوونەوەی بۆ دەکرێت. زۆرجار چەند خولەکێک دەخایەنێت.',
  numberCopied: 'ژمارە کۆپی کرا',
  paymentSuccess: 'پارەدان سەرکەوتوو بوو',
  insufficientBalance: 'باڵانس بەس نییە',
  enterValidAmount: 'تکایە بڕێکی دروست بنووسە',
  selectCompanyError: 'تکایە کۆمپانیای گواستنەوە هەڵبژێرە',
  topUpFailed: 'نەتوانرا پڕکردنەوە بنێردرێت',
  planLinkFailed: 'نەتوانرا ئەم پلانە هەڵبژێردرێت، تکایە دووبارە هەوڵبدەوە',
  totalBalance: 'کۆی باڵانس',
  noTransactions: 'هیچ مامەڵەیەک نییە.',
  credit: 'هاتوو',
  debit: 'دەرچوو',
  adLabel: 'ڕیکلام:',
  companyLabel: 'کۆمپانیا:',
  loadMore: 'زیاتر بهێنە',
};

const dictionaries: Record<Lang, Dict> = { en, ar, fa };

export type TKey = keyof typeof en;

/** Translate a key into the current language (falls back to English). */
export function t(key: TKey): string {
  const lang = currentLang();
  return dictionaries[lang][key] ?? en[key] ?? key;
}
