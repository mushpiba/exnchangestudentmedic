// Ingredient dictionary and MFDS-registered products for reading Korean medicine packages.
// Ingredient facts are general pharmacology. Draft data — a pharmacist must review it before the pilot.
import type { MessageKey } from "../i18n";

type Ingredient = {
  /** Spellings found on packages: Korean label names, INN and common variants. */
  names: string[];
  cls: string;
  uses: string[];
  cautions: string[];
};

export const INGREDIENTS: Record<string, Ingredient> = {
  acetaminophen: {
    names: ["아세트아미노펜", "아세트아미노휀", "파라세타몰", "acetaminophen", "paracetamol", "парацетамол", "对乙酰氨基酚", "乙醯胺酚"],
    cls: "analgesic",
    uses: ["fever", "pain", "headache", "menstrual"],
    cautions: ["alcoholLiver", "maxDose", "duplicate"],
  },
  ibuprofen: {
    names: ["이부프로펜", "ibuprofen", "ибупрофен", "布洛芬"],
    cls: "nsaid",
    uses: ["pain", "fever", "menstrual", "muscle"],
    cautions: ["stomach", "asthmaNsaid", "kidney", "pregnancy", "duplicate"],
  },
  dexibuprofen: {
    names: ["덱시부프로펜", "dexibuprofen"],
    cls: "nsaid",
    uses: ["pain", "fever", "menstrual", "muscle"],
    cautions: ["stomach", "asthmaNsaid", "kidney", "pregnancy", "duplicate"],
  },
  naproxen: {
    names: ["나프록센", "naproxen", "напроксен"],
    cls: "nsaid",
    uses: ["pain", "menstrual", "muscle"],
    cautions: ["stomach", "asthmaNsaid", "kidney", "pregnancy"],
  },
  aspirin: {
    names: ["아스피린", "아세틸살리실산", "aspirin", "acetylsalicylic", "аспирин"],
    cls: "nsaid",
    uses: ["pain", "fever"],
    cautions: ["stomach", "asthmaNsaid", "reye", "pregnancy"],
  },
  isopropylantipyrine: {
    names: ["이소프로필안티피린", "isopropylantipyrine", "propyphenazone"],
    cls: "analgesic",
    uses: ["pain", "headache", "fever"],
    cautions: ["maxDose", "duplicate"],
  },
  ethenzamide: {
    names: ["에텐자미드", "ethenzamide"],
    cls: "analgesic",
    uses: ["pain", "headache"],
    cautions: ["stomach", "duplicate"],
  },
  caffeine: {
    names: ["무수카페인", "카페인", "caffeine"],
    cls: "stimulant",
    uses: ["headache", "alertness"],
    cautions: ["caffeine"],
  },
  chlorpheniramine: {
    names: ["클로르페니라민", "chlorpheniramine", "chlorphenamine"],
    cls: "antihistamine",
    uses: ["runnyNose", "allergy", "itching"],
    cautions: ["drowsy", "duplicate"],
  },
  diphenhydramine: {
    names: ["디펜히드라민", "diphenhydramine"],
    cls: "antihistamine",
    uses: ["allergy", "itching", "sleep"],
    cautions: ["drowsy", "duplicate"],
  },
  cetirizine: {
    names: ["세티리진", "cetirizine", "цетиризин"],
    cls: "antihistamine",
    uses: ["allergy", "runnyNose", "itching"],
    cautions: ["drowsy", "pregnancy"],
  },
  levocetirizine: {
    names: ["레보세티리진", "levocetirizine"],
    cls: "antihistamine",
    uses: ["allergy", "runnyNose", "itching"],
    cautions: ["drowsy", "pregnancy"],
  },
  loratadine: {
    names: ["로라타딘", "loratadine", "лоратадин"],
    cls: "antihistamine",
    uses: ["allergy", "runnyNose", "itching"],
    cautions: ["pregnancy"],
  },
  fexofenadine: {
    names: ["펙소페나딘", "fexofenadine"],
    cls: "antihistamine",
    uses: ["allergy", "runnyNose", "itching"],
    cautions: ["pregnancy"],
  },
  pseudoephedrine: {
    names: ["슈도에페드린", "pseudoephedrine"],
    cls: "decongestant",
    uses: ["nasalCongestion", "cold"],
    cautions: ["bloodPressure", "duplicate"],
  },
  phenylephrine: {
    names: ["페닐에프린", "phenylephrine"],
    cls: "decongestant",
    uses: ["nasalCongestion", "cold"],
    cautions: ["bloodPressure", "duplicate"],
  },
  methylephedrine: {
    names: ["메틸에페드린", "methylephedrine"],
    cls: "decongestant",
    uses: ["cough", "nasalCongestion", "cold"],
    cautions: ["bloodPressure", "duplicate"],
  },
  dextromethorphan: {
    names: ["덱스트로메토르판", "dextromethorphan"],
    cls: "antitussive",
    uses: ["cough"],
    cautions: ["drowsy", "duplicate"],
  },
  guaifenesin: {
    names: ["구아이페네신", "guaifenesin"],
    cls: "expectorant",
    uses: ["phlegm", "cough"],
    cautions: ["duplicate", "shortTerm"],
  },
  ambroxol: {
    names: ["암브록솔", "ambroxol", "амброксол"],
    cls: "expectorant",
    uses: ["phlegm", "cough"],
    cautions: ["shortTerm"],
  },
  bromhexine: {
    names: ["브롬헥신", "bromhexine"],
    cls: "expectorant",
    uses: ["phlegm"],
    cautions: ["shortTerm"],
  },
  acetylcysteine: {
    names: ["아세틸시스테인", "acetylcysteine"],
    cls: "expectorant",
    uses: ["phlegm"],
    cautions: ["shortTerm"],
  },
  famotidine: {
    names: ["파모티딘", "famotidine"],
    cls: "h2blocker",
    uses: ["heartburn", "indigestion"],
    cautions: ["shortTerm", "kidney"],
  },
  aluminumHydroxide: {
    names: ["수산화알루미늄", "aluminumhydroxide", "aluminiumhydroxide"],
    cls: "antacid",
    uses: ["heartburn"],
    cautions: ["separateDose", "kidney"],
  },
  aluminumPhosphate: {
    names: ["인산알루미늄", "aluminumphosphate", "aluminiumphosphate"],
    cls: "antacid",
    uses: ["heartburn"],
    cautions: ["separateDose", "kidney"],
  },
  magnesiumHydroxide: {
    names: ["수산화마그네슘", "magnesiumhydroxide"],
    cls: "antacid",
    uses: ["heartburn", "constipation"],
    cautions: ["separateDose", "kidney"],
  },
  almagate: {
    names: ["알마게이트", "almagate"],
    cls: "antacid",
    uses: ["heartburn"],
    cautions: ["separateDose", "kidney"],
  },
  sodiumAlginate: {
    names: ["알긴산나트륨", "sodiumalginate"],
    cls: "antacid",
    uses: ["heartburn"],
    cautions: ["separateDose"],
  },
  sodiumBicarbonate: {
    names: ["탄산수소나트륨", "sodiumbicarbonate"],
    cls: "antacid",
    uses: ["heartburn"],
    cautions: ["separateDose", "bloodPressure"],
  },
  calciumCarbonate: {
    names: ["탄산칼슘", "calciumcarbonate"],
    cls: "antacid",
    uses: ["heartburn"],
    cautions: ["separateDose"],
  },
  simethicone: {
    names: ["시메티콘", "디메티콘", "simethicone", "dimethicone"],
    cls: "antiflatulent",
    uses: ["gas", "indigestion"],
    cautions: [],
  },
  pancreatin: {
    names: ["판크레아틴", "pancreatin"],
    cls: "digestive",
    uses: ["indigestion"],
    cautions: [],
  },
  trimebutine: {
    names: ["트리메부틴", "trimebutine"],
    cls: "gutMotility",
    uses: ["indigestion", "gas"],
    cautions: ["pregnancy"],
  },
  smectite: {
    names: ["디옥타헤드랄스멕타이트", "스멕타이트", "diosmectite", "smectite"],
    cls: "antidiarrheal",
    uses: ["diarrhea"],
    cautions: ["separateDose", "shortTerm"],
  },
  loperamide: {
    names: ["로페라미드", "loperamide", "лоперамид"],
    cls: "antidiarrheal",
    uses: ["diarrhea"],
    cautions: ["infectiousDiarrhea", "children"],
  },
  bisacodyl: {
    names: ["비사코딜", "bisacodyl"],
    cls: "laxative",
    uses: ["constipation"],
    cautions: ["separateDose", "shortTerm"],
  },
  sennoside: {
    names: ["센노사이드", "sennoside", "senna"],
    cls: "laxative",
    uses: ["constipation"],
    cautions: ["shortTerm", "pregnancy"],
  },
  docusate: {
    names: ["도큐세이트", "docusate"],
    cls: "laxative",
    uses: ["constipation"],
    cautions: ["shortTerm"],
  },
  lactulose: {
    names: ["락툴로오스", "락툴로즈", "lactulose"],
    cls: "laxative",
    uses: ["constipation"],
    cautions: [],
  },
  fusidicAcid: {
    names: ["퓨시드산", "후시드산", "fusidicacid", "fusidate"],
    cls: "topicalAntibiotic",
    uses: ["woundInfection"],
    cautions: ["externalOnly", "shortTerm"],
  },
  mupirocin: {
    names: ["무피로신", "mupirocin"],
    cls: "topicalAntibiotic",
    uses: ["woundInfection"],
    cautions: ["externalOnly", "shortTerm"],
  },
  neomycin: {
    names: ["네오마이신", "neomycin"],
    cls: "topicalAntibiotic",
    uses: ["woundInfection"],
    cautions: ["externalOnly"],
  },
  centella: {
    names: ["센텔라정량추출물", "센텔라아시아티카", "centellaasiatica", "centellatitrated"],
    cls: "woundHealing",
    uses: ["wound"],
    cautions: ["externalOnly"],
  },
  hydrocortisone: {
    names: ["히드로코르티손", "하이드로코티손", "hydrocortisone"],
    cls: "topicalSteroid",
    uses: ["itching", "eczema"],
    cautions: ["externalOnly", "steroidLong"],
  },
  clotrimazole: {
    names: ["클로트리마졸", "clotrimazole"],
    cls: "antifungal",
    uses: ["fungal"],
    cautions: ["externalOnly"],
  },
  terbinafine: {
    names: ["테르비나핀", "terbinafine"],
    cls: "antifungal",
    uses: ["fungal"],
    cautions: ["externalOnly"],
  },
  acyclovir: {
    names: ["아시클로버", "acyclovir", "aciclovir"],
    cls: "antiviralTopical",
    uses: ["coldSore"],
    cautions: ["externalOnly"],
  },
  ketoprofen: {
    names: ["케토프로펜", "ketoprofen"],
    cls: "topicalNsaid",
    uses: ["muscle", "pain"],
    cautions: ["externalOnly", "sunlight", "asthmaNsaid"],
  },
  diclofenac: {
    names: ["디클로페낙", "diclofenac", "диклофенак"],
    cls: "topicalNsaid",
    uses: ["muscle", "pain"],
    cautions: ["externalOnly", "asthmaNsaid"],
  },
  triamcinolone: {
    names: ["트리암시놀론", "triamcinolone"],
    cls: "mouthCare",
    uses: ["mouthUlcer"],
    cautions: ["externalOnly", "shortTerm"],
  },
  policresulen: {
    names: ["폴리크레줄렌", "폴리크레설렌", "policresulen"],
    cls: "mouthCare",
    uses: ["mouthUlcer"],
    cautions: ["externalOnly"],
  },
  dimenhydrinate: {
    names: ["디멘히드리네이트", "dimenhydrinate"],
    cls: "antiemetic",
    uses: ["motionSickness"],
    cautions: ["drowsy"],
  },
  scopolamine: {
    names: ["스코폴라민", "scopolamine", "hyoscine"],
    cls: "antiemetic",
    uses: ["motionSickness"],
    cautions: ["drowsy", "washHands"],
  },
  doxylamine: {
    names: ["독시라민", "doxylamine"],
    cls: "sleepAid",
    uses: ["sleep"],
    cautions: ["drowsy", "shortTerm"],
  },
  pamabrom: {
    names: ["파마브롬", "pamabrom"],
    cls: "diuretic",
    uses: ["menstrual"],
    cautions: ["duplicate"],
  },
  tipepidine: {
    names: ["티페피딘", "tipepidine"],
    cls: "antitussive",
    uses: ["cough", "phlegm"],
    cautions: ["duplicate"],
  },
  pentoxyverine: {
    names: ["펜톡시베린", "pentoxyverine", "carbetapentane"],
    cls: "antitussive",
    uses: ["cough"],
    cautions: ["duplicate"],
  },
  cloperastine: {
    names: ["클로페라스틴", "cloperastine"],
    cls: "antitussive",
    uses: ["cough"],
    cautions: ["drowsy", "duplicate"],
  },
  pheniramine: {
    names: ["페니라민말레산", "pheniramine"],
    cls: "antihistamine",
    uses: ["runnyNose", "allergy"],
    cautions: ["drowsy", "duplicate"],
  },
  ursodiol: {
    names: ["우르소데옥시콜산", "ursodeoxycholic", "ursodiol"],
    cls: "digestive",
    uses: ["indigestion"],
    cautions: [],
  },
  digestiveEnzymes: {
    names: ["디아스타제", "프로테아제", "셀룰라제", "리파제", "판프로신", "판셀라제", "브로멜라인", "diastase", "cellulase", "lipase"],
    cls: "digestive",
    uses: ["indigestion"],
    cautions: [],
  },
};

export type Product = {
  /** Product name as registered with MFDS (without the export-name suffix). */
  ko: string;
  /** Distinctive parts of the name to look for in OCR text or a search (not the bare brand). */
  match: string[];
  /** Brand family: the bare brand name alone is ambiguous, so it only triggers a "check the product" note. */
  family: string;
  /** Main ingredients exactly as MFDS lists them, shown to the pharmacist. */
  mainKo: string;
  /** The ones we can explain; vitamins and herbal ingredients are not in the dictionary. */
  ingredients: { id: string; amount?: string }[];
  itemSeq: string;
};

// Source: MFDS 의약품안전나라 product search, checked 2026-11-18 (주성분, 품목기준코드).
// Several brands sell products with different ingredients under one name (게보린정 vs 게보린소프트,
// 탁센 naproxen vs ibuprofen, 판콜에스 vs 판콜아이 dexibuprofen, 케토톱 vs 케토톱액티브 flurbiprofen),
// so a product is only matched by its specific name.
export const PRODUCTS: Record<string, Product> = {
  tylenol500: { ko: "타이레놀정500밀리그람", match: ["타이레놀정500", "타이레놀500", "tylenol500"], family: "타이레놀", mainKo: "아세트아미노펜", ingredients: [{ id: "acetaminophen", amount: "500 mg" }], itemSeq: "202106092" },
  tylenol8h: { ko: "타이레놀8시간이알서방정", match: ["타이레놀8시간", "8시간이알", "tylenol8"], family: "타이레놀", mainKo: "아세트아미노펜", ingredients: [{ id: "acetaminophen" }], itemSeq: "202200407" },
  tylenolKids: { ko: "어린이타이레놀현탁액", match: ["어린이타이레놀현탁", "childrenstylenol"], family: "타이레놀", mainKo: "아세트아미노펜(미분화)", ingredients: [{ id: "acetaminophen" }], itemSeq: "202200525" },
  tylenolWomen: { ko: "우먼스타이레놀정", match: ["우먼스타이레놀", "womenstylenol"], family: "타이레놀", mainKo: "아세트아미노펜/파마브롬", ingredients: [{ id: "acetaminophen" }, { id: "pamabrom" }], itemSeq: "202200658" },
  geworin: { ko: "게보린정", match: ["게보린정", "geworintab"], family: "게보린", mainKo: "아세트아미노펜/카페인무수물/이소프로필안티피린", ingredients: [{ id: "acetaminophen" }, { id: "caffeine" }, { id: "isopropylantipyrine" }], itemSeq: "197900277" },
  penzalQ: { ko: "펜잘큐정", match: ["펜잘큐"], family: "펜잘", mainKo: "아세트아미노펜/카페인무수물/에텐자미드", ingredients: [{ id: "acetaminophen" }, { id: "caffeine" }, { id: "ethenzamide" }], itemSeq: "200810700" },
  saridonA: { ko: "사리돈에이정", match: ["사리돈에이"], family: "사리돈", mainKo: "아세트아미노펜/이소프로필안티피린/카페인무수물", ingredients: [{ id: "acetaminophen" }, { id: "isopropylantipyrine" }, { id: "caffeine" }], itemSeq: "200610627" },
  advilLiqui: { ko: "애드빌리퀴겔연질캡슐", match: ["애드빌리퀴겔", "advilliqui"], family: "애드빌", mainKo: "이부프로펜", ingredients: [{ id: "ibuprofen" }], itemSeq: "200610785" },
  brufen200: { ko: "부루펜정200밀리그램", match: ["부루펜정200"], family: "부루펜", mainKo: "이부프로펜", ingredients: [{ id: "ibuprofen", amount: "200 mg" }], itemSeq: "197700120" },
  taxen: { ko: "탁센연질캡슐", match: ["탁센연질캡슐"], family: "탁센", mainKo: "나프록센", ingredients: [{ id: "naproxen" }], itemSeq: "200710782" },
  easyN6any: { ko: "이지엔6애니연질캡슐", match: ["이지엔6애니"], family: "이지엔6", mainKo: "이부프로펜", ingredients: [{ id: "ibuprofen" }], itemSeq: "200400463" },
  easyN6pro: { ko: "이지엔6프로연질캡슐", match: ["이지엔6프로"], family: "이지엔6", mainKo: "덱시부프로펜", ingredients: [{ id: "dexibuprofen" }], itemSeq: "200400485" },
  pancolS: { ko: "판콜에스내복액", match: ["판콜에스"], family: "판콜", mainKo: "아세트아미노펜/dl-메틸에페드린염산염/클로르페니라민말레산염/카페인무수물/구아이페네신", ingredients: [{ id: "acetaminophen" }, { id: "methylephedrine" }, { id: "chlorpheniramine" }, { id: "caffeine" }, { id: "guaifenesin" }], itemSeq: "198900672" },
  panpyrinQ: { ko: "판피린큐액", match: ["판피린큐"], family: "판피린", mainKo: "티페피딘시트르산염/구아이페네신/dl-메틸에페드린염산염/클로르페니라민말레산염/카페인무수물/아세트아미노펜", ingredients: [{ id: "tipepidine" }, { id: "guaifenesin" }, { id: "methylephedrine" }, { id: "chlorpheniramine" }, { id: "caffeine" }, { id: "acetaminophen" }], itemSeq: "200700547" },
  panpyrinT: { ko: "판피린티정", match: ["판피린티"], family: "판피린", mainKo: "아세트아미노펜/클로르페니라민말레산염/카페인무수물", ingredients: [{ id: "acetaminophen" }, { id: "chlorpheniramine" }, { id: "caffeine" }], itemSeq: "199400202" },
  coldaewonCoughS: { ko: "콜대원코프에스시럽", match: ["콜대원코프에스"], family: "콜대원", mainKo: "아세트아미노펜/펜톡시베린시트르산염/dl-메틸에페드린염산염/구아이페네신/카페인무수물/슈도에페드린염산염", ingredients: [{ id: "acetaminophen" }, { id: "pentoxyverine" }, { id: "methylephedrine" }, { id: "guaifenesin" }, { id: "caffeine" }, { id: "pseudoephedrine" }], itemSeq: "201603303" },
  fightubenCPlus: { ko: "화이투벤씨플러스캡슐", match: ["화이투벤씨플러스"], family: "화이투벤", mainKo: "아세트아미노펜/클로르페니라민말레산염/dl-메틸에페드린염산염/클로페라스틴염산염/카페인무수물/티아민질산염/리보플라빈/아스코르브산", ingredients: [{ id: "acetaminophen" }, { id: "chlorpheniramine" }, { id: "methylephedrine" }, { id: "cloperastine" }, { id: "caffeine" }], itemSeq: "201300045" },
  theraFluNight: { ko: "테라플루나이트타임건조시럽", match: ["테라플루나이트"], family: "테라플루", mainKo: "아세트아미노펜/페니라민말레산염/페닐레프린염산염", ingredients: [{ id: "acetaminophen" }, { id: "pheniramine" }, { id: "phenylephrine" }], itemSeq: "200807357" },
  champSyrup: { ko: "챔프시럽", match: ["챔프시럽"], family: "챔프", mainKo: "아세트아미노펜", ingredients: [{ id: "acetaminophen" }], itemSeq: "201206715" },
  suspenSupp: { ko: "복합써스펜좌약", match: ["써스펜좌약"], family: "써스펜", mainKo: "아세트아미노펜/DL-메티오닌", ingredients: [{ id: "acetaminophen" }], itemSeq: "199102142" },
  zyrtec: { ko: "지르텍정", match: ["지르텍", "zyrtec", "зиртек", "仙特明"], family: "지르텍", mainKo: "세티리진염산염", ingredients: [{ id: "cetirizine" }], itemSeq: "200610765" },
  claritin: { ko: "클라리틴정", match: ["클라리틴", "claritin", "кларитин"], family: "클라리틴", mainKo: "로라타딘", ingredients: [{ id: "loratadine" }], itemSeq: "200905692" },
  allegra120: { ko: "알레그라정120밀리그람", match: ["알레그라정120", "allegra120"], family: "알레그라", mainKo: "펙소페나딘염산염", ingredients: [{ id: "fexofenadine", amount: "120 mg" }], itemSeq: "199801016" },
  gavisconDA: { ko: "개비스콘더블액션현탁액", match: ["개비스콘더블액션", "gavisondouble", "gaviscondouble"], family: "개비스콘", mainKo: "알긴산나트륨/탄산칼슘/탄산수소나트륨", ingredients: [{ id: "sodiumAlginate" }, { id: "calciumCarbonate" }, { id: "sodiumBicarbonate" }], itemSeq: "200801645" },
  gelfosM: { ko: "겔포스엠현탁액", match: ["겔포스엠"], family: "겔포스", mainKo: "인산알루미늄겔/수산화마그네슘/시메티콘", ingredients: [{ id: "aluminumPhosphate" }, { id: "magnesiumHydroxide" }, { id: "simethicone" }], itemSeq: "199400883" },
  almagelF: { ko: "알마겔에프현탁액", match: ["알마겔에프"], family: "알마겔", mainKo: "알마게이트", ingredients: [{ id: "almagate" }], itemSeq: "199000541" },
  beaze: { ko: "베아제정", match: ["베아제정"], family: "베아제", mainKo: "디아스타제·프로테아제·셀룰라제/리파제/판프로신/판셀라제/판크레아틴장용과립/우르소데옥시콜산/시메티콘", ingredients: [{ id: "digestiveEnzymes" }, { id: "pancreatin" }, { id: "ursodiol" }, { id: "simethicone" }], itemSeq: "198700405" },
  drBeaze: { ko: "닥터베아제정", match: ["닥터베아제"], family: "베아제", mainKo: "디아스타제·프로테아제·셀룰라제/판셀라제/크리아제-PEG/디아스타제·프로테아제100/판프로신/리파제/브로멜라인/우르소데옥시콜산/시메티콘", ingredients: [{ id: "digestiveEnzymes" }, { id: "ursodiol" }, { id: "simethicone" }], itemSeq: "200300406" },
  festalPlus: { ko: "훼스탈플러스정", match: ["훼스탈플러스"], family: "훼스탈", mainKo: "판크레아틴/셀룰라제/우르소데옥시콜산/시메티콘", ingredients: [{ id: "pancreatin" }, { id: "digestiveEnzymes" }, { id: "ursodiol" }, { id: "simethicone" }], itemSeq: "199801026" },
  dulcolaxS: { ko: "둘코락스에스장용정", match: ["둘코락스에스"], family: "둘코락스", mainKo: "비사코딜/도큐세이트나트륨", ingredients: [{ id: "bisacodyl" }, { id: "docusate" }], itemSeq: "200906478" },
  fucidin: { ko: "후시딘연고", match: ["후시딘연고", "fucidin"], family: "후시딘", mainKo: "퓨시드산나트륨", ingredients: [{ id: "fusidicAcid" }], itemSeq: "197900171" },
  madecassol: { ko: "마데카솔연고", match: ["마데카솔연고"], family: "마데카솔", mainKo: "센텔라정량추출물", ingredients: [{ id: "centella" }], itemSeq: "201107088" },
  madecassolCare: { ko: "마데카솔케어연고", match: ["마데카솔케어"], family: "마데카솔", mainKo: "센텔라정량추출물/네오마이신황산염", ingredients: [{ id: "centella" }, { id: "neomycin" }], itemSeq: "200903973" },
  canestenCream: { ko: "카네스텐크림", match: ["카네스텐크림"], family: "카네스텐", mainKo: "클로트리마졸", ingredients: [{ id: "clotrimazole" }], itemSeq: "199906850" },
  lamisilCream: { ko: "라미실크림1%", match: ["라미실크림"], family: "라미실", mainKo: "테르비나핀염산염", ingredients: [{ id: "terbinafine" }], itemSeq: "199304286" },
  ketotop: { ko: "케토톱플라스타", match: ["케토톱플라스타", "케토톱엘플라스타"], family: "케토톱", mainKo: "케토프로펜", ingredients: [{ id: "ketoprofen" }], itemSeq: "199300356" },
  voltarenEmulgel: { ko: "볼타렌에멀겔", match: ["볼타렌에멀겔", "voltarenemulgel", "вольтарен"], family: "볼타렌", mainKo: "디클로페낙디에틸암모늄", ingredients: [{ id: "diclofenac" }], itemSeq: "200108778" },
  oramedy: { ko: "오라메디연고", match: ["오라메디"], family: "오라메디", mainKo: "트리암시놀론아세토니드", ingredients: [{ id: "triamcinolone" }], itemSeq: "198500023" },
  albothylConc: { ko: "알보칠콘센트레이트액", match: ["알보칠콘센트레이트"], family: "알보칠", mainKo: "폴리크레줄렌액50%", ingredients: [{ id: "policresulen" }], itemSeq: "201506617" },
  kimitePatch: { ko: "키미테패취", match: ["키미테패취", "키미테패치"], family: "키미테", mainKo: "스코폴라민", ingredients: [{ id: "scopolamine" }], itemSeq: "198501415" },
};

/** Brand names (and spellings in other scripts) that cover products with different ingredients. */
export const FAMILIES: Record<string, string[]> = {
  타이레놀: ["타이레놀", "tylenol", "тайленол", "泰诺"],
  게보린: ["게보린", "geworin"],
  펜잘: ["펜잘", "penzal"],
  사리돈: ["사리돈", "saridon"],
  애드빌: ["애드빌", "advil", "адвил"],
  부루펜: ["부루펜", "brufen"],
  탁센: ["탁센", "taxen"],
  이지엔6: ["이지엔6", "easyn6"],
  판콜: ["판콜", "pancol"],
  판피린: ["판피린", "panpyrin"],
  콜대원: ["콜대원"],
  화이투벤: ["화이투벤"],
  테라플루: ["테라플루", "theraflu"],
  챔프: ["챔프"],
  써스펜: ["써스펜"],
  알레그라: ["알레그라", "allegra"],
  개비스콘: ["개비스콘", "gaviscon", "гевискон", "гавискон"],
  겔포스: ["겔포스", "gelfos"],
  알마겔: ["알마겔", "almagel"],
  베아제: ["베아제", "beaze"],
  훼스탈: ["훼스탈", "festal"],
  둘코락스: ["둘코락스", "dulcolax"],
  후시딘: ["후시딘", "fucidin", "фуцидин"],
  마데카솔: ["마데카솔", "madecassol"],
  카네스텐: ["카네스텐", "canesten", "канестен"],
  라미실: ["라미실", "lamisil", "ламизил"],
  케토톱: ["케토톱", "ketotop"],
  볼타렌: ["볼타렌", "voltaren"],
  알보칠: ["알보칠", "albothyl"],
  키미테: ["키미테", "kimite"],
};

export const ingredientKey = (id: string) => ("ing." + id) as MessageKey;
export const classKey = (c: string) => ("medclass." + c) as MessageKey;
export const useKey = (u: string) => ("use." + u) as MessageKey;
export const cautionKey = (c: string) => ("caution." + c) as MessageKey;

export const officialItem = (itemSeq: string) =>
  "https://nedrug.mfds.go.kr/pbp/CCBBB01/getItemDetail?itemSeq=" + itemSeq;

/** Official product search on the MFDS drug database. */
export const officialSearch = (name: string) =>
  "https://nedrug.mfds.go.kr/searchDrug?itemName=" + encodeURIComponent(name);
