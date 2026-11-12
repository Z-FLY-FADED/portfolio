import {radarMarkup} from './radar.js';
import {defaultSkillProfile} from './skills.js';
import {mountSkillLibrary,defaultSkillLibrary} from './skill-library.js';
import {carouselMarkup} from './photos.js';
import {awardsMarkup,mountAwardGallery} from './awards.js';
import {publicationsMarkup} from './publications.js';
import {publicProjects,projectCard} from './ui.js';

const educationMarkup=(records,e)=>records.map(item=>`
  <div class="home-education-item">
    <div><h3>${e(item.school)}</h3><p>${[item.degree,item.major].filter(Boolean).map(e).join(' · ')}</p></div>
    <span>${e(item.period)}</span>
  </div>`).join('');

function workExperienceMarkup(records,e) {
  if(!records.length)return '';
  return `<section class="home-section home-experience" id="experience" aria-labelledby="home-experience-title" data-moment="word-highlight">
    <div class="container wrap">
      <h2 class="section-title" id="home-experience-title">工作经历</h2>
      ${records.map((item,i)=>{
        const highlights=Array.isArray(item.highlights)?item.highlights.filter(note=>typeof note==='string'&&note.trim()):[];
        return `<article class="experience-entry">
          <header class="experience-meta">
            <span>${e(item.period)}</span><h3>${e(item.company)}</h3><p>${e(item.position)}</p>
          </header>
          ${item.summary?`<p class="experience-lead${i===0?' mo-wh__text':''}">${e(item.summary)}</p>`:''}
          ${highlights.length?`<ul class="experience-notes">${highlights.map(note=>{
            const separator=note.indexOf('：');
            return separator>0
              ? `<li><h4>${e(note.slice(0,separator))}</h4><p>${e(note.slice(separator+1))}</p></li>`
              : `<li><p>${e(note)}</p></li>`;
          }).join('')}</ul>`:''}
        </article>`;
      }).join('')}
    </div>
  </section>`;
}

function resumeLink(site,name,e,icon) {
  if(!site.resume)return '';
  try {
    const url=new URL(site.resume,location.origin);
    if(!['http:','https:'].includes(url.protocol))return '';
    return `<a href="${e(url.href)}" download="${e(site.resumeFilename||name+'-简历.pdf')}" class="home-resume-link">下载简历 ${icon('download')}</a>`;
  } catch {return '';}
}

function homeProjectsMarkup(projects,{e,img,icon}) {
  if(!projects.length)return '';
  const byCategory=new Map(['机械设计','代码开发','仿真分析'].map(name=>[name,[]]));
  for(const project of projects){
    const category=project.category||'其他项目';
    if(!byCategory.has(category))byCategory.set(category,[]);
    byCategory.get(category).push(project);
  }
  const groups=[...byCategory].filter(([,items])=>items.length);
  const filters=[['全部',projects.length],...groups.map(([name,items])=>[name,items.length])];
  return `<section class="home-section home-projects" id="selected" aria-labelledby="home-projects-title">
    <div class="container wrap">
      <div class="section-bar"><h2 class="section-title" id="home-projects-title">参与项目</h2><a class="text-link" href="/portfolio/projects/">浏览项目档案 ${icon('arrow')}</a></div>
      <div class="home-project-toolbar">
        <div class="home-project-filters" role="group" aria-label="项目分类">
          ${filters.map(([name,count],index)=>`<button type="button" data-home-project-filter="${e(name)}" aria-pressed="${!index}" aria-controls="home-project-groups">${e(name)} <span aria-hidden="true">${count}</span></button>`).join('')}
        </div>
        <span class="home-project-count" data-home-project-count role="status">${projects.length} 个项目</span>
      </div>
      <div class="home-project-groups" id="home-project-groups">
        ${groups.map(([name,items],index)=>`<section class="home-project-group" data-home-project-group="${e(name)}" data-project-count="${items.length}" aria-labelledby="home-project-group-${index}">
          <h3 id="home-project-group-${index}">${e(name)}</h3>
          <div class="home-project-card-grid">${items.map(project=>projectCard(project,{e,img,icon,grouped:true})).join('')}</div>
        </section>`).join('')}
      </div>
    </div>
  </section>`;
}

function mountHomeProjectFilters(){
  const section=document.getElementById('selected');
  if(!section)return;
  const buttons=[...section.querySelectorAll('[data-home-project-filter]')];
  const groups=[...section.querySelectorAll('[data-home-project-group]')];
  const status=section.querySelector('[data-home-project-count]');
  for(const button of buttons)button.addEventListener('click',()=>{
    if(button.getAttribute('aria-pressed')==='true')return;
    const selected=button.dataset.homeProjectFilter;
    for(const item of buttons)item.setAttribute('aria-pressed',String(item===button));
    let count=0;
    for(const group of groups){
      group.hidden=selected!=='全部'&&group.dataset.homeProjectGroup!==selected;
      if(!group.hidden)count+=Number(group.dataset.projectCount);
    }
    status.textContent=`${count} 个项目`;
  });
}

export function homeMarkup(data, {e, img, icon}) {
  const a=data.about;
  const education=Array.isArray(data.education)?data.education:[];
  const work=Array.isArray(data.workExperience)?data.workExperience:[];
  const projects=publicProjects(data.projects);
  const papers=publicationsMarkup(data,{e,icon});
  const awards=awardsMarkup(data,{e,icon});
  const skills=String(a.skills||'').split(/[,，]/).map(skill=>skill.trim()).filter(Boolean);
  const resume=resumeLink(data.site,a.name,e,icon);
  const indexLinks=[
    papers&&['#publications','发表论文'],
    projects.length&&['#selected','参与项目'],
    work.length&&['#experience','工作经历'],
    awards&&['#awards','奖项与证书']
  ].filter(Boolean);
  const contacts=[['email','邮箱','发送邮件'],['github','GitHub','访问 GitHub'],['wechat','微信','复制微信号'],['phone','手机','拨打电话'],['qq','QQ','复制 QQ 号']];
  const contactMarkup=contacts.map(([key,label,action])=>{
    const value=String(data.site[key]||'').trim();
    if(!value)return '';
    const content=`<span class="home-contact-label">${label}</span><strong>${e(value)}</strong><span class="home-contact-action">${action}</span>`;
    if(key==='email')return `<a class="home-contact-item" href="mailto:${e(encodeURIComponent(value))}">${content}</a>`;
    if(key==='phone')return `<a class="home-contact-item" href="tel:${e(value.replace(/[^+\d]/g,''))}">${content}</a>`;
    if(key==='github')return `<a class="home-contact-item" href="https://github.com/${e(encodeURIComponent(value.replace(/^@/,'')))}" target="_blank" rel="noopener noreferrer">${content}</a>`;
    return `<button class="home-contact-item" data-contact-copy="${e(value)}">${content}</button>`;
  }).join('');
  const portrait=carouselMarkup(a,{e,icon});
  return `<main id="main" class="home-dashboard container">
    <section class="home-hero" aria-labelledby="home-title">
      <div class="home-intro">
        <div>
          <h1 id="home-title">${e(a.name)}</h1>
          ${a.role?`<p class="home-role">${e(a.role)}</p>`:''}
          ${data.home.subtitle?`<p class="home-lead">${e(data.home.subtitle)}</p>`:''}
        </div>
        ${indexLinks.length?`<nav class="home-jump-links" aria-label="首页章节">${indexLinks.map(([href,label])=>`<a href="${href}">${label}<span aria-hidden="true">↓</span></a>`).join('')}</nav>`:''}
      </div>
      <div class="home-overview${portrait?'':' home-overview--text'}">
        ${portrait?`<div class="home-portrait">${portrait}</div>`:''}
        <div class="home-center" id="profile">
          ${education.length?`<section class="home-info" aria-labelledby="home-info-title">
            <div class="home-panel-label"><h2 id="home-info-title">教育经历</h2><a href="/portfolio/about/">详细介绍 ${icon('up')}</a></div>
            <div class="home-education-list">${educationMarkup(education,e)}</div>
          </section>`:''}
          <section class="home-skills" aria-labelledby="home-skills-title">
            <div class="home-panel-label"><h2 id="home-skills-title">技能</h2><button class="home-text-button" data-open-skills aria-haspopup="dialog">展开技能树 ${icon('arrow')}</button></div>
            ${skills.length?`<div class="home-skill-tags">${skills.map(skill=>`<button data-open-skills aria-haspopup="dialog" aria-label="查看${e(skill)}相关技能与实践">${e(skill)}</button>`).join('')}</div>`:''}
          </section>
        </div>
        <aside class="home-sidebar" aria-label="能力与简历">
          <section class="home-radar" aria-labelledby="home-radar-title">
            <div class="home-panel-label"><h2 id="home-radar-title">能力雷达图</h2><a href="/portfolio/about/#skill-map" aria-label="查看完整技能图谱">${icon('up')}</a></div>
            <div class="home-radar-canvas"></div>
          </section>
          ${resume?`<section class="home-resume"><div><span class="home-resume-format">PDF</span><h2>个人简历</h2></div>${resume}</section>`:''}
        </aside>
      </div>
    </section>
    ${papers}
    ${homeProjectsMarkup(projects,{e,img,icon})}
    ${workExperienceMarkup(work,e)}
    ${awards}
    ${contactMarkup?`<section class="home-section home-contact" id="contact" aria-labelledby="home-contact-title"><div class="container wrap"><h2 class="section-title" id="home-contact-title">联系方式</h2><div class="home-contact-grid">${contactMarkup}</div></div></section>`:''}
  </main>`;
}

export function mountHomeDashboard(data, {e,icon}) {
  mountHomeProjectFilters();
  const radar=document.querySelector('.home-radar-canvas');
  if(!radar)return;
  mountAwardGallery();
  const dimensions=(data.skillProfile||defaultSkillProfile()).dimensions;
  if(dimensions?.length)radar.innerHTML=radarMarkup(dimensions,null,e,'self',{compact:true});
  let toastTimer;
  document.querySelectorAll('[data-contact-copy]').forEach(button=>button.addEventListener('click',async()=>{
    const toast=document.querySelector('.toast');
    try{await navigator.clipboard.writeText(button.dataset.contactCopy);toast.textContent='已复制：'+button.dataset.contactCopy;}
    catch{toast.textContent='暂时无法自动复制，请手动复制联系方式。';}
    toast.classList.add('visible');clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>toast.classList.remove('visible'),4000);
  }));
  document.body.insertAdjacentHTML('beforeend',`<dialog class="viewer-dialog home-skill-dialog" id="home-skill-dialog" aria-labelledby="home-skill-dialog-title"><div class="dialog-toolbar"><div><h2 id="home-skill-dialog-title">技能与实践</h2></div><button class="dialog-close" aria-label="关闭技能弹窗" autofocus>×</button></div><div class="home-skill-dialog-body"><div class="skill-tree-panel"></div><a href="/portfolio/about/#skill-map" class="text-link">查看完整技能图谱 ${icon('arrow')}</a></div></dialog>`);
  const dialog=document.querySelector('#home-skill-dialog');
  let opener;
  mountSkillLibrary(dialog.querySelector('.skill-tree-panel'),data.skillLibrary||defaultSkillLibrary(),{e,icon});
  document.querySelectorAll('[data-open-skills]').forEach(button=>button.addEventListener('click',()=>{
    opener=button;
    dialog.showModal();
    document.body.classList.add('dialog-open');
  }));
  dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
  dialog.addEventListener('close',()=>{document.body.classList.remove('dialog-open');opener?.focus({preventScroll:true});});
}
