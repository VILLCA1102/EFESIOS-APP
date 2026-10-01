const DATA=window.EFESIOS_DATA;
const META=window.EFESIOS_META;
const COUNTS=META.chapters;
const chapter=document.getElementById('chapter');
const verse=document.getElementById('verse');
const body=document.body;
let font=parseFloat(localStorage.getItem('ef_font')||'1.08');
let current={chapter:1,verse:1};
let deferredPrompt=null;

for(let c=1;c<=6;c++){const o=document.createElement('option');o.value=c;o.textContent=`Capítulo ${c}`;chapter.appendChild(o)}

function fillVerses(c,selected=1){
  verse.innerHTML='';
  const count=COUNTS[c];
  for(let v=1;v<=count;v++){const o=document.createElement('option');o.value=v;o.textContent=`Versículo ${v}`;verse.appendChild(o)}
  verse.value=Math.min(selected,count);
  document.getElementById('chapterInfo').textContent=`Capítulo ${c} · ${count} versículos`;
}
function key(c,v){return `${c}:${v}`}
function favs(){try{return JSON.parse(localStorage.getItem('ef_favs')||'[]')}catch(e){return[]}}
function setFavs(x){localStorage.setItem('ef_favs',JSON.stringify(x))}
function valid(c,v){return c>=1&&c<=6&&v>=1&&v<=COUNTS[c]}
function entry(c,v){return DATA[String(c)][v-1]}

function render(c,v,scroll=true){
  c=Number(c)||1; v=Number(v)||1;
  if(!valid(c,v)){c=1;v=1}
  current={chapter:c,verse:v};
  chapter.value=c; fillVerses(c,v); verse.value=v;
  const x=entry(c,v);
  document.getElementById('ref').textContent=`EFESIOS ${c}:${v}`;
  document.getElementById('heading').textContent=x.heading;
  document.getElementById('greek').textContent=x.greek||'';
  document.getElementById('greekWrap').style.display=x.greek?'block':'none';
  document.getElementById('commentary').textContent=x.commentary;
  document.getElementById('sourcePage').textContent=`Ubicación en tu PDF: página ${x.source_page}.`;
  const ref=key(c,v);
  document.getElementById('fav').textContent=favs().includes(ref)?'★ Favorito':'☆ Favorito';
  document.querySelector('.prose').style.fontSize=font+'em';
  document.querySelector('pre').style.fontSize=(font*.94)+'em';
  localStorage.setItem('ef_last',ref);
  if(scroll) window.scrollTo({top:0,behavior:'smooth'});
}
chapter.onchange=()=>render(Number(chapter.value),1);
verse.onchange=()=>render(Number(chapter.value),Number(verse.value));

function adjacent(delta){
  let c=current.chapter,v=current.verse+delta;
  if(v<1){if(c>1){c--;v=COUNTS[c]}else return}
  if(v>COUNTS[c]){if(c<6){c++;v=1}else return}
  render(c,v);
}
document.getElementById('prev').onclick=()=>adjacent(-1);
document.getElementById('next').onclick=()=>adjacent(1);

document.getElementById('fav').onclick=()=>{
  const ref=key(current.chapter,current.verse);let f=favs();
  f=f.includes(ref)?f.filter(x=>x!==ref):[...f,ref];
  setFavs(f);render(current.chapter,current.verse,false);
  toast(f.includes(ref)?'Guardado en favoritos':'Quitado de favoritos');
};

function parseRef(q){
  const m=q.trim().match(/(?:efesios\s*)?([1-6])\s*[:.,-]\s*(\d{1,2})/i);
  if(!m)return null;const c=+m[1],v=+m[2];return valid(c,v)?{c,v}:null;
}
function search(){
  const q=document.getElementById('q').value.trim();
  if(!q)return;
  const r=parseRef(q); if(r){render(r.c,r.v);return}
  const t=q.toLocaleLowerCase('es');
  for(let c=1;c<=6;c++){
    const hit=DATA[String(c)].find(x=>(x.heading+' '+x.commentary).toLocaleLowerCase('es').includes(t));
    if(hit){render(c,hit.verse);return}
  }
  toast('No encontré esa palabra o referencia.');
}
document.getElementById('go').onclick=search;
document.getElementById('q').addEventListener('keydown',e=>{if(e.key==='Enter')search()});

document.getElementById('plus').onclick=()=>{font=Math.min(1.75,font+.08);localStorage.setItem('ef_font',font);render(current.chapter,current.verse,false)};
document.getElementById('minus').onclick=()=>{font=Math.max(.85,font-.08);localStorage.setItem('ef_font',font);render(current.chapter,current.verse,false)};
document.getElementById('theme').onclick=()=>{body.classList.toggle('dark');localStorage.setItem('ef_dark',body.classList.contains('dark')?'1':'0')};
if(localStorage.getItem('ef_dark')==='1')body.classList.add('dark');

document.getElementById('goLast').onclick=()=>{const p=(localStorage.getItem('ef_last')||'1:1').split(':').map(Number);render(p[0],p[1])};
const modal=document.getElementById('favModal');
document.getElementById('showFavs').onclick=()=>{
  const list=document.getElementById('favList');const f=favs();list.innerHTML='';
  if(!f.length){list.innerHTML='<div class="empty">Todavía no tienes versículos favoritos.</div>'}
  f.forEach(ref=>{const [c,v]=ref.split(':').map(Number);const b=document.createElement('button');b.className='fav-item';b.textContent=`Efesios ${ref} — ${entry(c,v).heading}`;b.onclick=()=>{closeModal();render(c,v)};list.appendChild(b)});
  modal.classList.remove('hidden');modal.setAttribute('aria-hidden','false');
};
document.querySelectorAll('[data-close]').forEach(x=>x.onclick=closeModal);
function closeModal(){modal.classList.add('hidden');modal.setAttribute('aria-hidden','true')}

function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}

window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;document.getElementById('install').classList.remove('hidden')});
document.getElementById('install').onclick=async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;document.getElementById('install').classList.add('hidden')};

const last=(localStorage.getItem('ef_last')||'1:1').split(':').map(Number);
render(last[0],last[1],false);
// Service Worker no se necesita dentro del APK Android.

try{document.getElementById('install')?.classList.add('hidden')}catch(e){}
