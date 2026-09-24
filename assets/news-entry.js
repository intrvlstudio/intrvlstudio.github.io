export function initPublicNewsEntry(admin){
 let link=document.getElementById('public-news-entry');if(!admin){link?.remove();return}if(link)return;
 link=document.createElement('a');link.id='public-news-entry';link.className='public-news-entry';link.href='news-admin.html';link.textContent='官網活動消息：發文／上圖 ↗';document.querySelector('.topbar')?.after(link);
}
