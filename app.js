(() => {
  'use strict';
  const DB = window.CM0102_DATA;
  const ROOT = document.getElementById('app-root');
  const SAVE_KEY = 'cm0102_mobile_career_v1';
  if (!DB || !Array.isArray(DB.players) || !ROOT) {
    ROOT.innerHTML = '<main><section class="card"><h2>Kunne ikke laste databasen</h2><p>Kontroller at cm0102_data.js ligger i samme mappe som index.html.</p></section></main>';
    return;
  }

  const clubById = new Map(DB.clubs.map(c => [c[0], c]));
  const playerById = new Map(DB.players.map(p => [p[0], p]));
  const nationById = new Map(DB.nations.map(n => [n[0], n]));
  const leagueById = new Map(DB.leagues.map(l => [l[0], l]));
  const baseRosters = new Map();
  for (const p of DB.players) {
    if (p[5] > 0) {
      if (!baseRosters.has(p[5])) baseRosters.set(p[5], []);
      baseRosters.get(p[5]).push(p[0]);
    }
  }
  const ATTR = Object.fromEntries(DB.attributeKeys.map((k, i) => [k, i]));
  const ATTR_LABELS = {
    crossing:'Innlegg',dribbling:'Dribling',finishing:'Avslutninger',heading:'Heading',longShots:'Langskudd',marking:'Markering',offTheBall:'Bevegelse',passing:'Pasninger',penalties:'Straffer',tackling:'Taklinger',freeKicks:'Frispark',corners:'Hjørnespark',technique:'Teknikk',throwIns:'Kast',aggression:'Aggresjon',anticipation:'Forutsigelse',bravery:'Mot',creativity:'Kreativitet',decisions:'Beslutninger',determination:'Pågangsmot',flair:'Flair',influence:'Påvirkning',positioning:'Posisjonering',teamwork:'Lagspill',workRate:'Arbeidskapasitet',acceleration:'Akselerasjon',agility:'Smidighet',balance:'Balanse',jumping:'Spens',naturalFitness:'Naturlig form',pace:'Fart',stamina:'Utholdenhet',strength:'Styrke',handling:'Feltarbeid',oneOnOnes:'En mot en',reflexes:'Reflekser',consistency:'Jevnhet',importantMatches:'Viktige kamper',injuryProneness:'Skadeutsatthet',dirtiness:'Hardhet',versatility:'Allsidighet',adaptability:'Tilpasning',ambition:'Ambisjoner',loyalty:'Lojalitet',pressure:'Press',professionalism:'Profesjonalitet',sportsmanship:'Sportsånd',temperament:'Temperament'
  };
  const ATTR_GROUPS = [
    ['Teknikk',['crossing','dribbling','finishing','heading','longShots','marking','offTheBall','passing','penalties','tackling','freeKicks','corners','technique','throwIns']],
    ['Mentalitet',['aggression','anticipation','bravery','creativity','decisions','determination','flair','influence','positioning','teamwork','workRate']],
    ['Fysikk',['acceleration','agility','balance','jumping','naturalFitness','pace','stamina','strength']],
    ['Keeperferdigheter',['handling','oneOnOnes','reflexes']],
    ['Personlighet og skjulte egenskaper',['consistency','importantMatches','injuryProneness','dirtiness','versatility','adaptability','ambition','loyalty','pressure','professionalism','sportsmanship','temperament']]
  ];
  const FORMATIONS = {
    '4-4-2':[{r:'ATT',n:2},{r:'MID',n:4},{r:'DEF',n:4},{r:'GK',n:1}],
    '4-3-3':[{r:'ATT',n:3},{r:'MID',n:3},{r:'DEF',n:4},{r:'GK',n:1}],
    '4-2-3-1':[{r:'ATT',n:1},{r:'AM',n:3},{r:'DM',n:2},{r:'DEF',n:4},{r:'GK',n:1}],
    '3-5-2':[{r:'ATT',n:2},{r:'MID',n:3},{r:'WB',n:2},{r:'DEF',n:3},{r:'GK',n:1}],
    '4-5-1':[{r:'ATT',n:1},{r:'MID',n:5},{r:'DEF',n:4},{r:'GK',n:1}],
    '5-3-2':[{r:'ATT',n:2},{r:'MID',n:3},{r:'DEF',n:5},{r:'GK',n:1}]
  };
  const TACTIC_DEFAULT = {formation:'4-4-2',mentality:2,passing:'Blandet',tempo:'Normalt',pressing:'Normalt',width:'Bredt'};
  let career = loadCareer();
  let page = career ? 'overview' : 'start';
  let newGameMode = false;
  let managerName = career?.manager || 'Manager';
  let modal = null;
  let selectedCountry = '';
  let selectedLeague = '';
  let clubSearch = '';
  let playerSearch = '';
  let playerFilter = 'Alle';
  let transferFilter = 'Alle';
  let tableLeague = '';
  let toastTimer = null;

  function loadCareer() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.schema !== 1 || !clubById.has(parsed.clubId)) return null;
      parsed.playerChanges ||= {};
      parsed.playerStats ||= {};
      parsed.clubLeagueChanges ||= {};
      parsed.round ||= 0;
      return parsed;
    } catch (e) { console.warn('Kunne ikke lese lagring', e); return null; }
  }
  function saveCareer() {
    if (!career) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(career)); }
    catch (e) { toast('Lagring feilet – nettleseren kan være full'); }
  }
  function toast(message) {
    const old = document.querySelector('.toast'); if (old) old.remove();
    const el = document.createElement('div'); el.className = 'toast'; el.textContent = message; document.body.appendChild(el);
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.remove(), 2400);
  }
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = n => {
    n = Number(n) || 0;
    if (Math.abs(n) >= 1e6) return `£${(n/1e6).toFixed(n>=1e7?0:1)}m`;
    if (Math.abs(n) >= 1000) return `£${Math.round(n/1000)}k`;
    return `£${Math.round(n)}`;
  };
  const int = n => Math.round(Number(n)||0).toLocaleString('nb-NO');
  const initials = name => String(name||'?').split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();
  const club = id => clubById.get(Number(id));
  const player = id => playerById.get(Number(id));
  const nationName = id => nationById.get(Number(id))?.[1] || 'Ukjent';
  const playerClubId = p => Number(career?.playerChanges?.[p[0]]?.clubId ?? p[5]);
  const playerWage = p => Number(career?.playerChanges?.[p[0]]?.wage ?? p[15] ?? 0);
  const playerValue = p => Number(career?.playerChanges?.[p[0]]?.value ?? p[16] ?? 0);
  const currentSeason = () => Number(career?.season || 2001);
  const playerAge = p => Math.max(15, Number(p[3]||20) + currentSeason() - 2001);
  const clubLeagueId = c => career?.clubLeagueChanges?.[c[0]] ?? c[4];
  const activeClub = () => club(career.clubId);
  const activeLeagueId = () => clubLeagueId(activeClub());
  const activeLeague = () => leagueById.get(activeLeagueId()) || leagueById.get(activeClub()?.[4]);
  const clubRosterIds = clubId => {
    const ids = (baseRosters.get(Number(clubId)) || []).filter(id => playerClubId(player(id)) === Number(clubId));
    for (const [pid, change] of Object.entries(career?.playerChanges || {})) {
      if (Number(change.clubId) === Number(clubId) && !ids.includes(Number(pid))) ids.push(Number(pid));
    }
    return ids;
  };
  const getClubPlayers = clubId => clubRosterIds(clubId).map(player).filter(Boolean);
  const getCountryLeagues = country => DB.leagues.filter(l=>l[2]===country).sort((a,b)=>a[3]-b[3]);
  const getCountryClubs = country => DB.clubs.filter(c=>!c[15] && DB.leagues.some(l=>l[0]===clubLeagueId(c) && l[2]===country));
  const currentDate = () => {
    const d = new Date(2001,7,4 + (career?.round||0)*7);
    d.setFullYear(currentSeason());
    return d.toLocaleDateString('nb-NO',{day:'numeric',month:'short',year:'numeric'});
  };
  const formatDOB = p => p[2] ? new Date(`${p[2]}T12:00:00`).toLocaleDateString('nb-NO',{day:'numeric',month:'short',year:'numeric'}) : 'Ukjent';

  function createSchedule(ids) {
    const teams = ids.slice();
    if (teams.length < 2) return [];
    if (teams.length % 2) teams.push(null);
    const n=teams.length, rounds=n-1, half=n/2, rotation=teams.slice(), first=[];
    for (let r=0;r<rounds;r++) {
      const games=[];
      for (let i=0;i<half;i++) {
        const a=rotation[i], b=rotation[n-1-i];
        if (a!=null && b!=null) games.push({home:r%2===0?a:b,away:r%2===0?b:a,played:false});
      }
      first.push(games);
      rotation.splice(1,0,rotation.pop());
    }
    return first.concat(first.map((games)=>games.map(g=>({home:g.away,away:g.home,played:false}))));
  }
  function initTables(leagues,schedules) {
    const tables={};
    for (const l of leagues) {
      tables[l[0]]={};
      const ids=DB.clubs.filter(c=>!c[15] && clubLeagueId(c)===l[0]).map(c=>c[0]);
      ids.forEach(id=>tables[l[0]][id]={clubId:id,P:0,W:0,D:0,L:0,GF:0,GA:0,PTS:0});
    }
    return tables;
  }
  function newCareer(clubId) {
    try{const previous=localStorage.getItem(SAVE_KEY);if(previous)localStorage.setItem(SAVE_KEY+'_backup_'+Date.now(),previous);}catch(e){}
    const c=club(clubId); const l=leagueById.get(c[4]);
    const leagues=getCountryLeagues(l[2]);
    const schedules={};
    for (const tier of leagues) {
      const ids=DB.clubs.filter(x=>!x[15] && x[4]===tier[0]).map(x=>x[0]);
      schedules[tier[0]]=createSchedule(ids);
    }
    career={schema:1,manager:(managerName.trim()||'Manager'),clubId:Number(clubId),country:l[2],season:2001,round:0,budget:Number(c[10]||0)*1e6,clubLeagueChanges:{},playerChanges:{},playerStats:{},tactic:{...TACTIC_DEFAULT},lineup:[],schedules,tables:initTables(leagues,schedules),lastMatch:null,history:[],createdAt:new Date().toISOString()};
    const xi=bestXI(clubId,career.tactic.formation);
    career.lineup=xi.map(p=>p[0]);
    saveCareer(); page='overview'; render();
  }

  function scoreForPosition(p, role) {
    const s=p[7]||[]; const a=p[13]||[];
    const posScore = role==='GK' ? s[0] : role==='SW' ? s[1] : role==='DEF' ? Math.max(s[2]||0,(s[1]||0)*.78,(s[7]||0)*.55) : role==='DM' ? Math.max(s[3]||0,(s[4]||0)*.62,(s[2]||0)*.4) : role==='MID' ? Math.max(s[4]||0,(s[3]||0)*.72,(s[5]||0)*.55) : role==='AM' ? Math.max(s[5]||0,(s[4]||0)*.7,(s[6]||0)*.35) : role==='WB' ? Math.max(s[7]||0,(s[2]||0)*.72,(s[4]||0)*.48) : Math.max(s[6]||0,(s[5]||0)*.45);
    const engine = role==='GK' ? ((a[ATTR.reflexes]||0)*.23+(a[ATTR.handling]||0)*.20+(a[ATTR.oneOnOnes]||0)*.14+(a[ATTR.positioning]||0)*.13+(a[ATTR.anticipation]||0)*.10+(a[ATTR.agility]||0)*.10+(a[ATTR.concentration]||0)*.1) : ((a[ATTR.passing]||0)*.11+(a[ATTR.technique]||0)*.10+(a[ATTR.decisions]||0)*.10+(a[ATTR.stamina]||0)*.09+(a[ATTR.workRate]||0)*.08+(a[ATTR.teamwork]||0)*.07+(a[ATTR.positioning]||0)*.07+(a[ATTR.tackling]||0)*.08+(a[ATTR.finishing]||0)*.08+(a[ATTR.pace]||0)*.07+(a[ATTR.strength]||0)*.05+(a[ATTR.creativity]||0)*.05+(a[ATTR.offTheBall]||0)*.05);
    return posScore*0.62 + (Number(p[10])||80)/10*0.24 + engine*0.14;
  }
  function bestXI(clubId, formation) {
    const p= getClubPlayers(clubId); const slots=[];
    for (const group of (FORMATIONS[formation]||FORMATIONS['4-4-2'])) for(let i=0;i<group.n;i++) slots.push(group.r);
    const chosen=[];
    const pool=p.slice();
    for (const role of slots) {
      pool.sort((a,b)=>scoreForPosition(b,role)-scoreForPosition(a,role));
      const pick=pool.shift(); if(pick) chosen.push({p:pick,role});
    }
    return chosen.map(x=>x.p);
  }
  function roleLineup(clubId, formation, currentIds) {
    const slots=[];
    for (const group of (FORMATIONS[formation]||FORMATIONS['4-4-2'])) for(let i=0;i<group.n;i++) slots.push(group.r);
    const roster=getClubPlayers(clubId);
    const ordered=[];
    const used=new Set();
    for(let i=0;i<slots.length;i++){
      const role=slots[i];
      const requested=player(currentIds?.[i]);
      let best=requested && playerClubId(requested)===clubId && !used.has(requested[0]) ? requested : null;
      if(!best){
        let bestScore=-Infinity;
        for(const p of roster){if(used.has(p[0]))continue;const sc=scoreForPosition(p,role);if(sc>bestScore){bestScore=sc;best=p;}}
      }
      if(best){used.add(best[0]);ordered.push({p:best,role});}
      else ordered.push({p:null,role});
    }
    return ordered;
  }
  function strengthFromXI(xi) {
    if(!xi.length) return {attack:50,mid:50,defence:50,keeper:50,total:50};
    const vals=xi.map(x=>x.p||x).filter(Boolean);
    const mean=(arr)=>arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:50;
    const a=p=>p[13]||[];
    const attack=mean(vals.map(p=>((a(p)[ATTR.finishing]||5)*.3+(a(p)[ATTR.offTheBall]||5)*.2+(a(p)[ATTR.dribbling]||5)*.12+(a(p)[ATTR.pace]||5)*.15+(a(p)[ATTR.heading]||5)*.08+(a(p)[ATTR.longShots]||5)*.15)));
    const mid=mean(vals.map(p=>((a(p)[ATTR.passing]||5)*.25+(a(p)[ATTR.technique]||5)*.18+(a(p)[ATTR.creativity]||5)*.15+(a(p)[ATTR.decisions]||5)*.13+(a(p)[ATTR.workRate]||5)*.15+(a(p)[ATTR.stamina]||5)*.14)));
    const defence=mean(vals.map(p=>((a(p)[ATTR.tackling]||5)*.22+(a(p)[ATTR.marking]||5)*.22+(a(p)[ATTR.positioning]||5)*.20+(a(p)[ATTR.heading]||5)*.12+(a(p)[ATTR.strength]||5)*.12+(a(p)[ATTR.teamwork]||5)*.12)));
    const gk=vals.find(p=>(p[7]||[])[0]>=8) || vals[0];
    const keeper=(a(gk)[ATTR.reflexes]||5)*.3+(a(gk)[ATTR.handling]||5)*.26+(a(gk)[ATTR.oneOnOnes]||5)*.18+(a(gk)[ATTR.positioning]||5)*.14+(a(gk)[ATTR.anticipation]||5)*.12;
    return {attack,mid,defence,keeper,total:mean(vals.map(p=>(Number(p[10])||80)/10))};
  }
  function bestXIRole(clubId) {
    const ids=bestXI(clubId,'4-4-2');
    return ids.map(p=>({p,role:p[6]}));
  }
  function poisson(lambda) {
    const L=Math.exp(-Math.max(.05,Math.min(5,lambda))); let k=0,p=1;
    do{k++;p*=Math.random();}while(p>L && k<9);
    return k-1;
  }
  function weightedPick(players,role='ATT') {
    const candidates=players.filter(p=>p);
    if(!candidates.length)return null;
    const weights=candidates.map(p=>Math.max(1,scoreForPosition(p,role)+((p[13]?.[ATTR.finishing]||0)*.55)));
    let n=Math.random()*weights.reduce((a,b)=>a+b,0);
    for(let i=0;i<candidates.length;i++){n-=weights[i];if(n<=0)return candidates[i];}
    return candidates[candidates.length-1];
  }
  function getTeamXI(clubId) {
    if(clubId===career.clubId){
      const xi=roleLineup(clubId,career.tactic.formation,career.lineup);
      return xi.filter(x=>x.p).map(x=>x.p);
    }
    return bestXI(clubId,'4-4-2');
  }
  function resultFor(homeId, awayId, isUser=false) {
    const homeXI=getTeamXI(homeId), awayXI=getTeamXI(awayId);
    const hs=strengthFromXI(homeXI), as=strengthFromXI(awayXI);
    const tactic=isUser?career.tactic:null;
    const ment=tactic?({0:-.13,1:-.06,2:0,3:.07,4:.13}[tactic.mentality]||0):0;
    const press = tactic?.pressing === 'Høyt' ? .05 : tactic?.pressing === 'Lavt' ? -.025 : 0;
    const tempo = tactic?.tempo === 'Høyt' ? .045 : tactic?.tempo === 'Lavt' ? -.02 : 0;
    const passing = tactic?.passing === 'Direkte' ? .035 : tactic?.passing === 'Kort' ? -.01 : 0;
    const width = tactic?.width === 'Bredt' ? .018 : tactic?.width === 'Smalt' ? -.008 : 0;
    const homeFactor=1.10;
    const hAttack=hs.attack*.28+hs.mid*.28+hs.total*.44;
    const aAttack=as.attack*.28+as.mid*.28+as.total*.44;
    let homeXG=Math.max(.18,Math.min(3.8,(1.25+(hAttack-as.defence)*.037+(hAttack-as.keeper)*.009+(hs.mid-as.mid)*.012)*homeFactor));
    let awayXG=Math.max(.16,Math.min(3.5,1.05+(aAttack-hs.defence)*.034+(aAttack-hs.keeper)*.009+(as.mid-hs.mid)*.012));
    if(isUser){ if(homeId===career.clubId)homeXG*=1+ment+tempo+press+passing+width; else awayXG*=1+ment+tempo+press+passing+width; }
    const hg=poisson(homeXG), ag=poisson(awayXG);
    const events=[];
    for(let i=0;i<hg;i++){
      const scorer=weightedPick(homeXI,'ATT'); const minute=4+Math.floor(Math.random()*88);
      events.push({minute,side:'home',type:'goal',playerId:scorer?.[0]||null,player:scorer?.[1]||'Ukjent målscorer',club:club(homeId)?.[1]});
    }
    for(let i=0;i<ag;i++){
      const scorer=weightedPick(awayXI,'ATT'); const minute=4+Math.floor(Math.random()*88);
      events.push({minute,side:'away',type:'goal',playerId:scorer?.[0]||null,player:scorer?.[1]||'Ukjent målscorer',club:club(awayId)?.[1]});
    }
    if(Math.random()<.20)events.push({minute:18+Math.floor(Math.random()*65),side:'neutral',type:'chance',player:'',club:''});
    events.sort((a,b)=>a.minute-b.minute);
    return {homeId,awayId,homeGoals:hg,awayGoals:ag,events,homeXI:homeXI.map(p=>p[0]),awayXI:awayXI.map(p=>p[0]),homeXG:Number(homeXG.toFixed(2)),awayXG:Number(awayXG.toFixed(2))};
  }
  function updateTable(leagueId, result) {
    const t=career.tables[leagueId]; if(!t)return;
    const h=t[result.homeId], a=t[result.awayId]; if(!h||!a)return;
    h.P++;a.P++;h.GF+=result.homeGoals;h.GA+=result.awayGoals;a.GF+=result.awayGoals;a.GA+=result.homeGoals;
    if(result.homeGoals>result.awayGoals){h.W++;h.PTS+=3;a.L++;}
    else if(result.homeGoals<result.awayGoals){a.W++;a.PTS+=3;h.L++;}
    else {h.D++;a.D++;h.PTS++;a.PTS++;}
  }
  function recordUserStats(result) {
    const ids=result.homeId===career.clubId?result.homeXI:result.awayXI;
    const goals=result.events.filter(e=>e.type==='goal' && e.side===(result.homeId===career.clubId?'home':'away'));
    for(const id of ids){ career.playerStats[id] ||= {apps:0,goals:0}; career.playerStats[id].apps++; }
    for(const e of goals){
      const p=player(e.playerId);
      if(p){career.playerStats[p[0]] ||= {apps:0,goals:0};career.playerStats[p[0]].goals++;}
    }
  }
  function simulateRound() {
    const leagues=getCountryLeagues(career.country); const userLeague=activeLeagueId();
    let userResult=null; const played=[];
    for(const l of leagues){
      const rounds=career.schedules[l[0]]||[]; const games=rounds[career.round]||[];
      for(const game of games){
        if(game.played)continue;
        const res=resultFor(game.home,game.away,game.home===career.clubId||game.away===career.clubId);
        Object.assign(game,{played:true,homeGoals:res.homeGoals,awayGoals:res.awayGoals});
        updateTable(l[0],res); played.push({...res,leagueId:l[0]});
        if(game.home===career.clubId||game.away===career.clubId){userResult=res;recordUserStats(res);}
      }
    }
    const clubData=activeClub();
    const wages=getClubPlayers(career.clubId).reduce((sum,p)=>sum+playerWage(p),0);
    const leagueTier=activeLeague()?.[3]||2;
    const weeklyTV=leagueTier===1?180000:leagueTier===2?90000:leagueTier===3?45000:30000;
    const gateIncome=userResult && userResult.homeId===career.clubId
      ? Math.round(Math.min(Number(clubData[8]||0),Number(clubData[11]||0)||Number(clubData[8]||0)*.35) * (leagueTier===1?25:leagueTier===2?18:leagueTier===3?14:11) * .78)
      : 0;
    career.budget += weeklyTV + gateIncome - wages;
    career.lastRound={date:currentDate(),fixtures:played.length,userResult,leagueId:userLeague,wages,weeklyTV,gateIncome};
    if(userResult){career.lastMatch={...userResult,date:currentDate(),round:career.round+1,leagueId:userLeague};}
    career.history.push({season:career.season,round:career.round+1,score:userResult?`${club(userResult.homeId)?.[1]} ${userResult.homeGoals}-${userResult.awayGoals} ${club(userResult.awayId)?.[1]}`:'Ingen kamp'});
    career.history=career.history.slice(-80);
    career.round++;
    if(isSeasonComplete()) finishSeason();
    saveCareer(); render();
    toast(userResult?'Runden er ferdig – kampresultatet er klart':'Runden er simulert');
  }
  function isSeasonComplete() {
    return getCountryLeagues(career.country).every(l=>career.round >= (career.schedules[l[0]]||[]).length);
  }
  function finishSeason() {
    const leagues=getCountryLeagues(career.country);
    const oldLeague=activeLeagueId();
    const ranked=Object.fromEntries(leagues.map(l=>[l[0],getSortedTable(l[0])]));
    const awards=[];
    for(let i=0;i<leagues.length-1;i++){
      const upper=leagues[i], lower=leagues[i+1];
      const promoted=(ranked[lower[0]]||[]).slice(0,2).map(x=>x.clubId);
      const relegated=(ranked[upper[0]]||[]).slice(-2).map(x=>x.clubId);
      promoted.forEach(id=>career.clubLeagueChanges[id]=upper[0]);
      relegated.forEach(id=>career.clubLeagueChanges[id]=lower[0]);
      if(promoted.length)awards.push(`${promoted.map(id=>club(id)?.[1]).join(', ')} rykker opp`);
      if(relegated.length)awards.push(`${relegated.map(id=>club(id)?.[1]).join(', ')} rykker ned`);
    }
    const userPos=(ranked[oldLeague]||[]).findIndex(x=>x.clubId===career.clubId)+1;
    const prizePerPlace=(leagueById.get(oldLeague)?.[3]===1?400000:leagueById.get(oldLeague)?.[3]===2?220000:leagueById.get(oldLeague)?.[3]===3?120000:70000);
    career.budget+=Math.max(0,((getSortedTable(oldLeague).length-userPos+1)*prizePerPlace));
    career.history.push({season:career.season,round:'Sesongslutt',score:`Plass ${userPos||'-'} – ${awards.join('; ')}`});
    career.season++;
    career.round=0;
    for(const l of leagues){
      const ids=DB.clubs.filter(c=>!c[15] && clubLeagueId(c)===l[0]).map(c=>c[0]);
      career.schedules[l[0]]=createSchedule(ids);
    }
    career.tables=initTables(leagues,career.schedules);
    const newLeague=activeLeagueId();
    toast(newLeague!==oldLeague?'Sesongen er over – klubben har byttet divisjon!':`Ny sesong ${career.season}/${String(career.season+1).slice(-2)} starter`);
  }
  function getSortedTable(leagueId) {
    const table=career?.tables?.[leagueId]||{};
    return Object.values(table).sort((a,b)=>b.PTS-a.PTS || (b.GF-b.GA)-(a.GF-a.GA) || b.GF-a.GF || (club(a.clubId)?.[1]||'').localeCompare(club(b.clubId)?.[1]||''));
  }
  function clubBadge(c,large=false) {
    if(!c)return '';
    const colours=c[14]||['#27405b','#fff'];
    return `<span class="${large?'hero-crest':'mini-crest'}" style="background:${esc(colours[0])};color:${esc(colours[1])}">${esc(initials(c[2]||c[1]))}</span>`;
  }
  function pageHead(kicker,title,subtitle,action='') {return `<div class="page-head"><div><div class="eyebrow">${esc(kicker)}</div><h1 class="page-title">${esc(title)}</h1>${subtitle?`<p class="page-subtitle">${esc(subtitle)}</p>`:''}</div>${action}</div>`;}
  function stat(label,value,sub='',colour='') {return `<div class="stat"><label>${esc(label)}</label><strong class="${colour}">${esc(value)}</strong>${sub?`<small>${esc(sub)}</small>`:''}</div>`;}
  function cardTitle(title,sub='') {return `<div class="section-title"><h2>${esc(title)}</h2>${sub?`<small>${esc(sub)}</small>`:''}</div>`;}
  function playerItem(p,extra='') {
    const cid=playerClubId(p),clubName=club(cid)?.[2]||'Klubbløs';
    return `<div class="player-row" data-player="${p[0]}"><div class="player-avatar">${esc(initials(p[1]))}</div><div class="player-main"><div class="player-name">${esc(p[1])}${cid===0?'<span class="badge green">Fri</span>':''}</div><div class="player-meta">${esc(p[6])} · ${playerAge(p)} år · ${esc(nationName(p[4]))} · ${esc(clubName)}</div></div><div class="player-ratings"><span class="rating-chip">${p[10]}<small>CA</small></span><span class="rating-chip">${p[11]}<small>${p[12]!==null&&p[12]!==undefined?'PA*':'PA'}</small></span></div>${extra}</div>`;
  }
  function nav() {
    const items=[['overview','⌂','Hjem'],['squad','♙','Tropp'],['tactics','⚑','Taktikk'],['fixtures','▦','Kamper'],['table','▤','Tabell'],['transfers','↔','Marked']];
    return `<nav class="nav"><div class="nav-inner">${items.map(([id,icon,label])=>`<button data-page="${id}" class="${page===id?'active':''}"><span class="nav-icon">${icon}</span>${label}</button>`).join('')}</div></nav>`;
  }
  function topbar() {
    const c=activeClub();
    return `<header class="topbar"><div class="brand"><div class="brand-crest">CM</div><div><div class="brand-name">CHAMPIONSHIP MANAGER</div><div class="brand-sub">01 / 02 MOBILE EDITION</div></div></div><div class="top-right"><span class="season-pill">${career.season}/${String(career.season+1).slice(-2)}</span><div class="club-pill">${clubBadge(c)}<b>${esc(c?.[1]||'Klubb')}</b></div><button class="btn ghost small" data-action="new-career" title="Start en ny karriere" aria-label="Start en ny karriere">＋</button></div></header>`;
  }
  function render() {
    if(!career){ ROOT.innerHTML=renderStart(); bind(); return; }
    const body = page==='overview'?renderOverview():page==='squad'?renderSquad():page==='tactics'?renderTactics():page==='fixtures'?renderFixtures():page==='table'?renderTable():page==='transfers'?renderTransfers():renderOverview();
    ROOT.innerHTML=`<div class="app">${topbar()}${nav()}<main>${body}</main></div>${modal?renderModal():''}`;
    bind();
  }
  function renderStart() {
    const countries=[...new Set(DB.leagues.map(l=>l[2]))].sort((a,b)=>a.localeCompare(b));
    if(!selectedCountry)selectedCountry=countries.includes('England')?'England':countries[0];
    const leagues=getCountryLeagues(selectedCountry); if(!selectedLeague||!leagues.some(l=>l[0]===selectedLeague))selectedLeague=leagues[0]?.[0]||'';
    const teams=DB.clubs.filter(c=>!c[15]&&c[4]===selectedLeague).filter(c=>!clubSearch||c[1].toLowerCase().includes(clubSearch.toLowerCase()));
    let resume=null; try { resume=localStorage.getItem(SAVE_KEY); } catch(e) {}
    return `<main class="start-wrap"><div class="start-logo"><div class="brand-crest">CM</div><h1>CHAMPIONSHIP MANAGER</h1><p>2001 / 2002 · MOBILE EDITION</p></div><section class="start-card"><div class="eyebrow">En ny fotballverden begynner</div><h2>Velg din klubb</h2><p>Start i juli 2001 med den originale spillerbasen fra CM 01/02. Velg land, divisjon og klubb. Alle registrerte spillere har med seg sine opprinnelige attributter.</p><div class="field" style="margin-bottom:12px"><label>Managerens navn</label><input id="manager-name" maxlength="32" placeholder="Skriv navnet ditt" value="${esc(managerName)}"></div><div class="field-grid"><div class="field"><label>Land</label><select id="country-select">${countries.map(n=>`<option ${n===selectedCountry?'selected':''}>${esc(n)}</option>`).join('')}</select></div><div class="field"><label>Divisjon</label><select id="league-select">${leagues.map(l=>`<option value="${l[0]}" ${l[0]===selectedLeague?'selected':''}>${esc(l[1])} · ${l[4]} lag</option>`).join('')}</select></div></div><div class="field" style="margin-top:12px"><label>Søk etter klubb</label><input id="club-search" placeholder="Skriv klubbnavn …" value="${esc(clubSearch)}"></div><div style="margin-top:12px;max-height:310px;overflow:auto">${teams.slice(0,100).map(c=>`<div class="club-choice">${clubBadge(c)}<div class="grow"><b>${esc(c[1])}</b><div class="tiny muted">${esc(c[7])} · ${int(c[8])} plasser · Rep. ${c[9]}</div></div><button class="btn primary small" data-start-club="${c[0]}">Velg</button></div>`).join('')||'<div class="empty">Ingen klubber matcher søket.</div>'}</div><div class="start-actions">${resume?'<button class="btn primary" data-action="resume-career">Fortsett forrige karriere</button>':''}<button class="btn ghost" data-action="import-save">Importer karriere</button><button class="btn ghost" data-action="about">Om utgaven</button></div><input id="import-file" type="file" accept="application/json,.json" hidden></section><p class="start-foot">33 spillbare divisjoner · 597 klubber · 36 284 spillere<br>Original database: 2001/02 · Offline lagring på enheten</p></main>`;
  }
  function renderOverview() {
    const c=activeClub(),l=activeLeague(),roster=getClubPlayers(career.clubId),table=getSortedTable(activeLeagueId()),pos=table.findIndex(x=>x.clubId===career.clubId)+1;
    const schedule=career.schedules[activeLeagueId()]||[]; const next=(schedule[career.round]||[]).find(g=>g.home===career.clubId||g.away===career.clubId);
    const opponent=next?club(next.home===career.clubId?next.away:next.home):null;
    const upcoming=career.lastMatch?career.lastMatch:null;
    const nextBtn=career.round>=schedule.length?'<button class="btn primary" data-action="new-season" disabled>Sesongen ferdig</button>':'<button class="btn primary" data-action="next-round">Spill neste runde&nbsp; →</button>';
    return `${pageHead('Sesongen '+career.season+'/'+String(career.season+1).slice(-2),'Manageroversikt',`${l?.[1]||''} · ${currentDate()}`,nextBtn)}
      <section class="hero"><div class="hero-top">${clubBadge(c,true)}<div><div class="eyebrow">Managerens klubb</div><h1>${esc(c[1])}</h1><p>${esc(career.manager||'Manager')} · ${esc(c[7])} · ${esc(career.country)} · ${esc(l?.[1]||'')}</p></div></div><div class="hero-stats"><div class="hero-stat"><b>${pos||'-'}.</b><span>Ligaplass</span></div><div class="hero-stat"><b>${esc(money(career.budget))}</b><span>Overgangsbudsjett (£)</span></div><div class="hero-stat"><b>${int(roster.length)}</b><span>Spillere i troppen</span></div></div></section>
      <div class="grid cols-4">${stat('Spilt',career.tables[activeLeagueId()]?.[career.clubId]?.P||0,'Ligakamper')}${stat('Poeng',career.tables[activeLeagueId()]?.[career.clubId]?.PTS||0,'I ligaen','gold')}${stat('Målforskjell',`${(career.tables[activeLeagueId()]?.[career.clubId]?.GF||0)-(career.tables[activeLeagueId()]?.[career.clubId]?.GA||0)>0?'+':''}${(career.tables[activeLeagueId()]?.[career.clubId]?.GF||0)-(career.tables[activeLeagueId()]?.[career.clubId]?.GA||0)}`,'Mål')}${stat('Lønn/uke',money(roster.reduce((s,p)=>s+playerWage(p),0)),'Hele troppen')}</div>
      <div class="dashboard-columns" style="margin-top:12px"><section class="card">${cardTitle('Neste kamp',career.round+1<=schedule.length?`Runde ${career.round+1}`:'Ingen flere kamper')} ${next?`<div class="next-match"><div class="team-block">${clubBadge(c)}<span class="name">${esc(c[1])}</span></div><div><div class="fixture-vs">${next.home===career.clubId?'HJEMME':'BORTE'}</div><div class="fixture-date">${currentDate()}</div></div><div class="team-block right">${clubBadge(opponent)}<span class="name">${esc(opponent?.[1]||'Ukjent')}</span></div></div><div class="divider"></div><p class="small muted">${esc(opponent?.[1]||'Motstander')} · Stadion: ${esc(next.home===career.clubId?c[7]:opponent?.[7]||'')}</p>`:'<div class="empty">Ingen kamp i denne runden. Sesongen er ferdig eller klubben har spillefri.</div>'}<div class="actions" style="margin-top:12px">${nextBtn}<button class="btn" data-page="tactics">Laguttak og taktikk</button></div></section>
      <section class="card">${cardTitle('Siste kamp',upcoming?'Kampreferat':'Ingen kamper spilt')}${upcoming?renderLastMatchCompact(upcoming):'<div class="empty">Kampresultatene vises her etter første runde.</div>'}<div class="divider"></div>${career.lastMatch?'<button class="btn small" data-action="last-report">Se kampreferat</button>':''}<div class="divider"></div>${cardTitle('Klubbstatus')}<div class="row between small"><span class="muted">Stadion</span><b>${esc(c[7])}</b></div><div class="row between small" style="margin-top:8px"><span class="muted">Kapasitet</span><b>${int(c[8])}</b></div><div class="row between small" style="margin-top:8px"><span class="muted">Gj.sn. tilskuere</span><b>${int(c[11])}</b></div></section></div>
      <section class="card" style="margin-top:12px">${cardTitle('Siste ligastilling',l?.[1]||'')}${renderTableHTML(activeLeagueId(),true)}<div class="actions" style="margin-top:10px"><button class="btn" data-page="table">Se hele tabellen</button><button class="btn" data-action="export-save">Eksporter karriere</button></div></section>`;
  }
  function renderLastMatchCompact(m) {
    const h=club(m.homeId),a=club(m.awayId);
    return `<div class="match-head"><div class="club">${esc(h?.[1]||'Hjemme')}</div><div class="score">${m.homeGoals}–${m.awayGoals}</div><div class="club">${esc(a?.[1]||'Borte')}</div></div><div class="tiny muted" style="margin-top:8px">${esc(m.date)} · ${m.events.filter(e=>e.type==='goal').length} mål</div>`;
  }
  function renderSquad() {
    const c=activeClub(); let ps=getClubPlayers(career.clubId).sort((a,b)=>b[10]-a[10]);
    if(playerSearch)ps=ps.filter(p=>p[1].toLowerCase().includes(playerSearch.toLowerCase()));
    if(playerFilter!=='Alle')ps=ps.filter(p=>p[6]===playerFilter);
    const total=getClubPlayers(career.clubId).length;
    return `${pageHead('Spillerstall',c[1],`${total} spillere · snittalder ${(getClubPlayers(career.clubId).reduce((s,p)=>s+playerAge(p),0)/Math.max(1,total)).toFixed(1)} år`)}<section class="card"><div class="filterbar"><input id="player-search" placeholder="Søk på spillernavn …" value="${esc(playerSearch)}"><select class="control" id="player-filter" style="max-width:130px">${['Alle','GK','DEF','MID','ATT'].map(x=>`<option ${x===playerFilter?'selected':''}>${x}</option>`).join('')}</select></div><div class="player-list">${ps.map(p=>playerItem(p)).join('')||'<div class="empty">Ingen spillere funnet.</div>'}</div></section><section class="card" style="margin-top:12px">${cardTitle('Lagstatistikk')}<div class="grid cols-3">${stat('Snitt CA',Math.round(ps.reduce((s,p)=>s+p[10],0)/Math.max(1,ps.length)),'Spillerstall')}${stat('Snittalder',(getClubPlayers(career.clubId).reduce((s,p)=>s+playerAge(p),0)/Math.max(1,total)).toFixed(1),'År')}${stat('Lønn/uke',money(getClubPlayers(career.clubId).reduce((s,p)=>s+playerWage(p),0)),'Total')}</div></section>`;
  }
  function renderTactics() {
    const c=activeClub(),xi=roleLineup(career.clubId,career.tactic.formation,career.lineup);
    const pitchGroups=[xi.filter(x=>['ATT','AM'].includes(x.role)),xi.filter(x=>['MID','DM'].includes(x.role)),xi.filter(x=>['DEF','WB','SW'].includes(x.role)),xi.filter(x=>x.role==='GK')];
    const pitch=pitchGroups.map(group=>`<div class="pitch-half">${group.map(x=>`<div class="shirt"><span>${esc(x.p?x.p[14]||'•':'?')}</span><small>${esc(x.p?x.p[1].split(' ').slice(-1)[0]:'Ledig')}</small></div>`).join('')}</div>`).join('');
    const slotSelect=xi.map((x,i)=>`<div class="slot-row"><span class="slot-role">${x.role} ${i+1}</span><select data-lineup-slot="${i}"><option value="">Velg spiller</option>${getClubPlayers(career.clubId).sort((a,b)=>scoreForPosition(b,x.role)-scoreForPosition(a,x.role)).map(p=>`<option value="${p[0]}" ${x.p?.[0]===p[0]?'selected':''}>${esc(p[1])} (${Math.round(scoreForPosition(p,x.role))})</option>`).join('')}</select></div>`).join('');
    return `${pageHead('Kampforberedelser','Taktikk og laguttak','Velg formasjon, spillestil og startellever')}<section class="card"><div class="field-grid"><div class="field"><label>Formasjon</label><select id="formation">${Object.keys(FORMATIONS).map(f=>`<option ${f===career.tactic.formation?'selected':''}>${f}</option>`).join('')}</select></div><div class="field"><label>Mentalitet</label><select data-tactic="mentality">${[['0','Defensiv'],['1','Forsiktig'],['2','Balansert'],['3','Offensiv'],['4','Svært offensiv']].map(([v,t])=>`<option value="${v}" ${Number(v)===career.tactic.mentality?'selected':''}>${t}</option>`).join('')}</select></div><div class="field"><label>Pasningsstil</label><select data-tactic="passing">${['Kort','Blandet','Direkte'].map(x=>`<option ${x===career.tactic.passing?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Tempo</label><select data-tactic="tempo">${['Lavt','Normalt','Høyt'].map(x=>`<option ${x===career.tactic.tempo?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Press</label><select data-tactic="pressing">${['Lavt','Normalt','Høyt'].map(x=>`<option ${x===career.tactic.pressing?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Spillbredde</label><select data-tactic="width">${['Smalt','Normalt','Bredt'].map(x=>`<option ${x===career.tactic.width?'selected':''}>${x}</option>`).join('')}</select></div></div><div class="actions" style="margin-top:12px"><button class="btn" data-action="auto-xi">Velg beste ellever</button><button class="btn primary" data-action="save-tactics">Lagre taktikk</button></div></section><div class="pitch-layout" style="margin-top:12px"><section class="card">${cardTitle('Formasjonskart',career.tactic.formation)}<div class="pitch"><div class="pitch-lines"></div>${pitch}</div><div class="tiny muted" style="margin-top:8px">Plasseringene er skjematiske. Velg spillere i listen ved siden av.</div></section><section class="card">${cardTitle('Startellever',`${xi.filter(x=>x.p).length}/11 valgt`)}<div class="slot-list">${slotSelect}</div></section></div>`;
  }
  function renderFixtures() {
    const leagueId=activeLeagueId(),sched=career.schedules[leagueId]||[];
    const rounds=sched.map((games,i)=>({i,games}));
    return `${pageHead('Terminliste','Kamper og resultater',`${activeLeague()?.[1]||''} · ${career.season}/${String(career.season+1).slice(-2)}`,`<button class="btn primary" data-action="next-round">Spill neste runde</button>`)}<section class="card">${rounds.map(({i,games})=>`<div class="modal-section"><div class="row between"><b>Runde ${i+1}</b><small class="muted">${new Date(career.season,7,4+i*7).toLocaleDateString('nb-NO',{day:'numeric',month:'short'})}</small></div><div class="fixture-list">${games.map(g=>`<div class="fixture-row"><div class="fixture-round">${g.played?'Ferdig':`R${i+1}`}</div><div class="fixture-teams">${esc(club(g.home)?.[1]||'')}<div class="versus">mot ${esc(club(g.away)?.[1]||'')}</div></div><div class="fixture-result">${g.played?`${g.homeGoals}–${g.awayGoals}`:'–'}</div></div>`).join('')}</div></div>`).join('')}</section>`;
  }
  function renderTableHTML(leagueId,compact=false) {
    const rows=getSortedTable(leagueId); const userLeague=activeLeagueId();
    return `<div class="table-wrap"><table><thead><tr><th>#</th><th>Klubb</th><th>K</th><th>V</th><th>U</th><th>T</th><th>MF</th><th>P</th></tr></thead><tbody>${rows.slice(0,compact?10:rows.length).map((r,i)=>`<tr class="${r.clubId===career.clubId?'user-row':''} ${i<2?'promote':''} ${i>=rows.length-2?'relegate':''}"><td><span class="pos-cell">${i+1}</span></td><td class="team-name-cell">${esc(club(r.clubId)?.[2]||'Ukjent')}</td><td>${r.P}</td><td>${r.W}</td><td>${r.D}</td><td>${r.L}</td><td>${r.GF-r.GA>0?'+':''}${r.GF-r.GA}</td><td><b>${r.PTS}</b></td></tr>`).join('')}</tbody></table></div><p class="table-note">Grønn markering viser opprykksplass. Rød markering viser nedrykksplass. Den faktiske opp-/nedrykksregelen er to lag ved sesongslutt.</p>`;
  }
  function renderTable() {
    const leagues=getCountryLeagues(career.country); if(!tableLeague||!leagues.some(l=>l[0]===tableLeague))tableLeague=activeLeagueId();
    return `${pageHead('Ligaspill','Tabell og divisjoner','Følg utviklingen i alle divisjonene i landet')}<section class="card"><div class="field"><label>Velg divisjon</label><select id="table-league">${leagues.map(l=>`<option value="${l[0]}" ${l[0]===tableLeague?'selected':''}>${esc(l[1])}</option>`).join('')}</select></div><div style="margin-top:12px">${renderTableHTML(tableLeague)}</div></section>`;
  }
  function renderTransfers() {
    let list=DB.players.filter(p=>{
      const cid=playerClubId(p); if(cid===career.clubId)return false;
      if(transferFilter==='Fri')return cid===0;
      if(transferFilter==='Angrep')return ['ATT','MID'].includes(p[6]);
      if(transferFilter==='Forsvar')return ['DEF','GK'].includes(p[6]);
      return cid===0 || p[10]>=105;
    });
    if(playerSearch)list=list.filter(p=>p[1].toLowerCase().includes(playerSearch.toLowerCase()));
    list.sort((a,b)=> (playerClubId(a)===0?0:1)-(playerClubId(b)===0?0:1) || b[10]-a[10]);
    const count=list.length; list=list.slice(0,140);
    return `${pageHead('Overgangsmarked','Spillerjakt',`Budsjett: ${money(career.budget)} · ${int(count)} treff`)}<section class="card"><div class="filterbar"><input id="player-search" placeholder="Søk spiller …" value="${esc(playerSearch)}"><select class="control" id="transfer-filter" style="max-width:130px">${['Alle','Fri','Angrep','Forsvar'].map(x=>`<option ${x===transferFilter?'selected':''}>${x}</option>`).join('')}</select></div><div class="notice" style="margin-bottom:12px">Spillere i den historiske databasen er tilgjengelige for søk. Klubber kan avslå bud; overgangssum og lønn belastes klubbens økonomi.</div><div class="player-list">${list.map(p=>{
      const cid=playerClubId(p),from=club(cid),value=playerValue(p),wage=playerWage(p);
      return `<div class="player-row" data-player="${p[0]}"><div class="player-avatar">${esc(initials(p[1]))}</div><div class="player-main"><div class="player-name">${esc(p[1])}${cid===0?'<span class="badge green">Fri</span>':''}</div><div class="player-meta">${esc(p[6])} · ${playerAge(p)} år · ${esc(from?.[2]||'Klubbløs')} · CA ${p[10]}</div></div><div class="player-ratings"><span class="rating-chip">${money(value)}<small>Verdi</small></span></div><button class="btn small" data-sign="${p[0]}">${cid===0?'Signér':'Bud'}</button></div>`;
    }).join('')||'<div class="empty">Ingen spillere funnet.</div>'}</div>${count>140?`<p class="table-note">Viser de 140 mest relevante treffene. Bruk søk for å finne flere.</p>`:''}</section>`;
  }
  function renderModal() {
    if(!modal)return '';
    if(modal.type==='player'){
      const p=player(modal.id); if(!p)return '';
      const stats=career.playerStats[p[0]]||{}; const sections=ATTR_GROUPS.map(([title,keys])=>`<div class="attr-group"><h3>${title}</h3><div class="attr-grid">${keys.map(key=>{const val=p[13][ATTR[key]]??0;return `<div class="attr-row"><div>${esc(ATTR_LABELS[key]||key)}<div class="attr-bar"><i style="width:${Math.min(100,Math.max(0,val*5))}%"></i></div></div><strong>${val||'–'}</strong></div>`}).join('')}</div></div>`).join('');
      return `<div class="overlay" data-close-modal><section class="modal" role="dialog"><div class="modal-head"><div><div class="eyebrow">Spillerprofil · ${esc(p[6])}</div><h2>${esc(p[1])}</h2><div class="small muted">${esc(club(playerClubId(p))?.[1]||'Klubbløs')} · ${esc(nationName(p[4]))}</div></div><button class="modal-close" data-action="close-modal">×</button></div><div class="grid cols-4">${stat('CA',p[10],'Nåværende')}${stat(p[12]!==null&&p[12]!==undefined?'PA*':'PA',p[11],p[12]!==null&&p[12]!==undefined?'Estimert potensial':'Potensial','gold')}${stat('Alder',playerAge(p),'År')}${stat('Kamper',stats.apps||0,'Denne karrieren')}</div><div class="grid cols-3" style="margin-top:8px">${stat('Verdi',money(playerValue(p)),'Estimert')}${stat('Lønn/uke',money(playerWage(p)),'Lønn')}${stat('Mål',stats.goals||0,'Karriere')}</div><div class="modal-section"><div class="grid cols-3"><div><span class="tiny muted">Født</span><b style="display:block">${formatDOB(p)}</b></div><div><span class="tiny muted">Fot</span><b style="display:block">${p[9]==='B'?'Begge':p[9]==='L'?'Venstre':'Høyre'}</b></div><div><span class="tiny muted">Draktnr.</span><b style="display:block">${p[14]||'–'}</b></div><div><span class="tiny muted">Landskamper</span><b style="display:block">${p[18]||0}</b></div><div><span class="tiny muted">Landslagsmål</span><b style="display:block">${p[19]||0}</b></div><div><span class="tiny muted">Kontrakt</span><b style="display:block">${p[17]||'–'}</b></div></div></div>${sections}${p[12]!==null&&p[12]!==undefined?'<p class="table-note">* Denne spilleren hadde en skjult/ukjent PA-verdi i kildedataene. Potensialet er estimert for å gjøre spilleren spillbar i karrieremodellen.</p>':''}</section></div>`;
    }
    if(modal.type==='match'){
      const m=modal.data,h=club(m.homeId),a=club(m.awayId);
      return `<div class="overlay" data-close-modal><section class="modal" role="dialog"><div class="modal-head"><div><div class="eyebrow">Kampreferat · ${esc(m.date||currentDate())}</div><h2>${esc(h?.[1]||'Hjemmelag')} mot ${esc(a?.[1]||'Bortelag')}</h2></div><button class="modal-close" data-action="close-modal">×</button></div>${renderLastMatchCompact(m)}<div class="modal-section">${cardTitle('Kampens hendelser')}<div class="event-list">${m.events.map(e=>`<div class="event ${e.type==='goal'?'goal':''}"><span class="minute">${e.minute}'</span><span class="event-icon">${e.type==='goal'?'⚽':'◉'}</span><span>${e.type==='goal'?`MÅL – ${esc(e.player)} (${esc(e.club)})`:'En god mulighet i kampen.'}</span></div>`).join('')||'<div class="empty">Ingen store hendelser.</div>'}</div></div><div class="modal-section"><div class="grid cols-2">${stat('Forventede mål',m.homeXG,'Hjemmelag')}${stat('Forventede mål',m.awayXG,'Bortelag')}</div></div></section></div>`;
    }
    return '';
  }

  function openPlayer(id){modal={type:'player',id:Number(id)};render();}
  function bidOrSign(id) {
    const p=player(id); if(!p)return;
    const current=playerClubId(p),value=playerValue(p),wage=playerWage(p);
    if(current===career.clubId){toast('Spilleren er allerede i klubben');return;}
    const cost=current===0?0:Math.max(100000,value*1.15);
    const signingWage=Math.max(wage,Math.round((p[10]||80)*650));
    if(career.budget<cost){toast('Klubben har ikke nok penger til dette budet');return;}
    const from=club(current);
    const accepted=current===0 || (club(current)?.[9]||0) < (activeClub()?.[9]||0)+7 || Math.random() < (career.budget > cost * 1.8 ? .65 : .3);
    if(!accepted){career.budget-=Math.min(50000,cost*.02);saveCareer();toast(`${from?.[1]||'Klubben'} avslo budet`);return;}
    career.budget-=cost;
    career.playerChanges[p[0]]={...(career.playerChanges[p[0]]||{}),clubId:career.clubId,wage:signingWage,value:Math.max(value,0)};
    saveCareer();render();toast(`${p[1]} er klar for ${activeClub()[1]}!`);
  }
  function bind() {
    ROOT.querySelectorAll('[data-page]').forEach(el=>el.addEventListener('click',()=>{page=el.dataset.page;playerSearch='';render();}));
    ROOT.querySelectorAll('[data-start-club]').forEach(el=>el.addEventListener('click',()=>newCareer(Number(el.dataset.startClub))));
    ROOT.querySelectorAll('[data-player]').forEach(el=>el.addEventListener('click',()=>openPlayer(el.dataset.player)));
    ROOT.querySelectorAll('[data-sign]').forEach(el=>el.addEventListener('click',ev=>{ev.stopPropagation();bidOrSign(Number(el.dataset.sign));}));
    ROOT.querySelectorAll('[data-action]').forEach(el=>el.addEventListener('click',()=>{
      const action=el.dataset.action;
      if(action==='next-round')simulateRound();
      else if(action==='auto-xi'){career.lineup=bestXI(career.clubId,career.tactic.formation).map(p=>p[0]);saveCareer();render();toast('Beste ellever er valgt');}
      else if(action==='save-tactics'){saveCareer();toast('Taktikken er lagret');}
      else if(action==='close-modal'){modal=null;render();}
      else if(action==='new-season')toast('Sesongen starter automatisk når alle kamper er spilt');
      else if(action==='last-report'){modal={type:'match',data:career.lastMatch};render();}
      else if(action==='new-career'){if(confirm('Start en ny karriere? Den nye karrieren vil erstatte den aktive lagringen. Eksporter først dersom du vil ta vare på en separat kopi.')){career=null;newGameMode=true;managerName='Manager';page='start';selectedCountry='England';selectedLeague='';clubSearch='';render();}}
      else if(action==='resume-career'){career=loadCareer();managerName=career?.manager||'Manager';newGameMode=false;page='overview';render();}
      else if(action==='export-save')exportSave();
      else if(action==='import-save')document.getElementById('import-file')?.click();
      else if(action==='about')showAbout();
    }));
    ROOT.querySelectorAll('[data-close-modal]').forEach(el=>el.addEventListener('click',ev=>{if(ev.target===el){modal=null;render();}}));
    const manager=document.getElementById('manager-name');if(manager)manager.addEventListener('input',e=>{managerName=e.target.value;});
    const country=document.getElementById('country-select'); if(country)country.addEventListener('change',e=>{selectedCountry=e.target.value;selectedLeague='';clubSearch='';render();});
    const league=document.getElementById('league-select');if(league)league.addEventListener('change',e=>{selectedLeague=e.target.value;render();});
    const clubInput=document.getElementById('club-search');if(clubInput)clubInput.addEventListener('input',e=>{clubSearch=e.target.value;const pos=e.target.selectionStart;render();const n=document.getElementById('club-search');n.focus();n.setSelectionRange(pos,pos);});
    const search=document.getElementById('player-search');if(search)search.addEventListener('input',e=>{playerSearch=e.target.value;const pos=e.target.selectionStart;render();const n=document.getElementById('player-search');if(n){n.focus();n.setSelectionRange(pos,pos);}});
    const pf=document.getElementById('player-filter');if(pf)pf.addEventListener('change',e=>{playerFilter=e.target.value;render();});
    const tf=document.getElementById('transfer-filter');if(tf)tf.addEventListener('change',e=>{transferFilter=e.target.value;render();});
    const tl=document.getElementById('table-league');if(tl)tl.addEventListener('change',e=>{tableLeague=e.target.value;render();});
    const formation=document.getElementById('formation');if(formation)formation.addEventListener('change',e=>{career.tactic.formation=e.target.value;career.lineup=bestXI(career.clubId,e.target.value).map(p=>p[0]);saveCareer();render();});
    ROOT.querySelectorAll('[data-tactic]').forEach(el=>el.addEventListener('change',()=>{const key=el.dataset.tactic;career.tactic[key]=key==='mentality'?Number(el.value):el.value;saveCareer();}));
    ROOT.querySelectorAll('[data-lineup-slot]').forEach(el=>el.addEventListener('change',()=>{const idx=Number(el.dataset.lineupSlot),arr=roleLineup(career.clubId,career.tactic.formation,career.lineup);if(el.value){arr[idx].p=player(el.value);}else arr[idx].p=null;const ids=arr.map(x=>x.p?.[0] ?? null);career.lineup=ids;saveCareer();render();}));
    const importFile=document.getElementById('import-file');if(importFile)importFile.addEventListener('change',importSave);
  }
  function exportSave() {
    if(!career)return;
    const blob=new Blob([JSON.stringify(career,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`cm0102-${career.clubId}-${career.season}.json`;a.click();URL.revokeObjectURL(url);toast('Karrieren er eksportert');
  }
  function importSave(event) {
    const file=event?.target?.files?.[0]; if(!file)return;
    const reader=new FileReader();reader.onload=()=>{try{const obj=JSON.parse(reader.result);if(obj.schema!==1||!clubById.has(obj.clubId))throw new Error('Ugyldig karrierefil');career=obj;career.playerChanges||={};career.playerStats||={};managerName=career.manager||'Manager';saveCareer();page='overview';render();toast('Karrieren er importert');}catch(e){toast('Kunne ikke importere filen: '+e.message);}};reader.readAsText(file);
  }
  function showAbout() {
    modal={type:'about'};
    // Keep the introductory panel simple so the data and prototype limits are clear.
    ROOT.insertAdjacentHTML('beforeend',`<div class="overlay" data-close-modal><section class="modal"><div class="modal-head"><div><div class="eyebrow">CM 01/02 Mobile Edition</div><h2>Om denne utgaven</h2></div><button class="modal-close" data-action="close-modal">×</button></div><p class="small muted">En mobiltilpasset managerprototype basert på spiller-, klubb- og ligaopplysninger fra den opplastede 2001/02-databasen.</p><div class="grid cols-2">${stat('Spillbare ligaer','33','Valgte divisjoner')}${stat('Klubber','597','Spillbare klubber')}${stat('Spillere','36 284','Inkludert frie spillere')}${stat('Sesong','2001/02','Original tidsperiode')}</div><div class="notice" style="margin-top:12px">Dette er en selvstendig mobilutgave/prototype – ikke en fullstendig gjenskaping av alle funksjonene i originalspillet. Datafilene er hentet fra arkivet du lastet opp. Ikke publiser databasen eller denne samlepakken offentlig uten nødvendige rettigheter.</div></section></div>`);
    ROOT.querySelectorAll('[data-action="close-modal"]').forEach(el=>el.addEventListener('click',()=>{modal=null;render();}));
    ROOT.querySelectorAll('[data-close-modal]').forEach(el=>el.addEventListener('click',ev=>{if(ev.target===el){modal=null;render();}}));
  }

  if(career){
    const leagues=getCountryLeagues(career.country);
    if(!career.schedules || !career.tables || !career.schedules[activeLeagueId()]){
      const schedules={};for(const l of leagues){const ids=DB.clubs.filter(c=>!c[15]&&clubLeagueId(c)===l[0]).map(c=>c[0]);schedules[l[0]]=createSchedule(ids);}career.schedules=schedules;career.tables=initTables(leagues,schedules);career.round=0;career.lineup=bestXI(career.clubId,career.tactic?.formation||'4-4-2').map(p=>p[0]);saveCareer();
    }
    career.tactic ||= {...TACTIC_DEFAULT};
  }
  render();
})();
