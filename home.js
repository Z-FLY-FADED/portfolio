import {radarMarkup} from './radar.js';
import {defaultSkillProfile} from './skills.js';
import {projectCard,initProjectCards} from './ui.js';
import {mountSkillLibrary,defaultSkillLibrary} from './skill-library.js';
import {photoMarkup,mountPhotoCarousel} from './photos.js';
import {awardsMarkup,mountAwardGallery} from './awards.js';
import {publicationsMarkup} from './publications.js';

function educationMarkup(records,e) {
  const entries=Array.isArray(records)?records:[];
  return `<div class="home-education-list">${entries.map(item=>`<div class="home-education-item"><div><h3>${e(item.school)}</h3><p>${[item.degree,item.major].filter(Boolean).map(e).join(' · ')}</p></div><span>${e(item.period)}</span></div>`).join('')||'<p class="home-education-empty">教育经历待补充。</p>'}</div>`;
}

function workExperienceMarkup(records,e) {
  const entries=Array.isArray(records)?records:[];
  return `<section class="home-experience" id="experience" aria-labelledby="home-experience-title"><div class="home-projects-heading"><div><span>WORK EXPERIENCE</span><h2 id="home-experience-title">工作经历</h2></div></div><div class="home-experience-list">${entries.map(item=>`<article class="home-experience-card"><div class="home-experience-heading"><div><h3>${[item.company,item.position].filter(Boolean).map(e).join('-')}</h3></div><span class="home-experience-period">${e(item.period)}</span></div>${item.summary?`<p class="home-experience-summary">${e(item.summary)}</p>`:''}${item.highlights?.length?`<ul class="home-experience-highlights">${item.highlights.filter(Boolean).map(text=>`<li>${e(text)}</li>`).join('')}</ul>`:''}</article>`).join('')||'<p class="home-experience-empty">工作经历整理中。</p>'}</div></section>`;
}

export function homeMarkup(data, {e, img, icon}) {
  const a=data.about;
  const tags=String(a.skills||'').split(/[,，]/).map(s=>s.trim()).filter(Boolean);
  const contactItems=[['wechat','微信','复制微信号'],['phone','手机号','拨打电话'],['email','邮箱','发送邮件'],['qq','QQ','复制 QQ 号'],['github','GitHub','访问 GitHub 主页 ↗']];
  const contactMarkup=contactItems.map(([key,label,action])=>{
    const value=String(data.site[key]||'').trim();
    const content=`<span class="home-contact-label">${label}</span><strong>${e(value||'待补充')}</strong><span class="home-contact-action">${value?action:'联系方式待补充'}</span>`;
    if(!value)return `<div class="home-contact-item is-empty">${content}</div>`;
    if(key==='email')return `<a class="home-contact-item" href="mailto:${e(encodeURIComponent(value))}">${content}</a>`;
    if(key==='phone')return `<a class="home-contact-item" href="tel:${e(value.replace(/[^+\d]/g,''))}">${content}</a>`;
    if(key==='github')return `<a class="home-contact-item" href="https://github.com/${e(encodeURIComponent(value.replace(/^@/,'')))}" target="_blank" rel="noopener noreferrer">${content}</a>`;
    return `<button class="home-contact-item" data-contact-copy="${e(value)}" aria-label="${action}">${content}</button>`;
  }).join('');
  const resume=(()=>{try{const url=new URL(data.site.resume,location.origin);return data.site.resume&&['http:','https:'].includes(url.protocol)?url.href:'';}catch{return '';}})();
  const awards=awardsMarkup(data,{e,icon});
  const sections=[['publications','发表论文'],['selected','参与项目'],['experience','工作经历']];
  if(awards)sections.push(['awards','获得奖项']);
  return `<main id="main" class="home-dashboard container">
    <section class="home-hero" aria-labelledby="home-title">
      <div class="home-intro">
        <div><p class="home-kicker">ENGINEERING PORTFOLIO</p><h1 id="home-title">${e(a.name)}</h1>${a.role?`<p class="home-role">${e(a.role)}</p>`:''}</div>
        <nav class="home-jump-links" aria-label="首页章节">${sections.map(([id,label])=>`<a href="#${id}">${label}<span aria-hidden="true">↓</span></a>`).join('')}</nav>
      </div>
      <div class="home-overview">
        ${photoMarkup(a,{e,icon})}
        <div class="home-center">
          <section class="home-info" aria-labelledby="home-info-title"><div class="home-panel-label"><h2 id="home-info-title">教育经历</h2><a href="/portfolio/about/">详细介绍 ${icon('up')}</a></div>${educationMarkup(data.education,e)}</section>
          <section class="home-skills" aria-labelledby="home-skills-title"><div class="home-panel-label"><h2 id="home-skills-title">技能</h2><button class="home-text-button" data-open-skills aria-haspopup="dialog">展开技能树 ${icon('arrow')}</button></div><div class="home-skill-tags">${tags.map(t=>`<button data-open-skills aria-haspopup="dialog" aria-label="查看${e(t)}相关技能与实践">${e(t)}</button>`).join('')}</div></section>
        </div>
        <aside class="home-sidebar" aria-label="能力与简历">
          <section class="home-radar" aria-labelledby="home-radar-title"><div class="home-panel-label"><h2 id="home-radar-title">能力雷达图</h2><a href="/portfolio/about/#skill-map" aria-label="查看完整能力雷达图">${icon('up')}</a></div><div class="home-radar-canvas"></div></section>
          <section class="home-resume"><div><span class="home-resume-format">PDF</span><h2>个人简历</h2></div>${resume?`<a href="${e(resume)}" download="${e(data.site.resumeFilename||a.name+'-简历.pdf')}" class="home-resume-link">下载简历 ${icon('download')}</a>`:`<button class="home-resume-link" data-unset="简历 PDF 尚未提供，补充后即可下载。">简历待补充</button>`}</section>
        </aside>
      </div>
    </section>
    ${publicationsMarkup(data,{e,icon})}
    <section class="home-projects" id="selected" aria-labelledby="home-projects-title"><div class="home-projects-heading"><div><span>SELECTED WORK</span><h2 id="home-projects-title">参与项目</h2></div><a href="/portfolio/projects/">查看全部项目 ${icon('arrow')}</a></div><div class="home-project-toolbar"><div role="group" aria-label="首页项目分类" class="home-project-filters">${['全部','机械设计','仿真分析','代码开发'].map((label,i)=>`<button data-home-filter="${label}" aria-pressed="${!i}">${label}</button>`).join('')}</div><span class="home-project-status" role="status">精选 ${Math.min(4,data.projects.length)} 个项目</span></div><div class="project-grid">${data.projects.slice(0,4).map((p,i)=>projectCard(p,i,{e,img,icon})).join('')}</div></section>
    ${workExperienceMarkup(data.workExperience,e)}
    ${awards}
    <section class="home-contact" id="contact" aria-labelledby="home-contact-title"><div class="home-projects-heading"><div><span>LET’S CONNECT</span><h2 id="home-contact-title">联系方式</h2></div></div><div class="home-contact-grid">${contactMarkup}</div></section>
  </main>`;
}

export function mountHomeDashboard(data, {e,img,icon}) {
  const panel=document.querySelector('.home-radar');
  if(!panel)return;
  mountPhotoCarousel();
  mountAwardGallery();
  document.querySelector('.nav-contact').href='#contact';
  const dimensions=(data.skillProfile||defaultSkillProfile()).dimensions;
  // Only the owner's actual scores are displayed; missing values remain unset.
  const render=()=>{
    panel.querySelector('.home-radar-canvas').innerHTML=radarMarkup(dimensions,dimensions[0].id,e,'self',{compact:true});
  };
  document.querySelectorAll('[data-contact-copy]').forEach(button=>button.addEventListener('click',async()=>{
    const toast=document.querySelector('.toast');
    try{await navigator.clipboard.writeText(button.dataset.contactCopy);toast.textContent='已复制：'+button.dataset.contactCopy;}
    catch{toast.textContent='暂时无法自动复制，请手动复制上方联系方式。';}
    toast.classList.add('visible');setTimeout(()=>toast.classList.remove('visible'),4000);
  }));
  render();
  const projectSection=document.querySelector('.home-projects');
  projectSection.querySelectorAll('[data-home-filter]').forEach(button=>button.addEventListener('click',()=>{
    const category=button.dataset.homeFilter;
    const projects=(category==='全部'?data.projects:data.projects.filter(p=>p.category===category)).slice(0,4);
    projectSection.querySelectorAll('[data-home-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    projectSection.querySelector('.project-grid').innerHTML=projects.length?projects.map(p=>projectCard(p,data.projects.indexOf(p),{e,img,icon})).join(''):'<p class="home-project-empty">这个方向的项目正在整理中。</p>';
    projectSection.querySelector('.home-project-status').textContent=(category==='全部'?'精选':category)+' '+projects.length+' 个项目';
    initProjectCards();
  }));
  document.body.insertAdjacentHTML('beforeend',`<dialog class="viewer-dialog home-skill-dialog" id="home-skill-dialog" aria-labelledby="home-skill-dialog-title"><div class="dialog-toolbar"><div><span>SOFTWARE & KNOWLEDGE</span><h2 id="home-skill-dialog-title">技能与实践</h2></div><button class="dialog-close" aria-label="关闭技能弹窗" autofocus>×</button></div><div class="home-skill-dialog-body"><div class="skill-tree-panel"></div><a href="/portfolio/about/#skill-map" class="text-link">查看完整技能页面 ${icon('arrow')}</a></div></dialog>`);
  const skillDialog=document.querySelector('#home-skill-dialog');let opener;
  mountSkillLibrary(skillDialog.querySelector('.skill-tree-panel'),data.skillLibrary||defaultSkillLibrary(),{e,icon});
  document.querySelectorAll('[data-open-skills]').forEach(b=>b.addEventListener('click',()=>{opener=b;skillDialog.showModal();document.body.classList.add('dialog-open');}));
  skillDialog.querySelector('.dialog-close').addEventListener('click',()=>skillDialog.close());
  skillDialog.addEventListener('click',event=>{if(event.target!==skillDialog)return;const r=skillDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)skillDialog.close();});
  skillDialog.addEventListener('close',()=>{document.body.classList.remove('dialog-open');opener?.focus({preventScroll:true});});
}
