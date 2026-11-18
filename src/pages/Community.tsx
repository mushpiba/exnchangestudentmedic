import { useEffect, useState } from "react";
import { ArrowLeft, Flag, Heart, MessageCircle, PenSquare, Search, Star, Trash2, X } from "lucide-react";
import { useI18n, type MessageKey } from "../i18n";
import { LOCALES, nativeName } from "../i18n/locales";
import { go, href } from "../app/router";
import { BOARDS, age, community, looksPersonal, type Board, type CommunityApi, type Feed, type Post, type PostSummary } from "../campus/api";
import { Gate } from "../campus/Gate";
import { Chip, Notice } from "../components/ui";
import { SchoolHead } from "../components/SchoolHead";

const FEEDS: Feed[] = ["hot", "all", ...BOARDS];
const boardKey = (b: Feed) => ("community.board." + b) as MessageKey;

function useApi() {
  const [api, setApi] = useState<CommunityApi | null>(null);
  useEffect(() => {
    community().then(setApi);
  }, []);
  return api;
}

function Ago({ iso }: { iso: string }) {
  const { t } = useI18n();
  const a = age(iso);
  return <time dateTime={iso}>{t(a.key, { n: a.n })}</time>;
}

// Language filter survives switching boards while the tab is open.
let lastLang = "all";

function Feeds({ feed }: { feed: Feed }) {
  const { t, locale } = useI18n();
  const api = useApi();
  const [posts, setPosts] = useState<PostSummary[] | null>(null);
  const [query, setQuery] = useState("");
  const [lang, setLangState] = useState(lastLang);
  const setLang = (l: string) => {
    lastLang = l;
    setLangState(l);
  };
  // My language first, then every other language that has posts here.
  const langs = [locale, ...new Set((posts ?? []).map((p) => p.locale).filter((l) => l !== locale))];
  const shown = posts && lang !== "all" ? posts.filter((p) => p.locale === lang) : posts;
  useEffect(() => {
    if (!api) return;
    let live = true;
    // Wait for a pause in typing before searching.
    const timer = setTimeout(() => {
      setPosts(null);
      api.list(feed, query).then((p) => live && setPosts(p), () => live && setPosts([]));
    }, query ? 300 : 0);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [api, feed, query]);
  return (
    <>
      <nav className="boards" aria-label={t("community.board")}>
        {FEEDS.map((f) => (
          <a key={f} href={href("community", f)} aria-current={f === feed ? "page" : undefined}>
            {t(boardKey(f))}
          </a>
        ))}
      </nav>
      <label className="search">
        <Search size={18} aria-hidden />
        <input type="search" dir="auto" value={query} placeholder={t("community.search")} aria-label={t("community.search")} onChange={(e) => setQuery(e.target.value)} />
        {query && (
          <button type="button" className="clear" aria-label={t("common.clear")} onClick={() => setQuery("")}>
            <X size={20} aria-hidden />
          </button>
        )}
      </label>
      <div className="lang-filter" role="group" aria-label={t("community.langFilter")}>
        {["all", ...langs].map((l) => (
          <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} lang={l === "all" ? undefined : l}>
            {l === "all" ? t("community.langAll") : nativeName(l)}
          </button>
        ))}
      </div>
      {shown === null ? (
        <p className="muted">{t("common.loading")}</p>
      ) : shown.length === 0 ? (
        <p className="muted">
          {query.trim()
            ? t("community.searchEmpty")
            : lang !== "all" && posts?.length
              ? t("community.langEmpty")
              : feed === "hot"
                ? t("community.hotEmpty")
                : t("community.empty")}
        </p>
      ) : (
        <ul className="post-list">
          {shown.map((p) => (
            <li key={p.id}>
              <a href={href("community", "post", p.id)}>
                <span className="post-board">{t(boardKey(p.board))}</span>
                <strong dir="auto">{p.title}</strong>
                <span dir="auto" className="excerpt">
                  {p.excerpt}
                </span>
                <span className="meta">
                  <Ago iso={p.createdAt} />
                  <span className="lang-tag" lang={p.locale}>
                    {nativeName(p.locale)}
                  </span>
                  <span className="counts">
                    <Heart size={14} aria-hidden /> {p.likes}
                    <MessageCircle size={14} aria-hidden /> {p.comments}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
      <a className="fab" href={href("community", "write") + (BOARDS.includes(feed as Board) ? "?" + feed : "")}>
        <PenSquare aria-hidden /> {t("community.write")}
      </a>
    </>
  );
}

function PostView({ id }: { id: string }) {
  const { t } = useI18n();
  const api = useApi();
  const [post, setPost] = useState<Post | null | undefined>(undefined);
  const [comment, setComment] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [reported, setReported] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = () => api?.get(id).then(setPost, () => setPost(null));
  useEffect(() => {
    load();
  }, [api, id]);

  async function act(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (post === undefined) return <p className="muted">{t("common.loading")}</p>;
  if (post === null) return <p className="muted">{t("community.empty")}</p>;

  return (
    <article className="post">
      <a className="back" href={href("community", post.board)}>
        <ArrowLeft className="flip" size={18} aria-hidden /> {t(boardKey(post.board))}
      </a>
      <header>
        <span className="who">{post.authorName ?? t("community.anonymous")}</span>
        <span className="meta">
          <Ago iso={post.createdAt} /> · {t("community.originalLang", { lang: nativeName(post.locale) })}
        </span>
        <h1 dir="auto">{post.title}</h1>
      </header>
      {post.board === "review" && (post.facility || post.rating) && (
        <dl className="review-meta">
          {post.facility && (
            <>
              <dt>{t("community.facility")}</dt>
              <dd dir="auto">{post.facility}</dd>
            </>
          )}
          {post.langs && post.langs.length > 0 && (
            <>
              <dt>{t("community.langUsed")}</dt>
              <dd>{post.langs.map(nativeName).join(", ")}</dd>
            </>
          )}
          {post.rating && (
            <>
              <dt>{t("community.rating")}</dt>
              <dd aria-label={post.rating + "/5"}>{"★".repeat(post.rating) + "☆".repeat(5 - post.rating)}</dd>
            </>
          )}
        </dl>
      )}
      <p className="body" dir="auto">
        {post.body}
      </p>
      <div className="row post-actions">
        <button type="button" aria-pressed={post.liked} disabled={busy} onClick={() => act(() => api!.like(post.id))}>
          <Heart size={16} aria-hidden fill={post.liked ? "currentColor" : "none"} /> {t("community.like")} {post.likes}
        </button>
        {post.mine ? (
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              if (!confirm(t("community.deleteConfirm"))) return;
              await api!.remove(post.id);
              go("community", post.board);
            }}
          >
            <Trash2 size={16} aria-hidden /> {t("community.delete")}
          </button>
        ) : (
          <button
            type="button"
            disabled={busy || reported}
            onClick={() => act(() => api!.report(post.id)).then(() => setReported(true))}
          >
            <Flag size={16} aria-hidden /> {reported ? t("community.reported") : t("community.report")}
          </button>
        )}
      </div>

      <section className="thread" aria-label={t("community.comments")}>
        <h2>
          {t("community.comments")} {post.thread.length}
        </h2>
        <ul>
          {post.thread.map((c) => (
            <li key={c.id} className={c.who === "author" ? "by-author" : ""}>
              <span className="who">
                {c.name && c.name !== "me" ? c.name : c.who === "author" ? t("community.author") : t("community.anonN", { n: c.who })}
              </span>
              <p dir="auto">{c.body}</p>
              <span className="meta">
                <Ago iso={c.createdAt} />
                {c.mine ? (
                  <button type="button" className="link" onClick={() => act(() => api!.removeComment(c.id))}>
                    {t("community.delete")}
                  </button>
                ) : (
                  <button type="button" className="link" onClick={() => act(() => api!.report(post.id, c.id))}>
                    {t("community.report")}
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
        <form
          className="comment-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!comment.trim()) return;
            if (looksPersonal(comment) && !confirm(t("community.piiWarning"))) return;
            act(() => api!.comment(post.id, comment.trim(), anonymous)).then(() => setComment(""));
          }}
        >
          <textarea
            dir="auto"
            maxLength={1000}
            value={comment}
            placeholder={t("community.commentPh")}
            aria-label={t("community.commentPh")}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="row">
            <label className="check">
              <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
              {t("community.anonymous")}
            </label>
            <button className="primary" disabled={busy || !comment.trim()}>
              {t("community.submit")}
            </button>
          </div>
        </form>
      </section>
    </article>
  );
}

function Write() {
  const { t, locale } = useI18n();
  const api = useApi();
  const preset = location.hash.split("?")[1] as Board | undefined;
  const [board, setBoard] = useState<Board>(BOARDS.includes(preset as Board) ? preset! : "free");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [facility, setFacility] = useState("");
  const [langs, setLangs] = useState<string[]>([]);
  const [rating, setRating] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (looksPersonal(title + " " + body) && !confirm(t("community.piiWarning"))) return;
    setBusy(true);
    setError("");
    try {
      const id = await api!.create({
        board,
        title: title.trim(),
        body: body.trim(),
        locale,
        anonymous,
        ...(board === "review" ? { facility: facility.trim(), langs, rating: rating || undefined } : {}),
      });
      go("community", "post", id);
    } catch {
      setError(t("auth.error"));
      setBusy(false);
    }
  }

  return (
    <form
      className="write"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <h1>{t("community.write")}</h1>
      <div className="rules">
        <strong>{t("community.rulesTitle")}</strong>
        <ul>
          <li>{t("community.rule1")}</li>
          <li>{t("community.rule2")}</li>
          <li>{t("community.rule3")}</li>
        </ul>
      </div>
      <fieldset>
        <legend>{t("community.board")}</legend>
        <div className="choices">
          {BOARDS.map((b) => (
            <Chip key={b} on={board === b} onClick={() => setBoard(b)}>
              {t(boardKey(b))}
            </Chip>
          ))}
        </div>
      </fieldset>
      <input dir="auto" required maxLength={120} value={title} placeholder={t("community.titlePh")} aria-label={t("community.titlePh")} onChange={(e) => setTitle(e.target.value)} />
      {board === "review" && (
        <>
          <input dir="auto" maxLength={80} value={facility} placeholder={t("community.facility")} aria-label={t("community.facility")} onChange={(e) => setFacility(e.target.value)} />
          <fieldset>
            <legend>{t("community.langUsed")}</legend>
            <div className="choices">
              {LOCALES.map((l) => (
                <Chip key={l.code} lang={l.code} on={langs.includes(l.code)} onClick={() => setLangs(langs.includes(l.code) ? langs.filter((x) => x !== l.code) : [...langs, l.code])}>
                  {l.native}
                </Chip>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>{t("community.rating")}</legend>
            <div className="stars" role="radiogroup">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={n + "/5"} onClick={() => setRating(n)}>
                  <Star fill={n <= rating ? "currentColor" : "none"} aria-hidden />
                </button>
              ))}
            </div>
          </fieldset>
        </>
      )}
      <textarea dir="auto" required maxLength={3000} value={body} placeholder={t("community.bodyPh")} aria-label={t("community.bodyPh")} onChange={(e) => setBody(e.target.value)} />
      <label className="check">
        <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
        {t("community.anonymous")}
      </label>
      <div className="actions">
        <button type="button" onClick={() => history.back()}>
          {t("common.cancel")}
        </button>
        <button className="primary" disabled={busy || !api || !title.trim() || !body.trim()}>
          {t("community.submit")}
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}

export function Community({ route }: { route: string[] }) {
  const { t } = useI18n();
  const [head, id] = route;
  const feed = (FEEDS.includes(head as Feed) ? head : "all") as Feed;
  return (
    <section className="community">
      {head !== "post" && head !== "write" && (
        <>
          <SchoolHead current="board" />
          <p className="muted">{t("community.intro")}</p>
        </>
      )}
      <Gate>
        {() =>
          head === "post" && id ? <PostView id={id} /> : head === "write" ? <Write /> : <Feeds feed={feed} />
        }
      </Gate>
      <Notice>{t("community.rule3")}</Notice>
    </section>
  );
}
