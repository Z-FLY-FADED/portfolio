// Public reads only. No privileged key or upload operation belongs in this module.
export function validContent(value) {
  return !!value?.site && !!value.home && !!value.about && Array.isArray(value.projects) && value.projects.length>0;
}
export async function loadContent() {
  const fallback=async()=>{
    const response=await fetch('/portfolio/content.json',{cache:'no-cache'});
    if(!response.ok)throw Error('网站内容暂时无法加载，请刷新重试。');
    const value=await response.json();
    if(!validContent(value))throw Error('网站内容格式不完整。');
    return value;
  };
  return fallback();
}
