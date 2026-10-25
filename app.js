/* app.js — ตัวช่วยกลางของ SkillHub Studio (ใช้ร่วมกันทั้งแกลเลอรีและสตูดิโอ)
   D = สถิติการฝึกวาด (เก็บคีย์ 'sh4' เหมือนเวอร์ชันก่อน เพื่อให้ข้อมูลเก่ายังอยู่) */
const $=id=>document.getElementById(id);
const T=()=>new Date().toLocaleDateString('sv');
let D;try{D=JSON.parse(localStorage.getItem('sh4'))}catch(e){}
D=D||{};D.min=D.min||{};D.goal=D.goal||10;D.exp=D.exp||Date.now();
const sv=()=>{try{localStorage.setItem('sh4',JSON.stringify(D))}catch(e){}};
const rl=()=>{try{const x=JSON.parse(localStorage.getItem('sh4'));if(x){D=x;D.min=D.min||{};D.goal=D.goal||10}}catch(e){}};
function streak(){let n=0,d=new Date();if(!D.min[T()])d.setDate(d.getDate()-1);while(D.min[d.toLocaleDateString('sv')]>0){n++;d.setDate(d.getDate()-1)}return n}
function toast(t){let e=$('toast');if(!e){e=document.createElement('div');e.id='toast';e.setAttribute('role','status');document.body.append(e)}e.textContent=t;e.className='s';clearTimeout(e.t);e.t=setTimeout(()=>e.className='',2200)}
function modal(h){const m=document.createElement('div');m.className='md';m.innerHTML='<div class="bx" role="dialog" aria-modal="true" tabindex="-1">'+h+'</div>';document.body.append(m);const k=e=>e.key==='Escape'&&m.close();m.close=()=>{m.remove();removeEventListener('keydown',k)};addEventListener('keydown',k);m.onclick=e=>{if(e.target==m)m.close()};m.querySelector('.bx').focus();return m}
// นับเวลาที่เปิดแอป (ทุก 5 วินาที) เฉพาะหน้าบนสุด
if(top===window)setInterval(()=>{if(!document.hidden){rl();D.min[T()]=(D.min[T()]||0)+5;if(window.PR)window.PR.tk+=5;sv()}},5e3);
if(window.Notification&&Notification.permission=='granted'&&new Date().getHours()>=18&&(D.min[T()]||0)<D.goal*60&&D.nt!=T()){D.nt=T();sv();try{new Notification('SkillHub Studio',{body:'วันนี้ยังไม่ถึงเป้าวาด '+D.goal+' นาที'})}catch(e){}}
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
