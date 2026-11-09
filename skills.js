import {radarMarkup} from './radar.js';
import {mountSkillLibrary,defaultSkillLibrary} from './skill-library.js';
export {radarGeometry} from './radar.js';
const identities=[['social','社交能力'],['learning','学习能力'],['simulation','仿真能力'],['modeling','建模能力'],['vibecoding','Vibe Coding能力'],['management','团队协作'],['custom7','语言能力'],['custom8','创新能力']];
export const defaultSkillProfile=()=>({title:'能力雷达与个人 Skill',subtitle:'八维能力画像，软件工具与专业知识的成长记录。',dimensions:identities.map(([id,label])=>({id,label,score:null}))});
const scoreOf=d=>typeof d.score==='number'&&Number.isFinite(d.score)&&d.score>=0&&d.score<=100?d.score:null;
export function mountSkills(data,{e,icon}){
  const homeHook=document.querySelector('.capabilities'),hook=homeHook||document.querySelector('.about-profile');if(!hook)return;
  const profile=data.skillProfile||defaultSkillProfile(),library=data.skillLibrary||defaultSkillLibrary();
  const dimensions=identities.map(([id,label])=>({id,label,score:null,...profile.dimensions?.find(d=>d.id===id)}));
  const root=document.createElement('section');root.id='skill-map';root.className='skills-universe '+(homeHook?'skills-on-home':'skills-on-about');
  root.innerHTML=`<div class="${homeHook?'container ':''}skills-inner"><div class="section-head"><div><p class="eyebrow"><span>SKILL</span> CAPABILITY & KNOWLEDGE</p><h2>${e(profile.title)}<span class="heading-dot">.</span></h2><p class="section-description">${e(profile.subtitle)}</p></div><span class="skill-system-label">ATTRIBUTES / PERSONAL SKILLS <span>+</span></span></div><div class="skill-layout"><article class="radar-panel"><header class="skill-panel-heading"><div><span>ATTRIBUTE RADAR</span><h3>八维能力雷达</h3></div><span class="data-status">个人自评</span></header><div class="radar-canvas"></div><div class="radar-values" aria-label="各维度评分"></div></article><article class="skill-tree-panel"></article></div></div>`;
  hook.insertAdjacentElement('afterend',root);
  if(homeHook)document.querySelector('.hero-disciplines')?.insertAdjacentHTML('afterend',`<a class="hero-skill-link" href="#skill-map">${icon('grid')} 查看个人能力与 Skill ${icon('arrow')}</a>`);
  let selected=dimensions[0].id;
  const renderRadar=()=>{
    root.dataset.radarMode='self';
    root.querySelector('.radar-canvas').innerHTML=radarMarkup(dimensions,selected,e,'self');
    root.querySelector('.radar-values').innerHTML=dimensions.map(d=>`<button data-skill-select="${e(d.id)}" aria-pressed="${d.id===selected}" aria-label="${e(d.label)}：${scoreOf(d)===null?'未设置评分':scoreOf(d)+' / 100'}"><span>${e(d.label)}</span></button>`).join('');
  };
  root.addEventListener('click',event=>{const button=event.target.closest('[data-skill-select]');if(button){selected=button.dataset.skillSelect;renderRadar();root.querySelector(`[data-skill-select="${selected}"]`)?.focus({preventScroll:true});}});
  mountSkillLibrary(root.querySelector('.skill-tree-panel'),library,{e,icon});renderRadar();
}
