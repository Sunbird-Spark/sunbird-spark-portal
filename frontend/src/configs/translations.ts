export type LanguageCode = "en" | "pt" | "ar" | "fr";

export type Language = {
  code: LanguageCode;
  name: string;
  nativeName: string;
  dir: "ltr" | "rtl";
};

export const languages: Language[] = [
  { code: "en", name: "English", nativeName: "English", dir: "ltr" },
  { code: "pt", name: "Portuguese", nativeName: "Português", dir: "ltr" },
  { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl" },
  { code: "fr", name: "French", nativeName: "Français", dir: "ltr" },
];
