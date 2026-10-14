/* V2 opportunity intelligence: public GitHub issues only. No payout verification, bids, or spending. */
(()=>{
"use strict";
const endpoint="https://api.github.com/search/issues";
const queries=['is:issue is:open label:bounty','is:issue is:open "bounty" "$"','is:issue is:open "reward" "USD"'];
const tbody=document.getElementById("opportunities"),status=document.getElementById("scanStatus"),button=document.getElementById("refreshScan");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const safeUrl=u=>/^https:\/\/github\.com\/[^/]+\/[^/]+\/issues\/\d+$/.test(u)?u:"#";
const getMoney=(title,body)=>{
  const text=(title+" "+(body||"").slice(0,5000));
  const matches=[...text.matchAll(/(?:\$|USD\s*)(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)/gi)].map(m=>+m[1].replace(/,/g,"")).filter(n=>n>0&&n<=100000);
  return matches.length?Math.max(...matches):null;
};
const score=(j,usd)=>{
  let s=0; const content=((j.title||"")+" "+(j.body||"")).toLowerCase();
  if(usd!==null)s+=25;
  if(/bounty|reward|paid issue/.test(content))s+=20;
  if(/\bfix\b|bug|documentation|test|python|typescript|javascript/.test(content))s+=15;
  if(j.labels?.some(l=>/bounty|reward/i.test(l.name||"")))s+=20;
  if(j.assignee)s-=10;
  if(/closed|claimed|paid out|no longer available/.test(content))s-=25;
  const age=(Date.now()-Date.parse(j.updated_at||0))/86400000;
  if(age>=0&&age<=7)s+=20; else if(age>60)s-=15;
  return Math.max(0,Math.min(100,s));
};
function render(jobs){
 const ceiling=500;
 const ranked=jobs.map(j=>{const usd=getMoney(j.title||"",j.body||"");return {...j,usd,rank:score(j,usd)};}).sort((a,b)=>b.rank-a.rank||new Date(b.updated_at)-new Date(a.updated_at)).slice(0,40);
 if(!ranked.length){tbody.innerHTML='<tr><td colspan="4">No candidates found. This does not mean no paid opportunities exist.</td></tr>';return;}
 tbody.innerHTML=ranked.map(j=>'<tr><td><a target="_blank" rel="noopener noreferrer" href="'+esc(safeUrl(j.html_url))+'">'+esc((j.title||"Untitled").slice(0,100))+'</a><div class="muted">'+esc(j.repository_url?.split("/").slice(-2).join("/")||"GitHub")+' · updated '+esc((j.updated_at||"").slice(0,10))+'</div></td><td>'+esc(j.usd===null?"Unknown":"$"+j.usd.toLocaleString("en-US")+" (unverified)")+'</td><td class="yellow">Rank '+j.rank+'/100 · FUNDING UNKNOWN</td><td>'+esc(j.usd===null?"VERIFY REWARD":j.rank>=60?"PRIORITY REVIEW":"MANUAL REVIEW")+'</td></tr>').join("");
 status.textContent=ranked.length+" public candidates ranked by evidence and recency. Ranking is NOT probability of payment or profit. $"+ceiling+" evaluation ceiling is a cost limit, not a bounty-value cutoff. Verify sponsor, terms, competition and payout manually.";
}
async function run(){
 button.disabled=true; status.textContent="Searching public GitHub issues…";
 try{
  const results=await Promise.allSettled(queries.map(async q=>{
   const url=endpoint+"?"+new URLSearchParams({q,sort:"updated",order:"desc",per_page:"30"});
   const r=await fetch(url,{headers:{Accept:"application/vnd.github+json"}});
   if(!r.ok)throw Error("GitHub HTTP "+r.status);
   return (await r.json()).items||[];
  }));
  const good=results.filter(r=>r.status==="fulfilled"),bad=results.filter(r=>r.status==="rejected");
  if(!good.length)throw Error("GitHub API unavailable or rate-limited");
  const unique=new Map();
  good.flatMap(r=>r.value).forEach(j=>{if(j?.state==="open"&&!j.pull_request&&safeUrl(j.html_url)!=="#")unique.set(j.html_url,j);});
  render([...unique.values()]);
  if(bad.length)status.textContent+=" "+bad.length+" search source(s) unavailable; partial results.";
 }catch(e){tbody.innerHTML='<tr><td colspan="4">Live feed unavailable. No demo listings shown as current.</td></tr>';status.textContent="Live scan failed: "+String(e.message||e);}
 finally{button.disabled=false;}
}
button.addEventListener("click",run);run();
})();