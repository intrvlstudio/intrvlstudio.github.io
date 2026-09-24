export function initDraftPreview(getDraft) {
  const frame=document.getElementById('news-preview-frame'),stage=document.getElementById('preview-stage');
  let width=1200,timer;
  function fit(){
    const doc=frame.contentDocument;if(!doc?.querySelector('.board-items'))return;
    const scale=Math.min(1,stage.clientWidth/width);if(!scale)return;
    frame.style.width=width+'px';frame.style.transform=`scale(${scale})`;frame.style.left=Math.max(0,(stage.clientWidth-width*scale)/2)+'px';
    frame.style.height='1px';
    const height=Math.max(500,doc.querySelector('main').getBoundingClientRect().height+80);frame.style.height=height+'px';
    stage.style.height=Math.ceil(height*scale)+'px';
    frame.style.marginBottom=-(height*(1-scale))+'px';
  }
  function render(){
    const doc=frame.contentDocument,board=doc?.querySelector('.board-items');if(!board)return;
    const draft=getDraft();
    if(draft.title||draft.body||draft.image)board.replaceChildren(window.INTRVLNews.renderPost(draft,doc));
    else{const empty=doc.createElement('p');empty.className='board-empty';empty.textContent='填寫標題、內文或上傳圖片後，這裡會即時顯示草稿。';board.replaceChildren(empty)}
    board.querySelectorAll('img').forEach(img=>{img.onload=fit});fit();
  }
  document.querySelectorAll('[data-preview-device]').forEach(button=>button.addEventListener('click',()=>{
    width=button.dataset.previewDevice==='mobile'?390:1200;
    document.querySelectorAll('[data-preview-device]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    document.getElementById('preview-size').textContent=width===390?'手機 390px':'桌機 1200px';stage.scrollTop=0;fit();
  }));
  frame.addEventListener('load',()=>{render();frame.contentDocument?.fonts?.ready.then(fit)});new ResizeObserver(fit).observe(stage);
  document.getElementById('news-form').addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(render,100)});
  return render;
}
