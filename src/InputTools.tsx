import { useEffect, useRef, useState } from "react";
import { Mic, Search } from "lucide-react";
import type { Locale } from "./i18n";
const copy: Record<Locale, string> = {
  "ko-KR":
    "증상 검색|음성 입력|기기의 음성 서비스가 녹음을 처리할 수 있습니다. 시작할까요?|말한 내용이 맞는지 확인하고 수정하세요.",
  "en-US":
    "Search symptoms|Dictate|Your device’s speech service may process the audio. Start?|Check and edit the transcript.",
  uz: "Alomat qidirish|Ovoz bilan yozish|Qurilmaning nutq xizmati ovozni qayta ishlashi mumkin. Boshlaysizmi?|Yozilgan matnni tekshiring va tuzating.",
  kk: "Белгіні іздеу|Дауыспен енгізу|Құрылғының сөйлеу қызметі дыбысты өңдеуі мүмкін. Бастау керек пе?|Мәтінді тексеріп, түзетіңіз.",
  ky: "Белги издөө|Үн менен киргизүү|Түзмөктүн үн кызматы аудиону иштетиши мүмкүн. Баштайсызбы?|Текстти текшерип, оңдоңуз.",
  "ru-RU":
    "Найти симптом|Продиктовать|Речь может обрабатывать служба устройства. Начать?|Проверьте и исправьте распознанный текст.",
  "fr-FR":
    "Rechercher un symptôme|Dicter|Le service vocal de votre appareil peut traiter le son. Commencer ?|Vérifiez et corrigez le texte.",
  "es-ES":
    "Buscar síntomas|Dictar|El servicio de voz del dispositivo puede procesar el audio. ¿Empezar?|Revisa y corrige el texto.",
  "ja-JP":
    "症状を検索|音声入力|端末の音声サービスが音声を処理することがあります。開始しますか？|認識結果を確認して修正してください。",
  "zh-CN":
    "搜索症状|语音输入|设备的语音服务可能处理录音。开始吗？|请确认并修改识别结果。",
  "zh-TW":
    "搜尋症狀|語音輸入|裝置的語音服務可能處理錄音。要開始嗎？|請確認並修改辨識結果。",
  "ar-SA":
    "ابحث عن الأعراض|إملاء|قد تعالج خدمة الصوت في جهازك التسجيل. هل تبدأ؟|راجع النص وصححه.",
  "ur-PK":
    "علامت تلاش کریں|بول کر لکھیں|آلہ کی صوتی سروس آواز پر کارروائی کر سکتی ہے۔ شروع کریں؟|متن پڑھیں اور درست کریں۔",
  "mn-MN":
    "Шинж тэмдэг хайх|Дуугаар бичих|Төхөөрөмжийн дууны үйлчилгээ бичлэгийг боловсруулж магадгүй. Эхлэх үү?|Бичвэрийг шалгаж засаарай.",
  "ne-NP":
    "लक्षण खोज्नुहोस्|बोलेर लेख्नुहोस्|उपकरणको आवाज सेवाले ध्वनि प्रशोधन गर्न सक्छ। सुरु गर्ने?|लेखिएको पाठ जाँचेर सच्याउनुहोस्।",
  "vi-VN":
    "Tìm triệu chứng|Nhập bằng giọng nói|Dịch vụ giọng nói của thiết bị có thể xử lý âm thanh. Bắt đầu?|Kiểm tra và chỉnh sửa nội dung.",
};
function normalize(text: string) {
  return text
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[ʻ’‘ʼ`']/g, "")
    .trim();
}
const cyrillic: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "j",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "x",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  ъ: "",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
  ў: "o",
  қ: "q",
  ғ: "g",
  ҳ: "h",
};
export function symptomMatch(name: string, query: string, locale: Locale) {
  const q = normalize(query);
  return normalize(name).includes(
    locale === "uz" ? Array.from(q, (c) => cyrillic[c] ?? c).join("") : q,
  );
}
export function SearchSymptoms({
  locale,
  value,
  onChange,
}: {
  locale: Locale;
  value: string;
  onChange: (s: string) => void;
}) {
  return (
    <label className="search">
      <Search size={17} />
      <input
        type="search"
        aria-label={copy[locale].split("|")[0]}
        placeholder={copy[locale].split("|")[0]}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
type Speech = {
  lang: string;
  interimResults: boolean;
  onresult:
    | ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void)
    | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
};
export function Dictate({
  locale,
  append,
  t,
}: {
  locale: Locale;
  append: (s: string) => void;
  t: Record<string, string>;
}) {
  const api = window as typeof window & {
    SpeechRecognition?: new () => Speech;
    webkitSpeechRecognition?: new () => Speech;
  };
  const engine = api.SpeechRecognition ?? api.webkitSpeechRecognition;
  const [active, setActive] = useState(false),
    [message, setMessage] = useState(""),
    ref = useRef<Speech | null>(null);
  useEffect(
    () => () => {
      if (ref.current) {
        ref.current.onresult = null;
        ref.current.onend = null;
        ref.current.onerror = null;
        ref.current.abort();
      }
    },
    [locale],
  );
  if (!engine) return null;
  const [, label, consent, check] = copy[locale].split("|");
  function start() {
    if (!engine || !window.confirm(consent)) return;
    const r = new engine();
    ref.current = r;
    r.lang = locale;
    r.interimResults = false;
    r.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript;
      if (transcript) {
        append(transcript);
        setMessage(check);
      }
    };
    r.onerror = () => {
      setMessage(label + " ✕ · " + t.notes);
      setActive(false);
    };
    r.onend = () => setActive(false);
    try {
      r.start();
      setActive(true);
    } catch {
      setMessage(label + " ✕ · " + t.notes);
    }
  }
  return (
    <div>
      <button onClick={() => (active ? ref.current?.abort() : start())}>
        <Mic size={16} />
        {active ? t.cancel : label}
      </button>
      {message && <p role="status">{message}</p>}
    </div>
  );
}
