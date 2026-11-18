import { useState, useEffect } from "react";
import { createClient, type Session } from "@supabase/supabase-js";
import type { Locale } from "./i18n";
const url = import.meta.env.VITE_CAMPUS_URL,
  key = import.meta.env.VITE_CAMPUS_PUBLIC_KEY;
const client =
  url && key
    ? createClient(url, key, {
        auth: { persistSession: false, detectSessionInUrl: false },
      })
    : null;
type Member = { id: string; campus: string; role: string };
type Post = { id: string; body: string; author: string };
type Request = {
  id: string;
  student: string;
  buddy: string | null;
  starts_at: string;
  status: string;
  locale: string;
};
const authCopy: Record<Locale, string> = {
  "ko-KR":
    "학교 인증 계정|코드 받기|인증 코드|로그인|로그아웃|학교 운영자에게 계정 등록을 문의하세요.|신고|다시 불러오기",
  "en-US":
    "Verified campus email|Send code|Verification code|Sign in|Sign out|Contact the campus operator to register.|Report|Refresh",
  uz: "Universitet hisobi|Kod olish|Tasdiqlash kodi|Kirish|Chiqish|Ro‘yxatdan o‘tish uchun universitetga murojaat qiling.|Shikoyat|Yangilash",
  kk: "Университет тіркелгісі|Код алу|Растау коды|Кіру|Шығу|Тіркелу үшін университетке хабарласыңыз.|Шағым|Жаңарту",
  ky: "Университет эсеби|Код алуу|Тастыктоо коду|Кирүү|Чыгуу|Катталуу үчүн университетке кайрылыңыз.|Даттануу|Жаңылоо",
  "ru-RU":
    "Почта участника|Получить код|Код подтверждения|Войти|Выйти|Для регистрации обратитесь в университет.|Пожаловаться|Обновить",
  "fr-FR":
    "Adresse universitaire vérifiée|Envoyer le code|Code|Connexion|Déconnexion|Contactez le campus pour vous inscrire.|Signaler|Actualiser",
  "es-ES":
    "Correo universitario verificado|Enviar código|Código|Entrar|Salir|Contacta con el campus para registrarte.|Denunciar|Actualizar",
  "ja-JP":
    "大学認証メール|コードを送信|認証コード|ログイン|ログアウト|登録は大学の担当者にお問い合わせください。|通報|更新",
  "zh-CN":
    "已认证的校园邮箱|发送验证码|验证码|登录|退出|请联系学校管理员注册。|举报|刷新",
  "zh-TW":
    "已驗證的校園信箱|寄送驗證碼|驗證碼|登入|登出|請聯絡學校管理員註冊。|檢舉|重新整理",
  "ar-SA":
    "بريد الجامعة المعتمد|إرسال الرمز|رمز التحقق|دخول|خروج|تواصل مع الجامعة للتسجيل.|إبلاغ|تحديث",
  "ur-PK":
    "تصدیق شدہ یونیورسٹی ای میل|کوڈ بھیجیں|تصدیقی کوڈ|داخل ہوں|باہر جائیں|اندراج کے لیے یونیورسٹی سے رابطہ کریں۔|رپورٹ|تازہ کریں",
  "ne-NP":
    "प्रमाणित क्याम्पस इमेल|कोड पठाउनुहोस्|पुष्टि कोड|प्रवेश|बाहिरिनुहोस्|दर्ताका लागि क्याम्पसमा सम्पर्क गर्नुहोस्।|उजुरी|रिफ्रेस",
  "mn-MN":
    "Сургуулийн баталгаатай цахим шуудан|Код авах|Код|Нэвтрэх|Гарах|Бүртгүүлэхээр сургуульдаа хандана уу.|Мэдэгдэх|Шинэчлэх",
  "vi-VN":
    "Email trường đã xác minh|Gửi mã|Mã xác minh|Đăng nhập|Đăng xuất|Liên hệ trường để đăng ký.|Báo cáo|Làm mới",
};
export default function Campus({
  page,
  t,
  locale,
}: {
  page: "forum" | "buddy";
  t: Record<string, string>;
  locale: Locale;
}) {
  const db = client!;
  const [session, setSession] = useState<Session | null>(null),
    [member, setMember] = useState<Member | null>(null);
  const [email, setEmail] = useState(""),
    [code, setCode] = useState(""),
    [sent, setSent] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [version, setVersion] = useState(0);
  const [body, setBody] = useState(""),
    [slot, setSlot] = useState(""),
    [posts, setPosts] = useState<Post[]>([]),
    [requests, setRequests] = useState<Request[]>([]);
  const [buddies, setBuddies] = useState<string[]>([]),
    [assignee, setAssignee] = useState(""),
    [flags, setFlags] = useState<string[]>([]);
  const a = authCopy[locale].split("|");
  useEffect(() => {
    const sub = db.auth.onAuthStateChange((_, s) => {
      setSession(s);
      setMember(null);
      setPosts([]);
      setRequests([]);
    });
    return () => sub.data.subscription.unsubscribe();
  }, [db]);
  useEffect(() => {
    let active = true;
    async function read() {
      if (!session) return;
      const m = await db
        .from("campus_members")
        .select("id,campus,role")
        .eq("id", session.user.id)
        .maybeSingle();
      if (!active) return;
      if (m.error) {
        setError(m.error.message);
        return;
      }
      setMember(m.data);
      if (!m.data) return;
      if (m.data.role === "operator") {
        const response =
          page === "buddy"
            ? await db.rpc("available_buddies")
            : await db.from("post_reports").select("post");
        if (active && response.data) {
          if (page === "buddy")
            setBuddies(response.data.map((item: { id: string }) => item.id));
          else
            setFlags(response.data.map((item: { post: string }) => item.post));
        }
      }
      if (page === "forum") {
        const r = await db
          .from("campus_posts")
          .select("id,body,author")
          .order("created_at", { ascending: false })
          .limit(50);
        if (active) {
          setPosts(r.data ?? []);
          setError(r.error?.message ?? "");
        }
      } else {
        const r = await db
          .from("buddy_requests")
          .select("id,student,buddy,starts_at,status,locale")
          .order("starts_at", { ascending: false })
          .limit(50);
        if (active) {
          setRequests(r.data ?? []);
          setError(r.error?.message ?? "");
        }
      }
    }
    read().catch(() => {
      if (active) setError(a[7]);
    });
    return () => {
      active = false;
    };
  }, [session, db, page, version]);
  async function run(
    fn: () => PromiseLike<{ error: { message: string } | null }>,
    done?: () => void,
  ) {
    setBusy(true);
    setError("");
    try {
      const r = await fn();
      if (r.error) setError(r.error.message);
      else {
        done?.();
        setVersion((v) => v + 1);
      }
    } catch {
      setError(a[7]);
    } finally {
      setBusy(false);
    }
  }
  const refresh = () => setVersion((v) => v + 1);
  return (
    <section className="panel">
      <h1>{t[page]}</h1>
      {!session ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!sent)
              run(
                () =>
                  db.auth.signInWithOtp({
                    email,
                    options: { shouldCreateUser: false },
                  }),
                () => setSent(true),
              );
            else
              run(() =>
                db.auth.verifyOtp({ email, token: code, type: "email" }),
              );
          }}
        >
          <p>{a[5]}</p>
          <label>
            {a[0]}
            <input
              type="email"
              required
              readOnly={sent}
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
            />
          </label>
          {sent && (
            <label>
              {a[2]}
              <input
                required
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </label>
          )}
          <button disabled={busy}>{a[sent ? 3 : 1]}</button>
          {sent && (
            <button type="button" onClick={() => setSent(false)}>
              {t.back}
            </button>
          )}
        </form>
      ) : (
        <>
          <button
            disabled={busy}
            onClick={() =>
              run(
                () => db.auth.signOut(),
                () => {
                  setCode("");
                  setSent(false);
                  setBody("");
                  setSlot("");
                },
              )
            }
          >
            {a[4]}
          </button>
          {!member ? (
            <p>{a[5]}</p>
          ) : (
            <>
              <button onClick={refresh}>{a[7]}</button>
              {page === "forum" ? (
                <>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      run(
                        () =>
                          db
                            .from("campus_posts")
                            .insert({
                              campus: member.campus,
                              author: member.id,
                              body: body.trim(),
                              locale,
                            }),
                        () => setBody(""),
                      );
                    }}
                  >
                    <label>
                      {t.post}
                      <textarea
                        value={body}
                        maxLength={1500}
                        onChange={(e) => setBody(e.target.value)}
                      />
                    </label>
                    <button disabled={busy || !body.trim()}>{t.post}</button>
                  </form>
                  {posts.map((p) => (
                    <article key={p.id} className="result">
                      <span dir="auto">{p.body}</span>
                      {member.role === "operator" && flags.includes(p.id) && (
                        <button
                          disabled={busy}
                          onClick={() =>
                            run(() =>
                              db.rpc("moderate_reported_post", {
                                target: p.id,
                              }),
                            )
                          }
                        >
                          {a[6]} · {t.clear}
                        </button>
                      )}
                      {p.author === member.id ? (
                        <button
                          disabled={busy}
                          onClick={() =>
                            run(() =>
                              db.from("campus_posts").delete().eq("id", p.id),
                            )
                          }
                        >
                          {t.clear}
                        </button>
                      ) : (
                        <button
                          disabled={busy}
                          onClick={() =>
                            run(() =>
                              db
                                .from("post_reports")
                                .insert({ post: p.id, reporter: member.id }),
                            )
                          }
                        >
                          {a[6]}
                        </button>
                      )}
                    </article>
                  ))}
                </>
              ) : (
                <>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      run(
                        () =>
                          db
                            .from("buddy_requests")
                            .insert({
                              campus: member.campus,
                              student: member.id,
                              locale,
                              starts_at: new Date(slot).toISOString(),
                            }),
                        () => setSlot(""),
                      );
                    }}
                  >
                    <label>
                      {t.time}
                      <input
                        type="datetime-local"
                        required
                        value={slot}
                        onChange={(e) => setSlot(e.target.value)}
                      />
                    </label>
                    <button disabled={busy}>{t.save}</button>
                  </form>
                  {member.role === "operator" && (
                    <label>
                      {t.buddy}
                      <select
                        value={assignee}
                        onChange={(e) => setAssignee(e.target.value)}
                      >
                        <option value="">—</option>
                        {buddies.map((id) => (
                          <option key={id}>{id}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  {requests.map((r) => (
                    <article key={r.id} className="result">
                      <div>
                        {new Date(r.starts_at).toLocaleString(locale)} ·{" "}
                        {r.locale}
                        <br />
                        {r.status}
                      </div>
                      {member.role === "operator" &&
                        r.status === "requested" && (
                          <button
                            disabled={busy || !assignee}
                            onClick={() =>
                              run(() =>
                                db.rpc("change_buddy", {
                                  request_id: r.id,
                                  action: "assign",
                                  assignee,
                                }),
                              )
                            }
                          >
                            {t.buddy}
                          </button>
                        )}
                      {r.student === member.id &&
                        ["requested", "assigned", "accepted"].includes(
                          r.status,
                        ) && (
                          <button
                            disabled={busy}
                            onClick={() =>
                              run(() =>
                                db.rpc("change_buddy", {
                                  request_id: r.id,
                                  action: "cancel",
                                }),
                              )
                            }
                          >
                            {t.cancel}
                          </button>
                        )}
                      {r.buddy === member.id &&
                        r.status === "assigned" &&
                        ["accept", "decline"].map((action) => (
                          <button
                            disabled={busy}
                            key={action}
                            onClick={() =>
                              run(() =>
                                db.rpc("change_buddy", {
                                  request_id: r.id,
                                  action,
                                }),
                              )
                            }
                          >
                            {action === "accept" ? t.yes : t.cancel}
                          </button>
                        ))}
                      {r.status === "accepted" && (
                        <button
                          disabled={busy}
                          onClick={() =>
                            run(() =>
                              db.rpc("change_buddy", {
                                request_id: r.id,
                                action: "finish",
                              }),
                            )
                          }
                        >
                          {t.done}
                        </button>
                      )}
                    </article>
                  ))}
                </>
              )}
            </>
          )}
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
