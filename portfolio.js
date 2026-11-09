// Presentation enhancements shared by all static pages. Content stays in content.json.
export function mountPortfolio(data, {e, icon}) {
  const route=location.pathname.slice(new URL(".", import.meta.url).pathname.length - 1).replace(/\/+$/,'')||'/';
  document.body.dataset.page=route==='/'?'home':route==='/about'?'about':route==='/projects'?'projects':'detail';
  const nav=document.querySelector('#navigation');
  nav.querySelector('a[href="/portfolio/about/"]').insertAdjacentHTML('beforebegin','<a class="nav-skills" href="/portfolio/about/#skill-map">技能 <small>Skills</small></a>');
  const hero=document.querySelector('.hero-copy');
  if(hero){
    hero.insertAdjacentHTML('afterbegin',`<div class="hero-person"><span class="person-monogram" aria-hidden="true">ZP<span>+</span></span><span>${e(data.about.name)}<small>PERSONAL ENGINEERING PORTFOLIO</small></span></div>`);
    const visual=document.querySelector('.hero-visual');
    visual.querySelector('.visual-label').innerHTML='<span class="canvas-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>MECHANICAL STUDY</span><span class="canvas-mode">示意模型</span>';
    visual.insertAdjacentHTML('beforeend','<span class="canvas-coordinate" aria-hidden="true">X / Y / Z</span>');
  }
  const heading=document.querySelector('.page-heading');
  if(heading)heading.insertAdjacentHTML('beforeend',`<span class="page-watermark" aria-hidden="true">${route==='/about'?'ABOUT':'WORK'}</span>`);
  const portrait=document.querySelector('.portrait-placeholder');
  if(portrait)portrait.innerHTML='<span class="portrait-corner">PROFILE / 01</span><span class="portrait-monogram" aria-hidden="true">ZP<span>+</span></span><span>YOUR PORTRAIT HERE</span><small>个人照片占位</small>';
  const main=document.querySelector('main');
  document.querySelector('.footer-links').insertAdjacentHTML('beforeend',`<a href="#${main.id}" class="back-to-top">回到顶部 ${icon('up')}</a>`);
}
