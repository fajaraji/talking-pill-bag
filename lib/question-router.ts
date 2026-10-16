import { findDrugInfo } from "./drug-info.ts";
import type { Language } from "./i18n.ts";
import type { CachedExplanation } from "./storage.ts";

export interface QuestionRouteResult {
  reply: string;
  ifMissedQuote?: string;
  saveToQuestions: {
    medicineId: string;
    drugName: string;
    question: string;
    askedOn: string;
  };
}

// Keywords that suggest the user is asking about a missed or forgotten dose.
// These are checked case-insensitively.
const MISSED_DOSE_KEYWORDS: Record<Language, string[]> = {
  en: ["missed", "forgot", "forget", "skip", "skipped"],
  zh: ["错过", "忘记", "漏服", "没吃"],
  ms: ["terlepas", "lupa", "terlupa", "tertinggal"],
  id: ["terlewat", "lupa", "terlupa", "tertinggal", "lewat"],
};

const PHARMACIST_MESSAGES: Record<Language, string> = {
  en: "I'm not able to identify that medication, please check with your pharmacist.",
  zh: "无法识别该药物，请咨询药剂师。",
  ms: "Saya tidak dapat mengenal pasti ubat tersebut, sila semak dengan ahli farmasi anda.",
  id: "Saya tidak bisa mengenali obat ini, silakan periksa ke apoteker.",
};

/**
 * Deterministic question router. NEVER calls an LLM.
 * Always redirects the question to a doctor/pharmacist.
 * If the question mentions a missed dose and the drug is known with if_missed,
 * also returns the official missed-dose quote (English; translated cache not
 * reliably extractable for this section alone).
 * If the medicine is unknown, replies with the pharmacist sentence only.
 */
export function routeQuestion(args: {
  question: string;
  medicineId: string;
  drugName: string;
  language: Language;
  today: string;
  cachedExplanation?: CachedExplanation | null;
}): QuestionRouteResult {
  const { question, medicineId, drugName, language, today } = args;

  const drug = findDrugInfo(drugName);

  // Unknown medicine → pharmacist sentence only, but still save the question
  if (!drug) {
    return {
      reply: PHARMACIST_MESSAGES[language] ?? PHARMACIST_MESSAGES.en,
      saveToQuestions: {
        medicineId,
        drugName,
        question,
        askedOn: today,
      },
    };
  }

  const reply = getRedirectReply(language);

  const lowerQ = question.toLowerCase();
  // Check keywords of ALL languages — the user may ask in a language different from the UI.
  const allKeywords = Object.values(MISSED_DOSE_KEYWORDS).flat();
  const mentionsMissed = allKeywords.some((k) => lowerQ.includes(k.toLowerCase()));

  let ifMissedQuote: string | undefined;

  if (mentionsMissed && drug.if_missed) {
    ifMissedQuote = drug.if_missed;
  }

  return {
    reply,
    ifMissedQuote,
    saveToQuestions: {
      medicineId,
      drugName,
      question,
      askedOn: today,
    },
  };
}

function getRedirectReply(lang: Language): string {
  switch (lang) {
    case "zh":
      return "这个问题需要医生或药剂师来回答。我们已将其添加到您的问题列表中。";
    case "ms":
      return "Soalan ini perlu dijawab oleh doktor atau ahli farmasi anda. Kami telah menambahnya ke senarai soalan anda.";
    case "id":
      return "Pertanyaan ini perlu dijawab oleh dokter atau apoteker Anda. Kami telah menambahkannya ke daftar pertanyaan Anda.";
    default:
      return "This question needs your doctor or pharmacist. We've added it to your questions list.";
  }
}
