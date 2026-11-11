export function mountDownloads(data,{e,icon},project){
  const safe=url=>{if(!url)return '';try{const value=new URL(url,location.origin);return ['http:','https:'].includes(value.protocol)?value.href:'';}catch{return '';}};
  const downloadUrl=(url,filename)=>{const value=new URL(url);if(value.hostname.endsWith('.supabase.co')&&value.pathname.startsWith('/storage/v1/object/public/'))value.searchParams.set('download',filename||'');return value.href;};
  const actions=(url,filename,label='资料')=>{const href=safe(url);if(!href)return '';return `<div class="document-actions"><a href="${e(href)}" data-document-view="${e(filename||'资料预览')}" aria-haspopup="dialog" target="_blank" rel="noopener noreferrer">${icon('up')}查看${e(label)}</a><a href="${e(downloadUrl(href,filename))}" download="${e(filename||'')}">${icon('download')}下载${e(label)}</a></div>`;};
  if(data.site.resume&&safe(data.site.resume)){
    document.querySelectorAll('a[href]').forEach(link=>{if(link.textContent.includes('查看')&&link.textContent.includes('简历')&&safe(link.getAttribute('href'))===safe(data.site.resume)){link.insertAdjacentHTML('afterend',`<a class="resume-download" href="${e(downloadUrl(safe(data.site.resume),data.site.resumeFilename||'赵鹏飞-简历.pdf'))}" download="${e(data.site.resumeFilename||'赵鹏飞-简历.pdf')}">${icon('download')}下载简历</a>`);}});
  }
  if(project){const section=document.querySelector('#module-9');if(section){const attachments=(project.attachments||[]).filter(item=>safe(item.url));if(attachments.length){section.querySelector('[data-unset]')?.remove();section.insertAdjacentHTML('beforeend',`<div class="document-list">${attachments.map(item=>`<article class="document-card"><span class="document-icon">${icon('download')}</span><div><h3>${e(item.name||item.filename||'项目资料')}</h3><p>${e(item.description||'公开项目资料')}</p></div>${actions(item.url,item.filename)}</article>`).join('')}</div>`);}}}
  // Downloads are offered only for already displayed, public images.
  const dialog=document.querySelector('#viewer-dialog');
  if(dialog){const observer=new MutationObserver(()=>{const caption=dialog.querySelector('.lightbox-caption');if(!caption||caption.querySelector('[data-image-download]'))return;const image=dialog.querySelector('.lightbox-image img'),href=safe(image?.getAttribute('src'));if(href)caption.insertAdjacentHTML('beforeend',`<a data-image-download class="utility-link" href="${e(downloadUrl(href,''))}" download>${icon('download')}下载图片</a>`);});observer.observe(dialog.querySelector('.dialog-body'),{childList:true});}
  document.addEventListener('click',async event=>{
    const link=event.target.closest('a[download],a[data-document-view]');
    if(!link||link.hasAttribute('data-source-download')||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    const url=new URL(link.href);
    if(!['http:','https:'].includes(url.protocol))return;
    event.preventDefault();
    if(link.getAttribute('aria-busy')==='true')return;
    const preview=link.hasAttribute('data-document-view');
    const filename=link.download||link.dataset.documentView||url.pathname.split('/').pop()||'download';
    const toast=document.querySelector('.toast');
    const message=text=>{if(!toast)return;toast.textContent=text;toast.classList.add('visible');setTimeout(()=>toast.classList.remove('visible'),5000);};
    const get=async address=>{const response=await fetch(address,{signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('文件未能获取');return response.blob();};
    let previewBody;
    if(preview&&dialog){
      dialog.classList.remove('image-dialog');dialog.querySelector('#viewer-title').textContent=filename;
      dialog.querySelector('#viewer-kicker').textContent='DOCUMENT PREVIEW / 资料预览';
      previewBody=dialog.querySelector('.dialog-body');previewBody.innerHTML='<p class="document-loading">正在加载资料…</p>';
      dialog.showModal();document.body.classList.add('dialog-open');
      dialog.addEventListener('close',()=>{if(link.isConnected)link.focus({preventScroll:true});},{once:true});
    }
    link.setAttribute('aria-busy','true');
    try{
      let blob;
      try{blob=await get(url.href);}
      catch(error){
        const prefix='/storage/v1/object/public/portfolio-files/';
        if(!url.hostname.endsWith('.supabase.co')||!url.pathname.startsWith(prefix))throw error;
        // A static mirror exists only for files also included in the GitHub publication.
        blob=await get('/'+url.pathname.slice(prefix.length));
      }
      if(preview&&previewBody){
        if(!dialog.open)return;
        const extension=filename.split('.').pop().toLowerCase();
        if(['txt','md','csv','json','log'].includes(extension)||blob.type.startsWith('text/')){
          const pre=document.createElement('pre');pre.className='document-text';pre.textContent=await blob.text();previewBody.replaceChildren(pre);
        }else if(extension==='pdf'||blob.type==='application/pdf'){
          const objectUrl=URL.createObjectURL(blob),frame=document.createElement('iframe');frame.className='document-frame';frame.title=filename;frame.src=objectUrl;previewBody.replaceChildren(frame);dialog.addEventListener('close',()=>URL.revokeObjectURL(objectUrl),{once:true});
        }else{
          previewBody.innerHTML='<p class="document-loading">此格式暂不支持站内预览，可下载后使用对应软件查看。</p>';
        }
        if(dialog.open)previewBody.insertAdjacentHTML('beforeend',`<div class="document-preview-actions"><a class="button" href="${e(downloadUrl(url.href,filename))}" download="${e(filename)}">${icon('download')}下载资料</a></div>`);
        return;
      }
      const objectUrl=URL.createObjectURL(blob),anchor=document.createElement('a');
      anchor.href=objectUrl;anchor.download=filename;anchor.hidden=true;document.body.append(anchor);anchor.click();anchor.remove();
      setTimeout(()=>URL.revokeObjectURL(objectUrl),60000);
      message('文件已准备，请查看浏览器的下载列表。');
    }catch{if(previewBody&&dialog.open)previewBody.innerHTML='<p class="document-loading">资料暂时无法载入，请稍后重试。</p>';else message('资料暂时无法下载，请稍后重试，或点击“查看资料”预览。');}
    finally{link.removeAttribute('aria-busy');}
  });
}
