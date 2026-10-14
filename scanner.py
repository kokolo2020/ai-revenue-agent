"""Read-only multi-platform candidate triage. Does not authenticate, spend or submit.
Usage: python3 scanner.py examples.json
Input: JSON list of candidate objects. This imports candidate exports; it does NOT crawl live feeds.
"""
import argparse,json,sys
from urllib.parse import urlparse

REQUIRED=("funding_verified","issue_open_verified","no_competing_accepted_pr","ai_assistance_permitted","payout_eligible","scope_feasible")
def decision(job, cap=500):
    reward=float(job.get("reward_usd",0)); fee=float(job.get("platform_fee_pct",0)); cost=float(job.get("estimated_cost_usd",0)); chance=float(job.get("estimated_win_probability",0))
    if not 0<=fee<=100 or not 0<=chance<=1 or reward<0 or cost<0 or cap<0:
        return {"decision":"REJECT","reason":"Invalid inputs"}
    if any(job.get(flag) is False for flag in REQUIRED):
        return {"decision":"REJECT","reason":"A mandatory eligibility check failed"}
    if any(job.get(flag) is not True for flag in REQUIRED):
        return {"decision":"HOLD","reason":"Mandatory checks not independently verified"}
    if cost>cap:
        return {"decision":"REJECT","reason":"Estimated cost exceeds experiment cap"}
    net_if_won=reward*(1-fee/100)-cost
    expected=reward*(1-fee/100)*chance-cost
    if expected<=0 or net_if_won<=0:
        return {"decision":"REJECT","reason":"Non-positive estimated economics","net_if_won_usd":round(net_if_won,2),"expected_net_usd":round(expected,2)}
    return {"decision":"HUMAN_REVIEW_REQUIRED","reason":"Positive estimate, not authorization to spend or submit","net_if_won_usd":round(net_if_won,2),"expected_net_usd":round(expected,2)}
def scan(jobs):
    seen=set(); out=[]
    for j in jobs:
        url=str(j.get("url",""))
        p=urlparse(url)
        if p.scheme!="https" or not p.hostname or p.username or p.password:
            out.append({"job":j.get("title"),"decision":"REJECT","reason":"Invalid/non-HTTPS URL"});continue
        normalized=url.rstrip("/").lower()
        if normalized in seen:continue
        seen.add(normalized)
        out.append({"job":j.get("title"),"platform":j.get("platform"),"url":url,**decision(j)})
    return out
def main():
    parser=argparse.ArgumentParser();parser.add_argument("input",help="JSON array of candidate exports");args=parser.parse_args()
    with open(args.input,encoding="utf-8") as f: jobs=json.load(f)
    if not isinstance(jobs,list):sys.exit("Input must be a JSON list")
    print(json.dumps(scan(jobs),indent=2))
if __name__=="__main__":main()
