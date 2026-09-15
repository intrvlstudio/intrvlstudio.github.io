import { auth, db, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, serverTimestamp } from './auth.js';
const root = document.getElementById('formsTool');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uniform = { id: 'uniform-sizes', title: '工作服尺寸', description: '請以公分（cm）填寫尺寸、公斤（kg）填寫體重。肩寬、胸圍、衣長與袖長請量測合身衣物；胸圍填一圈的尺寸。背後名字將依填寫內容印製，請確認大小寫。', open: true, fields: [
  ...['身高（cm）','體重（kg）','肩寬（cm）','胸圍（cm）','衣長（cm）','袖長（cm）'].map(label => ({label, type:'number', required:true, options:[]})),
  {label:'衣服重量類型',type:'select',required:true,options:['輕量','一般','厚重','無偏好']},
  {label:'想印在衣服背後的名字',type:'text',required:true,options:[]}
]};
let admin = false, forms = [], active, generation = 0;
function message(text) { root.querySelector('[role="status"]').textContent = text; }
function frame(body) { root.innerHTML = `<div class="form-tool-actions"><button type="button" data-action="list">← 表單列表</button></div>${body}<p role="status" aria-live="polite"></p>`; }
function error(e) { message(e.code === 'permission-denied' ? '目前沒有存取權限，請聯絡管理員確認表單資料庫規則已發布。' : '讀取或儲存失敗，請確認網路連線後重試。'); }
export async function initForms(isAdmin) { admin = isAdmin; await list(); }
async function list() {
  const token = ++generation;
  frame('<h2>員工表單</h2><p>集中填寫工作室需要的資料；送出後可回來修改自己的回覆。</p><div id="formList">載入中…</div>');
  try {
    const snap = await getDocs(collection(db,'forms'));
    if (token !== generation) return;
    forms = snap.docs.map(d => ({...d.data(),id:d.id}));
    if (!forms.some(f => f.id === uniform.id)) forms.unshift(uniform);
    root.querySelector('#formList').innerHTML = (admin ? '<button data-action="create">＋ 新增表單</button>' : '') + forms.map(f => `<article class="form-tool-card"><div><h3>${esc(f.title)}</h3><p>${esc(f.description)}</p><span>${f.open ? '開放填寫' : '已截止'}</span></div><div class="form-tool-actions"><button data-action="fill" data-id="${esc(f.id)}">${f.open ? '填寫／修改回覆' : '查看我的回覆'}</button>${admin ? `<button data-action="responses" data-id="${esc(f.id)}">查看回覆</button><button data-action="toggle" data-id="${esc(f.id)}">${f.open ? '截止收件' : '重新開放'}</button>` : ''}</div></article>`).join('');
  } catch(e) { root.querySelector('#formList').textContent = ''; error(e); }
}
async function fill(id) {
  const token = ++generation;
  active = forms.find(f => f.id === id);
  const f = active;
  frame(`<h2>${esc(f.title)}</h2><p>${esc(f.description)}</p><p>回覆連結至登入帳號：${esc(auth.currentUser.email)}。只有本人及管理員能查看。</p><div id="formAnswer">載入中…</div>`);
  try {
    const snap = await getDoc(doc(db,'forms',id,'responses',auth.currentUser.uid));
    if (token !== generation) return;
    const answers = snap.exists() ? snap.data().answers : [];
    root.querySelector('#formAnswer').innerHTML = `<p>${snap.exists() ? '已填寫，可更新回覆。' : '尚未填寫。'} ${f.open ? '標示 * 的欄位為必填。' : '表單已截止，無法修改。'}</p><form id="answerForm"><fieldset ${f.open ? '' : 'disabled'}><div class="form-tool-grid">${f.fields.map((field,i) => `<label>${esc(field.label)}${field.required ? ' *' : ''}${field.type === 'select' ? `<select name="f${i}" ${field.required ? 'required' : ''}><option value="">請選擇</option>${field.options.map(o => `<option ${answers[i] === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>` : `<input name="f${i}" type="${field.type === 'number' ? 'number' : 'text'}" ${field.type === 'number' ? 'min="0.1" max="1000" step="0.1"' : 'maxlength="200"'} value="${esc(answers[i])}" ${field.required ? 'required' : ''}>`}</label>`).join('')}</div>${f.open ? '<button type="submit">儲存回覆</button>' : ''}</fieldset></form>`;
    root.querySelector('#answerForm').addEventListener('submit', saveAnswer);
  } catch(e) { root.querySelector('#formAnswer').textContent=''; error(e); }
}
async function saveAnswer(event) {
  event.preventDefault();
  const button = event.target.querySelector('button[type="submit"]');
  button.disabled = true; message('儲存中，請稍候…');
  try {
    const data = new FormData(event.target);
    const answers = active.fields.map((f,i) => { const value = String(data.get('f'+i) || '').trim(); if (f.required && !value) throw new Error('required'); return f.type === 'number' && value !== '' ? Number(value) : value; });
    await setDoc(doc(db,'forms',active.id,'responses',auth.currentUser.uid), {answers, email:auth.currentUser.email || '', updatedAt:serverTimestamp()});
    message('回覆已儲存。你可以在截止前回來修改。');
  } catch(e) { if(e.message === 'required') message('請填寫所有必填欄位，不可只輸入空白。'); else error(e); }
  finally { button.disabled = false; }
}
function create() {
  ++generation;
  frame('<h2>新增表單</h2><p>可新增最多 20 個欄位。發布後欄位固定，避免已填回覆錯位。</p><form id="createForm"><label>表單名稱 *<input name="title" required maxlength="100"></label><label>填寫說明<textarea name="description" maxlength="2000"></textarea></label><div id="fieldRows"></div><div class="form-tool-actions"><button type="button" id="addField">＋ 新增欄位</button><button type="submit">發布表單</button></div></form>');
  const rows = root.querySelector('#fieldRows');
  function row() {
    if(rows.children.length >= 20) return;
    const el = document.createElement('div'); el.className='form-tool-field';
    el.innerHTML='<label>欄位名稱 *<input data-key="label" required maxlength="100"></label><label>類型<select data-key="type"><option value="text">文字</option><option value="number">數字（0.1–1000）</option><option value="select">單選</option></select></label><label>單選選項（每行一個）<textarea data-key="options" maxlength="2000" disabled></textarea></label><label class="form-tool-check"><input type="checkbox" data-key="required" checked>必填</label><button type="button">移除此欄</button>';
    el.querySelector('select').onchange = e => { const options=el.querySelector('textarea'); options.disabled=e.target.value!=='select'; options.required=!options.disabled; };
    el.querySelector('button').onclick=()=>el.remove(); rows.append(el);
  }
  row(); root.querySelector('#addField').onclick=row;
  root.querySelector('#createForm').onsubmit=async event=>{
    event.preventDefault(); const button=event.target.querySelector('[type="submit"]'); button.disabled=true;
    try {
      const data=new FormData(event.target);
      const fields=Array.from(rows.children, el=>({label:el.querySelector('[data-key="label"]').value.trim(),type:el.querySelector('select').value,required:el.querySelector('[type="checkbox"]').checked,options:el.querySelector('select').value==='select' ? [...new Set(el.querySelector('textarea').value.split('\n').map(s=>s.trim()).filter(Boolean))] : []}));
      if(!String(data.get('title')).trim() || !fields.length || fields.some(f=>!f.label || (f.type==='select' && (!f.options.length || f.options.length>20 || f.options.some(o=>o.length>100))))) { message('請填寫表單名稱及至少一個欄位；單選需 1–20 個選項，每個最多 100 字。'); return; }
      await addDoc(collection(db,'forms'),{title:String(data.get('title')).trim(),description:String(data.get('description')).trim(),fields,open:true,createdAt:serverTimestamp()}); await list(); message('新表單已發布。');
    } catch(e) { error(e); } finally { button.disabled=false; }
  };
}
async function responses(id) {
  const token=++generation, f=forms.find(f=>f.id===id);
  frame(`<h2>${esc(f.title)}：回覆</h2><div id="responseTable">載入中…</div>`);
  try {
    const snap=await getDocs(collection(db,'forms',id,'responses'));
    if(token!==generation)return;
    const headers=['員工帳號','更新時間',...f.fields.map(x=>x.label)];
    const rows=snap.docs.map(d=>{const r=d.data();return [r.email,r.updatedAt?.toDate().toLocaleString('zh-TW') || '',...r.answers];});
    root.querySelector('#responseTable').innerHTML=`<p>共 ${rows.length} 份回覆</p><button id="exportResponses" ${rows.length ? '' : 'disabled'}>匯出 CSV</button><div class="form-tool-table"><table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    root.querySelector('#exportResponses').onclick=()=>{const cell=v=>'"'+String(/^[\s]*[=+@-]/.test(String(v)) ? "'"+v : v).replace(/"/g,'""')+'"';const blob=new Blob(['\ufeff'+[headers,...rows].map(r=>r.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=f.title.replace(/[\\/:*?"<>|]/g,'_')+'-回覆.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  }catch(e){root.querySelector('#responseTable').textContent='';error(e);}
}
root.addEventListener('click',async event=>{
  const b=event.target.closest('[data-action]'); if(!b)return;
  const action=b.dataset.action,id=b.dataset.id;
  if(action==='list')return list();
  if(action==='fill')return fill(id);
  if(!admin)return;
  if(action==='create')return create();
  if(action==='responses')return responses(id);
  if(action==='toggle') {b.disabled=true;try{const f=forms.find(f=>f.id===id);const ref=doc(db,'forms',id);const snap=await getDoc(ref);if(!snap.exists() && id===uniform.id){const {id:unused,...data}=uniform;await setDoc(ref,{...data,open:false,createdAt:serverTimestamp()});}else await updateDoc(ref,{open:!f.open});await list();}catch(e){error(e);b.disabled=false;}}
});
