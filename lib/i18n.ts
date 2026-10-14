// Multilingual UI strings for Talking Pill Bag.
// Per project rules: English is the default and source language.
// Languages: English, 中文 (Mandarin), Bahasa Melayu, Bahasa Indonesia.

export type Language = "en" | "zh" | "ms" | "id";

export const languages: { code: Language; label: string; nativeLabel: string }[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "zh", label: "Mandarin", nativeLabel: "中文" },
  { code: "ms", label: "Malay", nativeLabel: "Bahasa Melayu" },
  { code: "id", label: "Indonesian", nativeLabel: "Bahasa Indonesia" },
];

export const defaultLanguage: Language = "en";

// UI string dictionary. Each top-level key maps to translations per language.
type StringKey =
  | "appTitle"
  | "tagline"
  | "chooseLanguage"
  | "getStarted"
  | "placeholderPageTitle";

type Dictionary = Record<StringKey, string>;

const en: Dictionary = {
  appTitle: "Talking Pill Bag",
  tagline: "Medication management made simple for seniors and their families",
  chooseLanguage: "Choose your language",
  getStarted: "Get Started",
  placeholderPageTitle: "Welcome",
};

const zh: Dictionary = {
  appTitle: "会说话的药袋",
  tagline: "为长者和家人简化药物管理",
  chooseLanguage: "选择您的语言",
  getStarted: "开始使用",
  placeholderPageTitle: "欢迎",
};

const ms: Dictionary = {
  appTitle: "Beg Ubat Boleh Bercakap",
  tagline: "Pengurusan ubat yang mudah untuk warga emas dan keluarga mereka",
  chooseLanguage: "Pilih bahasa anda",
  getStarted: "Mula",
  placeholderPageTitle: "Selamat datang",
};

const id: Dictionary = {
  appTitle: "Kantong Obat yang Bisa Ngomong",
  tagline: "Mengurus obat lansia jadi mudah untuk keluarga",
  chooseLanguage: "Pilih bahasa Anda",
  getStarted: "Mulai",
  placeholderPageTitle: "Selamat datang",
};

export const dictionaries: Record<Language, Dictionary> = { en, zh, ms, id };

export function t(lang: Language, key: StringKey): string {
  return dictionaries[lang][key] ?? dictionaries.en[key] ?? key;
}
