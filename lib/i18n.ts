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
  | "placeholderPageTitle"
  // Add Medicine page
  | "addMedicine"
  | "takePhoto"
  | "uploadPhoto"
  | "analyzing"
  | "confirm"
  | "edit"
  | "drugName"
  | "strength"
  | "dose"
  | "timesPerDay"
  | "timeSlots"
  | "food"
  | "specialInstructions"
  | "quantityDispensed"
  | "dispensedDate"
  | "unclearFields"
  | "pharmacistMessage"
  | "genericError"
  | "back"
  | "retry";

type Dictionary = Record<StringKey, string>;

const en: Dictionary = {
  appTitle: "Talking Pill Bag",
  tagline: "Medication management made simple for seniors and their families",
  chooseLanguage: "Choose your language",
  getStarted: "Get Started",
  placeholderPageTitle: "Welcome",
  addMedicine: "Add Medicine",
  takePhoto: "Take Photo",
  uploadPhoto: "Upload Photo",
  analyzing: "Analyzing…",
  confirm: "Confirm",
  edit: "Edit",
  drugName: "Drug name",
  strength: "Strength",
  dose: "Dose per time",
  timesPerDay: "Times per day",
  timeSlots: "Time slots",
  food: "Food",
  specialInstructions: "Special instructions",
  quantityDispensed: "Quantity dispensed",
  dispensedDate: "Dispensed date",
  unclearFields: "Unclear fields",
  pharmacistMessage:
    "I'm not able to identify that medication, please check with your pharmacist.",
  genericError: "Something went wrong, please try again.",
  back: "Back",
  retry: "Retry",
};

const zh: Dictionary = {
  appTitle: "会说话的药袋",
  tagline: "为长者和家人简化药物管理",
  chooseLanguage: "选择您的语言",
  getStarted: "开始使用",
  placeholderPageTitle: "欢迎",
  addMedicine: "添加药物",
  takePhoto: "拍照",
  uploadPhoto: "上传照片",
  analyzing: "分析中…",
  confirm: "确认",
  edit: "修改",
  drugName: "药物名称",
  strength: "剂量强度",
  dose: "每次剂量",
  timesPerDay: "每日次数",
  timeSlots: "服药时间",
  food: "饮食",
  specialInstructions: "特别说明",
  quantityDispensed: "配发数量",
  dispensedDate: "配发日期",
  unclearFields: "不清楚的项目",
  pharmacistMessage: "无法识别该药物，请咨询药剂师。",
  genericError: "出了点问题，请重试。",
  back: "返回",
  retry: "重试",
};

const ms: Dictionary = {
  appTitle: "Beg Ubat Boleh Bercakap",
  tagline: "Pengurusan ubat yang mudah untuk warga emas dan keluarga mereka",
  chooseLanguage: "Pilih bahasa anda",
  getStarted: "Mula",
  placeholderPageTitle: "Selamat datang",
  addMedicine: "Tambah Ubat",
  takePhoto: "Ambil Gambar",
  uploadPhoto: "Muat Naik Gambar",
  analyzing: "Menganalisis…",
  confirm: "Sahkan",
  edit: "Sunting",
  drugName: "Nama ubat",
  strength: "Kekuatan",
  dose: "Dosis setiap kali",
  timesPerDay: "Kali sehari",
  timeSlots: "Slot masa",
  food: "Makanan",
  specialInstructions: "Arahan khas",
  quantityDispensed: "Kuantiti diedarkan",
  dispensedDate: "Tarikh diedarkan",
  unclearFields: "Medan tidak jelas",
  pharmacistMessage:
    "Saya tidak dapat mengenal pasti ubat tersebut, sila semak dengan ahli farmasi anda.",
  genericError: "Sesuatu yang tidak kena, sila cuba semula.",
  back: "Kembali",
  retry: "Cuba semula",
};

const id: Dictionary = {
  appTitle: "Kantong Obat yang Bisa Ngomong",
  tagline: "Mengurus obat lansia jadi mudah untuk keluarga",
  chooseLanguage: "Pilih bahasa Anda",
  getStarted: "Mulai",
  placeholderPageTitle: "Selamat datang",
  addMedicine: "Tambah Obat",
  takePhoto: "Ambil Foto",
  uploadPhoto: "Unggah Foto",
  analyzing: "Menganalisis…",
  confirm: "Benar",
  edit: "Perbaiki",
  drugName: "Nama obat",
  strength: "Kekuatan",
  dose: "Dosis per minum",
  timesPerDay: "Kali sehari",
  timeSlots: "Waktu minum",
  food: "Makanan",
  specialInstructions: "Petunjuk khusus",
  quantityDispensed: "Jumlah yang diberikan",
  dispensedDate: "Tanggal diberikan",
  unclearFields: "Bagian tidak jelas",
  pharmacistMessage:
    "Saya tidak bisa mengenali obat ini, silakan periksa ke apoteker.",
  genericError: "Terjadi kesalahan, silakan coba lagi.",
  back: "Kembali",
  retry: "Coba lagi",
};

export const dictionaries: Record<Language, Dictionary> = { en, zh, ms, id };

export function t(lang: Language, key: StringKey): string {
  return dictionaries[lang][key] ?? dictionaries.en[key] ?? key;
}
