// Small drawings that say what a screen does before its words are read: the buddy walking you from
// campus to the clinic, and the two directions the medicine tab translates in. All three are decorative
// — every fact they carry is also written next to them — so they are hidden from screen readers.

/** Campus → clinic, with the two of you on the path. The line the pair says is real text, so it translates. */
export function BuddyWalk({ say }: { say: string }) {
  return (
    <figure className="buddy-walk">
      <p className="bw-say" dir="auto">
        {say}
      </p>
      <svg className="bw-art" viewBox="0 0 320 84" aria-hidden focusable="false">
        <path
          className="bw-path"
          d="M48 60c34-16 62 12 96 2s58-20 92-14"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="2 7"
        />
        <g className="bw-place">
          <path d="M26 22v13" strokeWidth="2" strokeLinecap="round" />
          <path className="bw-flag" d="M26 22l13 4-13 4z" />
          <rect x="11" y="37" width="30" height="27" rx="4" fill="none" strokeWidth="2" />
          <path d="M11 45h30" strokeWidth="2" />
          <rect className="bw-door" x="22" y="52" width="8" height="12" rx="1.5" />
        </g>
        <g transform="translate(146 0)">
          <circle className="bw-me" cx="0" cy="33" r="7.5" />
          <path className="bw-me" d="M-9.5 64c0-10.5 4.3-17 9.5-17s9.5 6.5 9.5 17z" />
          <circle className="bw-buddy" cx="21" cy="37" r="7.5" strokeWidth="2" />
          <path className="bw-buddy" d="M11.5 64c0-10 4.3-16 9.5-16s9.5 6 9.5 16z" strokeWidth="2" />
        </g>
        <g className="bw-place">
          <circle cx="288" cy="45" r="17" fill="none" strokeWidth="2" />
          <path d="M288 37v16M280 45h16" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </svg>
    </figure>
  );
}

/** A box from home turning into a Korean pharmacy pack. */
export function MedsHomeArt() {
  return (
    <span className="meds-art" aria-hidden>
      <svg viewBox="0 0 268 84" focusable="false">
        <g className="ma-line">
          <path d="M26 30l24-9 24 9v34l-24 9-24-9z" fill="none" strokeWidth="2" strokeLinejoin="round" />
          <path d="M26 30l24 9 24-9M50 39v34" strokeWidth="2" strokeLinejoin="round" fill="none" />
          <path className="ma-soft" d="M34 44h10M34 52h7" strokeWidth="2" strokeLinecap="round" fill="none" />
        </g>
        <path className="ma-arrow" d="M112 42h40m-9-7l9 7-9 7" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <g className="ma-line">
          <rect x="190" y="24" width="60" height="42" rx="4" fill="none" strokeWidth="2" />
          <path d="M190 32h60" strokeWidth="2" fill="none" />
          <path className="ma-soft" d="M198 44h26M198 52h18" strokeWidth="2" strokeLinecap="round" fill="none" />
          <circle className="ma-dot" cx="238" cy="50" r="7" />
        </g>
      </svg>
    </span>
  );
}

/** A Korean pack read back to you in your own words. */
export function MedsKoreaArt() {
  return (
    <span className="meds-art" aria-hidden>
      <svg viewBox="0 0 268 84" focusable="false">
        <g className="ma-line">
          <rect x="18" y="24" width="58" height="42" rx="4" fill="none" strokeWidth="2" />
          <path d="M18 32h58" strokeWidth="2" fill="none" />
          <path className="ma-soft" d="M26 44h24M26 52h16" strokeWidth="2" strokeLinecap="round" fill="none" />
          <circle className="ma-dot" cx="64" cy="50" r="7" />
        </g>
        <path className="ma-arrow" d="M112 42h40m-9-7l9 7-9 7" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <g className="ma-line">
          <path d="M184 24h62a4 4 0 014 4v26a4 4 0 01-4 4h-38l-13 11v-11h-11a4 4 0 01-4-4V28a4 4 0 014-4z" fill="none" strokeWidth="2" strokeLinejoin="round" />
          <path className="ma-soft" d="M194 36h42M194 44h34M194 52h24" strokeWidth="2" strokeLinecap="round" fill="none" />
        </g>
      </svg>
    </span>
  );
}
