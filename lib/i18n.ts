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
  | "readFailed"
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
  | "takenAtBy"
  | "undo"
  | "dosesTaken"
  | "progressDone"
  | "allDoneToday"
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
  // Ask a question
  | "askQuestion"
  | "askQuestionPlaceholder"
  | "send"
  | "questionRedirected"
  | "whatSourceSaysAboutMissedDose"
  | "oglAttribution"
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
  // Personalisation / home page
  | "whoIsThisFor"
  | "namePlaceholder"
  | "yourName"
  | "yourNamePlaceholder"
  | "joinAction"
  | "recoveryCode"
  | "recoveryCodeHint"
  | "newRecoveryCode"
  | "gotIt"
  | "settings"
  | "changeNameLanguage"
  | "todaysMedicinesNamed"
  | "todaysMedicinesNeutral"
  | "homeValueStatement"
  | "step1Title"
  | "step2Title"
  | "step3Title"
  | "addFirstMedicine"
  | "forFamilyAndHelpers"
  | "addMedicineTile"
  | "addMedicineTileDesc"
  | "bpTile"
  | "bpTileDesc"
  | "questionsTile"
  | "questionsTileDesc"
  | "weeklySummaryTile"
  | "weeklySummaryTileDesc"
  | "shareViaWhatsApp"
  | "nextDose"
  | "takenOf"
  // Weekly summary
  | "weeklySummary"
  | "summaryForFamily"
  | "dosesTakenVsScheduled"
  | "reasonsRecorded"
  | "bpAverage"
  | "refillsDue"
  | "missedThisWeek"
  | "doses"
  | "readingsCount"
  // Onboarding / family sharing
  | "setupTitle"
  | "caregiverChoice"
  | "seniorChoice"
  | "joinWithCode"
  | "codePlaceholder"
  | "invalidCode"
  | "familyPhones"
  | "familyPhonesDesc"
  | "addPhone"
  | "addFamilyMember"
  | "qrInstructions"
  | "codeExpiresIn"
  | "shortCodeDuration"
  | "linkedPhones"
  | "noDevices"
  | "defaultDeviceLabelSenior"
  | "defaultDeviceLabelCaregiver"
  | "you"
  | "roleLabel"
  | "caregiver"
  | "senior"
  | "lastActive"
  | "unlink"
  | "unlinkConfirm"
  | "installPrompt"
  | "installHintChrome"
  | "installHintIOS"
  | "joinSuccess"
  | "redirecting"
  | "joinFailed"
  | "share"
  | "copied"
  | "copyText"
  | "seniorHelpLine";

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
  readFailed: "We couldn't read the photo this time. Please try again.",
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
  takenAtBy: "Taken at {time} by {name}",
  undo: "Undo",
  dosesTaken: "doses taken",
  progressDone: "{taken} of {total} done today",
  allDoneToday: "All done for today",
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
  askQuestion: "Ask a question about this medicine",
  askQuestionPlaceholder: "Type your question here",
  send: "Send",
  questionRedirected:
    "This question needs your doctor or pharmacist. We've added it to your questions list.",
  whatSourceSaysAboutMissedDose: "Information about a missed dose:",
  oglAttribution: "Contains public sector information licensed under the Open Government Licence v3.0.",
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
  whoIsThisFor: "Who is this for?",
  namePlaceholder: "Name, e.g. Mum",
  yourName: "Your name",
  yourNamePlaceholder: "e.g. Mei (daughter)",
  joinAction: "Join",
  recoveryCode: "Recovery code",
  recoveryCodeHint:
    "Save this code. If this phone loses its data, use it to get back in.",
  newRecoveryCode: "New recovery code",
  gotIt: "Got it",
  settings: "Settings",
  changeNameLanguage: "Change name and language",
  todaysMedicinesNamed: "{name}'s medicines today",
  todaysMedicinesNeutral: "Today's medicines",
  homeValueStatement:
    "Snap a medicine label once. Get a simple daily schedule, spoken explanations and gentle reminders.",
  step1Title: "Photograph the label",
  step2Title: "Check what we read",
  step3Title: 'Tap "Done" each day — we remind and explain',
  addFirstMedicine: "Add the first medicine",
  forFamilyAndHelpers: "For family and helpers",
  addMedicineTile: "Add medicine",
  addMedicineTileDesc: "Scan a new medicine label",
  bpTile: "Blood pressure",
  bpTileDesc: "Log blood pressure readings",
  questionsTile: "Questions for the doctor",
  questionsTileDesc: "Notes to bring to the next visit",
  weeklySummaryTile: "Weekly summary",
  weeklySummaryTileDesc: "See how the week went",
  shareViaWhatsApp: "Share via WhatsApp",
  nextDose: "Next: {slot}",
  takenOf: "{taken} of {total} taken",
  setupTitle: "Set up Talking Pill Bag",
  caregiverChoice: "I look after someone's medicines",
  seniorChoice: "I have a code from my family",
  joinWithCode: "Join with a code",
  codePlaceholder: "6-digit code",
  invalidCode: "Invalid or expired code.",
  familyPhones: "Family phones",
  familyPhonesDesc: "Add or manage family member devices",
  addPhone: "Add {name}'s phone",
  addFamilyMember: "Add another family member",
  qrInstructions: "Open the camera on {name}'s phone and scan this code. You only need to do this once.",
  codeExpiresIn: "This code works for {n} more minutes.",
  shortCodeDuration: "This 6-digit code works for 15 minutes.",
  linkedPhones: "Linked phones",
  noDevices: "No devices linked yet.",
  defaultDeviceLabelSenior: "{name}'s phone",
  defaultDeviceLabelCaregiver: "Family member",
  you: "You",
  roleLabel: "Role",
  caregiver: "Caregiver",
  senior: "Senior",
  lastActive: "Last active",
  unlink: "Unlink",
  unlinkConfirm: "Are you sure you want to unlink this device?",
  installPrompt: "After joining, add Talking Pill Bag to the home screen.",
  installHintChrome: "Chrome menu > Add to Home screen (Android)",
  installHintIOS: "Share > Add to Home Screen (iPhone)",
  joinSuccess: "Welcome! You are now connected.",
  redirecting: "Taking you to your medicines…",
  joinFailed: "Could not join",
  share: "Share",
  copied: "Copied",
  copyText: "Copy text",
  seniorHelpLine: "Ask your family for help.",
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
  readFailed: "这次我们无法读取照片。请重试。",
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
  takenAtBy: "已于 {time} 由 {name} 服用",
  undo: "撤销",
  dosesTaken: "剂已服用",
  progressDone: "今天已完成 {taken} / {total}",
  allDoneToday: "今天的药都已完成",
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
  askQuestion: "询问有关此药物的问题",
  askQuestionPlaceholder: "在此输入您的问题",
  send: "发送",
  questionRedirected: "这个问题需要医生或药剂师来回答。我们已将其添加到您的问题列表中。",
  whatSourceSaysAboutMissedDose: "漏服剂量相关信息：",
  oglAttribution: "Contains public sector information licensed under the Open Government Licence v3.0.",
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
  whoIsThisFor: "这是给谁的？",
  namePlaceholder: "名字，例如妈妈",
  yourName: "您的名字",
  yourNamePlaceholder: "例如 美（女儿）",
  joinAction: "加入",
  recoveryCode: "恢复码",
  recoveryCodeHint: "请保存此代码。如果此手机数据丢失，可用它重新登录。",
  newRecoveryCode: "新的恢复码",
  gotIt: "知道了",
  settings: "设置",
  changeNameLanguage: "更改名字和语言",
  todaysMedicinesNamed: "{name} 今天的药物",
  todaysMedicinesNeutral: "今日药物",
  homeValueStatement:
    "拍一次药袋标签。即可获得简单的每日时间表、语音说明和温和的提醒。",
  step1Title: "拍摄标签照片",
  step2Title: "核对我们读取的内容",
  step3Title: "每天点击“完成”——我们会提醒并解释",
  addFirstMedicine: "添加第一种药物",
  forFamilyAndHelpers: "给家人和助手",
  addMedicineTile: "添加药物",
  addMedicineTileDesc: "扫描新的药袋标签",
  bpTile: "血压",
  bpTileDesc: "记录血压读数",
  questionsTile: "给医生的问题",
  questionsTileDesc: "下次就诊要带去的记录",
  weeklySummaryTile: "每周摘要",
  weeklySummaryTileDesc: "查看本周情况",
  shareViaWhatsApp: "通过 WhatsApp 分享",
  nextDose: "下次：{slot}",
  takenOf: "已服用 {taken} / {total}",
  setupTitle: "设置会说话的药袋",
  caregiverChoice: "我负责某人的药物",
  seniorChoice: "我有家人给的代码",
  joinWithCode: "用代码加入",
  codePlaceholder: "6位数字代码",
  invalidCode: "代码无效或已过期。",
  familyPhones: "家人手机",
  familyPhonesDesc: "添加或管理家人设备",
  addPhone: "添加{name}的手机",
  addFamilyMember: "添加另一位家庭成员",
  qrInstructions: "在{name}的手机上打开相机扫描此码。只需操作一次。",
  codeExpiresIn: "此代码还剩{n}分钟有效。",
  shortCodeDuration: "此6位数字代码15分钟内有效。",
  linkedPhones: "已连接的手机",
  noDevices: "尚未连接任何设备。",
  defaultDeviceLabelSenior: "{name}的手机",
  defaultDeviceLabelCaregiver: "家庭成员",
  you: "您",
  roleLabel: "角色",
  caregiver: "照顾者",
  senior: "长者",
  lastActive: "最后活跃",
  unlink: "解除连接",
  unlinkConfirm: "确定要解除连接此设备吗？",
  installPrompt: "加入后，请将“会说话的药袋”添加到主屏幕。",
  installHintChrome: "Chrome菜单 > 添加到主屏幕（Android）",
  installHintIOS: "分享 > 添加到主屏幕（iPhone）",
  joinSuccess: "欢迎！您已连接成功。",
  redirecting: "正在带您前往药物页面…",
  joinFailed: "无法加入",
  share: "分享",
  copied: "已复制",
  copyText: "复制文字",
  seniorHelpLine: "请向家人求助。",
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
  readFailed: "Kami tidak dapat membaca gambar ini kali ini. Sila cuba semula.",
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
  takenAtBy: "Diambil pada {time} oleh {name}",
  undo: "Buat asal",
  dosesTaken: "dosis diambil",
  progressDone: "{taken} daripada {total} selesai hari ini",
  allDoneToday: "Semua selesai untuk hari ini",
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
  askQuestion: "Tanya soalan tentang ubat ini",
  askQuestionPlaceholder: "Taip soalan anda di sini",
  send: "Hantar",
  questionRedirected:
    "Soalan ini perlu dijawab oleh doktor atau ahli farmasi anda. Kami telah menambahnya ke senarai soalan anda.",
  whatSourceSaysAboutMissedDose: "Maklumat tentang terlepas dos:",
  oglAttribution: "Contains public sector information licensed under the Open Government Licence v3.0.",
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
  whoIsThisFor: "Ini untuk siapa?",
  namePlaceholder: "Nama, contohnya Mak",
  yourName: "Nama anda",
  yourNamePlaceholder: "cth. Mei (anak perempuan)",
  joinAction: "Sertai",
  recoveryCode: "Kod pemulihan",
  recoveryCodeHint:
    "Simpan kod ini. Jika telefon ini kehilangan datanya, gunakannya untuk masuk semula.",
  newRecoveryCode: "Kod pemulihan baharu",
  gotIt: "Faham",
  settings: "Tetapan",
  changeNameLanguage: "Tukar nama dan bahasa",
  todaysMedicinesNamed: "Ubat {name} hari ini",
  todaysMedicinesNeutral: "Ubat hari ini",
  homeValueStatement:
    "Ambil gambar label ubat sekali. Dapatkan jadual harian yang mudah, penjelasan bersuara dan peringatan lembut.",
  step1Title: "Ambil gambar label",
  step2Title: "Semak apa yang kami baca",
  step3Title: 'Ketik "Selesai" setiap hari — kami ingatkan dan terangkan',
  addFirstMedicine: "Tambah ubat pertama",
  forFamilyAndHelpers: "Untuk keluarga dan pembantu",
  addMedicineTile: "Tambah ubat",
  addMedicineTileDesc: "Imbas label ubat baharu",
  bpTile: "Tekanan darah",
  bpTileDesc: "Rekod bacaan tekanan darah",
  questionsTile: "Soalan untuk doktor",
  questionsTileDesc: "Nota untuk dibawa pada lawatan seterusnya",
  weeklySummaryTile: "Ringkasan mingguan",
  weeklySummaryTileDesc: "Lihat perkembangan minggu ini",
  shareViaWhatsApp: "Kongsi melalui WhatsApp",
  nextDose: "Seterusnya: {slot}",
  takenOf: "{taken} daripada {total} diambil",
  setupTitle: "Sediakan Beg Ubat Boleh Bercakap",
  caregiverChoice: "Saya menjaga ubat seseorang",
  seniorChoice: "Saya ada kod daripada keluarga saya",
  joinWithCode: "Sertai dengan kod",
  codePlaceholder: "Kod 6 digit",
  invalidCode: "Kod tidak sah atau telah tamat tempoh.",
  familyPhones: "Telefon keluarga",
  familyPhonesDesc: "Tambah atau urus peranti ahli keluarga",
  addPhone: "Tambah telefon {name}",
  addFamilyMember: "Tambah ahli keluarga lain",
  qrInstructions: "Buka kamera pada telefon {name} dan imbas kod ini. Anda hanya perlu lakukan sekali.",
  codeExpiresIn: "Kod ini sah untuk {n} minit lagi.",
  shortCodeDuration: "Kod 6 digit ini sah untuk 15 minit.",
  linkedPhones: "Telefon yang dipautkan",
  noDevices: "Tiada peranti dipautkan lagi.",
  defaultDeviceLabelSenior: "Telefon {name}",
  defaultDeviceLabelCaregiver: "Ahli keluarga",
  you: "Anda",
  roleLabel: "Peranan",
  caregiver: "Penjaga",
  senior: "Warga emas",
  lastActive: "Aktif terakhir",
  unlink: "Nyahpaut",
  unlinkConfirm: "Adakah anda pasti mahu menyahpaut peranti ini?",
  installPrompt: "Selepas menyertai, tambah Beg Ubat Boleh Bercakap ke skrin utama.",
  installHintChrome: "Menu Chrome > Tambah ke skrin utama (Android)",
  installHintIOS: "Kongsi > Tambah ke Skrin Utama (iPhone)",
  joinSuccess: "Selamat datang! Anda kini telah disambungkan.",
  redirecting: "Membawa anda ke ubat anda…",
  joinFailed: "Tidak dapat menyertai",
  share: "Kongsi",
  copied: "Disalin",
  copyText: "Salin teks",
  seniorHelpLine: "Minta bantuan keluarga anda.",
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
  readFailed: "Kali ini kami tidak dapat membaca fotonya. Silakan coba lagi.",
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
  takenAtBy: "Diambil pukul {time} oleh {name}",
  undo: "Batalkan",
  dosesTaken: "dosis sudah diambil",
  progressDone: "{taken} dari {total} selesai hari ini",
  allDoneToday: "Semua selesai untuk hari ini",
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
  askQuestion: "Tanyakan pertanyaan tentang obat ini",
  askQuestionPlaceholder: "Ketik pertanyaan Anda di sini",
  send: "Kirim",
  questionRedirected:
    "Pertanyaan ini perlu dijawab oleh dokter atau apoteker Anda. Kami telah menambahkannya ke daftar pertanyaan Anda.",
  whatSourceSaysAboutMissedDose: "Informasi tentang dosis yang terlewat:",
  oglAttribution: "Contains public sector information licensed under the Open Government Licence v3.0.",
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
  whoIsThisFor: "Ini untuk siapa?",
  namePlaceholder: "Nama, misalnya Ibu",
  yourName: "Nama Anda",
  yourNamePlaceholder: "mis. Mei (anak perempuan)",
  joinAction: "Gabung",
  recoveryCode: "Kode pemulihan",
  recoveryCodeHint:
    "Simpan kode ini. Jika ponsel ini kehilangan datanya, gunakan untuk masuk kembali.",
  newRecoveryCode: "Kode pemulihan baru",
  gotIt: "Mengerti",
  settings: "Pengaturan",
  changeNameLanguage: "Ubah nama dan bahasa",
  todaysMedicinesNamed: "Obat {name} hari ini",
  todaysMedicinesNeutral: "Obat hari ini",
  homeValueStatement:
    "Foto label obat sekali. Dapatkan jadwal harian sederhana, penjelasan suara, dan pengingat lembut.",
  step1Title: "Fotograferi label",
  step2Title: "Periksa apa yang kami baca",
  step3Title: 'Ketuk "Selesai" setiap hari — kami ingatkan dan jelaskan',
  addFirstMedicine: "Tambah obat pertama",
  forFamilyAndHelpers: "Untuk keluarga dan pembantu",
  addMedicineTile: "Tambah obat",
  addMedicineTileDesc: "Pindai label obat baru",
  bpTile: "Tekanan darah",
  bpTileDesc: "Catat tekanan darah",
  questionsTile: "Pertanyaan untuk dokter",
  questionsTileDesc: "Catatan untuk dibawa saat berikutnya",
  weeklySummaryTile: "Ringkasan mingguan",
  weeklySummaryTileDesc: "Lihat perkembangan minggu ini",
  shareViaWhatsApp: "Bagikan via WhatsApp",
  nextDose: "Berikutnya: {slot}",
  takenOf: "{taken} dari {total} sudah diambil",
  setupTitle: "Siapkan Kantong Obat yang Bisa Ngomong",
  caregiverChoice: "Saya merawat obat seseorang",
  seniorChoice: "Saya punya kode dari keluarga saya",
  joinWithCode: "Gabung dengan kode",
  codePlaceholder: "Kode 6 digit",
  invalidCode: "Kode tidak valid atau sudah kedaluwarsa.",
  familyPhones: "Telepon keluarga",
  familyPhonesDesc: "Tambah atau kelola perangkat anggota keluarga",
  addPhone: "Tambah telepon {name}",
  addFamilyMember: "Tambah anggota keluarga lain",
  qrInstructions: "Buka kamera di telepon {name} dan pindai kode ini. Anda hanya perlu melakukannya sekali.",
  codeExpiresIn: "Kode ini berlaku selama {n} menit lagi.",
  shortCodeDuration: "Kode 6 digit ini berlaku selama 15 menit.",
  linkedPhones: "Telepon yang terhubung",
  noDevices: "Belum ada perangkat yang terhubung.",
  defaultDeviceLabelSenior: "Telepon {name}",
  defaultDeviceLabelCaregiver: "Anggota keluarga",
  you: "Anda",
  roleLabel: "Peran",
  caregiver: "Perawat",
  senior: "Lansia",
  lastActive: "Aktif terakhir",
  unlink: "Putuskan",
  unlinkConfirm: "Yakin ingin memutuskan perangkat ini?",
  installPrompt: "Setelah bergabung, tambahkan Kantong Obat yang Bisa Ngomong ke layar beranda.",
  installHintChrome: "Menu Chrome > Tambahkan ke Layar Beranda (Android)",
  installHintIOS: "Bagikan > Tambahkan ke Layar Beranda (iPhone)",
  joinSuccess: "Selamat datang! Anda kini telah terhubung.",
  redirecting: "Mengarahkan Anda ke obat Anda…",
  joinFailed: "Tidak dapat bergabung",
  share: "Bagikan",
  copied: "Disalin",
  copyText: "Salin teks",
  seniorHelpLine: "Minta bantuan keluarga Anda.",
};

export const dictionaries: Record<Language, Dictionary> = { en, zh, ms, id };

export function t(lang: Language, key: StringKey): string {
  return dictionaries[lang][key] ?? dictionaries.en[key] ?? key;
}
