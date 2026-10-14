/* Public GitHub search. Discover candidates only: no bounty is verified or funded by search results. */
(() => {
"use strict";
const endpoint="https://api.github.com/search/issues";
const searches=['is:issue is:open label:bounty','is:issue is:open "bounty" "$"'];
const tbody=document.getElementById('opportunities');
const status=document.getElementById('scanStatus');
const button=document.getElementById('refreshScan');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=u=>/^https:\/\/github\.com\/[^/]+\/[^/]+\/issues\/\d+$/.test(u)?u:'#';
function reward(body,title){
  const str=(title+' '+body).slice(0,3500);
  const nums=[...str.matchAll(/(?:\$|USD\s*)(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)/gi)].map(m=>Number(m[1].replace(/,/g,''))).filter(x=>x>0&&x<1e6);
  return nums.length?'$'+Math.max(...nums).toLocaleString('en-US')+' (unverified)':'Unknown';
}
async function run(){
  button.disabled=true;status.textContent='Searching public GitHub issues…';
  try{
    const responses=await Promise.all(searches.map(async q=>{
      const u=endpoint+'?'+new URLSearchParams({q,sort:'updated',order:'desc',per_page:'20'});
      const r=await fetch(u,{headers:{Accept:'application/vnd.github+json'}});
      if(!r.ok)throw Error('GitHub search HTTP '+r.status+(r.status===403||r.status===429?' — rate limit may apply':''));
      return (await r.json()).items||[];
    }));
    const unique=new Map();
    responses.flat().forEach(j=>{if(j&&j.state==='open'&&!j.pull_request&&safeUrl(j.html_url)!=='#')unique.set(j.html_url,j)});
    const jobs=[...unique.values()].sort((a,b)=>new Date(b.updated_at)-new Date(a.updated_at)).slice(0,30);
    if(!jobs.length)tbody.innerHTML='<tr><td colspan="4">No matching public issues found. This does not prove there are no bounties.</td></tr>';
    else tbody.innerHTML=jobs.map(j=>'<tr><td><a href="'+esc(safeUrl(j.html_url))+'" target="_blank" rel="noopener noreferrer">'+esc((j.title||'Untitled').slice(0,100))+'</a><div class="muted">GitHub · updated '+esc((j.updated_at||'').slice(0,10))+'</div></td><td>'+esc(reward(j.body||'',j.title||''))+'</td><td class="yellow">OPEN ISSUE ONLY</td><td>VERIFY MANUALLY</td></tr>').join('');
    status.textContent='Showing '+jobs.length+' live public GitHub issue candidates. Amounts, funding, AI rules, payout and competition are NOT verified. No job has been claimed.';
  }catch(e){tbody.innerHTML='<tr><td colspan="4">Live feed unavailable. No cached/demo jobs shown as current.</td></tr>';status.textContent='GitHub feed error: '+String(e.message||e)+'. Please retry later.'}
  finally{button.disabled=false}
}
button.addEventListener('click',run);run();
})();