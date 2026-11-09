const safeImage=src=>{try{const url=new URL(src,location.origin);return src&&['http:','https:'].includes(url.protocol)?url.href:'';}catch{return '';}};

export function photoMarkup(about,{e,icon}) {
  const photos=(Array.isArray(about.photos)?about.photos:[]).filter(p=>safeImage(p.src));
  if(!photos.length&&safeImage(about.portrait))photos.push({src:about.portrait,alt:about.portraitAlt||'个人照片',caption:'个人照片',position:'50% 0%'});
  if(!photos.length)return '<figure class="home-photo"><div class="home-photo-empty"><span>照片</span><small>个人照片待补充</small></div></figure>';
  const images=photos.map((p,i)=>{
    const position=/^\d{1,3}% \d{1,3}%$/.test(p.position||'')?p.position:'50% 50%';
    return '<div class="photo-slide" data-photo-card="'+i+'" data-depth="'+Math.min(i,2)+'" aria-hidden="'+(i!==0)+'" role="group" aria-roledescription="照片" aria-label="第 '+(i+1)+' 张，共 '+photos.length+' 张：'+e(p.caption||'个人照片')+'" data-caption="'+e(p.caption||'个人照片')+'"><img src="'+e(safeImage(p.src))+'" alt="'+e(p.alt||p.caption||'个人照片')+'" style="object-position:'+e(position)+'" '+(i===0?'fetchpriority="high"':'loading="lazy"')+' draggable="false"></div>';
  }).join('');
  const dots=photos.length>1?'<div class="photo-dots" role="group" aria-label="选择个人照片">'+photos.map((p,i)=>'<button aria-label="切换到第 '+(i+1)+' 张：'+e(p.caption||'个人照片')+'" aria-pressed="'+(!i)+'" data-photo-index="'+i+'"><span></span></button>').join('')+'</div>':'';
  const arrows=photos.length>1?'<button class="photo-arrow photo-prev" aria-label="上一张照片">‹</button><button class="photo-arrow photo-next" aria-label="下一张照片">›</button>':'';
  return '<figure class="home-photo photo-carousel" aria-label="'+e(about.name)+'的个人相册" aria-roledescription="堆叠式轮播图"><div class="photo-stage"><div class="photo-track" tabindex="0" role="group" aria-label="堆叠照片，左右滑动或按方向键切换">'+images+'</div><button class="photo-zoom" data-lightbox="'+e(safeImage(photos[0].src))+'" data-image-alt="'+e(photos[0].alt||'个人照片')+'" data-image-caption="'+e(photos[0].caption||'个人照片')+'" aria-haspopup="dialog" aria-label="放大当前照片">'+icon('up')+'</button>'+arrows+dots+'</div><span class="sr-only photo-counter" role="status" aria-live="polite">第 1 张，共 '+photos.length+' 张</span></figure>';
}

export function mountPhotoCarousel() {
  document.querySelectorAll('.photo-carousel').forEach(root=>{
    const track=root.querySelector('.photo-track'),slides=[...root.querySelectorAll('.photo-slide')],dots=[...root.querySelectorAll('[data-photo-index]')],zoom=root.querySelector('.photo-zoom');
    let selected=0,moving=false,drag=null;
    const reduced=()=>document.documentElement.classList.contains('reduce-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pose=x=>{root.style.setProperty('--photo-drag-x',x+'px');root.style.setProperty('--photo-drag-angle',(x*.045)+'deg');};
    const render=()=>{
      slides.forEach((slide,i)=>{
        const depth=(i-selected+slides.length)%slides.length;
        slide.dataset.depth=String(Math.min(depth,2));slide.style.zIndex=String(slides.length-depth);
        slide.setAttribute('aria-hidden',String(i!==selected));slide.classList.remove('is-leaving');
      });
      dots.forEach((dot,i)=>dot.setAttribute('aria-pressed',String(i===selected)));
      root.querySelector('.photo-counter').textContent='第 '+(selected+1)+' 张，共 '+slides.length+' 张';
      const image=slides[selected].querySelector('img');
      zoom.dataset.lightbox=image.src;zoom.dataset.imageAlt=image.alt;zoom.dataset.imageCaption=slides[selected].dataset.caption;
      root.dataset.photoIndex=String(selected);pose(0);
    };
    const select=(index,direction=-1)=>{
      if(moving||!Number.isFinite(index)||!track.clientWidth)return;
      const next=(index+slides.length)%slides.length;
      if(next===selected){pose(0);return;}
      if(reduced()){selected=next;render();return;}
      moving=true;root.classList.add('is-animating');
      slides[selected].classList.add('is-leaving');pose(direction*(track.clientWidth+80));
      // The front card exits, then the next card rises from the fan.
      setTimeout(()=>{selected=next;root.classList.remove('is-animating');render();moving=false;},280);
    };
    root.querySelector('.photo-prev')?.addEventListener('click',()=>select(selected-1,1));
    root.querySelector('.photo-next')?.addEventListener('click',()=>select(selected+1,-1));
    dots.forEach((dot,i)=>dot.addEventListener('click',()=>select(i,i>selected?-1:1)));
    track.addEventListener('keydown',event=>{
      let next;if(event.key==='ArrowRight')next=selected+1;if(event.key==='ArrowLeft')next=selected-1;if(event.key==='Home')next=0;if(event.key==='End')next=slides.length-1;
      if(next!==undefined){event.preventDefault();select(next,event.key==='ArrowLeft'||event.key==='Home'?1:-1);}
    });
    track.addEventListener('pointerdown',event=>{
      if(moving||slides.length<2||!event.isPrimary||(event.pointerType==='mouse'&&event.button!==0))return;
      drag={id:event.pointerId,x:event.clientX,y:event.clientY,dx:0,active:false,card:Number(event.target.closest('[data-photo-card]')?.dataset.photoCard??selected)};
      track.setPointerCapture(event.pointerId);
    });
    track.addEventListener('pointermove',event=>{
      if(!drag||drag.id!==event.pointerId)return;
      const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
      if(!drag.active&&Math.abs(dx)>7&&Math.abs(dx)>Math.abs(dy)){drag.active=true;root.classList.add('is-dragging');}
      if(drag.active){drag.dx=dx;pose(dx);}
    });
    const endDrag=(event,cancelled=false)=>{
      if(!drag||event.pointerId!==drag.id)return;
      const completed=drag;drag=null;root.classList.remove('is-dragging');
      if(track.hasPointerCapture(event.pointerId))track.releasePointerCapture(event.pointerId);
      if(cancelled){pose(0);return;}
      if(completed.active&&Math.abs(completed.dx)>Math.min(65,track.clientWidth*.2))select(selected+(completed.dx<0?1:-1),Math.sign(completed.dx));
      else if(!completed.active&&completed.card!==selected)select(completed.card,completed.card>selected?-1:1);
      else pose(0);
    };
    track.addEventListener('pointerup',event=>endDrag(event));
    track.addEventListener('pointercancel',event=>endDrag(event,true));
    track.addEventListener('lostpointercapture',event=>endDrag(event,true));
    render();
  });
}

