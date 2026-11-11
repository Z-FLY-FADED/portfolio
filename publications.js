const researchTopics=[
  {
    name:'二甲醚自热重整制氢',
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

function safeUrl(value) {
  try {
    const url=new URL(value);
    return ['https:','http:'].includes(url.protocol)?url.href:'';
  } catch {return '';}
}

function paperMarkup({paper,number}, heading, {e,icon}) {
  const doi=String(paper.doi||'').trim();
  const url=safeUrl(paper.url)||(/^10\.\d{4,9}\/\S+$/i.test(doi)?`https://doi.org/${encodeURIComponent(doi)}`:'');
  const title=e(paper.title);
  return `<article class="home-paper-card" id="paper-${number}" tabindex="-1">
    <span class="home-paper-index" aria-hidden="true">${number}</span>
    <div class="home-paper-body">
      <${heading} class="home-paper-title" lang="en">${url?`<a class="home-paper-title-link" href="${e(url)}" target="_blank" rel="noopener noreferrer">${title}<span aria-hidden="true"> ${icon('up')}</span><span class="sr-only">（在新标签页打开）</span></a>`:title}</${heading}>
      ${paper.titleZh?`<p class="home-paper-title-zh" lang="zh-CN">${e(paper.titleZh)}</p>`:''}
      ${paper.publicationType||paper.authorRole||paper.year?`<div class="home-paper-details">
        ${paper.publicationType?`<span class="home-paper-type">${e(paper.publicationType)}</span>`:''}
        ${paper.authorRole?`<span>${e(paper.authorRole)}</span>`:''}
        ${paper.year?`<span class="home-paper-year">${e(paper.year)}</span>`:''}
      </div>`:''}
    </div>
  </article>`;
}

export function publicationsMarkup(data,{e,icon}) {
  const papers=(Array.isArray(data.publications)?data.publications:[]).filter(p=>p&&typeof p.title==='string'&&p.title.trim());
  if(!papers.length)return '';

  const groups=new Map();
  papers.forEach((paper,index)=>{
    const topic=researchTopics.find(({matches})=>matches.test(`${paper.title} ${paper.titleZh||''}`));
    if(!groups.has(topic))groups.set(topic,[]);
    groups.get(topic).push({paper,number:String(index+1).padStart(2,'0')});
  });
  const topics=Array.from(groups,([topic,entries])=>{
    const cards=entries.map(entry=>paperMarkup(entry,topic?'h4':'h3',{e,icon})).join('');
    if(!topic)return `<div class="publication-papers publication-papers--standalone">${cards}</div>`;
    const {name,art,alt}=topic;
    const links=entries.map(({number})=>`<a href="#paper-${number}" aria-label="跳转到论文 ${number}">${number}</a>`).join('');
    return `<section class="publication-topic" aria-labelledby="publication-topic-${art}">
      <div class="publication-topic-visual">
        <div class="publication-topic-header">
          <h3 id="publication-topic-${art}">${name}</h3>
          <div class="publication-topic-links">${links}</div>
        </div>
        <img class="publication-topic-art" src="/portfolio/assets/research/${art}.svg" alt="${alt}" width="360" height="200" loading="lazy" decoding="async">
      </div>
      <div class="publication-papers">${cards}</div>
    </section>`;
  }).join('');
  return `<section class="home-section home-publications" id="publications" aria-labelledby="home-publications-title">
    <div class="container wrap">
      <div class="section-bar"><h2 class="section-title" id="home-publications-title">发表论文</h2><span class="section-count">${papers.length} 篇论文</span></div>
      <div class="publication-topics">${topics}</div>
    </div>
  </section>`;
}
