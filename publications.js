export function publicationsMarkup(data,{e,icon}) {
  const papers=(Array.isArray(data.publications)?data.publications:[]).filter(p=>p&&typeof p.title==='string'&&p.title.trim());
  const safeUrl=value=>{try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)?url.href:'';}catch{return '';}};
  const cards=papers.map((paper,i)=>{
    const doi=String(paper.doi||'').trim();
    const url=safeUrl(paper.url)||(/^10\.\d{4,9}\/\S+$/i.test(doi)?`https://doi.org/${encodeURIComponent(doi)}`:'');
    const meta=[paper.publicationType,paper.authorRole].filter(Boolean);
    return `<article class="home-paper-card"><span class="home-paper-index" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><div class="home-paper-body"><h3 lang="en">${url?`<a class="home-paper-title-link" href="${e(url)}" target="_blank" rel="noopener noreferrer" title="在新标签页打开期刊论文页面">${e(paper.title)}<span aria-hidden="true"> ${icon('up')}</span><span class="sr-only">（在新标签页打开）</span></a>`:e(paper.title)}</h3>${paper.titleZh?`<p class="home-paper-title-zh" lang="zh-CN">${e(paper.titleZh)}</p>`:''}</div><div class="home-paper-details"><p class="home-paper-meta">${meta.map(e).join(' · ')}</p>${paper.year?`<span class="home-paper-year">${e(paper.year)}</span>`:''}</div></article>`;
  }).join('');
  return `<section class="home-publications" id="publications" aria-labelledby="home-publications-title"><div class="home-projects-heading"><div><span>RESEARCH & PUBLICATIONS</span><h2 id="home-publications-title">发表论文</h2></div>${papers.length?`<span class="home-publication-count">${papers.length} 篇论文</span>`:''}</div>${papers.length?`<div class="home-publications-grid">${cards}</div>`:'<p class="home-publications-empty">论文信息整理中。</p>'}</section>`;
}
