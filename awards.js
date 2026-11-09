const imageUrl=value=>{try{const url=new URL(value,location.origin);return value&&['http:','https:'].includes(url.protocol)?url.href:'';}catch{return '';}};
const rotation=value=>({'向左旋转90°':-90,'向右旋转90°':90,'旋转180°':180}[value]||0);

export function awardsMarkup(data,{e,icon}) {
  const awards=(Array.isArray(data.awards)?data.awards:[]).filter(a=>a&&a.title&&imageUrl(a.cover));
  if(!awards.length)return '';
  const categories=[...new Set(awards.map(a=>a.type||'其他荣誉'))];
  const slides=awards.map((a,i)=>{
    const angle=rotation(a.imageRotation),src=imageUrl(a.cover),alt=a.coverAlt||a.title;
    const heading=[a.title,a.recognition].filter(Boolean).join(' - ');
    const date=String(a.date||'').trim();
    const ratio=Number(a.imageAspectRatio),aspect=Number.isFinite(ratio)&&ratio>0?ratio:4/3;
    return `<article class="home-award-slide" style="--award-aspect:${aspect}" data-award-type="${e(a.type||'其他荣誉')}"><button class="home-award-image ${Math.abs(angle)===90?'is-sideways':''}" style="--award-angle:${angle}deg" data-lightbox="${e(src)}" data-image-rotation="${angle}" data-image-alt="${e(alt)}" data-image-caption="${e(heading)}" aria-haspopup="dialog" aria-label="放大证书：${e(heading)}"><span class="home-award-picture"><img src="${e(src)}" alt="${e(alt)}" loading="lazy" decoding="async" draggable="false"></span><span class="home-award-zoom" aria-hidden="true">${icon('up')}</span></button><div class="home-award-caption"><h3>${e(heading)}</h3><p class="home-award-date">${date?`<time${/^\d{4}(?:-\d{2}){0,2}$/.test(date)?` datetime="${e(date)}"`:''}>${e(date.replaceAll('-','.'))}</time>`:'日期待补充'}</p></div></article>`;
  }).join('');
  return `<section class="home-awards" id="awards" aria-labelledby="home-awards-title"><div class="home-projects-heading"><div><span>HONORS & AWARDS</span><h2 id="home-awards-title">获得奖项</h2></div><div class="home-awards-heading-actions"><span class="home-awards-total">${awards.length} 张证书</span><a href="#award-gallery-track" data-award-all aria-expanded="false" aria-controls="award-gallery-track"><span>完整奖项</span> ${icon('up')}</a></div></div><div class="home-awards-toolbar"><div class="home-award-filters" role="group" aria-label="证书分类">${['全部',...categories].map((c,i)=>`<button data-award-filter="${e(c)}" aria-pressed="${!i}">${e(c)}</button>`).join('')}</div></div><div class="home-awards-track" tabindex="0" role="region" aria-label="获奖证书图片，使用左右方向键浏览">${slides}</div><div class="home-awards-navigation"><div class="home-awards-progress" aria-hidden="true"><span></span></div><button class="home-awards-autoplay" data-award-autoplay aria-pressed="true" aria-label="暂停奖项自动滚动">暂停滚动</button><span class="home-awards-position" role="status" aria-live="polite" aria-atomic="true"></span><div class="home-awards-arrows"><button data-award-prev aria-label="上一张奖项证书" aria-controls="award-gallery-track">←</button><button data-award-next aria-label="下一张奖项证书" aria-controls="award-gallery-track">→</button></div></div></section>`;
}

export function mountAwardGallery() {
  const root=document.querySelector('.home-awards'),track=root?.querySelector('.home-awards-track');
  if(!track)return;
  track.id='award-gallery-track';
  const slides=[...track.children],prev=root.querySelector('[data-award-prev]'),next=root.querySelector('[data-award-next]'),status=root.querySelector('.home-awards-position'),progress=root.querySelector('.home-awards-progress>span');
  let queued=false,drag=null,suppressClick=false;
  slides.forEach((slide,i)=>slide.dataset.awardIndex=String(i));
  const visible=()=>slides.filter(s=>!s.hidden);
  let loopLength=0;
  const manualMax=()=>{const items=visible(),first=items[0],last=items.at(-1);return first&&last?Math.max(0,last.offsetLeft+last.offsetWidth-first.offsetLeft-track.clientWidth+2):0;};
  const rebuildLoop=()=>{
    const left=loopLength?track.scrollLeft%loopLength:track.scrollLeft;
    track.querySelectorAll('[data-award-copy]').forEach(copy=>copy.remove());
    loopLength=0;track.classList.remove('has-award-loop');
    const items=visible();
    if(!root.classList.contains('is-expanded')&&manualMax()>2){
      const copies=items.map(slide=>{
        const copy=slide.cloneNode(true);copy.dataset.awardCopy='true';copy.setAttribute('aria-hidden','true');
        copy.querySelectorAll('button,a,[tabindex]').forEach(el=>el.setAttribute('tabindex','-1'));
        return copy;
      });
      track.append(...copies);track.classList.add('has-award-loop');
      loopLength=copies[0].offsetLeft-items[0].offsetLeft;
    }
    track.scrollTo({left,behavior:'instant'});
  };
  const reduced=()=>document.documentElement.classList.contains('reduce-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stops=()=>{const items=visible(),start=items[0]?.offsetLeft||0;return items.map(s=>s.offsetLeft-start);};
  const nearestStop=left=>Math.min(manualMax(),stops().reduce((best,x)=>Math.abs(x-left)<Math.abs(best-left)?x:best,0));
  const move=left=>track.scrollTo({left,behavior:reduced()?'instant':'smooth'});
  const adjacent=direction=>{const left=loopLength?track.scrollLeft%loopLength:track.scrollLeft,points=stops();const target=direction>0?points.find(x=>x>left+2):points.findLast(x=>x<left-2);move(Math.max(0,Math.min(manualMax(),target??(direction>0?manualMax():0))));};
  const render=()=>{
    queued=false;const items=visible(),max=manualMax(),left=loopLength?track.scrollLeft%loopLength:track.scrollLeft;
    prev.disabled=left<2;next.disabled=left>=max-2;
    const r=track.getBoundingClientRect(),shown=[...track.children].filter(s=>!s.hidden).map(s=>({i:items.indexOf(slides[Number(s.dataset.awardIndex)]),r:s.getBoundingClientRect()})).filter(s=>Math.min(r.right,s.r.right)-Math.max(r.left,s.r.left)>s.r.width*.5);
    if(shown.length)status.textContent=(shown.length===1?`${shown[0].i+1}`:`${shown[0].i+1}–${shown.at(-1).i+1}`)+` / ${items.length}`;
    else status.textContent=`${items.length} 张证书`;
    progress.style.width=(loopLength?Math.max(5,Math.min(100,left/loopLength*100)):100)+'%';
  };
  const autoButton=root.querySelector('[data-award-autoplay]');
  // Continuous motion is explicitly requested; the site motion toggle still stops it.
  let autoEnabled=!document.documentElement.classList.contains('reduce-motion'),hovered=false,inView=false,manualUntil=0;
  const manual=()=>{manualUntil=Date.now()+2500;};
  const canAdvance=()=>autoEnabled&&inView&&!hovered&&!drag&&!root.classList.contains('is-expanded')&&!document.hidden&&!document.querySelector('dialog[open]')&&!track.contains(document.activeElement)&&Date.now()>manualUntil;
  const updateAuto=()=>{
    autoButton.setAttribute('aria-pressed',String(autoEnabled));
    autoButton.setAttribute('aria-label',autoEnabled?'暂停奖项自动滚动':'开启奖项自动滚动');
    autoButton.textContent=autoEnabled?'暂停滚动':'自动滚动';
    status.setAttribute('aria-live',autoEnabled?'off':'polite');
    root.dataset.autoplay=autoEnabled?'enabled':'disabled';
  };
  autoButton.addEventListener('click',()=>{autoEnabled=!autoEnabled;manualUntil=0;updateAuto();});
  track.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse')hovered=true;});
  track.addEventListener('pointerleave',()=>hovered=false);
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;},{threshold:.15}).observe(root);else inView=true;
  const pixelsPerSecond=180;
  let animationFrame=0,lastFrame=0,autoPosition=null;
  const animate=time=>{
    const elapsed=lastFrame?Math.min(50,time-lastFrame):0;lastFrame=time;
    const running=canAdvance()&&loopLength>0;
    root.dataset.autoplayState=running?'running':'paused';
    if(running){
      if(autoPosition===null||Math.abs(track.scrollLeft-autoPosition)>2)autoPosition=track.scrollLeft%loopLength;
      autoPosition=(autoPosition+pixelsPerSecond*elapsed/1000)%loopLength;
      track.scrollTo({left:autoPosition,behavior:'instant'});
    }else autoPosition=null;
    animationFrame=requestAnimationFrame(animate);
  };
  animationFrame=requestAnimationFrame(animate);
  addEventListener('pagehide',event=>{if(!event.persisted)cancelAnimationFrame(animationFrame);},{once:true});
  const respectMotion=()=>{if(document.documentElement.classList.contains('reduce-motion')){autoEnabled=false;updateAuto();}};
  new MutationObserver(respectMotion).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  updateAuto();
  const schedule=()=>{if(!queued){queued=true;requestAnimationFrame(render);}};
  root.querySelector('[data-award-all]').addEventListener('click',event=>{
    event.preventDefault();manual();
    const link=event.currentTarget,expanded=!root.classList.contains('is-expanded');
    root.classList.toggle('is-expanded',expanded);
    link.setAttribute('aria-expanded',String(expanded));
    link.querySelector('span').textContent=expanded?'收起奖项':'完整奖项';
    root.querySelectorAll('[data-award-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.awardFilter==='全部')));
    slides.forEach(s=>s.hidden=false);
    rebuildLoop();track.scrollTo({left:0,behavior:'instant'});render();
    if(!expanded)root.scrollIntoView({block:'start',behavior:reduced()?'instant':'smooth'});
  });
  prev.addEventListener('click',()=>{manual();adjacent(-1);});
  next.addEventListener('click',()=>{manual();adjacent(1);});
  track.addEventListener('scroll',schedule,{passive:true});
  track.addEventListener('keydown',event=>{
    if(root.classList.contains('is-expanded'))return;
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();manual();
    if(event.key==='Home')move(0);else if(event.key==='End')move(manualMax());else adjacent(event.key==='ArrowRight'?1:-1);
  });
  root.querySelectorAll('[data-award-filter]').forEach(button=>button.addEventListener('click',()=>{
    manual();const category=button.dataset.awardFilter;
    root.querySelectorAll('[data-award-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    slides.forEach(s=>s.hidden=category!=='全部'&&s.dataset.awardType!==category);
    rebuildLoop();track.scrollTo({left:0,behavior:'instant'});render();
  }));
  track.addEventListener('pointerdown',event=>{
    manual();
    if(root.classList.contains('is-expanded')||event.pointerType!=='mouse'||event.button!==0)return;
    drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:track.scrollLeft,active:false};
  });
  track.addEventListener('pointermove',event=>{
    if(!drag||drag.id!==event.pointerId)return;
    const dx=event.clientX-drag.x;
    if(!drag.active&&Math.abs(dx)>7&&Math.abs(dx)>Math.abs(event.clientY-drag.y)){
      drag.active=true;track.classList.add('is-dragging');track.setPointerCapture(event.pointerId);
    }
    if(drag.active){event.preventDefault();track.scrollLeft=drag.left-dx;}
  });
  track.addEventListener('pointerleave',()=>{if(drag&&!drag.active)drag=null;});
  const finish=event=>{
    if(!drag||drag.id!==event.pointerId)return;
    const moved=drag.active;drag=null;track.classList.remove('is-dragging');
    if(track.hasPointerCapture(event.pointerId))track.releasePointerCapture(event.pointerId);
    if(moved){suppressClick=true;move(nearestStop(loopLength?track.scrollLeft%loopLength:track.scrollLeft));setTimeout(()=>suppressClick=false,0);}
  };
  track.addEventListener('pointerup',finish);track.addEventListener('pointercancel',finish);track.addEventListener('lostpointercapture',finish);
  track.addEventListener('click',event=>{if(suppressClick){event.preventDefault();event.stopPropagation();suppressClick=false;}},true);
  // Uploaded replacement images can have a new shape; keep originals and loop copies in sync.
  let layoutQueued=false;
  const syncAspect=image=>{
    if(!image.naturalWidth||!image.naturalHeight)return;
    const card=image.closest('.home-award-slide'),original=slides[Number(card?.dataset.awardIndex)];
    if(!original)return;
    const sideways=Math.abs(Number(original.querySelector('.home-award-image').dataset.imageRotation))===90;
    const ratio=sideways?image.naturalHeight/image.naturalWidth:image.naturalWidth/image.naturalHeight;
    if(Math.abs(Number(original.style.getPropertyValue('--award-aspect'))-ratio)<.00001)return;
    original.style.setProperty('--award-aspect',String(ratio));
    if(!layoutQueued){layoutQueued=true;requestAnimationFrame(()=>{layoutQueued=false;rebuildLoop();autoPosition=null;render();});}
  };
  track.addEventListener('load',event=>{if(event.target.matches('.home-award-picture img'))syncAspect(event.target);},true);
  slides.forEach(slide=>syncAspect(slide.querySelector('img')));
  if('ResizeObserver'in window)new ResizeObserver(()=>{rebuildLoop();autoPosition=null;schedule();}).observe(track);
  rebuildLoop();render();
}
