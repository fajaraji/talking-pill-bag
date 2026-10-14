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
  | "retry"
  // Today page
  | "todayTitle"
  | "morning"
  | "afternoon"
  | "evening"
  | "bedtime"
  | "foodBefore"
  | "foodAfter"
  | "foodWith"
  | "foodAny"
  | "done"
  | "takenAt"
  | "undo"
  | "dosesTaken"
  | "timeNotSet"
  | "editTime"
  | "todaysMedicines"
  | "noMedicines"
  // Listen / explanation panel
  | "listen"
  | "stop"
  | "close"
  | "source"
  | "voiceNotAvailable"
  | "loading"
  // Demo mode
  | "demoMode"
  | "simulatedDate"
  | "advanceDay"
  | "resetClock"
  // Adherence
  | "missedPrompt"
  | "forgot"
  | "sideEffects"
  | "feltWell"
  | "ranOut"
  | "other"
  | "acknowledgement"
  | "sideEffectsAck"
  | "addToQuestions";

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
  todayTitle: "Today's Medicines",
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  bedtime: "Bedtime",
  foodBefore: "Before food",
  foodAfter: "After food",
  foodWith: "With food",
  foodAny: "Any time",
  done: "Done",
  takenAt: "Taken at",
  undo: "Undo",
  dosesTaken: "doses taken",
  timeNotSet: "Time not set",
  editTime: "Edit time",
  todaysMedicines: "Today's medicines",
  noMedicines: "No medicines yet",
  listen: "Listen",
  stop: "Stop",
  close: "Close",
  source: "Source",
  voiceNotAvailable: "Voice not available on this device",
  loading: "Loading…",
  demoMode: "Demo mode",
  simulatedDate: "Simulated date",
  advanceDay: "+1 day",
  resetClock: "Reset",
  missedPrompt: "You missed {drug} {n} times this week. What happened?",
  forgot: "Forgot",
  sideEffects: "Side effects",
  feltWell: "Felt well",
  ranOut: "Ran out",
  other: "Other",
  acknowledgement:
    "Thank you. We'll add this to your questions for the doctor or pharmacist.",
  sideEffectsAck: "Please tell your doctor or pharmacist about this.",
  addToQuestions: "We'll add this to your questions for the doctor or pharmacist.",
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
  todayTitle: "今日药物",
  morning: "早上",
  afternoon: "下午",
  evening: "晚上",
  bedtime: "睡前",
  foodBefore: "饭前",
  foodAfter: "饭后",
  foodWith: "随餐",
  foodAny: "任何时间",
  done: "完成",
  takenAt: "已于",
  undo: "撤销",
  dosesTaken: "剂已服用",
  timeNotSet: "未设定时间",
  editTime: "编辑时间",
  todaysMedicines: "今日药物",
  noMedicines: "暂无药物",
  listen: "听",
  stop: "停止",
  close: "关闭",
  source: "来源",
  voiceNotAvailable: "此设备没有语音",
  loading: "加载中…",
  demoMode: "演示模式",
  simulatedDate: "模拟日期",
  advanceDay: "+1 天",
  resetClock: "重置",
  missedPrompt: "您本周错过了 {drug} {n} 次。发生了什么事？",
  forgot: "忘记了",
  sideEffects: "副作用",
  feltWell: "感觉良好",
  ranOut: "药物用完",
  other: "其他",
  acknowledgement: "谢谢。我们会将此添加到您给医生或药剂师的问题中。",
  sideEffectsAck: "请把这件事告诉您的医生或药剂师。",
  addToQuestions: "我们会将此添加到您给医生或药剂师的问题中。",
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
  todayTitle: "Ubat Hari Ini",
  morning: "Pagi",
  afternoon: "Petang",
  evening: "Malam",
  bedtime: "Sebelum Tidur",
  foodBefore: "Sebelum makan",
  foodAfter: "Selepas makan",
  foodWith: "Semasa makan",
  foodAny: "Bila-bila masa",
  done: "Sudah",
  takenAt: "Diambil pada",
  undo: "Buat asal",
  dosesTaken: "dosis diambil",
  timeNotSet: "Masa tidak ditetapkan",
  editTime: "Sunting masa",
  todaysMedicines: "Ubat hari ini",
  noMedicines: "Tiada ubat lagi",
  listen: "Dengar",
  stop: "Henti",
  close: "Tutup",
  source: "Sumber",
  voiceNotAvailable: "Suara tidak tersedia pada peranti ini",
  loading: "Memuatkan…",
  demoMode: "Mod demo",
  simulatedDate: "Tarikh simulasi",
  advanceDay: "+1 hari",
  resetClock: "Tetap semula",
  missedPrompt:
    "Anda terlepas {drug} {n} kali minggu ini. Apa yang berlaku?",
  forgot: "Lupa",
  sideEffects: "Kesan sampingan",
  feltWell: "Rasa sihat",
  ranOut: "Ubat habis",
  other: "Lain-lain",
  acknowledgement:
    "Terima kasih. Kami akan menambah ini ke soalan anda untuk doktor atau ahli farmasi.",
  sideEffectsAck: "Sila beritahu doktor atau ahli farmasi anda tentang perkara ini.",
  addToQuestions:
    "Kami akan menambah ini ke soalan anda untuk doktor atau ahli farmasi.",
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
  todayTitle: "Obat Hari Ini",
  morning: "Pagi",
  afternoon: "Siang",
  evening: "Malam",
  bedtime: "Sebelum Tidur",
  foodBefore: "Sebelum makan",
  foodAfter: "Sesudah makan",
  foodWith: "Bersama makanan",
  foodAny: "Kapan saja",
  done: "Sudah",
  takenAt: "Diambil pukul",
  undo: "Batalkan",
  dosesTaken: "dosis sudah diambil",
  timeNotSet: "Waktu belum diatur",
  editTime: "Atur waktu",
  todaysMedicines: "Obat hari ini",
  noMedicines: "Belum ada obat",
  listen: "Dengarkan",
  stop: "Berhenti",
  close: "Tutup",
  source: "Sumber",
  voiceNotAvailable: "Suara tidak tersedia di perangkat ini",
  loading: "Memuat…",
  demoMode: "Mode demo",
  simulatedDate: "Tanggal simulasi",
  advanceDay: "+1 hari",
  resetClock: "Atur ulang",
  missedPrompt:
    "Anda melewatkan {drug} {n} kali minggu ini. Apa yang terjadi?",
  forgot: "Lupa",
  sideEffects: "Efek samping",
  feltWell: "Merasa sehat",
  ranOut: "Obat habis",
  other: "Lainnya",
  acknowledgement:
    "Terima kasih. Kami akan menambahkan ini ke pertanyaan Anda untuk dokter atau apoteker.",
  sideEffectsAck: "Silakan ceritakan hal ini kepada dokter atau apoteker Anda.",
  addToQuestions:
    "Kami akan menambahkan ini ke pertanyaan Anda untuk dokter atau apoteker.",
};

export const dictionaries: Record<Language, Dictionary> = { en, zh, ms, id };

export function t(lang: Language, key: StringKey): string {
  return dictionaries[lang][key] ?? dictionaries.en[key] ?? key;
}
