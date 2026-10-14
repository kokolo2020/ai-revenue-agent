/* V2.1 strict paid-opportunity shortlist. Discovery is read-only; payments unverified. */
(()=>{
"use strict";
const API="https://api.github.com/search/issues";
const queries=['is:issue is:open in:title bounty "$"','is:issue is:open in:title reward "$"','is:issue is:open label:bounty "$"'];
const tbody=document.getElementById("opportunities"),status=document.getElementById("scanStatus"),button=document.getElementById("refreshScan");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const safeUrl=u=>/^https:\/\/github\.com\/[^/]+\/[^/]+\/issues\/\d+$/.test(u)?u:"#";
function payout(j){
 const title=j.title||"",body=(j.body||"").slice(0,6000);
 // Reward must be explicitly framed as a bounty in issue title or within a reward phrase in body.
 const titleMatch=title.match(/(?:\[?bounty\]?|\[?reward\]?|paid task)[^\n]{0,45}?(?:\$|USD\s*)(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)/i);
 const bodyMatch=body.match(/(?:bounty|reward|payment|payout|compensation)\s*(?:amount|of|:|=|-)?\s*(?:\$|USD\s*)(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)/i);
 const m=titleMatch||bodyMatch;
 if(!m)return null;
 const n=Number(m[1].replace(/,/g,""));
 return n>=5&&n<=100000?n:null;
}
function qualify(j){
 if(!j||j.state!=="open"||j.pull_request||safeUrl(j.html_url)==="#")return null;
 if(j.assignee||j.assignees?.length)return null; // Assigned work is not openly available.
 const money=payout(j);if(money===null)return null;
 const content=((j.title||"")+" "+(j.body||"")).toLowerCase();
 if(/(?:already|fully)\s+(?:claimed|paid|completed)|bounty\s+(?:closed|cancelled)|no longer available|do not apply/i.test(content))return null;
 const age=(Date.now()-Date.parse(j.updated_at||0))/86400000;
 const explicit=/\b(bounty|reward|paid task)\b/i.test(j.title||"");
 const labeled=j.labels?.some(l=>/\b(bounty|paid|reward)\b/i.test(l.name||""));
 const score=Math.min(100,(explicit?40:20)+(labeled?20:0)+(age<=7?20:age<=30?10:0)+(/\b(fix|test|docs|documentation|script|python|typescript|javascript)\b/i.test(j.title||"")?10:0)+(money>=50?10:5));
 return {...j,money,score};
}
function render(jobs,partial){
 const eligible=jobs.map(qualify).filter(Boolean).sort((a,b)=>b.score-a.score||b.money-a.money||new Date(b.updated_at)-new Date(a.updated_at));
 const best=eligible.slice(0,5);
 if(!best.length)tbody.innerHTML='<tr><td colspan="4">No candidates meet the explicit-reward screening rules right now. No verified payable opportunities found.</td></tr>';
 else tbody.innerHTML=best.map(j=>'<tr><td><a target="_blank" rel="noopener noreferrer" href="'+esc(safeUrl(j.html_url))+'">'+esc((j.title||"Untitled").slice(0,110))+'</a><div class="muted">'+esc(j.html_url.split("/").slice(3,5).join("/"))+' · updated '+esc((j.updated_at||"").slice(0,10))+'</div></td><td>$'+esc(j.money.toLocaleString("en-US"))+'<div class="muted">Claimed amount · unverified</div></td><td class="yellow">Rank '+j.score+'/100<br>OPEN ISSUE ONLY</td><td>VERIFY FUNDING, RULES &amp; COMPETITION</td></tr>').join("");
 status.textContent=best.length+" potential paid candidates shown; "+eligible.length+" passed preliminary screening from "+jobs.length+" open GitHub issues. $ amounts are claims in issue text, NOT verified funded bounties. Ranking measures evidence only, not profit or payout probability. No submissions or spending."+(partial?" Some searches failed; shortlist is incomplete.":"");
}
async function run(){
 button.disabled=true;status.textContent="Scanning public GitHub issues for explicit monetary bounties…";
 try{
  const results=await Promise.allSettled(queries.map(async q=>{
   const r=await fetch(API+"?"+new URLSearchParams({q,sort:"updated",order:"desc",per_page:"50"}),{headers:{Accept:"application/vnd.github+json"}});
   if(!r.ok)throw Error("GitHub search HTTP "+r.status);
   return (await r.json()).items||[];
  }));
  const good=results.filter(x=>x.status==="fulfilled");
  if(!good.length)throw Error("API unavailable or rate limited");
  const issues=new Map();
  good.flatMap(x=>x.value).forEach(j=>{if(j?.html_url)issues.set(j.html_url,j);});
  render([...issues.values()],good.length!==results.length);
 }catch(e){
  tbody.innerHTML='<tr><td colspan="4">Live scan unavailable. No fictional jobs displayed.</td></tr>';
  status.textContent="Scan failed: "+String(e.message||e);
 }finally{button.disabled=false;}
}
button.addEventListener("click",run);run();
})();