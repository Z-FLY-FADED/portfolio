// Public reads only. No privileged key or upload operation belongs in this module.
export function validContent(value) {
  return !!value?.site && !!value.home && !!value.about && Array.isArray(value.projects) && value.projects.length>0;
}
export async function loadContent({localPreview=false}={}) {
  const fallback=async()=>{
    const response=await fetch('/portfolio/content.json',{cache:'no-cache'});
    if(!response.ok)throw Error('网站内容暂时无法加载，请刷新重试。');
    const value=await response.json();
    if(!validContent(value))throw Error('网站内容格式不完整。');
    return value;
  };
  if(localPreview)return fallback();
  try {
    const config=await fetch('/portfolio/cloud-config.json',{cache:'no-cache'}).then(r=>r.ok?r.json():{});
    if(!config.supabaseUrl||!config.publishableKey)return fallback();
    const origin=new URL(config.supabaseUrl);
    if(origin.protocol!=='https:'||!origin.hostname.endsWith('.supabase.co'))throw Error('云端地址格式无效。');
    if(!config.publishableKey.startsWith('sb_publishable_'))throw Error('前台必须使用 Supabase publishable key。');
    const endpoint=new URL('/rest/v1/site_content',origin);
    endpoint.search=new URLSearchParams({id:'eq.'+(config.contentId||'portfolio'),select:'document',is_published:'eq.true',limit:'1'});
    const response=await fetch(endpoint,{headers:{apikey:config.publishableKey},signal:AbortSignal.timeout(5000),cache:'no-cache'});
    if(!response.ok)throw Error('云端内容暂时不可用。');
    const rows=await response.json();
    if(!validContent(rows[0]?.document))throw Error('云端尚未发布网站内容。');
    return rows[0].document;
  } catch(error) {
    console.warn('云端内容未载入，使用随站点发布的内容。',error.message);
    return fallback();
  }
}
