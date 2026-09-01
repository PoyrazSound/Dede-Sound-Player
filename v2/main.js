import { modules } from './modules/index.js';
const root=document.getElementById('modules'); const logEl=document.getElementById('log');
modules.forEach(m=>{const c=document.createElement('div');c.className='card';c.innerHTML=`<b>${m.id}. ${m.name}</b><div>${m.description}</div><br><button data-id="${m.id}">TEST</button>`;c.querySelector('button').onclick=()=>m.test(logEl);root.appendChild(c)});
document.getElementById('testAll').onclick=async()=>{for(const m of modules){await m.test(logEl)}};
document.getElementById('stopAll').onclick=()=>window.dispatchEvent(new Event('dede:stop-all'));
