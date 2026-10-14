"""Evidence-gated recurring-revenue software opportunity evaluator.
Usage: python3 business_research.py opportunities.json
No live discovery, purchase, outreach, or investment is performed.
"""
import json, sys
from urllib.parse import urlparse

FIELDS=("customer_evidence_url","recurring_spend_evidence_url","pain_evidence_url","competitor_evidence_url")
def safe_url(s):
    p=urlparse(str(s or ""))
    return p.scheme=="https" and bool(p.hostname) and not (p.username or p.password)

def evaluate(o):
    if not isinstance(o,dict):
        return {"status":"REJECT","reason":"Invalid record","score":0}
    title=str(o.get("title","")).strip()
    if not title:
        return {"status":"REJECT","reason":"Missing title","score":0}
    missing=[f for f in FIELDS if not safe_url(o.get(f))]
    if missing:
        return {"title":title,"status":"RESEARCH_REQUIRED","score":0,"missing":missing,
                "reason":"Missing public HTTPS evidence; no validated opportunity claimed"}
    # A link is not itself proof. Scores reflect stated assumptions only.
    scores={"pain_severity":25,"recurrence":20,"willingness_to_pay":20,
            "build_feasibility":15,"distribution_access":10,"differentiation":10}
    try:
        points={k:int(o.get(k,0)) for k in scores}
    except (ValueError,TypeError):
        return {"title":title,"status":"REJECT","reason":"Invalid scoring input","score":0}
    if any(not 0<=points[k]<=5 for k in scores):
        return {"title":title,"status":"REJECT","reason":"Scores must be 0–5","score":0}
    score=sum(points[k]*w/5 for k,w in scores.items())
    return {"title":title,"status":"HUMAN_VALIDATION_REQUIRED","score":round(score),
            "reason":"URLs supplied, but evidence and customer willingness to pay still require human verification",
            "evidence_urls":{k:o[k] for k in FIELDS}}

def rank(rows):
    if not isinstance(rows,list):
        raise ValueError("Expected JSON array")
    return sorted((evaluate(o) for o in rows),key=lambda x:x["score"],reverse=True)

if __name__=="__main__":
    if len(sys.argv)!=2: sys.exit("Usage: python3 business_research.py opportunities.json")
    with open(sys.argv[1],encoding="utf-8") as f: data=json.load(f)
    print(json.dumps(rank(data),indent=2))
