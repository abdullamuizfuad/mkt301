/* MKT Arena engine: automatic concept check for typed answers.
   Each key idea (a question's good chips) becomes weighted terms taken from the chip text, widened with
   synonyms (SYN) and, where the chip wording is a formula or label, hand-tuned patterns (OVER).
   checkAnswer(q,text,names) → {found,missing,struct,band,xp,words}. Runs in the browser and in Node (tests, marking tools). */
const CONCEPT=(()=>{
  const STOP=new Set(('a an the and or but so to of in on at by for with from as is are be was were it its this that these those their there they them '+
    'each every one two three both any all more most less than then into about over under per not no can could should would will may might must '+
    'do does did done use using used make makes made get gets got very also only just own same other others such which who whom what when where why how '+
    'define definition explain evaluate example decision recommend recommendation option options clear clearly answer case point points idea ideas key '+
    'firm company business companies firms '+CRS.conceptStop).split(' '));
  /* common marketing words count half: they appear in almost every answer */
  const SOFT=new Set('brand market marketing price pricing product products customer customers country countries local sale sales cost costs'.split(' ').map(w=>stem(w)));
  /* synonyms: stem → alternative stems or phrases (phrases are matched as whole word sequences) */
  const SYN=Object.assign({},CRS.conceptSyn,{
    cheap:['low','cheaper','inexpens','afford','budget'],expens:['costly','high','premium','pricey'],afford:['cheap','low'],
    halal:['islam','muslim','halaal'],muslim:['islam','halal'],islam:['muslim','halal'],
    control:['oversight','manag','in charge','say over'],risk:['danger','threat','exposure','risky','uncertain'],
    recipe:['formula'],copy:['imitat','steal','replicat','clone','copycat'],confidential:['secret','nda','non disclosure','non-disclosure'],
    exclusiv:['only','sole'],tourist:['visitor','traveller','traveler','holidaymaker'],famil:['parent','household','kid','children'],
    currenc:['exchange rate','forex','fx','yen','baht','euro','ringgit','dollar'],duty:['tariff','tax','levy'],tariff:['duty','tax'],
    relationship:['trust','personal','rapport','relation'],visit:['meet','face to face','in person','trip'],
    influenc:['creator','instagram','tiktok','influencer'],social:['instagram','tiktok','online','facebook'],
    franchis:['franchise','franchisee','franchisor'],licens:['license','licence','licensing'],
    standard:['same','uniform','consistent','global','identical'],standardiz:['same','uniform','standard','global'],
    adapt:['local','tailor','change','adjust','customiz','modif','fit'],consistent:['same','uniform','standard'],
    dilut:['weaken','damage','cheapen','confus','harm'],premium:['luxury','high end','upmarket','expens','exclusive'],
    awareness:['visibility','known','recogniz','attention'],loyal:['repeat','return','come back','regular'],
    discount:['offer','deal','promotion','free','bogo'],margin:['profit','markup','mark up'],profit:['margin','earn'],
    speed:['fast','quick','day','time','quickly'],fast:['quick','speed','rapid'],certif:['certificate','accredit','approved','certified'],
    regulat:['rule','law','legal','requirement','standard'],rule:['regulat','law','legal'],law:['legal','rule','regulat'],
    grey:['gray','parallel'],research:['survey','study','data','visit'],survey:['research','questionnaire','poll'],
    segment:['group','target'],target:['focus','aim','segment'],position:['image','perception','stand for'],
    competit:['rival','competitor','compete'],rival:['competit','competitor'],income:['wealth','rich','wealthy','afford','salary'],
    export:['ship','abroad','overseas'],decision:['decid','choice','choos'],trust:['relationship','confidence'],
    sustain:['sustainab','eco','green','pole and line','pole-and-line'],health:['healthy','protein','nutrition'],
    student:['young','youth','universit','college'],young:['youth','student','teen'],culture:['cultur','custom','tradition','value'],
    privacy:['data protection','personal data','gdpr'],context:['indirect','direct','implicit','explicit'],
    stereotyp:['generaliz','assumption','assume'],penetration:['more of the same','existing market'],diversif:['new product new market','unrelated'],
    escalation:['escalat','build up','add up','adds up'],intermediar:['middleman','distributor','agent','wholesaler'],
    freight:['shipping','transport','sea','air'],shipment:['consignment','container','load','order'],
    takeaway:['take away','grab and go','to go'],evidence:['data','figure','percent','%','show'],
    ownership:['owned','own','wholly'],venture:['partner','jv','joint'],shared:['share','split','both']
  });
  /* hand-tuned patterns for chips whose wording is a formula, a label or very short: per course, in course-config.js */
  const OVER=CRS.conceptOver||{};
  /* how many key ideas make a complete answer, where the question asks for fewer than the chips cover (e.g. "choose ONE country") */
  const NEED=CRS.conceptNeed||{};
  function norm(t){return String(t||'').toLowerCase().replace(/[’']/g,'').replace(/(\d)\.(\d)/g,'$1_$2').replace(/[^a-z0-9_%]+/g,' ').trim()}
  function stem(w){w=String(w).toLowerCase();if(/^\d/.test(w))return w;
    w=w.replace(/(is)(e|ed|es|ing|ation|ations)$/,'iz$2').replace(/^grey/,'gray').replace(/licenc/,'licens').replace(/colour/,'color');
    if(w.length>4&&w.endsWith('ies'))w=w.slice(0,-3)+'y';else if(/(ss|us|is)$/.test(w)){}else if(w.length>3&&/(sh|ch|x|z)es$/.test(w))w=w.slice(0,-2);else if(w.length>3&&w.endsWith('s'))w=w.slice(0,-1);
    if(w.length>5&&w.endsWith('ing'))w=w.slice(0,-3);else if(w.length>4&&w.endsWith('ed'))w=w.slice(0,-2);else if(w.length>5&&w.endsWith('ly'))w=w.slice(0,-2);
    if(w.length>4&&/([bdgklmnprt])\1$/.test(w))w=w.slice(0,-1);
    if(w.length>6&&/(ation|ment|ness|ity|ive|al|er|e|y)$/.test(w))w=w.replace(/(ation|ment|ness|ity|ive|al|er|e|y)$/,'');
    return w}
  const toks=t=>norm(t).split(' ').filter(Boolean),stems=t=>toks(t).map(stem);
  /* has the answer (array of stems) got this sequence of stems? */
  function hasSeq(A,seq){if(seq.length===1){const s=seq[0];return A.some(a=>a===s||(s.length>=5&&a.startsWith(s))||(a.length>=5&&s.startsWith(a)))}
    for(let i=0;i+seq.length<=A.length;i++)if(seq.every((s,j)=>A[i+j]===s||(s.length>=5&&A[i+j].startsWith(s))))return true;return false}
  /* key idea → terms: [{alts:[[stems...],...], w}] */
  const cache=new Map();
  function terms(chipText){if(cache.has(chipText))return cache.get(chipText);
    const body=chipText.replace(/^\s*(define|explain|evaluate|example|decision|apply|adapt|option|response|risk|difference|recommend\w*)\s*[A-Za-z ]{0,14}:\s*/i,m=>/^\s*(risk|adapt|option|response|difference)/i.test(m)?m.replace(':',' '):'');
    const out=[];for(const w of toks(body)){if(STOP.has(w)||(w.length<3&&!/^\d/.test(w))||/^\d$/.test(w))continue;const s=stem(w);if(out.some(o=>o.s===s))continue;
      const alts=[[s]].concat((SYN[s]||Object.entries(SYN).find(([k])=>s.startsWith(k)&&k.length>=4)?.[1]||[]).map(a=>stems(a)));
      out.push({s,alts,w:SOFT.has(s)?.5:1})}
    cache.set(chipText,out);return out}
  /* is a key idea covered? weighted share of its terms present in the answer */
  function covered(A,q,j){const ov=OVER[q.id]&&OVER[q.id][j];if(ov&&ov.some(p=>p.every(x=>hasSeq(A,stems(x)))))return true;
    const T=terms(q.chips[j].t);if(!T.length)return false;const tot=T.reduce((t,x)=>t+x.w,0);
    const got=T.reduce((t,x)=>t+(x.alts.some(a=>a.length&&hasSeq(A,a))?x.w:0),0),hard=T.filter(x=>x.w===1).length;
    const need=tot<=1?tot:tot<=2.5?Math.min(tot,1.5):Math.max(1.5,tot*.42);
    return got>=need-1e-9&&(hard===0||T.some(x=>x.w===1&&x.alts.some(a=>a.length&&hasSeq(A,a))))}
  const RX={def:/\b(means|meaning|refers? to|is defined as|is when|is where|is the (process|practice|price|act|idea|strategy|way)|are the|describes?|is a|is an|is called|known as)\b/i,
    ex:/\b(for example|for instance|e\.?g\.?|such as|like when|in the case of|an example)\b/i,
    ev:/\b(however|but|although|though|whereas|while|on the other hand|therefore|thus|so overall|in contrast|despite|weakness|downside|drawback|limitation|risk|trade-?off|advantage|disadvantage)\b/i,
    rec:/\b(recommend|recommendation|should|best option|the best|i would|i suggest|suggest|overall|in conclusion|my choice|i choose|i would choose|better option)\b/i};
  function struct(text,names){const s={def:RX.def.test(text),ex:RX.ex.test(text),ev:RX.ev.test(text),rec:RX.rec.test(text)};
    if(!s.ex&&names&&names.length){const n=norm(text);s.ex=names.some(x=>{const k=norm(x);return k.length>2&&(' '+n+' ').includes(' '+k+' ')})}return s}
  const words=t=>(String(t||'').trim().match(/\S+/g)||[]).length;
  function checkAnswer(q,text,names){const A=stems(text),w=words(text),good=q.chips.map((c,j)=>c.g?j:-1).filter(j=>j>=0);
    const found=good.filter(j=>covered(A,q,j)),missing=good.filter(j=>!found.includes(j)),s=struct(text,names),sc=Object.values(s).filter(Boolean).length;
    const need=Math.min(good.length,NEED[q.id]||Math.max(3,Math.ceil(good.length*.8))),k=good.length?Math.min(1,found.length/need):0;let band=Math.floor(1+3*k+.5*sc);
    if(!found.length)band=sc>=3&&w>=60?1:0;if(w<20)band=Math.min(band,1);else if(w<40)band=Math.min(band,2);band=Math.max(0,Math.min(6,band));
    const xp=w>=40&&found.length?Math.min(32,10+3*found.length+2*sc):0;
    return {found,missing,struct:s,band,xp,words:w,need}}
  return {checkAnswer,terms,stem,stems,norm,struct,words}})();
if(typeof module!=='undefined')module.exports=CONCEPT;
