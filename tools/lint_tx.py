#!/usr/bin/env python3
"""Lint article text in tools/tx_content.py for the banned writing shapes."""
import re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from tx_content import PAGES
RULES = [
 (r"[—–]", "dash"),
 (r"(^|[.!?]\s+)(That|This|These) (is|are|was)\b", "demonstrative gloss"),
 (r",\s*not\b", "tailing negation"),
 (r"\bnot only\b|\bnot just\b", "not only"),
 (r"\bis not\.\s|\bdoes not\.\s", "split contrast"),
 (r"\b(crucial|vital|pivotal|robust|seamless|leverage|delve|underscore|tapestry|testament|showcase|holistic|nuanced|myriad|realm|elevate|vibrant|boasts|nestled|stands as|serves as|cutting-edge|revolutionary|game-chang)\w*", "AI vocabulary"),
 (r"\b(simply|merely|truly|actually|essentially|fundamentally|arguably|basically)\b", "filler adverb"),
 (r"(Think of it as|In other words|The whole point|At its core|The real question|which is what|In plain terms)", "tic"),
 (r",\s*so (nothing|it still)|nothing is (cut|lost)|loses nothing", "reassurance"),
 (r",\s*(ensuring|allowing|highlighting|reflecting|meaning)\b", "gerund tail"),
 (r"\b(guarantee|best in|number one|No\. 1|miracle|permanent results|100 ?%)", "ad-law wording"),
 (r"\b(semaglutide|tirzepatide|liraglutide|ozempic|wegovy|mounjaro|saxenda|GLP-1|GIP)\b", "drug name"),
]
hits = 0
for p in PAGES:
    parts = list(p["hook"]) + [p["body"], p["desc"], p["ft"], *p["note"], p["pair"][4]] + [q + " " + a for q, a in p["faq"]] + [v for k, v in p["protocol"]]
    text = re.sub(r"<[^>]+>", " ", " ".join(parts))
    for pat, name in RULES:
        for m in re.finditer(pat, text, flags=re.I if name != "demonstrative gloss" else 0):
            hits += 1
            a = max(0, m.start() - 60)
            print(f"{p['slug']:18} {name:20} ...{text[a:m.end()+40].strip()}...")
print(f"{hits} hits")
