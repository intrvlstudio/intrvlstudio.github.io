export function cropRect(width,height,ratio,zoom=1,x=.5,y=.5){
 let w=width,h=width/ratio;if(h>height){h=height;w=h*ratio}w/=zoom;h/=zoom;
 return {sx:(width-w)*x,sy:(height-h)*y,sw:w,sh:h};
}
export function drawCrop(canvas,image,ratio,zoom,x,y,maxWidth=1080){
 const r=cropRect(image.naturalWidth,image.naturalHeight,ratio,zoom,x,y);
 canvas.width=Math.min(maxWidth,Math.round(r.sw));canvas.height=Math.max(1,Math.round(canvas.width/ratio));
 const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,r.sx,r.sy,r.sw,r.sh,0,0,canvas.width,canvas.height);
}
export async function compressCrop(canvas){
 for(let attempt=0;attempt<4;attempt++){
  for(const quality of [.86,.76,.66,.56]){const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));if(!blob)throw Error('無法壓縮圖片');if(blob.size<=450000)return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob)})}
  const smaller=document.createElement('canvas');smaller.width=Math.max(1,Math.round(canvas.width*.8));smaller.height=Math.max(1,Math.round(canvas.height*.8));smaller.getContext('2d').drawImage(canvas,0,0,smaller.width,smaller.height);canvas=smaller;
 }
 throw Error('圖片仍太大，請選擇較小的圖片');
}
export function instagramUrl(value){
 if(!value.trim())return '';let u;try{u=new URL(value)}catch{throw Error('請輸入有效的 Instagram 貼文網址')}
 const match=u.pathname.match(/^\/(?:[A-Za-z0-9_.]+\/)?(p|reel)\/([A-Za-z0-9_-]+)\/?$/);
 if(u.protocol!=='https:'||!['www.instagram.com','instagram.com'].includes(u.hostname)||!match)throw Error('請使用 Instagram 貼文或 Reel 網址');
 return `https://www.instagram.com/${match[1]}/${match[2]}/`;
}
