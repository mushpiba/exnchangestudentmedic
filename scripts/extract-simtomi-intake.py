"""Extract the Simtomi intake data NARU uses from the audited zip into data/simtomi/.

usage: python -I scripts/extract-simtomi-intake.py <path to simtomi_learning_data_audited_augmented.zip>

Writes trimmed copies (only the fields NARU reads) and copies the Simtomi-made images that the
questions reference into public/intake-img/. Images carrying Science Photo Library metadata are
licensed stock photos and are never copied.
"""
import hashlib
import json
import os
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "data", "simtomi")
IMG = os.path.join(ROOT, "public", "intake-img")

# Simtomi language keys -> NARU locale codes (kk, ky, uz are not in Simtomi; md_MD is unused).
LANGS = {
    "ko_KR": "ko-KR", "en_US": "en-US", "vi_VN": "vi-VN", "zh_CN": "zh-CN", "zh_TW": "zh-TW",
    "ru_RU": "ru-RU", "ja_JP": "ja-JP", "ne_NP": "ne-NP", "ar_SA": "ar-SA", "mn_MN": "mn-MN",
    "ur_PK": "ur-PK", "es_ES": "es-ES", "fr_FR": "fr-FR",
}


def main(zip_path):
    z = zipfile.ZipFile(zip_path)
    read = lambda name: json.loads(z.read(name).decode("utf-8"))
    symptoms = read("simtomi/symptoms_multilingual.json")
    questions = read("simtomi/questions_ko.json")
    history = read("simtomi/history_options_ko.json")
    manifest = {e["url"]: e for e in read("images/manifest.json")}

    os.makedirs(OUT, exist_ok=True)
    os.makedirs(IMG, exist_ok=True)

    images = {}  # url -> published file name, or None when excluded

    def image(url):
        if not url:
            return None
        if url in images:
            return images[url]
        entry = manifest.get(url)
        name = None
        if entry:
            data = z.read(entry["file"])
            if hashlib.sha256(data).hexdigest() != entry["sha256"]:
                raise SystemExit("hash mismatch: " + entry["file"])
            # "_science" files are the stock-photo set; four of them have had their metadata stripped.
            stock = "_science" in entry["file"] or b"Science Photo Library" in data or b"SCIENCE PHOTO LIBRARY" in data
            if not stock:
                name = os.path.basename(entry["file"]).split("_", 1)[1]
                with open(os.path.join(IMG, name), "wb") as f:
                    f.write(data)
        images[url] = name
        return name

    out_symptoms = []
    for s in symptoms:
        names = {}
        for key, locale in LANGS.items():
            v = s.get(key) or {}
            if v.get("name"):
                names[locale] = {"n": v["name"].strip(), "r": sorted({r.strip() for r in v.get("related", []) if r and r.strip()})}
        out_symptoms.append({"id": s["_id"], "cats": s.get("symptomCategory", []), "start": s.get("questionIdList", []), "names": names})

    out_questions = {}
    for qid, q in sorted(questions.items()):
        out_questions[qid] = {
            "t": q["type"],
            "q": q["question"].strip(),
            "img": image(q.get("imageUrl")),
            "o": [
                {
                    "k": "m" if o["blockType"] == "mainBlock" else "s",
                    "id": o["blockId"],
                    "next": o.get("questionIdList", []),
                    "n": o["name"].strip(),
                    "img": image(o.get("imageUrl")),
                }
                for o in q["answerOptions"]
            ],
        }

    out_history = {}
    for sid, h in sorted(history.items()):
        out_history[sid] = {
            short: [{"id": o["id"], "n": o["name"].strip()} for o in h.get(key, [])]
            for key, short in (("historyOptionList", "past"), ("drugHistoryOptionList", "drug"), ("familyHistoryOptionList", "family"))
        }

    def dump(name, data):
        with open(os.path.join(OUT, name), "w", encoding="utf-8", newline="\n") as f:
            json.dump(data, f, ensure_ascii=False, separators=(",", ":"))

    dump("symptoms.json", out_symptoms)
    dump("questions.json", out_questions)
    dump("history.json", out_history)
    kept = sorted(n for n in images.values() if n)
    print(f"symptoms {len(out_symptoms)}, questions {len(out_questions)}, history sets {len(out_history)}")
    print(f"images referenced {len(images)}, copied {len(kept)}, excluded {len(images) - len(kept)}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    main(sys.argv[1])
