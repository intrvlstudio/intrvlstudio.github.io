const fs=require('node:fs'),path=require('node:path');
const sharp=require('sharp');
const root=path.resolve(__dirname,'..'),out=path.join(root,'assets','favicon');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="96" fill="#252525"/><g transform="translate(64 89.5) scale(1.5)"><path d="M128.299 222L46.7535 80.9729H104.946L128.299 121.381L172.194 45.571L256 1.45519L128.299 222Z" fill="white"/><path d="M32.3426 55.9648L0 0H172.194L32.3426 55.9648Z" fill="#FF9142"/></g></svg>`;
(async()=>{
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'favicon.svg'),svg+'\n');
 for(const [file,size] of [['favicon-16x16.png',16],['favicon-32x32.png',32],['favicon-48x48.png',48],['apple-touch-icon.png',180],['icon-192.png',192],['icon-512.png',512]])await sharp(Buffer.from(svg)).resize(size,size).png().toFile(path.join(out,file));
 const images=await Promise.all([16,32,48].map(n=>sharp(Buffer.from(svg)).resize(n,n).png().toBuffer()));
 const header=Buffer.alloc(6+16*images.length);header.writeUInt16LE(1,2);header.writeUInt16LE(images.length,4);let offset=header.length;
 images.forEach((image,i)=>{const pos=6+i*16,size=[16,32,48][i];header[pos]=header[pos+1]=size;header.writeUInt16LE(1,pos+4);header.writeUInt16LE(32,pos+6);header.writeUInt32LE(image.length,pos+8);header.writeUInt32LE(offset,pos+12);offset+=image.length});
 const ico=Buffer.concat([header,...images]);fs.writeFileSync(path.join(out,'favicon.ico'),ico);fs.writeFileSync(path.join(root,'favicon.ico'),ico);
 fs.writeFileSync(path.join(out,'site.webmanifest'),JSON.stringify({name:'之間工作室 INTRVL Studio',short_name:'INTRVL',start_url:'../../index.html',scope:'../../',display:'browser',background_color:'#252525',theme_color:'#252525',icons:[{src:'icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},{src:'icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'}]},null,2)+'\n');
 console.log('Generated SVG, multi-size ICO, PNG and mobile icons.');
})().catch(e=>{console.error(e);process.exitCode=1});
