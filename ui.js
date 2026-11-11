// BlueLab components: independently implemented from the design references in 设计参考与改进.md.
export const isEditorialPlaceholder=value=>/^\s*\[(?:在此|填写|基础[：:]|应用[：:]|沉淀[：:]|项目介绍占位|项目经历待补充)/.test(String(value??''))||/占位\s*·\s*替换/.test(String(value??''));
export const publicProjects=projects=>projects.filter(project=>
  String(project.title||'').trim()&&!/项目占位|占位模板/.test(project.title)&&!isEditorialPlaceholder(project.summary)
);
const categoryQuery=category=>category?`?${new URLSearchParams({category})}`:'';
export const projectHref=(slug,category)=>`/portfolio/projects/${slug}/${categoryQuery(category)}`;
export const projectArchiveHref=category=>`/portfolio/projects/${categoryQuery(category)}`;

export function projectCard(project,{e,img,icon},index) {
  const href=projectHref(project.slug);
  const number=String(index).padStart(2,'0');
  return `<article class="project-entry" data-category="${e(project.category)}" data-project-slug="${e(project.slug)}">
    <a class="project-entry-link" href="${e(href)}" aria-label="查看详情：${e(project.title)}">
      <div class="project-entry-label"><span aria-hidden="true">${number}</span><span>${e(project.category)}</span></div>
      ${project.cover?`<div class="project-entry-image${project.coverCaption?' project-evidence-image':''}">${img(project.cover,project.coverAlt)}</div>`:''}
      <div class="project-entry-text"><h3>${e(project.title)}</h3>${project.summary?`<p>${e(project.summary)}</p>`:''}<span class="project-entry-detail">查看详情 ${icon('arrow')}</span></div>
    </a>
    <button class="text-link" data-preview="${e(project.slug)}" aria-haspopup="dialog" aria-label="预览${e(project.title)}">预览项目 ${icon('up')}</button>
  </article>`;
}

export function initProjectFilters() {
  const buttons=[...document.querySelectorAll('[data-filter]')];
  if(!buttons.length)return;
  const update=(category,writeUrl)=>{
    const selected=buttons.some(b=>b.dataset.filter===category)?category:'全部';
    for(const button of buttons){const active=button.dataset.filter===selected;button.classList.toggle('active',active);button.setAttribute('aria-pressed',active);}
    let count=0;
    document.querySelectorAll('.archive-page .project-entry').forEach(card=>{
      const matches=card.dataset.category===selected;
      card.hidden=selected!=='全部'&&!matches;
      card.querySelector('.project-entry-link').href=projectHref(card.dataset.projectSlug,matches?selected:'');
      if(!card.hidden)count++;
    });
    document.querySelector('.project-count').textContent=`${count} 个项目`;
    if(writeUrl){const url=new URL(location.href);if(selected==='全部')url.searchParams.delete('category');else url.searchParams.set('category',selected);history.pushState({},'',url);}
  };
  for(const button of buttons)button.addEventListener('click',()=>update(button.dataset.filter,true));
  addEventListener('popstate',()=>update(new URL(location.href).searchParams.get('category'),false));
  update(new URL(location.href).searchParams.get('category'),false);
}

export function enhanceExperience(data,{e,img,icon},project) {
  // These controls are native anchors; opening a new tab happens only on a visitor's click.
  const newTab=(label,href)=>{let url;try{url=new URL(href,location.origin);if(!['http:','https:'].includes(url.protocol))return '';}catch{return '';}return `<a class="utility-link" href="${e(url.href)}" target="_blank" rel="noopener noreferrer">${icon('up')}${e(label)}<span class="sr-only">（新标签页）</span></a>`;};
  if(project){
    const source=project.sourceArchive;
    const archivePath=new URL(`./files/project-sources/${project.slug}.zip`,import.meta.url).pathname;
    const sourceLink=source?.url===archivePath
      ? `<a class="button secondary project-source-download" href="${e(source.url)}" download="${e(project.slug)}.zip" data-source-download>${icon('download')} ${e(source.label||'下载源文件')}</a>`
      : project.sourceArchivePending ? '<span class="project-source-pending">工程源文件待补充</span>' : '';
    document.querySelector('.detail-top').insertAdjacentHTML('beforeend',`<div class="detail-utilities">${sourceLink}${newTab('新标签页打开本项目',location.pathname+location.search)}</div>`);
    const hasPlayback=project.simulations.some(item=>item.playback);
    const simulations=['module-5','sim',hasPlayback?'数据回放':'仿真展示'];
    const quickLinks=[...(hasPlayback?[simulations]:[]),['project-briefing','grid','项目汇报'],['module-3','cube','三维模型'],['module-4','grid','项目图档'],...(!hasPlayback?[simulations]:[]),['module-6','code','技术实现']]
      .filter(([id])=>document.getElementById(id))
      .map(([id,mark,label])=>`<a href="#${id}">${icon(mark)} ${label}</a>`).join('');
    if(quickLinks)document.querySelector('.detail-heading .tags').insertAdjacentHTML('afterend',`<div class="detail-quick-links">${quickLinks}</div>`);
    document.querySelector('.header').insertAdjacentHTML('beforeend','<div class="reading-progress" aria-hidden="true"><span></span></div>');
    const progress=document.querySelector('.reading-progress>span');let queued=false;
    const updateProgress=()=>{const height=document.documentElement.scrollHeight-innerHeight;progress.style.width=(height>0?Math.min(100,Math.max(0,scrollY/height*100)):0)+'%';queued=false;};
    addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(updateProgress);}},{passive:true});addEventListener('resize',updateProgress);updateProgress();
    const links=[...document.querySelectorAll('.detail-toc>a')];
    if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){for(const link of links){const current=link.hash==='#'+entry.target.id;link.classList.toggle('current-section',current);if(current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');}}},{rootMargin:'-12% 0px -65% 0px'});document.querySelectorAll('.detail-section').forEach(section=>observer.observe(section));}
  }
  document.querySelectorAll('.image-gallery figure,.detail-cover,.model-viewer,.simulation [role="tabpanel"]:not(:has(.project-trace)),.trace-poster').forEach(container=>{
    const image=container.querySelector('img');if(!image)return;
    const caption=(container.querySelector('[data-evidence-title]')||container.querySelector('figcaption,p'))?.textContent||image.alt;
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
    if(preview){
      const p=data.projects.find(p=>p.slug===preview.dataset.preview);if(!p)return;
      const category=new URLSearchParams(location.search).get('category');
      const href=projectHref(p.slug,category===p.category?category:'');
      const facts=[['项目时间',p.time],['个人角色',p.role],['使用工具',p.tools]].filter(([,value])=>String(value??'').trim());
      open(p.title,'项目预览',`<div class="preview-layout"><div class="preview-cover${p.coverCaption?' project-evidence-image':''}">${img(p.cover,p.coverAlt)}</div><div class="preview-copy"><span class="preview-category">${e(p.category)}</span>${isEditorialPlaceholder(p.summary)?'':`<p>${e(p.summary)}</p>`}<div class="tags">${p.tags.map(t=>`<span>${e(t)}</span>`).join('')}</div><dl>${facts.map(([label,value])=>`<div><dt>${label}</dt><dd>${e(value)}</dd></div>`).join('')}</dl></div></div><div class="dialog-actions"><a class="button" href="${e(href)}">查看完整详情 ${icon('arrow')}</a>${newTab('新标签页打开',href)}</div>`,'project');
      return;
    }
    const image=event.target.closest('[data-lightbox]');
    if(image){const angle=Number(image.dataset.imageRotation)||0;const turn=[-90,90].includes(angle)?' award-rotated':angle===180?' award-half':'';open(image.dataset.imageCaption||'图片预览','图片预览',`<div class="lightbox-image${turn}" style="--award-angle:${[-90,90,180].includes(angle)?angle:0}deg">${img(image.dataset.lightbox,image.dataset.imageAlt||'工程图片')}</div><div class="lightbox-caption">${project?'':`<p>${e(image.dataset.imageAlt)}</p>`}${newTab('新标签页查看原图',image.dataset.lightbox)}</div>`,'image');}
  });
  function safeImage(value){return e(value||'/portfolio/assets/assembly.svg');}
}
