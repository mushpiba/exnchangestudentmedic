import { useState } from "react";
import { ExternalLink, MapPin, Phone } from "lucide-react";
import type { Locale } from "./i18n";

const referenceText: Record<Locale, string> = {
  "ko-KR":
    "공식 기관 안내|응대 언어와 시간은 방문 전 전화로 확인하세요.|식약처 품목 대조|포장에서 직접 확인한 단일 성분·함량·제형을 입력하세요.|성분|함량|제형|일반 정제|일반의약품|검토 목록에서 일치하는 품목이 없습니다. 약사에게 포장을 보여주세요.|대조하기|공식 출처",
  "en-US":
    "Official directory|Call to confirm language and hours before visiting.|MFDS product lookup|Enter the single active ingredient, strength and form confirmed on the package.|Ingredient|Strength|Form|Regular tablet|Over the counter|No match in the review catalog. Show the package to a pharmacist.|Compare|Official source",
  uz: "Rasmiy ro‘yxat|Borishdan oldin til va vaqtni telefon orqali aniqlang.|Koreya dori reyestri|Qadoqdagi yagona faol modda, miqdor va shaklni tasdiqlang.|Faol modda|Miqdor|Shakl|Oddiy tabletka|Retseptsiz|Sinov ro‘yxatida mos dori topilmadi. Qadoqni farmatsevtga ko‘rsating.|Solishtirish|Rasmiy manba",
  kk: "Ресми анықтамалық|Қызмет тілі мен уақытын телефонмен нақтылаңыз.|Корея дәрі тізілімі|Қаптамадағы жалғыз белсенді затты, мөлшерін және түрін тексеріңіз.|Белсенді зат|Мөлшер|Түрі|Қарапайым таблетка|Рецептсіз|Сынақ тізімінде сәйкестік жоқ. Қаптаманы фармацевтке көрсетіңіз.|Салыстыру|Ресми дерек",
  ky: "Расмий тизме|Тилди жана иш убактысын телефон аркылуу тактаңыз.|Кореянын дары реестри|Таңгактан жалгыз активдүү затты, өлчөмүн жана формасын тактаңыз.|Активдүү зат|Өлчөмү|Формасы|Кадимки таблетка|Рецептсиз|Сыноо тизмесинен табылган жок. Таңгакты фармацевтке көрсөтүңүз.|Салыштыруу|Расмий булак",
  "ru-RU":
    "Официальный справочник|Уточните язык и часы работы по телефону.|Реестр лекарств Кореи|Сверьте единственное действующее вещество, дозировку и форму на упаковке.|Вещество|Дозировка|Форма|Обычная таблетка|Без рецепта|Совпадений в пробном каталоге нет. Покажите упаковку фармацевту.|Сопоставить|Официальный источник",
  "ja-JP":
    "公的機関情報|対応言語と時間は電話でご確認ください。|韓国の医薬品照合|包装で確認した単一の有効成分・含量・剤形を入力してください。|成分|含量|剤形|通常錠|一般用医薬品|試用リストに一致なし。包装を薬剤師に見せてください。|照合|公式情報",
  "zh-CN":
    "官方机构信息|请在就诊前致电确认语言和时间。|韩国药品核对|请按包装输入单一有效成分、含量及剂型。|成分|含量|剂型|普通片剂|非处方药|试用目录中无匹配。请将包装出示给药师。|核对|官方来源",
  "zh-TW":
    "官方機構資訊|請於就診前致電確認語言和時間。|韓國藥品核對|請按包裝輸入單一有效成分、含量及劑型。|成分|含量|劑型|普通錠劑|非處方藥|試用目錄中無相符項目。請將包裝出示給藥師。|核對|官方來源",
  "vi-VN":
    "Danh bạ chính thức|Gọi để xác nhận ngôn ngữ và giờ làm việc.|Đối chiếu thuốc Hàn Quốc|Nhập hoạt chất duy nhất, hàm lượng và dạng thuốc trên bao bì.|Hoạt chất|Hàm lượng|Dạng thuốc|Viên nén thường|Không kê đơn|Không khớp danh mục thử. Hãy đưa bao bì cho dược sĩ.|Đối chiếu|Nguồn chính thức",
  "fr-FR":
    "Annuaire officiel|Appelez pour vérifier la langue et les horaires.|Registre coréen des médicaments|Vérifiez sur la boîte le principe actif unique, le dosage et la forme.|Principe actif|Dosage|Forme|Comprimé ordinaire|Sans ordonnance|Aucune correspondance dans le catalogue pilote. Montrez la boîte au pharmacien.|Comparer|Source officielle",
  "es-ES":
    "Directorio oficial|Llama para confirmar idioma y horario.|Registro coreano de medicamentos|Comprueba el único principio activo, la concentración y la forma en el envase.|Principio activo|Concentración|Forma|Comprimido normal|Sin receta|Sin coincidencia en el catálogo piloto. Muestra el envase al farmacéutico.|Comparar|Fuente oficial",
  "mn-MN":
    "Албан ёсны лавлах|Хэл, цагийг утсаар лавлаарай.|Солонгос эмийн бүртгэл|Савлагаан дээрх нэг идэвхтэй бодис, хэмжээ, хэлбэрийг шалгана уу.|Бодис|Хэмжээ|Хэлбэр|Энгийн шахмал|Жоргүй|Туршилтын жагсаалтад тохирох эм алга. Савлагааг эм зүйчид үзүүлээрэй.|Харьцуулах|Албан ёсны эх сурвалж",
  "ne-NP":
    "आधिकारिक सूची|भाषा र समय फोन गरेर पुष्टि गर्नुहोस्।|कोरियाली औषधि सूची|प्याकेटमा लेखिएको एउटै सक्रिय तत्व, मात्रा र रूप जाँच्नुहोस्।|तत्व|मात्रा|रूप|साधारण चक्की|बिना पुर्जा|परीक्षण सूचीमा मिलेन। प्याकेट फार्मासिस्टलाई देखाउनुहोस्।|तुलना|आधिकारिक स्रोत",
  "ar-SA":
    "دليل رسمي|اتصل لتأكيد اللغة والساعات قبل الزيارة.|سجل الدواء الكوري|تحقق من المادة الفعالة الوحيدة وتركيزها وشكلها على العبوة.|المادة|التركيز|الشكل|قرص عادي|دون وصفة|لا تطابق في الدليل التجريبي. أظهر العبوة للصيدلي.|مقارنة|مصدر رسمي",
  "ur-PK":
    "سرکاری فہرست|زبان اور اوقات کی فون پر تصدیق کریں۔|کوریا کی دواؤں کا رجسٹر|پیکٹ پر واحد فعال جز، طاقت اور شکل کی تصدیق کریں۔|جز|طاقت|شکل|عام گولی|بغیر نسخے کے|آزمائشی فہرست میں مطابقت نہیں۔ پیکٹ فارماسسٹ کو دکھائیں۔|موازنہ|سرکاری ماخذ",
};
const institutions = [
  {
    ko: "인하대학교병원",
    en: "Inha University Hospital",
    address: "인항로 27",
    phone: "1600-8114",
  },
  {
    ko: "인천사랑병원",
    en: "Incheon Sarang Hospital",
    address: "미추홀대로 726",
    phone: "032-457-2000",
  },
  {
    ko: "현대유비스병원",
    en: "Hyundai UVIS Hospital",
    address: "독배로 503",
    phone: "032-888-7575",
  },
];
export function Directory({ locale }: { locale: Locale }) {
  const words = referenceText[locale].split("|");
  const [title, call] = words,
    source = words[11];
  return (
    <details className="reference" open>
      <summary>{title}</summary>
      <p>{call}</p>
      {institutions.map((h) => (
        <article key={h.phone} className="official">
          <strong lang="ko">{h.ko}</strong>
          <span lang="en">{h.en}</span>
          <small lang="ko">{h.address}</small>
          <div>
            <a href={"tel:" + h.phone}>
              <Phone size={16} />
              {h.phone}
            </a>
            <a
              href={
                "https://map.naver.com/p/search/" +
                encodeURIComponent(h.ko + " 인천")
              }
              target="_blank"
              rel="noreferrer"
            >
              <MapPin size={16} />
              {h.ko} ↗
            </a>
          </div>
        </article>
      ))}
      <a
        className="out"
        href="https://www.incheon.go.kr/ml_kr/MLKR050223"
        target="_blank"
        rel="noreferrer"
      >
        {source} · 인천광역시 ↗
      </a>
    </details>
  );
}
const ingredientAliases = [
  "acetaminophen",
  "paracetamol",
  "아세트아미노펜",
  "파라세타몰",
  "парацетамол",
  "paratsetamol",
  "对乙酰氨基酚",
  "乙醯胺酚",
  "アセトアミノフェン",
];
export function ProductLookup({ locale }: { locale: Locale }) {
  const words = referenceText[locale].split("|");
  const [ingredient, setIngredient] = useState(""),
    [strength, setStrength] = useState(""),
    [form, setForm] = useState(""),
    [result, setResult] = useState<boolean | null>(null);
  return (
    <details className="reference">
      <summary>{words[2]}</summary>
      <p>{words[3]}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setResult(
            ingredientAliases.includes(
              ingredient.normalize("NFKC").trim().toLowerCase(),
            ) &&
              Number(strength) === 500 &&
              form === "tablet",
          );
        }}
        onChange={() => setResult(null)}
      >
        <label>
          {words[4]}
          <input
            required
            value={ingredient}
            placeholder="Paracetamol"
            onChange={(e) => setIngredient(e.target.value)}
          />
        </label>
        <label>
          {words[5]} (mg)
          <input
            required
            type="number"
            min="0.001"
            step="any"
            value={strength}
            onChange={(e) => setStrength(e.target.value)}
          />
        </label>
        <label>
          {words[6]}
          <select
            aria-label={words[6]}
            required
            value={form}
            onChange={(e) => setForm(e.target.value)}
          >
            <option value="">—</option>
            <option value="tablet">{words[7]}</option>
            <option value="unknown">?</option>
          </select>
        </label>
        <button>{words[10]}</button>
      </form>
      {result !== null && (
        <div role="status" className="line">
          {result ? (
            <>
              <strong lang="ko">타이레놀정500밀리그람</strong>
              <span>
                Acetaminophen · 500 mg · {words[7]} · {words[8]}
              </span>
              <a
                className="out"
                href="https://nedrug.mfds.go.kr/pbp/CCBBB01/getItemDetail?itemSeq=202106092"
                target="_blank"
                rel="noreferrer"
              >
                {words[11]} · MFDS 202106092 <ExternalLink size={14} />
              </a>
            </>
          ) : (
            words[9]
          )}
        </div>
      )}
    </details>
  );
}
