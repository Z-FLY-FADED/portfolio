const researchTopics=[
  {
    name:'二甲醚重整制氢',
    matches:/(?=.*(?:二甲醚|dimethyl ether|\bDME\b)).*(?:重整|reform)/i,
    art:'reformer',
    alt:'二甲醚重整反应器概念剖面，显示筒体、内部通道与流向。'
  },
  {
    name:'人形机器人运动',
    matches:/(?=.*(?:人形机器人|humanoid)).*(?:运动|步态|locomotion|gait|motion)/i,
    art:'locomotion',
    alt:'人形机器人迈步概念图，以淡色姿态、足迹和虚线轨迹示意运动方向。'
  }
];

function researchMap(papers) {
  const topics=researchTopics.map(({name,matches,art,alt})=>{
    const links=papers.map((paper,index)=>{
      if(!matches.test(`${paper.title} ${paper.titleZh||''}`))return '';
      const number=String(index+1).padStart(2,'0');
      return `<a href="#paper-${number}" aria-label="跳转到论文 ${number}">${number}</a>`;
    }).join('');
    return links?`<div class="publication-topic">
      <div class="publication-topic-header"><h3>${name}</h3><div class="publication-topic-links">${links}</div></div>
      <img class="publication-topic-art" src="/portfolio/assets/research/${art}.svg" alt="${alt}" width="360" height="200" loading="lazy" decoding="async">
    </div>`:'';
  }).join('');
  return topics?`<aside class="publication-map" aria-label="论文研究方向" data-visual>${topics}</aside>`:'';
}

export function publicationsMarkup(data,{e,icon}) {
  const papers=(Array.isArray(data.publications)?data.publications:[]).filter(p=>p&&typeof p.title==='string'&&p.title.trim());
  if(!papers.length)return '';
  const safeUrl=value=>{try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)?url.href:'';}catch{return '';}};
  const cards=papers.map((paper,i)=>{
    const doi=String(paper.doi||'').trim();
    const url=safeUrl(paper.url)||(/^10\.\d{4,9}\/\S+$/i.test(doi)?`https://doi.org/${encodeURIComponent(doi)}`:'');
    const meta=[paper.publicationType,paper.authorRole].filter(Boolean);
    const number=String(i+1).padStart(2,'0');
    return `<article class="home-paper-card" id="paper-${number}" tabindex="-1">
      <span class="home-paper-index" aria-hidden="true">${number}</span>
      <div class="home-paper-body">
        <h3 lang="en">${url?`<a class="home-paper-title-link" href="${e(url)}" target="_blank" rel="noopener noreferrer" title="在新标签页打开期刊论文页面">${e(paper.title)}<span aria-hidden="true"> ${icon('up')}</span><span class="sr-only">（在新标签页打开）</span></a>`:e(paper.title)}</h3>
        ${paper.titleZh?`<p class="home-paper-title-zh" lang="zh-CN">${e(paper.titleZh)}</p>`:''}
      </div>
      <div class="home-paper-details"><p class="home-paper-meta">${meta.map(e).join(' · ')}</p>${paper.year?`<span class="home-paper-year">${e(paper.year)}</span>`:''}</div>
    </article>`;
  }).join('');
  const map=researchMap(papers);
  return `<section class="home-section home-publications" id="publications" aria-labelledby="home-publications-title">
    <div class="container wrap">
      <div class="section-bar"><h2 class="section-title" id="home-publications-title">发表论文</h2><span class="section-count">${papers.length} 篇论文</span></div>
      <div class="publication-layout${map?' publication-layout--mapped':''}">
        ${map}
        <div class="home-publications-grid">${cards}</div>
      </div>
    </div>
  </section>`;
}
