export type Lang = "en" | "ar";

export const customersCopy = {
  en: {
    title: "Customers",
    body: "Everyone who's booked with you, pulled from your booking history.",
    loading: "Loading...",
    noCustomersYet: "No customers yet — they'll show up here once bookings come in.",
    downloadCsv: "Download CSV",
    colName: "Name",
    colPhone: "Phone",
    colVisits: "Visits",
    colLastVisit: "Last visit",
    colTotalSpent: "Total spent",
    notAvailable: "—",
    langToggle: "العربية",
    localeTag: "en-GB" as string | undefined,
  },
  ar: {
    title: "الزباين",
    body: "كل زبون حجز معك، مجموع من سجل حجوزاتك.",
    loading: "عم يحمّل...",
    noCustomersYet: "ما في زباين لسا — رح يظهروا هون أول ما توصل حجوزات.",
    downloadCsv: "نزّل CSV",
    colName: "الاسم",
    colPhone: "رقم الهاتف",
    colVisits: "عدد الزيارات",
    colLastVisit: "آخر زيارة",
    colTotalSpent: "المجموع المدفوع",
    notAvailable: "—",
    langToggle: "English",
    localeTag: "ar-u-nu-latn" as string | undefined,
  },
} as const;
