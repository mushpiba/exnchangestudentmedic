import ui from './data/ui.json'
import terms from './data/terms.json'
export type Locale = keyof typeof ui
export const languages = Object.keys(ui) as Locale[]
const termKeys = Object.keys(terms['ko-KR'])
const extraTerms: Record<string,string> = {
  uz: 'Bosh sahifa|Klinika|Dorixona|Keyingi|Til|Alomat|Bosh og‘rig‘i|Qorin og‘rig‘i|Yo‘tal|Qusish|Bugun|Allergiya|Ichki kasalliklar|Stomatologiya|LOR',
  kk: 'Басты бет|Емхана|Дәріхана|Келесі|Тіл|Белгі|Бас ауруы|Іш ауруы|Жөтел|Құсу|Бүгін|Аллергия|Ішкі аурулар|Стоматология|ЛОР',
  ky: 'Башкы бет|Клиника|Дарыкана|Кийинки|Тил|Белги|Баш оору|Ич оору|Жөтөл|Кусуу|Бүгүн|Аллергия|Ички оорулар|Стоматология|ЛОР'
}
const contextual: Record<Locale,string> = {
 'ko-KR':'알레르기|열람용 시제품 · 의료 번역 검수 중|접수|진료|시간|직원이 확인할 질문|원문을 함께 봐 주세요.',
 'en-US':'Allergies|Review prototype · medical translations under review|Reception|Consultation|Hours|Staff question|Please read the original text too.',
 uz:'Allergiya|Sinov nusxasi · tibbiy tarjimalar tekshirilmoqda|Qabulxona|Ko‘rik|Vaqt|Xodim savoli|Asl matnni ham o‘qing.',
 kk:'Аллергия|Сынақ нұсқасы · медициналық аударма тексерілуде|Тіркеу|Қабылдау|Уақыт|Қызметкер сұрағы|Түпнұсқа мәтінді де оқыңыз.',
 ky:'Аллергия|Сыноо нускасы · медициналык котормо текшерилүүдө|Каттоо|Кабыл алуу|Убакыт|Кызматкердин суроосу|Баштапкы текстти да окуңуз.',
 'ru-RU':'Аллергии|Пробная версия · медицинский перевод на проверке|Регистратура|Консультация|Часы|Вопрос персонала|Прочитайте также оригинал.',
 'ja-JP':'アレルギー|試用版・医療翻訳は確認中です|受付|診察|時間|スタッフからの質問|原文もご確認ください。',
 'zh-CN':'过敏|试用版 · 医疗翻译审核中|接待|诊疗|时间|工作人员提问|请同时查看原文。',
 'zh-TW':'過敏|試用版 · 醫療翻譯審核中|接待|診療|時間|工作人員提問|請同時查看原文。',
 'vi-VN':'Dị ứng|Bản thử · đang kiểm tra bản dịch y tế|Tiếp nhận|Khám|Giờ|Câu hỏi của nhân viên|Vui lòng đọc cả nguyên văn.',
 'fr-FR':'Allergies|Prototype · traductions médicales en révision|Accueil|Consultation|Horaires|Question du personnel|Veuillez lire aussi le texte original.',
 'es-ES':'Alergias|Prototipo · traducciones médicas en revisión|Recepción|Consulta|Horario|Pregunta del personal|Lea también el texto original.',
 'mn-MN':'Харшил|Туршилтын хувилбар · эмнэлгийн орчуулгыг шалгаж байна|Бүртгэл|Үзлэг|Цаг|Ажилтны асуулт|Эх бичвэрийг мөн уншина уу.',
 'ar-SA':'الحساسية|نسخة تجريبية · الترجمة الطبية قيد المراجعة|الاستقبال|المعاينة|الساعات|سؤال الموظف|يرجى قراءة النص الأصلي أيضاً.',
 'ur-PK':'الرجی|آزمائشی نسخہ · طبی ترجمے زیر جائزہ ہیں|استقبالیہ|معائنہ|اوقات|عملے کا سوال|اصل متن بھی پڑھیں۔',
 'ne-NP':'एलर्जी|परीक्षण संस्करण · चिकित्सा अनुवादको समीक्षा हुँदैछ|दर्ता|परामर्श|समय|कर्मचारीको प्रश्न|मूल पाठ पनि पढ्नुहोस्।'
}
export function labels(locale: Locale): Record<string,string> {
 const base = locale in terms ? terms[locale as keyof typeof terms] : Object.fromEntries(termKeys.map((key,i)=>[key,extraTerms[locale].split('|')[i]]))
 const more = Object.fromEntries(['allergy','notice','desk','consult','hours','staff','original'].map((key,i)=>[key,contextual[locale].split('|')[i]]))
 return {...base,...ui[locale],...more,...(locale==='fr-FR'?{Sx_headache:'Mal de tête'}:{})}
}
export function initialLocale(): Locale {
 let saved: string|null=null
 try { saved=localStorage.getItem('inha-language') } catch {}
 if(languages.includes(saved as Locale)) return saved as Locale
 for(const code of navigator.languages) {
   if(/^zh-(Hant|TW|HK|MO)/i.test(code)) return 'zh-TW'
   const match=languages.find(l=>l===code || l.split('-')[0]===code.split('-')[0])
   if(match) return match
 }
 return 'en-US'
}

