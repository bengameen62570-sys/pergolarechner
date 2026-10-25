/* ───────────── gemeinsam: Navigation ───────────── */
(function(){
  const b = document.querySelector('.burger'), nav = document.getElementById('nav');
  if(!b || !nav) return;
  const set = o => { nav.classList.toggle('open', o); b.setAttribute('aria-expanded', o ? 'true' : 'false'); };
  b.addEventListener('click', () => set(!nav.classList.contains('open')));
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => set(false)));
  document.addEventListener('keydown', e => { if(e.key === 'Escape') set(false); });
  document.addEventListener('click', e => { if(!nav.contains(e.target) && !b.contains(e.target)) set(false); });
})();

/* ───────────── Zeichnung ───────────── */
/* Pergola in leichter Isometrie. W,P in mm; ang = Lamellenwinkel; opts = {led, zip, wall, glass:{front,left,right,back}, panels:{...}}.
   Die Lamellen sind Profile mit Dicke, drehen um ihre Achse; bei Öffnung legen sich Lichtstreifen auf den Boden. */
function pergolaSVG(W, P, ang, opts, box){
  const {led=false, zip=false, wall=true, glass={}, panels={}, stack=0} = opts;   // stack: Anteil der Tiefe, auf dem die Lamellen zusammengeschoben stehen (Slide)
  const VW = box.w, VH = box.h, dims = !!box.dims;
  const kx = 0.56, ky = -0.26;
  const bottom = dims ? 64 : 26;
  const FM = 0.6;                                                          // Terrassenplatte: 60 cm Rand um die Pergola
  const fitFor = (Wm, Pm) => Math.min((VW-60)/(Wm/1000 + 2*FM + Pm/1000*kx), (VH-bottom-26)/(1.72 + (Pm/1000 + FM)*(-ky)));
  let s = fitFor(W, P);
  if(box.ref) s = Math.min(s, 1.5*fitFor(box.ref.W, box.ref.P));   // Rechner: gleicher Maßstab für kleine und mittlere Größen, damit Breite und Tiefe sichtbar wachsen
  const w = W/1000*s, d = P/1000*s, H = 2.4*s*0.6, post = 0.15*s, fr = 0.22*s;
  const dx = d*kx, dy = d*ky;
  const fm = FM*s;                                                         // Rand der Platte in px
  const contentH = 1.66*s + (d + fm)*0.26 + fm*0.35;                       // Krone + Stützen + Tiefe + Platte
  const ox = (VW - (w + dx + fm*kx))/2 + 6, oy = dims ? VH - bottom : Math.min(VH - bottom, (VH + contentH)/2 - fm*0.35);
  const g = [];
  const C = { f:'#2b3631', fL:'#3f4d46', fD:'#1a2320', lam:'#61716a', lamL:'#7b8b83', lamD:'#4a5751', floor:'#e6e1d6', wall:'#27322d', light:'#c9a227' };
  const rad = ang*Math.PI/180, open = Math.sin(rad), cosA = Math.cos(rad);
  const NL = Math.max(4, Math.round(P/230));
  const topY = oy - H, cy = topY - fr;
  const glassTop = cy + fr;                                // Unterkante der Rinne = Oberkante Glas
  // Glaswand zwischen zwei Bodenpunkten; n = Elemente
  const pane = (x1,y1,x2,y2,n,op) => {
    const h = y1 - glassTop;                               // Höhe am ersten Punkt (gleich für beide, da parallel)
    const t1 = y1 - h, t2 = y2 - h;
    g.push(`<polygon points="${x1},${t1} ${x2},${t2} ${x2},${y2} ${x1},${y1}" fill="#dfeef3" opacity="${op}"/>`);
    g.push(`<polygon points="${x1},${t1} ${x2},${t2} ${x2},${y2} ${x1},${y1}" fill="url(#gl)"/>`);
    for(let i=1;i<n;i++){ const t=i/n, x=x1+(x2-x1)*t, yb=y1+(y2-y1)*t; g.push(`<line x1="${x}" y1="${yb-h}" x2="${x}" y2="${yb}" stroke="#c8dde3" stroke-width="1" opacity=".7"/>`); }
    g.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#9aa9a3" stroke-width="2"/>`);
    g.push(`<line x1="${x1}" y1="${t1}" x2="${x2}" y2="${t2}" stroke="#9aa9a3" stroke-width="1.2" opacity=".8"/>`);
  };
  // Terrassenplatte: wächst mit der Pergola (60 cm Rand, vorne etwas mehr)
  { const fx = fm, fy = fm*0.35, bdx = wall ? 0 : fm*kx, bdy = wall ? 0 : fm*ky;
    g.push(`<polygon points="${ox-fx},${oy+fy} ${ox+w+fx},${oy+fy} ${ox+w+fx+dx+bdx},${oy+fy+dy+bdy} ${ox-fx+dx+bdx},${oy+fy+dy+bdy}" fill="${C.floor}"/>`);
    g.push(`<polygon points="${ox-fx},${oy+fy} ${ox+w+fx},${oy+fy} ${ox+w+fx},${oy+fy+4} ${ox-fx},${oy+fy+4}" fill="#d6d0c3"/>`); }
  // Hauswand
  if(wall){ const bx=ox+dx, by=oy+dy, fx=fm, fy=fm*0.35; g.push(`<polygon points="${bx-fx-6},${by+fy} ${bx+w+fx+6},${by+fy} ${bx+w+fx+6},${by-H-fr-100} ${bx-fx-6},${by-H-fr-100}" fill="${C.wall}"/>`); g.push(`<line x1="${bx-fx-6}" y1="${by+fy}" x2="${bx+w+fx+6}" y2="${by+fy}" stroke="#1a2320" stroke-width="1.5"/>`); }
  // Glas hinten (nur freistehend)
  if(!wall && glass.back) pane(ox+dx+post, oy+dy, ox+w+dx-post, oy+dy, panels.back||4, .22);
  // Licht am Boden
  if(stack>0){ const t0=0, t1=1-stack; const x1=ox+dx*t0+post, y1=oy+dy*t0+24, x2=ox+dx*t1+post, y2=oy+dy*t1+24;
    g.push(`<polygon points="${x1},${y1} ${x1+w-2*post},${y1} ${x2+w-2*post},${y2} ${x2},${y2}" fill="${C.light}" opacity=".2"/>`); }
  else if(open>0.1){ const sw=(d/NL)*open*0.62;
    for(let i=0;i<NL;i++){ const t=(i+0.5)/NL, x1=ox+dx*t+post, y1=oy+dy*t+24;
      g.push(`<polygon points="${x1},${y1} ${x1+w-2*post},${y1} ${x1+w-2*post+sw*kx},${y1+sw*ky} ${x1+sw*kx},${y1+sw*ky}" fill="${C.light}" opacity="${0.1+0.22*open}"/>`); } }
  // hintere Stützen
  if(!wall){ [[ox+dx,oy+dy],[ox+w+dx-post,oy+dy]].forEach(([x,y])=>g.push(`<rect x="${x}" y="${y-H}" width="${post}" height="${H}" fill="${C.fL}"/>`)); }
  // Glas links (von innen gesehen, daher zarter)
  if(glass.left) pane(ox+post/2, oy, ox+post/2+dx, oy+dy, panels.left||4, .14);
  // ---- Krone: Rahmen ----
  const inW = w-2*fr*0.6, inD = d-2*fr*0.6;
  const idx=inD*kx, idy=inD*ky; const ixo=ox+fr*0.6+fr*0.6*kx, iyo=cy+fr*0.6*ky;
  g.push(`<polygon points="${ox},${cy} ${ox+w},${cy} ${ox+w+dx},${cy+dy} ${ox+dx},${cy+dy}" fill="${C.fL}"/>`);
  g.push(`<polygon points="${ixo},${iyo} ${ixo+inW},${iyo} ${ixo+inW+idx},${iyo+idy} ${ixo+idx},${iyo+idy}" fill="${C.fD}"/>`);
  // ---- Lamellen ----
  const pitch = inD/NL, lamW = pitch*0.95, th = 0.045*s;
  for(let i=0;i<NL;i++){
    const t = stack>0 ? (1-stack) + (i+0.5)/NL*stack : (i+0.5)/NL; const ax=ixo+idx*t, ay=iyo+idy*t;
    const pts=[[-lamW/2,-th/2],[lamW/2,-th/2],[lamW/2,th/2],[-lamW/2,th/2]].map(([u,v])=>{
      const ru = u*cosA - v*Math.sin(rad), rv = u*Math.sin(rad) + v*cosA;
      return [ax + ru*kx, ay + ru*ky - rv];
    });
    const L = inW;
    const [p0,p1,p2,p3]=pts;
    const top = `${p0[0]},${p0[1]} ${p0[0]+L},${p0[1]} ${p1[0]+L},${p1[1]} ${p1[0]},${p1[1]}`;
    const front = `${p3[0]},${p3[1]} ${p3[0]+L},${p3[1]} ${p0[0]+L},${p0[1]} ${p0[0]},${p0[1]}`;
    const side = pts.map(q=>`${q[0]+L},${q[1]}`).join(' ');
    g.push(`<polygon points="${front}" fill="${C.lamD}"/>`);
    g.push(`<polygon points="${top}" fill="${i%2?C.lam:C.lamL}" stroke="${C.fD}" stroke-width=".5"/>`);
    g.push(`<polygon points="${side}" fill="${C.lamD}" stroke="${C.fD}" stroke-width=".5"/>`);
  }
  // vordere und rechte Rahmenfläche
  g.push(`<rect x="${ox}" y="${cy}" width="${w}" height="${fr}" fill="${C.f}"/>`);
  g.push(`<polygon points="${ox+w},${cy} ${ox+w+dx},${cy+dy} ${ox+w+dx},${cy+dy+fr} ${ox+w},${cy+fr}" fill="${C.fD}"/>`);
  // LED
  if(led){ g.push(`<rect x="${ox}" y="${cy+fr}" width="${w}" height="${H*0.55}" fill="url(#glow)"/>`);
    g.push(`<line x1="${ox+2}" y1="${cy+fr}" x2="${ox+w-2}" y2="${cy+fr}" stroke="${C.light}" stroke-width="3" stroke-linecap="round"/>`);
    g.push(`<line x1="${ox+w}" y1="${cy+fr}" x2="${ox+w+dx}" y2="${cy+dy+fr}" stroke="${C.light}" stroke-width="2.5" stroke-linecap="round" opacity=".85"/>`); }
  // Glas rechts
  if(glass.right) pane(ox+w-post/2, oy, ox+w-post/2+dx, oy+dy, panels.right||4, .22);
  // Zip-Screen rechts
  if(zip){ const zx=ox+w-post*0.3, zy=cy+fr, h=H*0.72;
    g.push(`<polygon points="${zx},${zy} ${zx+dx},${zy+dy} ${zx+dx},${zy+dy+h} ${zx},${zy+h}" fill="#aab3ac" opacity=".5"/>`);
    g.push(`<line x1="${zx}" y1="${zy+h}" x2="${zx+dx}" y2="${zy+dy+h}" stroke="${C.f}" stroke-width="2.5"/>`); }
  // Glas vorne
  if(glass.front) pane(ox+post, oy, ox+w-post, oy, panels.front||4, .22);
  // vordere Stützen
  [[ox,oy],[ox+w-post,oy]].forEach(([x,y])=>g.push(`<rect x="${x}" y="${y-H}" width="${post}" height="${H}" fill="${C.f}"/>`));
  const f = v => (v/1000).toFixed(2).replace('.',',')+' m';
  if(dims){
    g.push(`<line x1="${ox}" y1="${oy+48}" x2="${ox+w}" y2="${oy+48}" stroke="#8a9a8e" stroke-width="1"/><text x="${ox+w/2}" y="${oy+64}" text-anchor="middle" font-family="Instrument Sans,system-ui" font-size="13" fill="#8a9a8e">${f(W)}</text>`);
    g.push(`<line x1="${ox+w+44}" y1="${oy+30}" x2="${ox+w+44+dx}" y2="${oy+30+dy}" stroke="#8a9a8e" stroke-width="1"/><text x="${ox+w+44+dx/2+14}" y="${oy+30+dy/2+4}" font-family="Instrument Sans,system-ui" font-size="13" fill="#8a9a8e">${f(P)}</text>`);
  }
  return `<defs><linearGradient id="glow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9a227" stop-opacity=".32"/><stop offset="1" stop-color="#c9a227" stop-opacity="0"/></linearGradient>`
       + `<linearGradient id="gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".5" stop-color="#fff" stop-opacity=".04"/><stop offset="1" stop-color="#fff" stop-opacity=".16"/></linearGradient></defs>`
       + g.join('');
}

/* ───────────── statische Abbildungen (Modellseite) ─────────────
   <svg data-fig data-w="4500" data-p="3500" data-a="50" data-free data-led data-zip data-glass="front,right" data-stack=".3"> */
document.querySelectorAll('svg[data-fig]').forEach(el => {
  const d = el.dataset; const glass = {}; (d.glass||'').split(',').filter(Boolean).forEach(k => glass[k] = true);
  el.setAttribute('viewBox', '0 0 640 400');
  el.innerHTML = pergolaSVG(+d.w||4500, +d.p||3500, +d.a||50, { wall: !('free' in d), led: 'led' in d, zip: 'zip' in d, glass, panels: {front:4,right:3,left:3,back:4}, stack: +d.stack||0 }, { w:640, h:400, dims:false });
});

/* ───────────── Hero: Lamellen drehen sich einmal ───────────── */
(function(){
  const svg = document.getElementById('hero-svg'); if(!svg) return;
  const draw = ang => { svg.innerHTML = pergolaSVG(4500, 3200, ang, {wall:true}, {w:640,h:430,dims:false}); };
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){ draw(60); return; }
  let t0=null; const dur=3400;
  function step(ts){ if(!t0) t0=ts; const k=Math.min(1,(ts-t0)/dur); const e=1-Math.pow(1-k,3); draw(5+e*65); if(k<1) requestAnimationFrame(step); }
  requestAnimationFrame(step);
})();

/* ───────────── Rechner ───────────── */
(function(){
  const $ = id => document.getElementById(id);
  if(!$('rechner')) return;
  /* Preislogik: Katalog netto × Händlerrabatt × Aufschlag, dann MwSt. Lieferung und Montage: individuell. */
  const DISC = 0.67, MARKUP = 1.30, VAT = 1.20;
  const OPT = { led: 1228, zip: 1100, sens: 325, heat: 1360 };          // Katalog netto; zip ≈ 1 Screen 2500×2600 inkl. Motor
  const GLASS_H = 2600;                                                  // Glashöhe unter der Rinne
  const LIM = { s400:{w:4500,p:7000}, s500:{w:5000,p:8000}, slide:{w:4000,p:7000} };
  const NAME = { s400:'Classic', s500:'Grand', slide:'Slide' };
  const SIDE = { front:'vorne', left:'links', right:'rechts', back:'hinten' };
  const fmt = n => n.toLocaleString('de-DE') + ' €';
  const m = v => (v/1000).toFixed(2).replace('.',',');
  function montage(w, p){ const m2 = w*p/1e6; return 1500 + Math.max(0, m2-10)*90; }
  function lookup(model, mount, w, p){
    const M = PRICES[model]; const T = M[mount]; if(!T) return null;
    const wi = M.widths.findIndex(x => x >= w); if(wi < 0) return null;
    const pk = Object.keys(T).map(Number).sort((a,b)=>a-b).find(q => q >= p); if(pk == null) return null;
    return T[pk][wi];
  }
  /* Glaswand: günstigste Elementzahl, die die Länge abdeckt (einseitig öffnend, 8 mm) */
  function glassWall(len){
    let best = null;
    for(const k of ['s3','s4','s5','s6']){ const G = GLASS[k]; const i = G.widths.findIndex(x => x >= len); if(i < 0) continue;
      const v = G.rows[GLASS_H][i]; if(best == null || v < best.v) best = { v, n: +k[1] }; }
    return best;
  }
  const state = () => ({
    model: document.querySelector('.seg [aria-pressed="true"]').dataset.model,
    mount: document.querySelector('.seg2 [aria-pressed="true"]').dataset.mount,
    w: +$('w').value, p: +$('p').value, a: +$('a').value,
    opts: ['led','zip','sens','heat'].filter(k => $('o-'+k).checked),
    sides: ['front','left','right','back'].filter(k => $('g-'+k).checked && !(k==='back' && document.querySelector('.seg2 [aria-pressed="true"]').dataset.mount==='wall'))
  });
  function calc(st){
    const base = lookup(st.model, st.mount, st.w, st.p); if(base == null) return null;
    let net = base*DISC*MARKUP;
    st.opts.forEach(k => { net += OPT[k]*DISC*MARKUP; });
    const panels = {};
    for(const side of st.sides){ const len = (side==='front'||side==='back') ? st.w : st.p; const gw = glassWall(len); if(!gw) return null;
      net += gw.v*DISC*MARKUP; panels[side] = gw.n; }
    return { price: Math.ceil(net*VAT/10)*10, panels };
  }
  function stageBox(){
    const el = $('stage-svg'); const r = el.getBoundingClientRect();
    const dims = r.height >= 380 || r.width === 0;
    const h = r.width ? Math.round(640*r.height/r.width) : 520;
    return { w:640, h: dims ? Math.max(h, 420) : h, dims };
  }
  function drawStage(st, res){
    const box = stageBox(); const el = $('stage-svg');
    el.setAttribute('viewBox', `0 0 ${box.w} ${box.h}`);
    const glass = {}; st.sides.forEach(k => glass[k] = true);
    box.ref = { W: LIM[st.model].w, P: LIM[st.model].p };
    el.innerHTML = pergolaSVG(st.w, st.p, st.a, { led: st.opts.includes('led'), zip: st.opts.includes('zip'), wall: st.mount==='wall', glass, panels: res ? res.panels : {} }, box);
  }
  function setRangeFill(el){ el.style.setProperty('--p', ((el.value-el.min)/(el.max-el.min)*100)+'%'); }
  function update(){
    ['w','p','a'].forEach(id => setRangeFill($(id)));
    const st = state();
    $('v-w').textContent = m(st.w)+' m'; $('v-p').textContent = m(st.p)+' m'; $('v-a').textContent = st.a+'°';
    $('g-back').closest('label').classList.toggle('off', st.mount==='wall');
    const res = calc(st); const ptxt = res ? fmt(res.price) : 'auf Anfrage';
    $('price').textContent = ptxt; $('stage-price').textContent = ptxt; if($('pdock-price')) $('pdock-price').textContent = ptxt;
    drawStage(st, res);
    const NL = Math.max(4, Math.round(st.p/230));
    const gl = st.sides.length ? ' · Glas ' + st.sides.map(k => SIDE[k]).join(', ') : '';
    $('cap-size').textContent = `${NAME[st.model]} · ${m(st.w)} × ${m(st.p)} m · ${NL} Lamellen${gl}`;
    const extras = st.opts.join(', ') || 'ohne Extras';
    $('f-config').value = `${NAME[st.model]}, ${st.mount==='wall'?'Wand':'freistehend'}, ${st.w}×${st.p} mm, ${extras}${st.sides.length?', Glas: '+st.sides.map(k=>SIDE[k]).join('/'):''}, ab ${ptxt}`;
  }
  // Richtpreis-Gate: цена после телефона/e-mail, заявка уходит на почту
  (function(){
    let un=false; try{ un=localStorage.getItem('pr_unlock')==='1'; }catch(e){}
    const apply=()=>{ document.body.classList.toggle('locked',!un); const pb=$('pdock-btn'); if(pb){ pb.textContent = un ? 'Angebot anfragen' : 'Richtpreis anzeigen'; pb.href = un ? '#kontakt' : '#gate'; } };
    apply();
    const btn=$('gate-btn'); if(!btn) return;
    const unlock=()=>{ un=true; try{ localStorage.setItem('pr_unlock','1'); }catch(e){} apply();
      try{ if(window.gtag) gtag('event','generate_lead',{method:'richtpreis'}); }catch(e){} };
    btn.addEventListener('click',()=>{
      const tel=$('gate-tel').value.trim(), mail=$('gate-mail').value.trim(), hint=$('gate-hint');
      if(tel.replace(/\D/g,'').length<6){
        hint.textContent='Bitte geben Sie Ihre Telefonnummer ein.'; hint.classList.add('err'); return; }
      btn.disabled=true; btn.textContent='Einen Moment …';
      let done=false; const finish=()=>{ if(done) return; done=true; unlock(); };
      try{
        fetch('https://formsubmit.co/ajax/bengameen62570@gmail.com',{method:'POST',
          headers:{'Content-Type':'application/json','Accept':'application/json'},
          body:JSON.stringify({_subject:'Richtpreis-Anfrage PergolaRechner (Rechner)',Telefon:tel||'—','E-Mail':mail||'—',
            Konfiguration:$('f-config').value,Seite:location.href})
        }).then(finish,finish);
      }catch(e){ finish(); }
      setTimeout(finish,4000);
    });
  })();
  document.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.seg button').forEach(x => x.setAttribute('aria-pressed','false'));
    b.setAttribute('aria-pressed','true');
    const L = LIM[b.dataset.model];
    $('w').max = L.w; $('p').max = L.p; if(+$('w').value > L.w) $('w').value = L.w; if(+$('p').value > L.p) $('p').value = L.p;
    if(b.dataset.model==='slide' && +$('p').value < 2500) $('p').value = 2500;
    update();
  }));
  document.querySelectorAll('.seg2 button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.seg2 button').forEach(x => x.setAttribute('aria-pressed','false'));
    b.setAttribute('aria-pressed','true'); update();
  }));
  ['w','p','a'].forEach(id => $(id).addEventListener('input', update));
  ['led','zip','sens','heat'].forEach(k => $('o-'+k).addEventListener('change', update));
  ['front','left','right','back'].forEach(k => $('g-'+k).addEventListener('change', update));
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(update, 120); });
  update();
})();
