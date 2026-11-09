// BlueLab components: independently implemented from the design references in 设计参考与改进.md.
export const isEditorialPlaceholder=value=>/^\s*\[(?:在此|填写|基础[：:]|应用[：:]|沉淀[：:]|项目介绍占位|项目经历待补充)/.test(String(value??''))||/占位\s*·\s*替换/.test(String(value??''));
export function projectCard(p,i,{e,img,icon}) {
  const href=`/portfolio/projects/${e(p.slug)}/`;
  return `<article class="project-card reveal" data-category="${e(p.category)}" data-project="${e(p.slug)}">
    <div class="flip-shell">
      <button class="flip-toggle" aria-label="翻转 ${e(p.title)} 查看简介" aria-expanded="false">${icon('flip')}<span>翻转简介</span></button>
      <div class="flip-inner">
        <div class="card-face card-front"><div class="project-cover">${img(p.cover,p.coverAlt)}<span class="cover-category">${e(p.category)}</span></div><div class="card-caption"><div><span class="project-index">PROJECT / ${String(i+1).padStart(2,'0')}</span><h3>${e(p.title)}</h3>${isEditorialPlaceholder(p.summary)?'':`<p class="mobile-summary">${e(p.summary)}</p>`}</div><span class="card-arrow">${icon('cube')}</span></div></div>
        <div class="card-face card-back" inert aria-hidden="true"><p class="eyebrow">PROJECT ${String(i+1).padStart(2,'0')} / ${e(p.category)}</p><h3>${e(p.title)}</h3>${isEditorialPlaceholder(p.summary)?'':`<p>${e(p.summary)}</p>`}<div class="tags">${p.tags.map(t=>`<span>${e(t)}</span>`).join('')}</div><a class="card-detail" href="${href}">查看项目详情 ${icon('arrow')}</a></div>
      </div>
    </div>
    <div class="card-actions"><button class="quick-preview" data-preview="${e(p.slug)}" aria-haspopup="dialog">${icon('grid')} 快速预览</button><a class="open-project" href="${href}">打开项目 ${icon('arrow')}</a><a class="new-tab-link" href="${href}" target="_blank" rel="noopener noreferrer" aria-label="在新标签页打开：${e(p.title)}" title="在新标签页打开项目">${icon('up')}</a></div>
  </article>`;
}

export function initProjectCards() {
  document.querySelectorAll('.project-card').forEach(card=>{
    let locked=false;
    const toggle=card.querySelector('.flip-toggle'), shell=card.querySelector('.flip-shell');
    const flip=value=>{
      card.classList.toggle('flipped',value);
      toggle.setAttribute('aria-expanded',value);
      toggle.setAttribute('aria-label',(value?'返回封面：':'查看简介：')+card.querySelector('h3').textContent);
      for(const [selector,hidden] of [['.card-front',value],['.card-back',!value]]){
        const face=card.querySelector(selector);face.inert=hidden;face.setAttribute('aria-hidden',hidden);
      }
    };
    shell.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'&&matchMedia('(hover:hover)').matches)flip(true);});
    shell.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse'&&!locked&&!shell.contains(document.activeElement))flip(false);});
    toggle.addEventListener('click',()=>{locked=!locked;flip(locked);});
    shell.addEventListener('focusout',()=>queueMicrotask(()=>{if(!locked&&!shell.contains(document.activeElement)&&!shell.matches(':hover'))flip(false);}));
    shell.addEventListener('keydown',event=>{if(event.key==='Escape'){locked=false;flip(false);toggle.focus();}});
  });
}

export function initProjectFilters() {
  const buttons=[...document.querySelectorAll('[data-filter]')];
  if(!buttons.length)return;
  const update=(category,writeUrl)=>{
    const selected=buttons.some(b=>b.dataset.filter===category)?category:'全部';
    for(const button of buttons){const active=button.dataset.filter===selected;button.classList.toggle('active',active);button.setAttribute('aria-pressed',active);}
    let count=0;
    document.querySelectorAll('.project-card').forEach(card=>{card.hidden=selected!=='全部'&&card.dataset.category!==selected;if(!card.hidden)count++;});
    document.querySelector('.project-count').textContent=`${String(count).padStart(2,'0')} 个项目占位`;
    if(writeUrl){const url=new URL(location.href);if(selected==='全部')url.searchParams.delete('category');else url.searchParams.set('category',selected);history.pushState({},'',url);}
  };
  for(const button of buttons)button.addEventListener('click',()=>update(button.dataset.filter,true));
  addEventListener('popstate',()=>update(new URL(location.href).searchParams.get('category'),false));
  update(new URL(location.href).searchParams.get('category'),false);
}

export function enhanceExperience(data,{e,img,icon},project) {
  // These controls are native anchors; opening a new tab happens only on a visitor's click.
  const newTab=(label,href)=>{let url;try{url=new URL(href,location.origin);if(!['http:','https:'].includes(url.protocol))return '';}catch{return '';}return `<a class="utility-link" href="${e(url.href)}" target="_blank" rel="noopener noreferrer">${icon('up')}${e(label)}<span class="sr-only">（新标签页）</span></a>`;};
  const disciplines=document.querySelector('.hero-disciplines');
  if(disciplines)disciplines.innerHTML=['机械设计','代码开发','仿真分析'].map(t=>`<a href="/portfolio/projects/?category=${encodeURIComponent(t)}">${e(t)} ${icon('arrow')}</a>`).join('');
  const hero=document.querySelector('.hero');
  if(hero){
    const footer=hero.querySelector('.visual-footer');
    footer.insertAdjacentHTML('beforeend',`<button class="hero-expand" data-lightbox="${safeImage(data.home.modelImage)}" data-image-alt="${e(data.home.modelAlt)}" data-image-caption="机械模型 · 静态示意占位" aria-haspopup="dialog" aria-label="放大机械模型示意图">${icon('up')}</button>`);
    hero.insertAdjacentHTML('afterend',`<div class="container process-strip reveal"><span class="process-heading">THE ENGINEERING PROCESS</span>${[['01','构思','IDEATE'],['02','建模','MODEL'],['03','实现','BUILD'],['04','验证','VALIDATE']].map(([n,t,en])=>`<div><span>${n}</span><strong>${t}</strong><small>${en}</small></div>`).join('')}<span class="process-end">从想法到可验证的方案 ${icon('arrow')}</span></div>`);
  }
  document.querySelectorAll('.ability').forEach((el,i)=>{el.insertAdjacentHTML('beforeend',`<a href="/portfolio/projects/?category=${encodeURIComponent(['机械设计','仿真分析','代码开发'][i])}" class="ability-link">探索此方向 ${icon('arrow')}</a>`);});
  const archive=document.querySelector('.archive');
  if(archive){
    document.querySelector('.page-heading').insertAdjacentHTML('beforeend',`<div class="archive-counter" aria-label="项目模板总数"><strong>${String(data.projects.length).padStart(2,'0')}</strong><span>PROJECT TEMPLATES<br>可编辑项目模板</span></div>`);
    document.querySelectorAll('[data-filter]').forEach(button=>{const count=button.dataset.filter==='全部'?data.projects.length:data.projects.filter(p=>p.category===button.dataset.filter).length;button.insertAdjacentHTML('beforeend',`<span aria-hidden="true">${String(count).padStart(2,'0')}</span>`);});
  }
  if(project){
    document.querySelector('.breadcrumb').insertAdjacentHTML('afterend',`<div class="detail-utilities"><span>${icon('grid')} 工程项目 / ${e(project.category)}</span>${newTab('新标签页打开本项目',location.pathname)}</div>`);
    document.querySelector('.detail-heading .tags').insertAdjacentHTML('afterend',`<div class="detail-quick-links"><a href="#module-3">${icon('cube')} 三维模型</a><a href="#module-5">${icon('sim')} 仿真展示</a><a href="#module-6">${icon('code')} 代码实现</a></div>`);
    document.querySelector('.header').insertAdjacentHTML('beforeend','<div class="reading-progress" aria-hidden="true"><span></span></div>');
    const progress=document.querySelector('.reading-progress>span');let queued=false;
    const updateProgress=()=>{const height=document.documentElement.scrollHeight-innerHeight;progress.style.width=(height>0?Math.min(100,Math.max(0,scrollY/height*100)):0)+'%';queued=false;};
    addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(updateProgress);}},{passive:true});addEventListener('resize',updateProgress);updateProgress();
    const links=[...document.querySelectorAll('.detail-toc>a')];
    if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){for(const link of links){const current=link.hash==='#'+entry.target.id;link.classList.toggle('current-section',current);if(current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');}}},{rootMargin:'-12% 0px -65% 0px'});document.querySelectorAll('.detail-section').forEach(section=>observer.observe(section));}
  }
  document.querySelectorAll('.image-gallery figure,.detail-cover,.model-viewer,.simulation [role="tabpanel"]').forEach(container=>{
    const image=container.querySelector('img');if(!image)return;
    const caption=container.querySelector('figcaption,p')?.textContent||image.alt;
    container.classList.add('expandable-image');
    container.insertAdjacentHTML('beforeend',`<button class="image-expand" data-lightbox="${e(image.getAttribute('src'))}" data-image-alt="${e(image.alt)}" data-image-caption="${e(caption)}" aria-haspopup="dialog" aria-label="放大图片：${e(image.alt)}">${icon('up')}<span>放大</span></button>`);
  });


  // One native dialog covers project previews and image lightboxes, with built-in focus trapping and Escape.
  document.body.insertAdjacentHTML('beforeend',`<dialog id="viewer-dialog" class="viewer-dialog" aria-labelledby="viewer-title"><div class="dialog-toolbar"><div><span id="viewer-kicker"></span><h2 id="viewer-title"></h2></div><button class="dialog-close" aria-label="关闭弹窗" autofocus>×</button></div><div class="dialog-body"></div></dialog>`);
  const dialog=document.querySelector('#viewer-dialog'),body=dialog.querySelector('.dialog-body');let opener;
  const open=(title,kicker,content,kind)=>{
    opener=document.activeElement;dialog.querySelector('#viewer-title').textContent=title;dialog.querySelector('#viewer-kicker').textContent=kicker;body.innerHTML=content;dialog.classList.toggle('image-dialog',kind==='image');dialog.showModal();document.body.classList.add('dialog-open');
  };
  dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('keydown',event=>{
    if(event.key!=='Tab')return;
    const focusable=[...dialog.querySelectorAll('a[href],button:not(:disabled),[tabindex="0"]')].filter(el=>el.getClientRects().length&&!el.closest('[inert]'));
    const first=focusable[0],last=focusable.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  });
  dialog.addEventListener('close',()=>{document.body.classList.remove('dialog-open');body.innerHTML='';if(opener?.isConnected)opener.focus({preventScroll:true});});
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();});
  document.addEventListener('click',event=>{
    const preview=event.target.closest('[data-preview]');
    if(preview){const p=data.projects.find(p=>p.slug===preview.dataset.preview);if(!p)return;open(p.title,'PROJECT PREVIEW / 项目预览',`<div class="preview-layout"><div class="preview-cover">${img(p.cover,p.coverAlt)}</div><div class="preview-copy"><span class="preview-category">${e(p.category)}</span>${isEditorialPlaceholder(p.summary)?'':`<p>${e(p.summary)}</p>`}<div class="tags">${p.tags.map(t=>`<span>${e(t)}</span>`).join('')}</div><dl><div><dt>项目时间</dt><dd>${e(p.time)}</dd></div><div><dt>个人角色</dt><dd>${e(p.role)}</dd></div><div><dt>使用工具</dt><dd>${e(p.tools)}</dd></div></dl></div></div><div class="dialog-actions"><a class="button" href="/portfolio/projects/${e(p.slug)}/">查看完整详情 ${icon('arrow')}</a>${newTab('新标签页打开','/portfolio/projects/'+p.slug+'/')}</div>`,'project');return;}
    const image=event.target.closest('[data-lightbox]');
    if(image){const angle=Number(image.dataset.imageRotation)||0;const turn=[-90,90].includes(angle)?' award-rotated':angle===180?' award-half':'';open(image.dataset.imageCaption||'图片预览','IMAGE VIEWER / 图片预览',`<div class="lightbox-image${turn}" style="--award-angle:${[-90,90,180].includes(angle)?angle:0}deg">${img(image.dataset.lightbox,image.dataset.imageAlt||'工程图片')}</div><div class="lightbox-caption"><p>${e(image.dataset.imageAlt)}</p>${newTab('新标签页查看原图',image.dataset.lightbox)}</div>`,'image');}
  });
  function safeImage(value){return e(value||'/portfolio/assets/assembly.svg');}
}
