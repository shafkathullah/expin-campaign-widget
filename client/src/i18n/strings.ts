export const strings = {
  en: {
    'header.title': 'Campaign Performance',
    'header.subtitle': 'Live performance per creator. Boost anyone falling behind.',

    'lang.english': 'English',
    'lang.arabic': 'العربية',
    'lang.toggle': 'Language',

    'filters.title': 'Filters',
    'filters.status': 'Status',
    'filters.statusPlaceholder': 'All statuses',
    'filters.minRate': 'Min conversion rate',
    'filters.search': 'Search creators',
    'filters.searchPlaceholder': 'Search by name or handle',
    'filters.reset': 'Reset filters',
    'filters.activeCount': '{count} filters applied',

    'status.pending': 'Pending',
    'status.live': 'Live',
    'status.completed': 'Completed',

    'table.name': 'Creator',
    'table.status': 'Status',
    'table.views': 'Views',
    'table.conversions': 'Conversions',
    'table.conversionRate': 'Conv. rate',
    'table.action': 'Action',
    'table.resultCount': 'Showing {visible} of {total} creators',

    'boost.action': 'Boost',
    'boost.pending': 'Boosting…',
    'boost.done': 'Boosted',
    'boost.success': 'Boost queued',
    'boost.error': 'Boost failed — try again',

    'empty.noCreators.title': 'No creators yet',
    'empty.noCreators.body': 'This campaign has no creators participating.',
    'empty.noResults.title': 'No creators match your filters',
    'empty.noResults.body': 'Try widening the conversion rate range or clearing the search.',

    'error.load.title': "Couldn't load creators",
    'error.load.body': 'Check that the mock server is running on port 4000.',
    'error.retry': 'Retry',

    'stream.live': 'Live',
    'stream.offline': 'Offline',
  },

  ar: {
    'header.title': 'أداء الحملة',
    'header.subtitle': 'أداء مباشر لكل صانع محتوى. عزّز من يتأخر.',

    'lang.english': 'English',
    'lang.arabic': 'العربية',
    'lang.toggle': 'اللغة',

    'filters.title': 'عوامل التصفية',
    'filters.status': 'الحالة',
    'filters.statusPlaceholder': 'جميع الحالات',
    'filters.minRate': 'الحد الأدنى لمعدل التحويل',
    'filters.search': 'بحث',
    'filters.searchPlaceholder': 'ابحث بالاسم أو المعرّف',
    'filters.reset': 'إعادة تعيين',
    'filters.activeCount': '{count} عوامل تصفية مفعّلة',

    'status.pending': 'قيد الانتظار',
    'status.live': 'مباشر',
    'status.completed': 'مكتمل',

    'table.name': 'صانع المحتوى',
    'table.status': 'الحالة',
    'table.views': 'المشاهدات',
    'table.conversions': 'التحويلات',
    'table.conversionRate': 'معدل التحويل',
    'table.action': 'الإجراء',
    'table.resultCount': 'عرض {visible} من {total} صانع محتوى',

    'boost.action': 'تعزيز',
    'boost.pending': 'جارٍ التعزيز…',
    'boost.done': 'مُعزَّز',
    'boost.success': 'تم تعزيز المنشور',
    'boost.error': 'فشل التعزيز — حاول مرة أخرى',

    'empty.noCreators.title': 'لا يوجد صنّاع محتوى',
    'empty.noCreators.body': 'لا يشارك أي صانع محتوى في هذه الحملة.',
    'empty.noResults.title': 'لا توجد نتائج مطابقة',
    'empty.noResults.body': 'جرّب توسيع نطاق معدل التحويل أو مسح البحث.',

    'error.load.title': 'تعذّر تحميل صنّاع المحتوى',
    'error.load.body': 'تأكّد من تشغيل خادم المحاكاة على المنفذ 4000.',
    'error.retry': 'إعادة المحاولة',

    'stream.live': 'مباشر',
    'stream.offline': 'غير متصل',
  },
} as const;

export type Lang = keyof typeof strings;
export type TKey = keyof (typeof strings)['en'];

export const LANGS: readonly Lang[] = ['en', 'ar'];
export const DEFAULT_LANG: Lang = 'en';

export function isLang(value: unknown): value is Lang {
  return value === 'en' || value === 'ar';
}
