// 병·의원 직원이 보는 화면. 읽는 사람이 한국 사람이라 글은 한국어로만 둔다.
// 그래서 16개 언어 카탈로그에 키를 더하지 않는다. 환자가 읽을 문장만 이미 번역된 것을 가져다 쓴다.
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ClipboardCheck, Copy, FileQuestion, Link as LinkIcon, Printer, QrCode, Check } from "lucide-react";
import QRCode from "qrcode";
import { KO } from "../i18n";
import { href } from "../app/router";
import { DESK_DEFAULT, DESK_GROUPS, DESK_LINES, OWN_LEN, OWN_MAX, type OwnLine, deskIndex, encodeOwn, encodeSheet } from "../content/desk";
import { READY_COUNT, READY_GROUPS } from "../content/ready";

const DISCLAIMER = "NARU가 정리한 공개 자료이며 법률 자문이 아닙니다. 실제 판단은 변호사와 관할 보건소에 확인하세요.";

export function ClinicHome() {
  return (
    <div className="clinic">
      <h1>병·의원용 NARU</h1>
      <p className="muted">
        외국인 환자가 와도 접수에서 막히지 않도록 돕습니다. 환자는 자기 언어로 읽고 답하고, 직원은 한국어로 봅니다.
      </p>
      <nav className="clinic-cards">
        <a className="tile" href={href("clinic", "sheet")}>
          <QrCode size={22} aria-hidden />
          <span>
            <strong>접수 질문지 만들기</strong>
            <small>우리 의원이 묻는 것을 고르고, 직접 적은 질문도 더해서 QR로 인쇄하세요.</small>
          </span>
        </a>
        <a className="tile" href={href("clinic", "ready")}>
          <ClipboardCheck size={22} aria-hidden />
          <span>
            <strong>받을 수 있는 상태 만들기</strong>
            <small>외국인 환자를 받으려면 무엇이 되어 있어야 하는지 {READY_COUNT}가지 점검표.</small>
          </span>
        </a>
      </nav>
      <p className="muted small">
        계정도 설치도 없습니다. 질문지는 주소 안에 들어 있어서 QR만 인쇄해 두면 그대로 동작합니다.
      </p>
    </div>
  );
}

const DONE_KEY = "naru-clinic-ready";

/** 체크한 것은 이 기기에만 남는다. 어디로도 보내지 않으므로 의원 정보가 밖으로 나가지 않는다. */
function useDone() {
  const [done, setDone] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DONE_KEY) ?? "[]");
      return Array.isArray(saved) ? saved.filter((id) => typeof id === "string") : [];
    } catch {
      return [];
    }
  });
  const toggle = (id: string) =>
    setDone((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(DONE_KEY, JSON.stringify(next));
      } catch {
        /* 사생활 보호 모드: 이 탭에서만 기억한다 */
      }
      return next;
    });
  return [done, toggle] as const;
}

export function ClinicReady() {
  const [done, toggle] = useDone();
  return (
    <div className="clinic">
      <h1>받을 수 있는 상태 만들기</h1>
      <p className="muted">
        외국인 환자가 늘지 않는 이유는 보통 응대 실력이 아닙니다. 찾을 수 없거나, 금액을 모르거나, 서류를 못 받기
        때문입니다. 아래는 모두 돈이 들지 않거나 한 번만 하면 되는 일입니다.
      </p>

      <p className="clinic-answer">
        국내에 살면서 외국인등록을 하고 건강보험에 가입한 환자만 본다면 <strong>유치의료기관 등록은 필요하지 않습니다.</strong>{" "}
        유학생과 외국인 주민은 대부분 여기에 해당합니다. 근거는 아래 &lsquo;법으로 먼저 확인할 것&rsquo;에 있습니다.
      </p>

      <p className="clinic-progress" aria-live="polite">
        <strong>
          {done.length} / {READY_COUNT}
        </strong>{" "}
        확인했습니다
      </p>

      {READY_GROUPS.map((group) => {
        const n = group.items.filter((i) => done.includes(i.id)).length;
        return (
          <details className="clinic-fold" key={group.title}>
            <summary>
              <span className="fold-title">{group.title}</span>
              <span className={"fold-count" + (n === group.items.length ? " full" : "")}>
                {n} / {group.items.length}
              </span>
              <ChevronDown className="fold-chev" size={18} aria-hidden />
            </summary>
            <p className="muted small fold-note">{group.note}</p>
            <div className="clinic-picks">
              {group.items.map((item) => {
                const on = done.includes(item.id);
                return (
                  <label key={item.id} className={"clinic-pick" + (on ? " on" : "")}>
                    <input type="checkbox" checked={on} onChange={() => toggle(item.id)} />
                    <span className="clinic-pick-text">
                      <span className="pick-label">{item.label}</span>
                      <small>{item.how}</small>
                    </span>
                  </label>
                );
              })}
            </div>
          </details>
        );
      })}

      <p className="muted small">{DISCLAIMER}</p>
    </div>
  );
}

export function ClinicSheet() {
  const [picked, setPicked] = useState<number[]>(DESK_DEFAULT);
  // 칸은 처음부터 최대 개수만큼 비워 둔다. 더하기·지우기 버튼이 없어도 되고, 몇 개까지인지도 보인다.
  const [own, setOwn] = useState<OwnLine[]>(() => Array.from({ length: OWN_MAX }, () => ({ kind: "ask", ko: "" })));
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);

  const code = useMemo(() => encodeSheet(picked), [picked]);
  const ownCode = useMemo(() => encodeOwn(own), [own]);
  const lines = picked.length + own.filter((o) => o.ko.trim()).length;
  const url = useMemo(() => {
    const base = location.origin + location.pathname;
    return base + (ownCode ? href("q", code, ownCode) : href("q", code));
  }, [code, ownCode]);

  useEffect(() => {
    let alive = true;
    if (!lines) {
      setQr("");
      return;
    }
    QRCode.toDataURL(url, { width: 480, margin: 1, errorCorrectionLevel: "M" })
      .then((src) => alive && setQr(src))
      .catch(() => alive && setQr(""));
    return () => {
      alive = false;
    };
  }, [url, lines]);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  const toggle = (i: number) =>
    setPicked((prev) => (prev.includes(i) ? prev.filter((n) => n !== i) : [...prev, i].sort((a, b) => a - b)));
  const setRow = (i: number, patch: Partial<OwnLine>) =>
    setOwn((prev) => prev.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  return (
    <div className="clinic">
      <h1>접수 질문지 만들기</h1>
      <p className="muted">
        우리 의원이 묻는 것만 고르세요. 환자가 QR을 찍으면 <strong>자기 언어로</strong> 읽고 답하고, 답은 한국어로
        바뀌어 돌아옵니다. 묶음을 열어 하나씩 켜고 끄면 됩니다.
      </p>

      {DESK_GROUPS.map((group) => {
        const n = group.keys.filter((k) => picked.includes(deskIndex(k))).length;
        return (
          <details className="clinic-fold" key={group.title}>
            <summary>
              <span className="fold-title">{group.title}</span>
              <span className={"fold-count" + (n ? " full" : "")}>
                {n} / {group.keys.length}
              </span>
              <ChevronDown className="fold-chev" size={18} aria-hidden />
            </summary>
            <p className="muted small fold-note">{group.note}</p>
            <div className="clinic-picks">
              {group.keys.map((k) => {
                const i = deskIndex(k);
                const on = picked.includes(i);
                return (
                  <label key={k} className={"clinic-pick" + (on ? " on" : "")}>
                    <input type="checkbox" checked={on} onChange={() => toggle(i)} />
                    <span className="clinic-pick-text">
                      {/* 글 흐름 안에 두어야 짧은 줄에서는 글 끝에 붙고, 긴 줄에서만 아래로 넘어간다. */}
                      <span className="pick-label">
                        {KO[k]}
                        {DESK_LINES[i].kind === "tell" && <em className="badge">안내</em>}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </details>
        );
      })}

      <details className="clinic-fold" open>
        <summary>
          <span className="fold-title">우리 의원 질문 더하기</span>
          <span className={"fold-count" + (ownCode ? " full" : "")}>
            {own.filter((o) => o.ko.trim()).length} / {OWN_MAX}
          </span>
          <ChevronDown className="fold-chev" size={18} aria-hidden />
        </summary>
        <p className="muted small fold-note">
          위 목록에 없는 것을 직접 적으세요. 미리 번역해 둘 수가 없어서 환자 화면에는 한국어로 보이고, 환자가 한 번
          누르면 자기 언어로 바뀝니다. 한 줄 {OWN_LEN}자까지.
        </p>
        <div className="clinic-owns">
          {own.map((row, i) => (
            <div className="clinic-own" key={i}>
              <input
                type="text"
                value={row.ko}
                maxLength={OWN_LEN}
                placeholder={i === 0 ? "예: 오늘 진료는 예약 환자만 받습니다" : "비워 두면 들어가지 않습니다"}
                onChange={(e) => setRow(i, { ko: e.target.value })}
                aria-label={"직접 적는 줄 " + (i + 1)}
              />
              <div className="seg2" role="group" aria-label="줄의 종류">
                <button type="button" aria-pressed={row.kind === "ask"} onClick={() => setRow(i, { kind: "ask" })}>
                  질문
                </button>
                <button type="button" aria-pressed={row.kind === "tell"} onClick={() => setRow(i, { kind: "tell" })}>
                  안내
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="muted small">
          질문은 환자가 예·아니요·모름으로 답하고, 안내는 읽기만 합니다. 적은 글이 그대로 주소에 들어가므로 환자
          이름처럼 사람에 관한 것은 적지 마세요.
        </p>
      </details>

      <section className="section clinic-out">
        <h2>인쇄해서 접수대에 두세요</h2>
        {lines === 0 ? (
          <p className="muted">질문을 하나 이상 고르거나 직접 적으면 QR이 나옵니다.</p>
        ) : (
          <>
            <p className="muted">
              고른 질문 {picked.length}개(전체 {DESK_LINES.length}개 중)
              {ownCode ? ` · 직접 적은 줄 ${own.filter((o) => o.ko.trim()).length}개` : ""}
            </p>
            {qr && <img className="clinic-qr" src={qr} alt="접수 질문지 QR" width={240} height={240} />}
            <div className="row">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(url).then(
                    () => setCopied(true),
                    () => undefined,
                  );
                }}
              >
                {copied ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />}
                {copied ? "복사했습니다" : "링크 복사"}
              </button>
              <button type="button" onClick={() => window.print()}>
                <Printer size={18} aria-hidden /> 인쇄
              </button>
              <a
                className="row-link"
                href={ownCode ? href("q", code, ownCode) : href("q", code)}
                target="_blank"
                rel="noreferrer"
              >
                <FileQuestion size={18} aria-hidden /> 환자 화면 미리보기
              </a>
            </div>
            <p className="clinic-url">
              <LinkIcon size={14} aria-hidden /> {url}
            </p>
            <p className="muted small">
              고른 질문이 주소 안에 들어 있습니다. 질문을 바꾸면 주소가 바뀌므로 QR을 다시 인쇄해야 합니다. 직접 적은
              줄이 길어지면 QR이 촘촘해지니, 인쇄한 뒤 한 번 찍어 보세요.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
