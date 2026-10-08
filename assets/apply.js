(function(scope){
  const roles=['後製助手','背景助手','上色助手'];
  function prepare(input){
    const limits={name:40,email:254,experience:250,availability:100},data={};
    for(const [key,max] of Object.entries(limits)){
      const raw=String(input[key]??'');
      if(/[\u0000-\u0008\u000b-\u001f\u007f]/.test(raw)||(/[\r\n]/.test(raw)&&['name','email'].includes(key)))throw Error('請移除不支援的控制字元或換行');
      data[key]=raw.trim();if(!data[key]||data[key].length>max)throw Error('請填寫所有必填欄位，並遵守字數限制');
    }
    if(!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(data.email))throw Error('請填寫有效的 Email');
    if(!roles.includes(input.role))throw Error('請選擇應徵職缺');
    const subject=`[INTRVL 應徵] ${input.role} — ${data.name}`;
    const body=`稱呼：${data.name}\nEmail：${data.email}\n應徵職缺：${input.role}\n\n相關經驗與工具：\n${data.experience}\n\n可投入時間與開始日期：\n${data.availability}\n\n請附上 PDF：個人介紹、作品集、工作經歷。`;
    return {subject,body,href:'mailto:intrvlstudio@gmail.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body),gmail:'https://mail.google.com/mail/?view=cm&fs=1&to=intrvlstudio%40gmail.com&su='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body)};
  }
  if(typeof module!=='undefined')module.exports={prepare};
  if(typeof document==='undefined')return;
  const form=document.getElementById('application'),draft=document.getElementById('draft'),error=document.getElementById('form-error');let prepared;
  form.addEventListener('input',()=>{draft.hidden=true;prepared=null;error.textContent='';document.getElementById('draft-mail').removeAttribute('href');document.getElementById('draft-gmail').removeAttribute('href')});
  form.addEventListener('submit',event=>{event.preventDefault();error.textContent='';if(!form.reportValidity())return;try{prepared=prepare(Object.fromEntries(new FormData(form)));document.getElementById('draft-text').textContent='收件人：intrvlstudio@gmail.com\n主旨：'+prepared.subject+'\n\n'+prepared.body;document.getElementById('draft-mail').href=prepared.href;document.getElementById('draft-gmail').href=prepared.gmail;draft.hidden=false;document.getElementById('draft-heading').focus()}catch(e){error.textContent=e.message;draft.hidden=true}});
  document.getElementById('copy-draft').addEventListener('click',async()=>{if(!prepared)return;try{await navigator.clipboard.writeText(document.getElementById('draft-text').textContent);document.getElementById('copy-status').textContent='已複製，請貼入郵件並附上 PDF。'}catch{document.getElementById('copy-status').textContent='請選取上方草稿文字並手動複製。'}});
})(typeof window==='undefined'?globalThis:window);
