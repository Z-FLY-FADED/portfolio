import {isEditorialPlaceholder} from './ui.js';
export const defaultSkillLibrary=()=>({title:'个人 Skill · 软件与知识',entries:[['software-01','[CAD 软件]','软件工具'],['software-02','[仿真软件]','软件工具'],['software-03','[编程工具]','软件工具'],['knowledge-01','[机械设计知识]','专业知识'],['knowledge-02','[有限元知识]','专业知识'],['knowledge-03','[工程制图知识]','专业知识']].map(([id,name,kind])=>({id,name,kind,status:'待配置',level:'待填写',description:kind==='软件工具'?'[填写实际会使用的软件、常用功能与使用场景。]':'[填写已掌握的专业知识、方法与应用范围。]',tasks:[{label:'[基础：填写需要掌握的操作或知识点]',state:'待配置',link:''},{label:'[应用：填写一个真实的实践任务]',state:'待配置',link:''},{label:'[沉淀：填写笔记、案例或验证目标]',state:'待配置',link:''}]}))});
const stateClass=s=>({'学习中':'learning','已掌握':'mastered','进行中':'learning','已完成':'mastered','未开始':'locked','未解锁':'locked'})[s]||'unconfigured';
const visibleValue=value=>typeof value==='string'&&Boolean(value.trim())&&!['待填写','待配置'].includes(value)&&!isEditorialPlaceholder(value);
let libraryInstance=0;
export function mountSkillLibrary(panel,library,{e,icon}){
  const entries=Array.isArray(library?.entries)&&library.entries.length?library.entries:defaultSkillLibrary().entries;
  const instance='skill-library-'+(++libraryInstance);
  const detailId=instance+'-detail';
  const tabId=id=>instance+'-tab-'+id;
  let selected=entries[0].id;
  panel.innerHTML=`<header class="skill-panel-heading"><div><h3>${e(library?.title||'软件与专业技能')}</h3></div></header><div class="skill-tree-root"><div class="skill-core">${icon('grid')}</div><div><strong>技能树</strong><span>软件工具 / 专业知识</span></div></div><div class="skill-tree-nodes" role="tablist" aria-label="软件与专业技能"></div><div class="skill-task-detail" id="${detailId}" role="tabpanel" tabindex="0"></div>`;
  const render=()=>{
    panel.querySelector('.skill-tree-nodes').innerHTML=entries.map((entry,i)=>`<button class="skill-node ${stateClass(entry.status)}" role="tab" id="${e(tabId(entry.id))}" data-library-node="${e(entry.id)}" aria-selected="${entry.id===selected}" aria-controls="${detailId}" tabindex="${entry.id===selected?0:-1}">
      <span class="skill-node-icon" aria-hidden="true">${icon(entry.kind==='软件工具'?['cube','sim','code'][i%3]:'grid')}</span>
      <span class="skill-node-info"><strong>${e(entry.name)}</strong><small>${e(entry.kind)}</small></span>
      ${visibleValue(entry.summary)?`<span class="skill-node-summary">${e(entry.summary)}</span>`:''}
      ${visibleValue(entry.status)?`<span class="node-status"><span></span>${e(entry.status)}</span>`:''}
    </button>`).join('');
    const active=entries.find(entry=>entry.id===selected);
    const tasks=(active.tasks||[]).filter(t=>visibleValue(t.label));
    const complete=tasks.filter(t=>t.state==='已完成').length;
    const detail=panel.querySelector('.skill-task-detail');
    detail.setAttribute('aria-labelledby',tabId(selected));
    const hasDescription=visibleValue(active.description);
    const hasLevel=visibleValue(active.level);
    detail.hidden=!hasDescription&&!tasks.length&&!hasLevel;
    if(detail.hidden){detail.replaceChildren();return;}
    detail.innerHTML=`<div class="quest-heading"><h4>${e(active.name)}${visibleValue(active.status)?`<small>${e(active.status)}</small>`:''}</h4>${hasLevel?`<div class="skill-level-display"><span>掌握程度</span><strong>${e(active.level)}</strong></div>`:''}</div>
      ${hasDescription?`<p class="quest-description">${e(active.description)}</p>`:''}
      ${tasks.length?`<div class="quest-progress"><span>项目实践</span>${complete<tasks.length?`<span>${complete} / ${tasks.length} 个任务已完成</span>`:''}</div>
      <ol class="quest-list">${tasks.map((task,i)=>{
        let url='';
        try {
          const value=new URL(task.link,location.origin);
          if(task.link&&['http:','https:'].includes(value.protocol))url=value.href;
        } catch {}
        return `<li class="quest-item ${stateClass(task.state)}"><span class="quest-check" aria-hidden="true">${task.state==='已完成'?'✓':String(i+1).padStart(2,'0')}</span><span class="quest-label">${url?`<a href="${e(url)}" target="_blank" rel="noopener noreferrer">${e(task.label)} ${icon('up')}</a>`:e(task.label)}</span>${visibleValue(task.state)?`<span class="quest-status">${e(task.state)}</span>`:''}</li>`;
      }).join('')}</ol>`:''}`;
  };
  const select=id=>{if(!entries.some(entry=>entry.id===id))return;selected=id;render();panel.querySelector('[role="tab"][aria-selected="true"]')?.focus();};
  panel.addEventListener('click',event=>{const button=event.target.closest('[data-library-node]');if(button)select(button.dataset.libraryNode);});
  panel.addEventListener('keydown',event=>{const button=event.target.closest('[data-library-node]');if(!button)return;const i=entries.findIndex(entry=>entry.id===button.dataset.libraryNode);let next;if(['ArrowRight','ArrowDown'].includes(event.key))next=(i+1)%entries.length;if(['ArrowLeft','ArrowUp'].includes(event.key))next=(i-1+entries.length)%entries.length;if(event.key==='Home')next=0;if(event.key==='End')next=entries.length-1;if(next!==undefined){event.preventDefault();select(entries[next].id);}});
  render();
}
