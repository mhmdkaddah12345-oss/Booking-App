export type Lang = "en" | "ar";

export const ownerLoginCopy = {
  en: {
    title: "Owner Login",
    emailPlaceholder: "Email",
    passwordPlaceholder: "Password",
    incorrectCredentials: "Incorrect email or password.",
    checking: "Checking...",
    logIn: "Log in",
    forgotPassword: "Forgot your password?",
    forgotHelp: (email: string) => `Email us at ${email} with your business name and we'll send you a recovery code. Already have one?`,
    resetPassword: "Reset your password",
    newBusiness: "New business?",
    createAccount: "Create an account",
    langToggle: "العربية",
  },
  ar: {
    title: "دخول صاحب العمل",
    emailPlaceholder: "الإيميل",
    passwordPlaceholder: "كلمة السر",
    incorrectCredentials: "الإيميل أو كلمة السر غلط.",
    checking: "عم يتحقق...",
    logIn: "دخول",
    forgotPassword: "نسيت كلمة السر؟",
    forgotHelp: (email: string) => `ابعتلنا إيميل عـ ${email} مع اسم عملك ورح نبعتلك كود استرجاع. عندك كود من قبل؟`,
    resetPassword: "غيّر كلمة السر",
    newBusiness: "عمل جديد؟",
    createAccount: "أنشئ حساب",
    langToggle: "English",
  },
} as const;
