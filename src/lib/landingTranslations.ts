// Landing-page copy in both languages. Kept as one parallel structure (not
// separate en.ts/ar.ts files) so it's obvious when a string is missing its
// translation — every key exists in both objects side by side.
export type Lang = "en" | "ar";

export const landingCopy = {
  en: {
    logIn: "Log in",
    nav: {
      howItWorks: "How it works",
      features: "Features",
      pricing: "Pricing",
      faq: "FAQ",
    },
    hero: {
      badge: "Built for Lebanon's salons, clinics & gyms",
      headline: "Booking pages for local businesses",
      subhead:
        "A simple, professional booking page for salons, clinics, and gyms — with automatic waitlist promotion the moment someone cancels.",
      ctaPrimary: "Create your booking page",
      ctaSecondary: "See how it works",
      businessTypes: ["Salons", "Barbershops", "Clinics", "Gyms", "Spas", "Nail studios"],
    },
    problem: {
      heading: "Still booking over WhatsApp and a notebook?",
      points: [
        "A customer messages at midnight and you forget to reply by morning — booking lost.",
        "Someone cancels last-minute and the slot just sits empty, because calling down the waitlist takes too long.",
        "Two customers message at the same time for the same slot, and now you have an awkward call to make.",
      ],
    },
    howItWorks: {
      heading: "How Maw3ed works",
      steps: [
        {
          title: "Tell us about your business",
          body: "Business name, services, and staff. Takes about two minutes — no technical setup on your end.",
        },
        {
          title: "Get your own booking link",
          body: "A clean, branded link like yourbusiness.maw3edapp.com — share it on WhatsApp, Instagram, or your storefront window.",
        },
        {
          title: "Bookings run themselves",
          body: "Customers pick a time, get auto-assigned to whoever's free, and can reschedule or cancel on their own — day or night.",
        },
      ],
    },
    photoSplit: {
      heading: "Built for every kind of business",
      body: "Whether you run a salon, a clinic, or a gym, Maw3ed adapts to how your business actually takes bookings — multiple staff members, different service lengths, and a waitlist that fills itself the moment someone cancels.",
    },
    preview: {
      heading: "What your customers actually see",
      body: "A clean page with your services, open time slots, and instant confirmation — the moment someone books, it's locked into your calendar. No app, no account, no confusion about which times are actually free.",
    },
    features: {
      heading: "Everything your booking page needs",
      items: [
        {
          title: "No app to download",
          body: "Customers book from a link you share — on WhatsApp, Instagram, or anywhere else. No install, no account.",
        },
        {
          title: "Automatic waitlist",
          body: "When someone cancels, the freed slot is offered to the next person waiting — no calls, no missed revenue.",
        },
        {
          title: "Multi-staff scheduling",
          body: "Bookings are assigned to whichever staff member is free. Customers never have to guess who to pick.",
        },
        {
          title: "Self-service changes",
          body: "Customers can reschedule or cancel their own appointment from a link — no back-and-forth messages needed.",
        },
        {
          title: "Your own branded link",
          body: "Every business gets a clean, professional web address — yours to put on business cards, stories, or a storefront sign.",
        },
        {
          title: "Race-condition-safe booking",
          body: "Built on a real database with proper safeguards, so two customers can never accidentally book the same slot.",
        },
      ],
    },
    pricing: {
      heading: "Simple, honest pricing",
      subtext: "Every business starts with a free trial. Pay via OMT or Whish Money — LBP equivalent to market rate at time of payment.",
      bestValue: "Best value",
      perMonth: "mo",
      periodMonth: "month",
      periodHalfYear: "6 months",
      periodYear: "year",
      planNames: { monthly: "Monthly", half_year: "6-Month", yearly: "Yearly" } as Record<string, string>,
    },
    faq: {
      heading: "Questions business owners ask",
      items: [
        {
          q: "Do my customers need to download anything?",
          a: "No. They open your link in any browser, book, and get a confirmation — nothing to install, no account to create.",
        },
        {
          q: "What happens when a customer cancels?",
          a: "The freed slot is automatically offered to the next person on that day's waitlist — you don't have to call anyone.",
        },
        {
          q: "Can I have more than one staff member?",
          a: "Yes. Add as many staff as you like in Settings — bookings are automatically assigned to whoever is free.",
        },
        {
          q: "How much does it cost?",
          a: "$30/month, or save by paying for 6 months ($150) or a full year ($240). Every business starts with a free trial — see Pricing above for the full breakdown.",
        },
      ],
    },
    closingCta: {
      heading: "Ready to stop losing bookings to a missed message?",
      body: "Set up your booking page today — it takes about two minutes.",
      cta: "Create your booking page",
    },
    footer: "Maw3ed — built for Lebanon's salons, clinics, and gyms.",
    mockup: {
      businessName: "Bella Salon",
      servicesLabel: "Services",
      todayLabel: "Today",
      liveDemoHint: "Go on, tap a time — it's a live demo.",
      bookButton: (time: string) => `Book ${time}`,
      confirmed: (time: string) => `Confirmed for ${time} — see you soon!`,
      tryAnother: "Try another time",
      services: [
        { name: "Haircut + Blow Dry", duration: 45 },
        { name: "Haircut only", duration: 30 },
        { name: "Color + Cut", duration: 90 },
      ],
    },
  },
  ar: {
    logIn: "تسجيل الدخول",
    nav: {
      howItWorks: "كيف بيشتغل",
      features: "الميزات",
      pricing: "الأسعار",
      faq: "الأسئلة الشائعة",
    },
    hero: {
      badge: "مصمَّم لصالونات وعيادات ونوادي لبنان",
      headline: "صفحة حجز مواعيد لعملك",
      subhead:
        "صفحة حجز بسيطة واحترافية لصالونات التجميل والعيادات والنوادي الرياضية — مع نقل تلقائي لقائمة الانتظار فور إلغاء أي موعد.",
      ctaPrimary: "أنشئ صفحة الحجز الخاصة فيك",
      ctaSecondary: "شوف كيف بيشتغل",
      businessTypes: ["صالونات", "صالونات حلاقة", "عيادات", "نوادي رياضية", "سبا", "صالونات أظافر"],
    },
    problem: {
      heading: "لسا عم تحجز عبر واتساب ودفتر؟",
      points: [
        "الزبون بيراسلك نص الليل وبتنسى ترد عليه الصبح — والحجز بيضيع.",
        "حدا بيلغي بآخر لحظة، والموعد بيضل فاضي لأنو الاتصال بلائحة الانتظار بياخد وقت طويل.",
        "زبونين بيراسلوك بنفس الوقت عالموعد نفسو، وهلق لازم تعمل مكالمة محرجة.",
      ],
    },
    howItWorks: {
      heading: "كيف بيشتغل Maw3ed",
      steps: [
        {
          title: "احكيلنا عن عملك",
          body: "اسم عملك، خدماتك، وموظفينك. بياخد دقيقتين تقريباً — بدون أي إعداد تقني من طرفك.",
        },
        {
          title: "احصل على رابط الحجز الخاص فيك",
          body: "رابط أنيق مثل yourbusiness.maw3edapp.com — شاركو عبر واتساب أو إنستغرام أو ع واجهة محلك.",
        },
        {
          title: "الحجوزات بتصير لحالها",
          body: "الزبون بيختار وقت، بينحول تلقائياً لأي موظف فاضي، وفيه يأجل أو يلغي موعدو لحاله — ليل نهار.",
        },
      ],
    },
    photoSplit: {
      heading: "مصمَّم لكل أنواع الأعمال",
      body: "سواء عندك صالون، عيادة، أو نادي رياضي، Maw3ed بيتأقلم مع طريقة عملك الفعلية — موظفين متعددين، مدد خدمات مختلفة، ولائحة انتظار بتنعبى لحالها فور ما حدا يلغي.",
    },
    preview: {
      heading: "شو بيشوف زبونك بالضبط",
      body: "صفحة نظيفة فيها خدماتك، الأوقات المتاحة، وتأكيد فوري — لحظة ما حدا يحجز، بينسجل مباشرة بجدولك. بدون تطبيق، بدون حساب، وبدون لخبطة بالأوقات المتاحة.",
    },
    features: {
      heading: "كل شي محتاجو صفحة الحجز تبعك",
      items: [
        {
          title: "بدون تنزيل تطبيق",
          body: "الزبائن بيحجزوا من رابط بتشاركو معن — عبر واتساب، إنستغرام، أو أي مكان تاني. بدون تثبيت، بدون حساب.",
        },
        {
          title: "لائحة انتظار تلقائية",
          body: "لما حدا يلغي، الموعد الفاضي بينعرض على أول واحد بلائحة الانتظار — بدون اتصالات، بدون خسارة دخل.",
        },
        {
          title: "جدولة لعدة موظفين",
          body: "الحجوزات بتنحول تلقائياً لأي موظف فاضي. الزبون ما إلو داعي يخمّن مين يختار.",
        },
        {
          title: "تعديل ذاتي من الزبون",
          body: "الزبون فيه يأجل أو يلغي موعدو من رابط خاص فيه — بدون رسائل جيء وذهاب.",
        },
        {
          title: "رابط خاص فيك",
          body: "كل عمل بياخد رابط أنيق واحترافي — حطو ع كرت العمل، الستوري، أو لافتة المحل.",
        },
        {
          title: "حجز آمن من التعارض",
          body: "مبني على قاعدة بيانات حقيقية مع ضمانات فعلية، منشان ما حدا يقدر يحجز نفس الموعد غلط.",
        },
      ],
    },
    pricing: {
      heading: "أسعار بسيطة وواضحة",
      subtext: "كل عمل بيبلش بفترة تجربة مجانية. الدفع عبر OMT أو Whish Money — الليرة اللبنانية حسب سعر السوق وقت الدفع.",
      bestValue: "الأفضل قيمة",
      perMonth: "بالشهر",
      periodMonth: "بالشهر",
      periodHalfYear: "لـ 6 أشهر",
      periodYear: "بالسنة",
      planNames: { monthly: "شهري", half_year: "6 أشهر", yearly: "سنوي" } as Record<string, string>,
    },
    faq: {
      heading: "أسئلة بيسألها أصحاب الأعمال",
      items: [
        {
          q: "زبائني محتاجين ينزلوا شي تطبيق؟",
          a: "لأ. بيفتحوا الرابط من أي متصفح، يحجزوا، ويوصلهم تأكيد — بدون تنزيل، بدون حساب.",
        },
        {
          q: "شو بيصير لما الزبون يلغي؟",
          a: "الموعد الفاضي بينعرض تلقائياً على أول حدا بلائحة الانتظار هيدا اليوم — ما بتضطر تتصل بحدا.",
        },
        {
          q: "فيني يكون عندي أكتر من موظف؟",
          a: "أكيد. ضيف كم موظف ما بدك من الإعدادات — الحجوزات بتنحول تلقائياً لأي موظف فاضي.",
        },
        {
          q: "قديش بتكلف؟",
          a: "٣٠$ بالشهر، أو وفّر إذا دفعت لـ 6 أشهر (150$) أو سنة كاملة (240$). كل عمل بيبلش بفترة تجربة مجانية — شوف الأسعار فوق لكل التفاصيل.",
        },
      ],
    },
    closingCta: {
      heading: "جاهز توقف تخسر حجوزات بسبب رسالة ما ردّيت عليها؟",
      body: "جهّز صفحة الحجز تبعك اليوم — بياخد حوالي دقيقتين.",
      cta: "أنشئ صفحة الحجز الخاصة فيك",
    },
    footer: "Maw3ed — مصمَّم لصالونات وعيادات ونوادي لبنان.",
    mockup: {
      businessName: "صالون بيلا",
      servicesLabel: "الخدمات",
      todayLabel: "اليوم",
      liveDemoHint: "جرّب دوس عوقت — هيدا عرض حي.",
      bookButton: (time: string) => `احجز الساعة ${time}`,
      confirmed: (time: string) => `تأكد الموعد الساعة ${time} — منشوفك قريباً!`,
      tryAnother: "جرّب وقت تاني",
      services: [
        { name: "قص شعر + تصفيف", duration: 45 },
        { name: "قص شعر فقط", duration: 30 },
        { name: "صبغة + قص", duration: 90 },
      ],
    },
  },
} as const;
