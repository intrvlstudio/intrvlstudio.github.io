import {auth,onAuthStateChanged,isAdmin,db,collection,doc,getDocs,addDoc,updateDoc,deleteDoc,query,orderBy,serverTimestamp} from './auth.js';
import {drawCrop,compressCrop,instagramUrl} from './news-image.mjs';
const $=id=>document.getElementById(id);let admin=false,editId=null,source=null,savedImage='',imagePending=false,imageGeneration=0,busy=false,posts=[];
const status=text=>$('save-status').textContent=text;
function renderCrop(){if(source)drawCrop($('crop-preview'),source,Number($('crop-ratio').value),Number($('crop-zoom').value),Number($('crop-x').value),Number($('crop-y').value));}
for(const id of ['crop-ratio','crop-zoom','crop-x','crop-y'])$(id).addEventListener('input',renderCrop);
function clearImage(){imageGeneration++;source=null;savedImage='';imagePending=false;$('news-file').value='';$('crop-tools').hidden=true;}
$('remove-image').onclick=clearImage;
$('news-file').onchange=async()=>{
 const file=$('news-file').files[0];if(!file)return;const generation=++imageGeneration;imagePending=true;status('正在讀取圖片…');
 let url;try{if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>25*1024*1024)throw Error('請選擇 25MB 以內的 JPG、PNG 或 WebP');url=URL.createObjectURL(file);const img=new Image();img.src=url;await img.decode();if(generation!==imageGeneration)return;source=img;savedImage='';$('crop-zoom').value=1;$('crop-x').value=$('crop-y').value=.5;$('crop-tools').hidden=false;renderCrop();status(`原圖 ${Math.round(file.size/1024)} KB；發佈時會自動壓縮。`)}catch(e){if(generation===imageGeneration)status(e.message)}finally{if(url)URL.revokeObjectURL(url);if(generation===imageGeneration)imagePending=false}
};
function reset(){editId=null;clearImage();$('news-form').reset();$('news-date').value=new Date().toLocaleDateString('en-CA');$('publish-news').textContent='發佈到官網';status('');}
$('reset-news').onclick=reset;
function lock(value){busy=value;$('news-form').querySelectorAll('input,textarea,select,button').forEach(el=>el.disabled=value);$('published-list').querySelectorAll('button').forEach(el=>el.disabled=value);}
function errorText(e){return e.code==='permission-denied'?'沒有寫入權限。請確認管理員帳號與官網消息的 Firestore 規則已啟用。':`未完成，內容已保留。${e.message||'請檢查網路再試一次。'}`;}
async function refresh(){
 $('list-status').textContent='正在載入…';try{const result=await getDocs(query(collection(db,'publicAnnouncements'),orderBy('createdAt','desc')));posts=result.docs.map(d=>({id:d.id,...d.data()}));$('published-list').replaceChildren();for(const p of posts){const article=document.createElement('article'),heading=document.createElement('h3'),date=document.createElement('p');heading.textContent=p.title;date.textContent=p.date;article.append(heading,date);if(p.image){const img=new Image();img.src=p.image;img.alt=p.title;article.append(img)}const edit=document.createElement('button');edit.type='button';edit.textContent='編輯';edit.onclick=()=>{if(busy)return;reset();editId=p.id;savedImage=p.image||'';$('news-title').value=p.title;$('news-body').value=p.body;$('news-date').value=p.date;$('news-category').value=p.category;$('news-url').value=p.url||'';$('publish-news').textContent='儲存並更新官網';status(savedImage?'保留原圖片；選擇新圖片即可重新裁切。':'');$('news-title').focus();};const remove=document.createElement('button');remove.type='button';remove.textContent='下架';remove.onclick=async()=>{if(busy||!admin||!confirm(`確定下架「${p.title}」？`))return;lock(true);try{await deleteDoc(doc(db,'publicAnnouncements',p.id));if(editId===p.id)reset();await refresh();status('已下架。')}catch(e){status(errorText(e))}finally{lock(false)}};article.append(edit,remove);$('published-list').append(article)}$('list-status').textContent=posts.length?'':'尚未發佈消息。'}catch(e){$('list-status').textContent=errorText(e)}
}
$('news-form').onsubmit=async e=>{e.preventDefault();if(busy||!admin)return;if(imagePending){status('圖片還在讀取，請稍候。');return}lock(true);status('正在壓縮及儲存…');try{
 const url=instagramUrl($('news-url').value),image=source?await compressCrop($('crop-preview')):savedImage;
 const data={title:$('news-title').value.trim(),body:$('news-body').value.trim(),category:$('news-category').value,date:$('news-date').value,url,image,updatedAt:serverTimestamp()};if(!data.title)throw Error('請填寫標題');
 if(editId)await updateDoc(doc(db,'publicAnnouncements',editId),data);else await addDoc(collection(db,'publicAnnouncements'),{...data,createdAt:serverTimestamp()});reset();status(`已發佈。官網重新整理或一分鐘內會更新。${image?' 圖片約 '+Math.round(image.length*.75/1024)+' KB。':''}`);await refresh();
 }catch(e){status(errorText(e))}finally{lock(false)}};
onAuthStateChanged(auth,async user=>{admin=false;$('editor').hidden=true;$('login-link').hidden=!!user;if(!user){$('auth-status').textContent='請先登入管理員帳號。';return}const ok=await isAdmin(user.uid);if(auth.currentUser?.uid!==user.uid)return;admin=ok;$('auth-status').textContent=ok?'官網消息管理':'此帳號沒有官網發文權限。';$('editor').hidden=!ok;if(ok){reset();await refresh()}});
