/* Static host bootstrap. Only the selected run is loaded, in bounded JSON chunks. */
(() => {
  'use strict';
  const lang=()=>window.AtriumI18n?.language||'en';
  const text=(en,zh)=>lang()==='zh'?zh:en;
  const panel=document.createElement('div');panel.className='load-notice';panel.setAttribute('role','status');
  document.querySelector('main').prepend(panel);
  let state='initial', loaded=0,total=0,error='',retry=null;
  function notice(){panel.replaceChildren();const message=document.createElement('span');
    message.textContent=state==='error'?text('Replay loading failed. ', '回放加载失败。')+error:
      state==='done'?text('Replay ready · all saved frames loaded','回放已就绪 · 全部原始帧已加载'):
      text(`Loading replay · ${loaded}/${total||'…'} chunks`, `正在加载回放 · ${loaded}/${total||'…'} 块`);
    panel.append(message);
    if(state==='error'){const button=document.createElement('button');button.textContent=text('Retry','重试');button.onclick=()=>retry?.();panel.append(button);}
    panel.classList.toggle('load-error',state==='error');panel.classList.toggle('load-done',state==='done');
  }
  window.AtriumI18n?.onChange(notice);notice();
  function preparing(value){
    for(const control of document.querySelectorAll?.('main button, main select, main input')||[])
      control.disabled=control.id==='stop'||value;
    if(value)for(const id of ['safe','active','incoming','guides','time','floorCount','queue','guideSafe']){
      const element=document.getElementById(id);if(element)element.textContent='—';
    }
  }
  const controller=new AbortController();window.addEventListener('pagehide',()=>controller.abort(),{once:true});
  async function json(path){const response=await fetch(path,{signal:controller.signal});if(!response.ok)throw Error(`HTTP ${response.status}`);return response.json();}
  function failed(e,again){if(e.name==='AbortError')return;state='error';error=e.message;retry=again;notice();}
  function script(path){return new Promise((resolve,reject)=>{const element=document.createElement('script');element.src=path;element.onload=resolve;element.onerror=()=>{element.remove();reject(Error(text('Could not load viewer script','无法加载绘图脚本')));};document.body.append(element);});}
  async function start(){
    state='initial';error='';preparing(true);notice();
    if(location.protocol==='file:'){failed(Error(text('Serve this folder over HTTP, or upload it to your website.','请使用 HTTP 服务预览此目录，或上传至您的网站。')),start);return;}
    try{
      const manifest=await json('manifest.json');const id=new URLSearchParams(location.search).get('run')||manifest.default_run;
      const selected=manifest.runs.find(r=>r.id===id);if(!selected?.available)throw Error(text('This saved run is unavailable','此运行没有可用回放'));
      total=selected.chunks.length;const [run,first]=await Promise.all([json(selected.meta),total?json(selected.chunks[0]):Promise.resolve([])]);
      loaded=total?1:0;const finished=run.finished;run.frames=first;run.finished=loaded===total?finished:false;
      const boot={run,live:false,static:true,loading:loaded<total,legacy_url:null,
        catalog:manifest.runs.filter(r=>r.available).map(r=>({model:r.model,variant:r.variant,url:`?run=${encodeURIComponent(r.id)}&lang=${lang()}`}))};
      document.getElementById('payload').textContent=JSON.stringify(boot);
      await script('assets/viewer.js');preparing(false);notice();
      async function remainder(){state='loading';error='';notice();
        try{while(loaded<total){const frames=await json(selected.chunks[loaded]);loaded++;
          window.AtriumDebug.appendFrames(frames,{complete:loaded===total,finished});notice();
          await new Promise(resolve=>setTimeout(resolve,0));}
          state='done';notice();
        }catch(e){failed(e,remainder);}
      }
      await remainder();
    }catch(e){failed(e,start);}
  }
  start();
})();
