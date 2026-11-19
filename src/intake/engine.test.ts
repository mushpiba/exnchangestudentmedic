import { describe, expect, it } from "vitest";
import bankJson from "./data/bank.json";
import ko from "./text/ko-KR.json";
import {
  alerts, answer, answeredCount, current, emptyFlow, entryQuestions, isMulti, isYesItem, plan, previous, setMain,
  suggestions, toggleSymptom, visibleOptions, type Answer, type Bank, type Flow,
} from "./engine";

const bank = bankJson as unknown as Bank;
const text = ko as Record<string, string>;

/** A tiny bank to pin down the flow rules. */
const mini: Bank = {
  symptoms: {
    A: { cats: [], start: ["q1", "qF", "qPain"] },
    B: { cats: [], start: ["qB", "qPain"] },
    W: { cats: [], start: ["qW"], sex: "F" },
  },
  questions: {
    q1: { t: "M", q: "t1", o: [{ x: "a", k: "opt", next: ["q2"] }, { x: "b", k: "opt", next: ["q3"] }, { x: "u", k: "unknown" }] },
    q2: { t: "B", q: "t2", o: [{ x: "yes2", k: "opt", next: ["q4"] }] },
    q3: { t: "B", q: "t3", o: [{ x: "yes3", k: "opt", level: "emergency" }] },
    q4: { t: "B", q: "t4", o: [{ x: "yes4", k: "opt" }] },
    qF: { t: "F", q: "tF", o: [{ x: "addB", k: "add", add: "B" }, { x: "addA", k: "add", add: "A" }, { x: "addW", k: "add", add: "W" }, { x: "none", k: "none" }] },
    qPain: { t: "S", q: "tP", o: [{ x: "p0", k: "opt" }, { x: "p1", k: "opt" }] },
    qB: { t: "B", q: "tB", o: [{ x: "yesB", k: "opt" }] },
    qW: { t: "B", q: "tW", sex: "F", o: [{ x: "yesW", k: "opt" }] },
  },
  history: { A: { past: ["p:1"], drug: [], family: [] }, B: { past: ["p:1", "p:2"], drug: [], family: [] } },
  hist: { "p:1": "h1", "p:2": "h2" },
  common: [],
  assoc: { A: ["B"] },
  naru: {},
};
const pick = (...options: number[]): Answer => ({ kind: "pick", options });
const keys = (f: Flow) => plan(mini, f).steps.map((s) => s.key);

describe("flow rules", () => {
  it("shows the symptom's start question first", () => {
    const f = setMain(mini, "A", "");
    expect(current(mini, f)?.qid).toBe("q1");
    expect(answeredCount(mini, f)).toBe(0);
  });

  it("puts follow-ups right after the answer that opened them", () => {
    let f = setMain(mini, "A", "");
    f = answer(mini, f, "q1", pick(0));
    expect(keys(f)).toEqual(["q1", "q2", "qF", "A|qPain"]);
    f = answer(mini, f, "q2", pick(0));
    expect(keys(f)).toEqual(["q1", "q2", "q4", "qF", "A|qPain"]);
    expect(current(mini, f)?.qid).toBe("q4");
  });

  it("drops the old branch and its answers when an answer changes", () => {
    let f = setMain(mini, "A", "");
    f = answer(mini, f, "q1", pick(0));
    f = answer(mini, f, "q2", pick(0));
    f = answer(mini, f, "q4", pick(0));
    f = answer(mini, f, "q1", pick(1));
    expect(keys(f)).toEqual(["q1", "q3", "qF", "A|qPain"]);
    expect(Object.keys(f.answers).sort()).toEqual(["q1"]);
    expect(current(mini, f)?.qid).toBe("q3");
  });

  it("stores skip and not-sure apart from no, and counts only answered questions", () => {
    let f = setMain(mini, "A", "");
    f = answer(mini, f, "q1", { kind: "unknown" });
    expect(f.answers.q1).toEqual({ kind: "unknown" });
    f = answer(mini, f, "qF", { kind: "skip" });
    expect(f.answers.qF).toEqual({ kind: "skip" });
    expect(answeredCount(mini, f)).toBe(2);
    expect(keys(f)).toEqual(["q1", "qF", "A|qPain"]); // not-sure opens no branch
  });

  it("adds an associated symptom from an answer, asks its questions after, and removes it cleanly", () => {
    let f = setMain(mini, "A", "");
    f = answer(mini, f, "qF", pick(0));
    expect(plan(mini, f).associated).toEqual(["B"]);
    expect(keys(f)).toEqual(["q1", "qF", "A|qPain", "qB", "B|qPain"]); // the pain scale is asked per symptom
    f = answer(mini, f, "qB", pick(0));
    f = toggleSymptom(mini, f, "B");
    expect(plan(mini, f).associated).toEqual([]);
    expect(f.answers.qF).toEqual({ kind: "no" });
    expect(f.answers.qB).toBeUndefined();
  });

  it("adds and removes a symptom by hand", () => {
    let f = setMain(mini, "A", "");
    f = toggleSymptom(mini, f, "B");
    expect(f.manual).toEqual(["B"]);
    expect(keys(f)).toContain("qB");
    f = toggleSymptom(mini, f, "B");
    expect(keys(f)).not.toContain("qB");
  });

  it("hides the main symptom and other-sex symptoms from associated-symptom options", () => {
    const f = setMain(mini, "A", "M");
    expect(visibleOptions(mini, f, "qF", "A").map((i) => mini.questions.qF.o[i].x)).toEqual(["addB", "none"]);
    expect(visibleOptions(mini, f, "q1", "A")).toEqual([0, 1]); // "not sure" becomes the standard button
  });

  it("goes back to the previous answered question and raises danger alerts", () => {
    let f = setMain(mini, "A", "");
    f = answer(mini, f, "q1", pick(1));
    expect(previous(mini, f, null)?.qid).toBe("q1");
    f = answer(mini, f, "q3", pick(0));
    expect(alerts(mini, f)).toEqual([{ level: "emergency", key: "q3", option: 0 }]);
  });

  it("suggests linked symptoms from the data and NARU's rules only", () => {
    expect(suggestions(mini, setMain(mini, "A", ""))).toEqual(["B", "W"]);
    expect(suggestions(mini, setMain(mini, "A", "M"))).toEqual(["B"]);
  });
});

describe("bank integrity", () => {
  const ids = Object.keys(bank.symptoms);

  it("has 261 symptoms, each with a start question that exists", () => {
    expect(ids.length).toBe(261);
    for (const sid of ids) {
      const entry = entryQuestions(bank, sid);
      expect(entry.length, sid).toBeGreaterThan(0);
      for (const q of entry) expect(bank.questions[q], `${sid} -> ${q}`).toBeDefined();
    }
  });

  it("every option's follow-up and added symptom exists, and every text is in Korean", () => {
    for (const [qid, q] of Object.entries(bank.questions)) {
      expect(text[q.q], qid).toBeTruthy();
      q.o.forEach((o, i) => {
        expect(text[o.x], `${qid}#${i}`).toBeTruthy();
        for (const n of o.next ?? []) expect(bank.questions[n], `${qid}#${i} -> ${n}`).toBeDefined();
        if (o.k === "add") expect(bank.symptoms[o.add!], `${qid}#${i} adds ${o.add}`).toBeDefined();
      });
    }
  });

  it("keeps only questions reachable from a symptom (no sampled disease-question rules)", () => {
    const reach = new Set<string>();
    const stack = ids.flatMap((s) => entryQuestions(bank, s));
    while (stack.length) {
      const q = stack.pop()!;
      if (reach.has(q)) continue;
      reach.add(q);
      for (const o of bank.questions[q].o) stack.push(...(o.next ?? []));
    }
    expect(Object.keys(bank.questions).filter((q) => !reach.has(q))).toEqual([]);
  });

  it("starts each symptom at its own first question", () => {
    expect(current(bank, setMain(bank, "SWH001", ""))?.qid).toBe("QSMZFA_150");
    expect(current(bank, setMain(bank, "SGI008", ""))?.qid).toBe("QSZZFA_003");
  });

  it("asks the red flags right after the first question", () => {
    let f = setMain(bank, "SWH001", "");
    f = answer(bank, f, "QSMZFA_150", pick(0));
    expect(plan(bank, f).steps.slice(0, 5).map((s) => s.qid)).toEqual(["QSMZFA_150", "QSWZFB_180", "NF_HEAD", "NF_MIGRAINE", "NF_HEADINJ"]);
  });

  /** Answer until nothing is left; fails if a symptom never finishes. */
  const walk = (sid: string, sex: "F" | "M" | "", choose: (q: Bank["questions"][string], vis: number[]) => Answer) => {
    let f = setMain(bank, sid, sex);
    for (let n = 0; n < 3000; n++) {
      const step = current(bank, f);
      if (!step) return f;
      const q = bank.questions[step.qid];
      expect(q, step.qid).toBeDefined();
      f = answer(bank, f, step.key, choose(q, visibleOptions(bank, f, step.qid, step.owner)));
    }
    throw new Error("no end: " + sid);
  };
  const first = (_q: Bank["questions"][string], vis: number[]): Answer => (vis.length ? pick(vis[0]) : { kind: "skip" });
  const last = (q: Bank["questions"][string], vis: number[]): Answer =>
    vis.length ? pick(...(isMulti(q) ? vis.filter((i) => q.o[i].k !== "none") : [vis[vis.length - 1]])) : { kind: "no" };

  it("finishes for every symptom when answering the first option, or not sure", () => {
    for (const sid of ids) {
      const sex = bank.symptoms[sid].sex ?? "";
      expect(current(bank, walk(sid, sex, first))).toBeNull();
      expect(current(bank, walk(sid, sex, () => ({ kind: "unknown" })))).toBeNull();
    }
  }, 120000);

  it("finishes even when every option is chosen", () => {
    for (const sid of ["SWH005", "SGI008", "SDM007", "SGY003", "SSX003"]) expect(current(bank, walk(sid, bank.symptoms[sid].sex ?? "", last))).toBeNull();
  }, 120000);

  it("yes-items have exactly one visible option", () => {
    for (const [qid, q] of Object.entries(bank.questions)) if (isYesItem(q)) expect(q.o.filter((o) => o.k === "opt" || o.k === "add").length, qid).toBe(1);
  });
});
