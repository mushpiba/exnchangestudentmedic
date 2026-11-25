// 병·의원 직원이 보는 화면. 읽는 사람이 한국 사람이라 글은 한국어로만 둔다.
// 그래서 16개 언어 카탈로그에 키를 더하지 않는다. 환자가 읽을 문장만 이미 번역된 것을 가져다 쓴다.
import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Copy, FileQuestion, Link as LinkIcon, Printer, QrCode, Check } from "lucide-react";
import QRCode from "qrcode";
import { KO } from "../i18n";
import { href } from "../app/router";
import { DESK_DEFAULT, DESK_GROUPS, DESK_LINES, encodeSheet } from "../content/desk";

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
            <small>우리 의원이 묻는 것을 고르면 QR이 나옵니다. 인쇄해서 접수대에 두세요.</small>
          </span>
        </a>
        <a className="tile" href={href("clinic", "ready")}>
          <ClipboardCheck size={22} aria-hidden />
          <span>
            <strong>받기 전 확인</strong>
            <small>등록이 필요한지, 접수에서 무엇을 확인해야 하는지.</small>
          </span>
        </a>
      </nav>
      <p className="muted small">
        계정도 설치도 없습니다. 질문지는 주소 안에 들어 있어서 QR만 인쇄해 두면 그대로 동작합니다.
      </p>
    </div>
  );
}

export function ClinicReady() {
  return (
    <div className="clinic">
      <h1>받기 전 확인</h1>

      <section className="section">
        <h2>외국인환자 유치의료기관 등록이 필요한가요?</h2>
        <p className="clinic-answer">
          외국인등록을 하고 건강보험에 가입한 환자만 본다면 <strong>등록은 필요하지 않습니다.</strong>
        </p>
        <ul className="clinic-list">
          <li>
            의료 해외진출 및 외국인환자 유치 지원에 관한 법률 시행규칙 제2조는 <strong>외국인등록을 한 사람을 외국인환자
            범위에서 원칙적으로 제외</strong>합니다. 국내에 사는 유학생과 외국인 주민은 대부분 여기에 해당합니다.
          </li>
          <li>
            등록이 필요한 쪽은 <strong>국내에 살지 않고 건강보험에도 없는 외국인을 유치</strong>하려는 경우입니다. 같은 법
            제6조가 진료과목별 전문의와 배상한도 1억원 이상의 의료사고배상책임보험을 요구하고, 처리에 20일이 걸립니다.
          </li>
          <li>등록 없이 유치하면 3년 이하 징역 또는 3천만원 이하 벌금입니다. 이미 찾아온 환자를 진료하는 것은 유치가 아닙니다.</li>
        </ul>
        <p className="muted small">{DISCLAIMER}</p>
      </section>

      <section className="section">
        <h2>접수에서 확인할 것</h2>
        <ol className="clinic-steps">
          <li>
            <strong>신분</strong> — 외국인등록증 또는 여권. 외국인등록번호가 있으면 내국인과 같은 방식으로 접수합니다.
          </li>
          <li>
            <strong>건강보험 자격</strong> — 가입자면 급여 진료입니다. 미가입이거나 자격이 정지된 경우에는 비급여(일반수가)가
            되어 금액이 크게 달라지므로, <strong>진료 전에 미리 알리는 편이 분쟁을 막습니다.</strong>
          </li>
          <li>
            <strong>이름 표기</strong> — 여권의 영문 이름과 외국인등록증의 한글 표기가 다를 수 있습니다. 차트에 쓸 표기를
            하나로 정해 두세요.
          </li>
          <li>
            <strong>연락처</strong> — 한국 번호가 없을 수 있습니다. 메신저 아이디나 같이 온 사람의 번호를 함께 받아 두세요.
          </li>
          <li>
            <strong>통역 필요 여부</strong> — 국적으로 언어를 짐작하지 마세요. 환자에게 직접 고르게 합니다.
          </li>
        </ol>
      </section>

      <section className="section">
        <h2>말이 막혔을 때</h2>
        <ul className="clinic-list">
          <li>
            질문지로 풀리지 않으면 <strong>bbb 코리아 1588-5644</strong>에 전화해 3자 통화로 넘깁니다. 통역료는 무료이고
            통화료만 듭니다(20개 언어, 24시간).
          </li>
          <li>
            다만 <strong>우즈베크어·카자흐어·키르기스어는 bbb에 없습니다.</strong> 중앙아시아 환자가 많다면 질문지를 더
            촘촘히 만들어 두는 편이 낫습니다.
          </li>
        </ul>
      </section>
    </div>
  );
}

export function ClinicSheet() {
  const [picked, setPicked] = useState<number[]>(DESK_DEFAULT);
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);

  const code = useMemo(() => encodeSheet(picked), [picked]);
  const url = useMemo(() => {
    const base = location.origin + location.pathname;
    return base + href("q", code);
  }, [code]);

  useEffect(() => {
    let alive = true;
    if (!picked.length) {
      setQr("");
      return;
    }
    QRCode.toDataURL(url, { width: 480, margin: 1, errorCorrectionLevel: "M" })
      .then((src) => alive && setQr(src))
      .catch(() => alive && setQr(""));
    return () => {
      alive = false;
    };
  }, [url, picked.length]);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  const toggle = (i: number) =>
    setPicked((prev) => (prev.includes(i) ? prev.filter((n) => n !== i) : [...prev, i].sort((a, b) => a - b)));

  let index = -1;
  return (
    <div className="clinic">
      <h1>접수 질문지 만들기</h1>
      <p className="muted">
        우리 의원이 묻는 것을 고르세요. 환자가 QR을 찍으면 <strong>자기 언어로</strong> 읽고 답하고, 답은 한국어로 바뀌어
        돌아옵니다.
      </p>

      {DESK_GROUPS.map((group) => (
        <section className="section" key={group.title}>
          <h2>{group.title}</h2>
          <div className="clinic-picks">
            {group.lines.map((line) => {
              index += 1;
              const i = index;
              const on = picked.includes(i);
              return (
                <label key={line.k} className={"clinic-pick" + (on ? " on" : "")}>
                  <input type="checkbox" checked={on} onChange={() => toggle(i)} />
                  <span className="clinic-pick-text">
                    {KO[line.k]}
                    {line.kind === "tell" && <em className="badge">안내</em>}
                  </span>
                </label>
              );
            })}
          </div>
        </section>
      ))}

      <section className="section clinic-out">
        <h2>인쇄해서 접수대에 두세요</h2>
        {picked.length === 0 ? (
          <p className="muted">질문을 하나 이상 고르면 QR이 나옵니다.</p>
        ) : (
          <>
            <p className="muted">고른 질문 {picked.length}개 · 전체 {DESK_LINES.length}개 중</p>
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
              <a className="row-link" href={href("q", code)} target="_blank" rel="noreferrer">
                <FileQuestion size={18} aria-hidden /> 환자 화면 미리보기
              </a>
            </div>
            <p className="clinic-url">
              <LinkIcon size={14} aria-hidden /> {url}
            </p>
            <p className="muted small">
              고른 질문이 주소 안에 들어 있습니다. 질문을 바꾸면 주소가 바뀌므로 QR을 다시 인쇄해야 합니다.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
