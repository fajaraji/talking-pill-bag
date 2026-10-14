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
  | "addToQuestions"
  // Blood pressure
  | "bpTitle"
  | "bpLink"
  | "addBPReading"
  | "enterManually"
  | "systolic"
  | "diastolic"
  | "pulse"
  | "save"
  | "cancel"
  | "delete"
  | "targetFromDoctor"
  | "setTarget"
  | "clearTarget"
  | "trend14Days"
  | "averageThisWeek"
  | "higherThanTarget"
  | "noteForDoctor"
  | "veryHighReading"
  | "contactDoctorToday"
  | "callEmergency"
  | "noReadingsYet"
  | "readings"
  | "date"
  | "time"
  | "bpConfirmPrompt"
  | "bpCouldNotRead"
  // Refill
  | "refillReminder"
  // Questions page
  | "questionsTitle"
  | "questionsForDoctor"
  | "addQuestion"
  | "asked"
  | "printSavePDF"
  | "missedDosesQuestion"
  | "refillQuestion"
  | "bpHighQuestion"
  | "bpVeryHighQuestion"
  | "redirectedQuestion"
  | "noQuestions"
  | "currentMedicines"
  | "printDate"
  // Weekly summary
  | "weeklySummary"
  | "summaryForFamily"
  | "dosesTakenVsScheduled"
  | "reasonsRecorded"
  | "bpAverage"
  | "refillsDue"
  | "missedThisWeek"
  | "doses"
  | "readingsCount";

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
  bpTitle: "Blood Pressure",
  bpLink: "Blood Pressure",
  addBPReading: "Add Reading",
  enterManually: "Enter manually",
  systolic: "Systolic",
  diastolic: "Diastolic",
  pulse: "Pulse",
  save: "Save",
  cancel: "Cancel",
  delete: "Delete",
  targetFromDoctor: "Target from your doctor",
  setTarget: "Set target",
  clearTarget: "Clear target",
  trend14Days: "Trend (14 days)",
  averageThisWeek: "Your average this week: {avg}.",
  higherThanTarget: "Higher than the target you entered on {count} of {total} days.",
  noteForDoctor: "Note this for your doctor.",
  veryHighReading: "This reading is very high.",
  contactDoctorToday: "Contact your doctor or clinic today.",
  callEmergency: "If you feel very unwell, call 995.",
  noReadingsYet: "No readings yet.",
  readings: "Readings",
  date: "Date",
  time: "Time",
  bpConfirmPrompt: "Please check the numbers and tap Save.",
  bpCouldNotRead: "Could not read the monitor. Please enter the numbers manually.",
  refillReminder:
    "{drug}: about {n} days left. Arrange a refill with your clinic or pharmacy.",
  questionsTitle: "Questions for my doctor or pharmacist",
  questionsForDoctor: "Questions for my doctor or pharmacist",
  addQuestion: "Add a question",
  asked: "Asked",
  printSavePDF: "Print / Save as PDF",
  missedDosesQuestion: "Missed {drug} {n} times this week — reason: {reason}",
  refillQuestion: "{drug}: about {n} days left. Arrange a refill.",
  bpHighQuestion: "Blood pressure {sys}/{dia} on {date} — above your target.",
  bpVeryHighQuestion: "Blood pressure {sys}/{dia} on {date} — very high reading.",
  redirectedQuestion: "Question for doctor/pharmacist: {question}",
  noQuestions: "No questions yet.",
  currentMedicines: "Current medicines",
  printDate: "Date",
  weeklySummary: "Weekly Summary",
  summaryForFamily: "For family members",
  dosesTakenVsScheduled: "Doses taken vs scheduled",
  reasonsRecorded: "Reasons recorded",
  bpAverage: "Blood pressure average",
  refillsDue: "Refills due",
  missedThisWeek: "Missed {n} dose(s) this week",
  doses: "doses",
  readingsCount: "{n} reading(s)",
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
  bpTitle: "血压",
  bpLink: "血压",
  addBPReading: "添加记录",
  enterManually: "手动输入",
  systolic: "收缩压",
  diastolic: "舒张压",
  pulse: "脉搏",
  save: "保存",
  cancel: "取消",
  delete: "删除",
  targetFromDoctor: "医生建议的目标",
  setTarget: "设定目标",
  clearTarget: "清除目标",
  trend14Days: "趋势（14天）",
  averageThisWeek: "本周平均：{avg}。",
  higherThanTarget: "在您输入的目标中，有{count}/{total}天偏高。",
  noteForDoctor: "请记录下来告诉医生。",
  veryHighReading: "此读数非常高。",
  contactDoctorToday: "今天请联系您的医生或诊所。",
  callEmergency: "如果您感觉非常不适，请拨打995。",
  noReadingsYet: "尚无记录。",
  readings: "记录",
  date: "日期",
  time: "时间",
  bpConfirmPrompt: "请检查数字后点击保存。",
  bpCouldNotRead: "无法读取显示器。请手动输入数字。",
  refillReminder: "{drug}：大约还剩 {n} 天。请向诊所或药房安排续药。",
  questionsTitle: "给医生或药剂师的问题",
  questionsForDoctor: "给医生或药剂师的问题",
  addQuestion: "添加问题",
  asked: "已询问",
  printSavePDF: "打印 / 保存为 PDF",
  missedDosesQuestion: "本周错过了 {drug} {n} 次 — 原因：{reason}",
  refillQuestion: "{drug}：大约还剩 {n} 天。请安排续药。",
  bpHighQuestion: "{date} 血压 {sys}/{dia} — 高于您的目标。",
  bpVeryHighQuestion: "{date} 血压 {sys}/{dia} — 读数非常高。",
  redirectedQuestion: "给医生/药剂师的问题：{question}",
  noQuestions: "没有问题。",
  currentMedicines: "当前药物",
  printDate: "日期",
  weeklySummary: "每周摘要",
  summaryForFamily: "给家庭成员",
  dosesTakenVsScheduled: "已服用剂量与计划剂量",
  reasonsRecorded: "记录的原因",
  bpAverage: "血压平均值",
  refillsDue: "需续药",
  missedThisWeek: "本周错过了 {n} 次",
  doses: "剂",
  readingsCount: "{n} 条记录",
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
  bpTitle: "Tekanan Darah",
  bpLink: "Tekanan Darah",
  addBPReading: "Tambah Bacaan",
  enterManually: "Masukkan secara manual",
  systolic: "Sistolik",
  diastolic: "Diastolik",
  pulse: "Denyutan",
  save: "Simpan",
  cancel: "Batal",
  delete: "Padam",
  targetFromDoctor: "Sasaran daripada doktor anda",
  setTarget: "Tetapkan sasaran",
  clearTarget: "Kosongkan sasaran",
  trend14Days: "Trend (14 hari)",
  averageThisWeek: "Purata minggu ini: {avg}.",
  higherThanTarget: "Lebih tinggi daripada sasaran yang anda masukkan pada {count} daripada {total} hari.",
  noteForDoctor: "Catat ini untuk doktor anda.",
  veryHighReading: "Bacaan ini sangat tinggi.",
  contactDoctorToday: "Hubungi doktor atau klinik anda hari ini.",
  callEmergency: "Jika anda berasa sangat tidak sihat, hubungi 995.",
  noReadingsYet: "Tiada bacaan lagi.",
  readings: "Bacaan",
  date: "Tarikh",
  time: "Masa",
  bpConfirmPrompt: "Sila semak nombor dan ketik Simpan.",
  bpCouldNotRead: "Tidak dapat membaca monitor. Sila masukkan nombor secara manual.",
  refillReminder:
    "{drug}: tinggal lebih kurang {n} hari. Aturkan pembekalan semula di klinik atau farmasi anda.",
  questionsTitle: "Soalan untuk doktor atau ahli farmasi saya",
  questionsForDoctor: "Soalan untuk doktor atau ahli farmasi saya",
  addQuestion: "Tambah soalan",
  asked: "Sudah ditanya",
  printSavePDF: "Cetak / Simpan sebagai PDF",
  missedDosesQuestion: "Terlepas {drug} {n} kali minggu ini — sebab: {reason}",
  refillQuestion: "{drug}: tinggal lebih kurang {n} hari. Aturkan pembekalan semula.",
  bpHighQuestion: "Tekanan darah {sys}/{dia} pada {date} — melebihi sasaran anda.",
  bpVeryHighQuestion: "Tekanan darah {sys}/{dia} pada {date} — bacaan sangat tinggi.",
  redirectedQuestion: "Soalan untuk doktor/ahli farmasi: {question}",
  noQuestions: "Tiada soalan lagi.",
  currentMedicines: "Ubat semasa",
  printDate: "Tarikh",
  weeklySummary: "Ringkasan Mingguan",
  summaryForFamily: "Untuk ahli keluarga",
  dosesTakenVsScheduled: "Dosis diambil berbanding dijadualkan",
  reasonsRecorded: "Sebab yang direkodkan",
  bpAverage: "Purata tekanan darah",
  refillsDue: "Pembekalan semula diperlukan",
  missedThisWeek: "Terlepas {n} kali minggu ini",
  doses: "dosis",
  readingsCount: "{n} bacaan",
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
  bpTitle: "Tekanan Darah",
  bpLink: "Tekanan Darah",
  addBPReading: "Tambah Catatan",
  enterManually: "Masukkan manual",
  systolic: "Sistolik",
  diastolic: "Diastolik",
  pulse: "Denyut nadi",
  save: "Simpan",
  cancel: "Batal",
  delete: "Hapus",
  targetFromDoctor: "Sasaran dari dokter Anda",
  setTarget: "Atur sasaran",
  clearTarget: "Hapus sasaran",
  trend14Days: "Tren (14 hari)",
  averageThisWeek: "Rata-rata minggu ini: {avg}.",
  higherThanTarget: "Lebih tinggi dari sasaran yang Anda masukkan pada {count} dari {total} hari.",
  noteForDoctor: "Catat ini untuk dokter Anda.",
  veryHighReading: "Bacaan ini sangat tinggi.",
  contactDoctorToday: "Hubungi dokter atau klinik Anda hari ini.",
  callEmergency: "Jika Anda merasa sangat tidak enak badan, hubungi 995.",
  noReadingsYet: "Belum ada catatan.",
  readings: "Catatan",
  date: "Tanggal",
  time: "Waktu",
  bpConfirmPrompt: "Silakan periksa angkanya lalu ketuk Simpan.",
  bpCouldNotRead: "Tidak bisa membaca monitor. Silakan masukkan angka secara manual.",
  refillReminder:
    "{drug}: tinggal sekitar {n} hari. Atur pengisian ulang di klinik atau apotek Anda.",
  questionsTitle: "Pertanyaan untuk dokter atau apoteker saya",
  questionsForDoctor: "Pertanyaan untuk dokter atau apoteker saya",
  addQuestion: "Tambah pertanyaan",
  asked: "Sudah ditanyakan",
  printSavePDF: "Cetak / Simpan sebagai PDF",
  missedDosesQuestion: "Melewatkan {drug} {n} kali minggu ini — alasan: {reason}",
  refillQuestion: "{drug}: tinggal sekitar {n} hari. Atur pengisian ulang.",
  bpHighQuestion: "Tekanan darah {sys}/{dia} pada {date} — di atas sasaran Anda.",
  bpVeryHighQuestion: "Tekanan darah {sys}/{dia} pada {date} — bacaan sangat tinggi.",
  redirectedQuestion: "Pertanyaan untuk dokter/apoteker: {question}",
  noQuestions: "Belum ada pertanyaan.",
  currentMedicines: "Obat saat ini",
  printDate: "Tanggal",
  weeklySummary: "Ringkasan Mingguan",
  summaryForFamily: "Untuk anggota keluarga",
  dosesTakenVsScheduled: "Dosis diambil vs dijadwalkan",
  reasonsRecorded: "Alasan yang tercatat",
  bpAverage: "Rata-rata tekanan darah",
  refillsDue: "Pengisian ulang diperlukan",
  missedThisWeek: "Melewatkan {n} dosis minggu ini",
  doses: "dosis",
  readingsCount: "{n} catatan",
};

export const dictionaries: Record<Language, Dictionary> = { en, zh, ms, id };

export function t(lang: Language, key: StringKey): string {
  return dictionaries[lang][key] ?? dictionaries.en[key] ?? key;
}
