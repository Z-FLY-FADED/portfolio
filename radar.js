// Example series are style previews only, never written into the owner's scores.
export const EXAMPLE_RADAR_SERIES=[[45,50,65,40,55,25,35,90],[70,75,70,80,75,80,65,65]];
const scoreOf=d=>typeof d.score==='number'&&Number.isFinite(d.score)&&d.score>=0&&d.score<=100?d.score:null;
export function radarGeometry(dimensions){
  const count=dimensions.length,center=[320,280],radius=180;
  const at=(index,ratio)=>{const angle=-Math.PI/2+index*Math.PI*2/count;return [center[0]+radius*ratio*Math.cos(angle),center[1]+radius*ratio*Math.sin(angle)];};
  return {at,center,radius,scores:dimensions.map(scoreOf),pointString:ratios=>ratios.map((r,i)=>at(i,r).map(n=>n.toFixed(2)).join(',')).join(' ')};
}
export function radarMarkup(dimensions,selected,e,mode,options={}){
  const {at,center,radius,scores,pointString}=radarGeometry(dimensions),count=dimensions.length;
  const compact=options.compact===true;
  const filled=scores.filter(s=>s!==null).length,demo=mode==='example',values=demo?EXAMPLE_RADAR_SERIES[0]:scores;
  const accessible=dimensions.map((d,i)=>{
    if(compact&&!demo)return scores[i]===null?`${d.label}（未设置）`:d.label;
    return `${d.label}：${demo?'示意 A '+EXAMPLE_RADAR_SERIES[0][i]+'，示意 B '+EXAMPLE_RADAR_SERIES[1][i]:scores[i]===null?'未设置':scores[i]+' / 100'}`;
  }).join('；');
  const axes=dimensions.map((d,i)=>{const [x,y]=at(i,1);return `<line class="radar-axis ${d.id===selected?'selected':''}" x1="${center[0]}" y1="${center[1]}" x2="${x}" y2="${y}"/>`;}).join('');
  const frame=compact?`<defs>
      <linearGradient id="compact-radar-fill" x1="0" y1="0" x2="0" y2="1">
        <stop stop-color="#5289ed" stop-opacity=".52"/>
        <stop offset="1" stop-color="#55cde0" stop-opacity=".24"/>
      </linearGradient>
    </defs>
    <g aria-hidden="true">
      <circle class="radar-orbit" cx="${center[0]}" cy="${center[1]}" r="${radius*1.08}"/>
      <polygon class="radar-bed" points="${pointString(Array(count).fill(1))}"/>
      ${dimensions.map((_,i)=>{
        const [x1,y1]=at(i,1.02),[x2,y2]=at(i,1.105);
        return `<line class="radar-register" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
      }).join('')}
    </g>`:'';
  const labels=dimensions.map((d,i)=>{
    let [x,y]=at(i,compact?1.22:1.29);if(i===2)x=compact?528:x-18;if(i===6&&compact)x=112;
    const anchor=i===0||i===count/2?'middle':i<count/2?'start':'end';
    return `<g class="radar-axis-label ${d.id===selected?'selected':''}" aria-hidden="true"><text class="radar-label ${d.id==='vibecoding'?'radar-label-long':''}" x="${x}" y="${y}" text-anchor="${anchor}"${compact?' dominant-baseline="central"':''}><tspan x="${x}">${e(d.label)}</tspan></text></g>`;
  }).join('');
  return `${demo?'<p class="radar-demo-label">样式示意 · 非个人评分</p>':''}<svg class="skill-radar octagon-radar${compact?' radar-compact':''}" viewBox="0 0 640 560" role="img" aria-label="${demo?'八角样式示意雷达图，非个人评分':'八维个人自评雷达图'}。${e(accessible)}。${demo?'青蓝与橙色的两组数据仅演示样式。':'未填写的维度不按零分处理。'}"><title>八角${demo?'样式示意':'个人能力'}雷达图</title><desc>八条辐射轴和分层八边形网格。${demo?'青蓝实线与橙色虚线轮廓均为样式示例。':'只有八项均填写后才显示完整多边形。'}</desc>
    ${frame}
    ${[.2,.4,.6,.8,1].map(r=>`<polygon class="radar-ring${compact&&r===1?' radar-ring--outer':''}" points="${pointString(Array(count).fill(r))}"/>`).join('')}${axes}
    ${demo?`<polygon class="radar-example-b" points="${pointString(EXAMPLE_RADAR_SERIES[1].map(s=>s/100))}"/>`:''}
    ${demo||filled===count?`<polygon class="radar-value ${demo?'radar-example-a':''}" points="${pointString(values.map(s=>s/100))}"/>`:''}
    ${values.map((s,i)=>{
      if(s===null)return '';
      const [x,y]=at(i,s/100);
      const halo=compact?`<circle class="radar-point-halo" cx="${x}" cy="${y}" r="9" aria-hidden="true"/>`:'';
      return `${halo}<circle class="radar-point ${dimensions[i].id===selected?'selected':''}" cx="${x}" cy="${y}" r="${compact?5:4}"><title>${e(dimensions[i].label)}</title></circle>`;
    }).join('')}
    ${labels}
    ${!demo&&filled===0?`<rect class="radar-empty-bg" x="250" y="260" width="140" height="40" rx="7"/><text class="radar-empty" x="320" y="285" text-anchor="middle">${options.compact?'评分待补充':'等待你的能力画像'}</text>`:''}
    </svg>`;
}
