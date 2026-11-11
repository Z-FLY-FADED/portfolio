import {homeMarkup,mountHomeDashboard} from '/portfolio/home.js';
import {mountDownloads} from '/portfolio/downloads.js';
import {carouselMarkup,mountPhotoCarousel} from '/portfolio/photos.js';
import {loadContent} from '/portfolio/content-source.js';
import {mountSkills} from '/portfolio/skills.js';
import {projectCard,projectHref,projectArchiveHref,publicProjects,initProjectFilters,enhanceExperience,isEditorialPlaceholder} from '/portfolio/ui.js';
import {projectBriefingMarkup,mountProjectBriefing} from '/portfolio/project-briefing.js';
import {mountEngineeringModel} from '/portfolio/engineering-model.js';
import {mountPlayback} from '/portfolio/project-playback.js';
const data = await loadContent({localPreview:['127.0.0.1','localhost','[::1]'].includes(location.hostname)});
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const prose=(text,cls='')=>!String(text??'').trim()||isEditorialPlaceholder(text)?'':`<p${cls?` class="${cls}"`:''}>${e(text)}</p>`;
const safeUrl=(s,embed=false)=>{if(!String(s??'').trim())return '';try{const u=new URL(s,location.origin);return (['http:','https:'].includes(u.protocol)&&(!embed||u.protocol==='https:'))?e(u.href):'';}catch{return '';}};
const img=(src,alt,cls='')=>`<img src="${safeUrl(src)||'/portfolio/assets/assembly.svg'}" alt="${e(alt)}" class="${cls}" loading="lazy" decoding="async">`;
const icon=(name,cls='')=>`<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${({arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',up:'<path d="M6 18 18 6M6 6h12v12"/>',cube:'<path d="m12 3 9 5v9l-9 5-9-5V8zM3 8l9 5 9-5M12 13v9M7 5l10 6"/>',code:'<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18"/>',sim:'<path d="M3 3v18h18M6 16l5-7 5 4 5-8"/><circle cx="11" cy="9" r="1.5"/>',mail:'<rect x="2" y="4" width="20" height="16" rx="3"/><path d="m3 6 9 7 9-7"/>',flip:'<path d="M20 8a8 8 0 0 0-14-3L3 8m0-5v5h5m-4 8a8 8 0 0 0 14 3l3-3m0 5v-5h-5"/>',menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',check:'<path d="m5 12 4 4L19 6"/>',link:'<path d="m10 13 4-4m-6 6-2 2a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m4 2 2-2a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0" transform="translate(1 0)"/>'})[name]||''}</svg>`;
const path=location.pathname.slice(new URL('.', import.meta.url).pathname.length-1).replace(/\/index\.html$/, '/').replace(/\/+$/,'')||'/';
const isProjects=path.startsWith('/projects');
const button=(text,href,secondary=false,ico='arrow')=>`<a class="button ${secondary?'secondary':''}" href="${e(href)}">${e(text)}${icon(ico)}</a>`;
const unavailable=(text,ico='up')=>`<button class="button secondary" data-unset="该资料暂未公开。">${e(text)}${icon(ico)}</button>`;
const external=(label,url,cls='')=>safeUrl(url)?`<a class="${cls}" href="${safeUrl(url)}" target="_blank" rel="noopener noreferrer">${e(label)}${icon('up')}</a>`:unavailable(label);
const logo=`<a class="brand" href="/portfolio/" aria-label="${e(data.about.name)}的首页"><span class="brand-mark" aria-hidden="true"></span><span>${e(data.about.name)}</span></a>`;
const hasContact=['email','github','wechat','phone','qq'].some(key=>String(data.site[key]||'').trim());
function header(){
  const links=[['/portfolio/','首页',path==='/'],['/portfolio/projects/','项目档案',isProjects],['/portfolio/about/','关于我',path==='/about']];
  return `<header class="header nav"><div class="container wrap header-inner">${logo}<button class="menu-button" aria-label="打开导航" aria-expanded="false" aria-controls="navigation">${icon('menu')}</button><nav class="nav__links" id="navigation" aria-label="主导航">${links.map(([href,label,current])=>`<a href="${href}"${current?' aria-current="page"':''}>${label}</a>`).join('')}<a href="/portfolio/about/#skill-map">技能图谱</a>${hasContact?`<a class="nav-contact" href="${path==='/'?'#contact':'/portfolio/#contact'}">联系方式 ${icon('up')}</a>`:''}</nav></div></header>`;
}
function footer(){
  return `<footer class="footer"><div class="container wrap footer-bottom"><span>© ${new Date().getFullYear()} ${e(data.site.copyright)}</span><a href="#main" class="back-to-top">回到顶部 ${icon('up')}</a><button class="motion-toggle" aria-pressed="false">减少动态效果</button></div></footer>`;
}
function projects(){
  const records=publicProjects(data.projects);
  return `<main id="main" class="container wrap archive-page">
    <section class="hero inner-hero" data-enter aria-labelledby="archive-title"><h1 id="archive-title" data-enter-whole>项目档案</h1><p>记录机械设计、工程仿真、智能车和软件整合实践。</p></section>
    ${records.length?`<section aria-labelledby="archive-list-title"><h2 id="archive-list-title" class="sr-only">已公开项目</h2><div class="filter-row"><div class="filters" role="group" aria-label="项目分类">${['全部',...new Set(records.map(p=>p.category))].map((c,i)=>`<button class="filter ${i?'':'active'}" data-filter="${e(c)}" aria-pressed="${!i}">${e(c)}</button>`).join('')}</div><span class="project-count" role="status">${records.length} 个项目</span></div><div class="project-index-grid">${records.map((p,i)=>projectCard(p,{e,img,icon},i+1)).join('')}</div></section>`:
    `<section class="archive-empty" aria-labelledby="archive-list-title"><h2 id="archive-list-title">项目详情暂未公开</h2><p>已公开的研究成果与实践经历可在首页查看。</p><div class="home-actions">${Array.isArray(data.publications)&&data.publications.some(p=>p?.title?.trim())?button('查看论文','/portfolio/#publications'):''}${data.workExperience?.length?button('查看工作经历','/portfolio/#experience',true):button('查看个人简介','/portfolio/about/',true)}</div></section>`}
  </main>`;
}
const detailCopy=value=>String(value??'').trim().split(/\r?\n\s*\r?\n/).map(part=>prose(part,'body-copy')).join('');
const caption=value=>value&&!isEditorialPlaceholder(value)?`<figcaption>${e(value)}</figcaption>`:'';
function galleryMarkup(items){
  const groups=new Map();
  for(const item of items){
    const topic=item.topic||'';
    if(!groups.has(topic))groups.set(topic,[]);
    groups.get(topic).push(item);
  }
  return [...groups].map(([topic,group])=>{
    const figures=group.map(item=>{
      const description=item.analysis||item.source
        ?`<figcaption class="evidence-caption">${item.caption?`<strong data-evidence-title>${e(item.caption)}</strong>`:''}${detailCopy(item.analysis)}${item.source?`<small>${e(item.source)}</small>`:''}</figcaption>`
        :caption(item.caption);
      return `<figure${item.wide?' class="gallery-wide"':''}>${img(item.src,item.alt)}${description}</figure>`;
    }).join('');
    const grid=`<div class="image-gallery">${figures}</div>`;
    return topic?`<div class="evidence-set"><h3>${e(topic)}</h3>${grid}</div>`:grid;
  }).join('');
}
function model(p){
  const viewer=safeUrl(p.viewerUrl,true);
  if(viewer)return `<div class="model-viewer"><iframe src="${viewer}" title="${e(p.title)} 三维模型查看器" loading="lazy" sandbox="allow-scripts allow-same-origin allow-pointer-lock" allow="fullscreen" referrerpolicy="no-referrer" allowfullscreen></iframe></div>`;
  return `<figure class="model-viewer">${img(p.modelImage,p.modelAlt)}${caption(p.modelCaption)}</figure>`;
}
function simulationMarkup(items){
  return `<div class="simulation">
    <div role="tablist" aria-label="仿真展示类型" class="sim-tabs">${items.map((item,i)=>`<button role="tab" id="sim-tab-${i}" aria-controls="sim-panel-${i}" aria-selected="${!i}" tabindex="${i?-1:0}" data-tab="${i}">${e(item.label)}</button>`).join('')}</div>
    ${items.map((item,i)=>`<div id="sim-panel-${i}" role="tabpanel" aria-labelledby="sim-tab-${i}"${i?' hidden':''}>${item.playback?`<div class="project-trace"><div class="trace-poster">${img(item.src,item.alt)}</div><div data-playback="${e(item.playback)}"></div></div>`:img(item.src,item.alt)}${prose(item.caption)}</div>`).join('')}
  </div>`;
}
function detail(p){
  const publicRecords=publicProjects(data.projects);
  const template=!publicRecords.includes(p);
  const hasPlayback=p.simulations.some(item=>item.playback);
  const records=template?data.projects:publicRecords;
  const category=!template&&new URLSearchParams(location.search).get('category')===p.category?p.category:'';
  const archive=projectArchiveHref(category);
  const neighbors=category?records.filter(record=>record.category===category):records;
  const neighborIndex=neighbors.indexOf(p);
  const returnLabel=`返回${category||'项目'}列表`;
  const number=i=>String(i+1).padStart(2,'0');
  const modules=[];
  const add=(id,title,short,body)=>modules.push({id:`module-${id}`,title,short,body});
  const note=(i,id,short)=>{
    const section=p.sections[i];
    if(section?.title)add(id,section.title,section.shortTitle||short,detailCopy(section.body));
  };
  const addSimulation=()=>add(5,p.simulationTitle||'仿真结果展示',hasPlayback?'仿真数据回放':'仿真展示',simulationMarkup(p.simulations));
  if(hasPlayback)addSimulation();
  note(0,0,'项目背景');
  note(1,1,'目标与约束');
  note(2,2,'实施过程');
  if(p.modelImage||safeUrl(p.viewerUrl,true))add(3,'三维模型','三维模型',model(p));
  if(p.gallery.length)add(4,p.galleryTitle||'工程图与设计过程',template?'工程图与过程':'项目图档',galleryMarkup(p.gallery));
  if(p.simulations.length&&!hasPlayback)addSimulation();
  if(template||p.repository||detailCopy(p.codeDescription)){
    const repository=(template||safeUrl(p.repository))?`<div class="repo-card">${icon('code')}<div><h3>公开代码仓库</h3><p>源代码、使用说明与运行环境</p></div>${external('查看仓库',p.repository,'text-link')}</div>`:'';
    add(6,p.implementationTitle||'代码与技术实现','技术实现',detailCopy(p.codeDescription)+repository);
  }
  note(3,7,'成果与验证');
  note(4,8,'个人贡献');
  if(template||p.links.length||p.attachments?.length)add(9,'相关资料','相关资料',`<div class="resource-links">${p.links.length?p.links.map(l=>external(l.label,l.url,'text-link')).join(''):template?unavailable('暂无公开资料','link'):''}</div>`);
  const facts=[['项目时间',p.time],['个人角色',p.role],['使用工具',p.tools]].filter(([,value])=>String(value??'').trim());
  const adjacent=(record,label)=>record?`<a href="${e(projectHref(record.slug,category))}"><small>${label}</small><span>${e(record.title)}</span></a>`:'';
  return `<main id="main" class="container detail${template?'':' project-case'}">
    <a class="breadcrumb" href="${e(archive)}">← ${e(returnLabel)}</a>
    <section class="detail-heading hero" data-enter><div><p class="eyebrow">${e(p.category)}</p><h1 data-enter-whole>${e(p.title)}</h1>${prose(p.summary)}<div class="tags">${p.tags.map(t=>`<span>${e(t)}</span>`).join('')}</div></div></section>
    ${p.briefing?.stages?.length?projectBriefingMarkup():p.cover?`<figure class="detail-cover reveal">${img(p.cover,p.coverAlt)}${caption(p.coverCaption)}</figure>`:''}
    ${facts.length?`<section class="meta-grid reveal" aria-label="项目信息">${facts.map(([label,value])=>`<div><span>${label}</span><p>${e(value)}</p></div>`).join('')}</section>`:''}
    <div class="detail-layout">
      <aside class="detail-toc" aria-label="项目目录"><p>项目目录</p>${modules.map((item,i)=>`<a href="#${item.id}"><span>${number(i)}</span>${e(item.short)}</a>`).join('')}</aside>
      <div class="detail-body">${modules.map(item=>`<section class="detail-section reveal" id="${item.id}"><h2>${e(item.title)}</h2>${item.body}</section>`).join('')}</div>
    </div>
    <nav class="project-pagination" aria-label="相邻项目">${adjacent(neighbors[neighborIndex-1],'← 上一个项目')||'<span></span>'}${adjacent(neighbors[neighborIndex+1],'下一个项目 →')||`<a href="${e(archive)}"><span>${e(returnLabel)} →</span></a>`}</nav>
  </main>`;
}
const pills=s=>String(s).split(/[,，]/).filter(Boolean).map(t=>`<span>${e(t.trim())}</span>`).join('');
function profileDetails(){
  const education=Array.isArray(data.education)?data.education:[];
  const work=Array.isArray(data.workExperience)?data.workExperience:[];
  const entry=(title,period,summary='')=>`<div class="profile-fact"><div class="profile-fact-heading"><h4>${e(title)}</h4>${period?`<span>${e(period)}</span>`:''}</div>${summary?`<p>${e(summary)}</p>`:''}</div>`;
  return `<div class="profile-facts">${education.length?`<section aria-labelledby="profile-education-title"><h3 id="profile-education-title">教育经历</h3>${education.map(item=>entry([item.school,item.degree,item.major].filter(Boolean).join('-'),item.period)).join('')}</section>`:''}${work.length?`<section aria-labelledby="profile-work-title"><h3 id="profile-work-title">工作经历</h3>${work.map(item=>entry([item.company,item.position].filter(Boolean).join('-'),item.period,item.summary)).join('')}</section>`:''}</div>`;
}
function about(){
  const a=data.about;
  const portrait=carouselMarkup(a,{e,icon});
  const lists=[['专业方向',a.directions],['软件工具',a.tools]].map(([label,value])=>{
    const items=String(value||'').split(/[,，]/).map(item=>item.trim()).filter(item=>item&&!item.startsWith('['));
    return items.length?`<div><dt>${label}</dt><dd>${items.map(e).join(' / ')}</dd></div>`:'';
  }).join('');
  return `<main id="main" class="container wrap about-page">
    <section class="hero about-profile${portrait?'':' about-profile--text'}" data-enter aria-labelledby="about-title">
      <div class="profile-copy">
        <h1 id="about-title" data-enter-whole>关于我</h1>
        <h2>${e(a.name)}</h2>
        <p class="profile-role">${e(a.role)}</p>
        ${prose(a.bio,'body-copy')}
        ${profileDetails()}
        ${lists?`<dl class="profile-fields">${lists}</dl>`:''}
        ${data.site.resume?external('查看简历',data.site.resume,'button secondary'):''}
      </div>
      ${portrait}
    </section>
    ${hasContact?`<section class="about-contact" id="contact" aria-labelledby="about-contact-title"><h2 class="section-title" id="about-contact-title">联系方式</h2><a href="/portfolio/#contact" class="text-link">查看联系方式 ${icon('arrow')}</a></section>`:''}
  </main>`;
}
const project=data.projects.find(p=>path==='/projects/'+p.slug);
const content=path==='/'?homeMarkup(data,{e,img,icon}):path==='/projects'?projects():path==='/about'?about():project?detail(project):`<main id="main" class="container page-heading"><p class="eyebrow">404 / PAGE NOT FOUND</p><h1>这个页面尚未建立。</h1>${button('返回首页','/portfolio/')}</main>`;
document.body.dataset.page=path==='/'?'home':path==='/about'?'about':path==='/projects'?'projects':'detail';
document.querySelector('#app').innerHTML=header()+content+footer()+`<div class="toast" role="status" aria-live="polite"></div>`;
if(project?.briefing?.stages?.length){
  mountProjectBriefing(document.getElementById('project-briefing'),project.briefing,{
    imageUrl:safeUrl,
    loadScene:async source=>{
      if(!/^\/portfolio\/assets\/projects\/[a-z0-9-]+\/[a-z0-9-]+\.scene\.json$/.test(source))throw new Error('模型路径无效');
      const response=await fetch(source);
      if(!response.ok)throw new Error('三维模型未找到');
      return response.json();
    },
    mountModel:mountEngineeringModel,
    mountPlayback,
  });
}
enhanceExperience(data,{e,img,icon},project);
mountSkills(data,{e,icon});
mountDownloads(data,{e,icon},project);
mountPhotoCarousel();
mountHomeDashboard(data,{e,img,icon});
const menuButton=document.querySelector('.menu-button');
const navigation=document.querySelector('#navigation');
function setMenuOpen(open) {
  menuButton.setAttribute('aria-expanded',String(open));
  menuButton.setAttribute('aria-label',open?'关闭导航':'打开导航');
  navigation.classList.toggle('open',open);
}
menuButton.addEventListener('click',()=>setMenuOpen(!navigation.classList.contains('open')));
navigation.addEventListener('click',event=>{if(event.target.closest('a'))setMenuOpen(false);});
document.addEventListener('keydown',event=>{
  if(event.key!=='Escape'||!navigation.classList.contains('open'))return;
  setMenuOpen(false);
  menuButton.focus();
});
let toastTimer;document.addEventListener('click',ev=>{const b=ev.target.closest('[data-unset]');if(!b)return;const t=document.querySelector('.toast');t.textContent=b.dataset.unset;t.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('visible'),4000);});
initProjectFilters();
const tabs=[...document.querySelectorAll('.sim-tabs [data-tab]')];
let selectedSimulation;
let stopSimulation;
function selectTab(button){
  if(selectedSimulation===button)return;
  stopSimulation?.();
  selectedSimulation=button;
  tabs.forEach(tab=>{
    const selected=tab===button;
    tab.setAttribute('aria-selected',selected);
    tab.tabIndex=selected?0:-1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden=!selected;
  });
  const host=document.getElementById(button.getAttribute('aria-controls')).querySelector('[data-playback]');
  stopSimulation=host?mountPlayback(host,host.dataset.playback):undefined;
}
tabs.forEach((button,index)=>{
  button.onclick=()=>selectTab(button);
  button.onkeydown=event=>{
    const next={ArrowRight:(index+1)%tabs.length,ArrowLeft:(index-1+tabs.length)%tabs.length,Home:0,End:tabs.length-1}[event.key];
    if(next===undefined)return;
    event.preventDefault();
    selectTab(tabs[next]);
    tabs[next].focus();
  };
});
if(tabs.length)selectTab(tabs[0]);
let motion=false;try{motion=localStorage.getItem('bluelab-reduce-motion')==='true';}catch{}const motionBtn=document.querySelector('.motion-toggle');const applyMotion=()=>{document.documentElement.classList.toggle('reduce-motion',motion);motionBtn.setAttribute('aria-pressed',motion);motionBtn.textContent=motion?'动态效果已减少':'减少动态效果';};applyMotion();motionBtn.onclick=()=>{motion=!motion;applyMotion();try{localStorage.setItem('bluelab-reduce-motion',motion);}catch{}};
import('/portfolio/assets/motion/motion.js').then(({refresh})=>refresh());
if(document.querySelector('[data-moment]'))import('/portfolio/assets/moments/moments.js');

// Resolve deep links after asynchronous content and reusable sections have mounted.
if(location.hash){requestAnimationFrame(()=>{try{document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({behavior:"instant",block:"start"});}catch{}});}
