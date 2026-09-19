const fs=require('node:fs'),path=require('node:path');
const {minify}=require('terser');
const CleanCSS=require('clean-css');
const root=path.resolve(__dirname,'..');
(async()=>{
 const files=['rpg-data.js','rpg-world.js','rpg-core.js','share.js','rpg-update.js','completion.js'];
 const sources=Object.fromEntries(files.map(f=>[f,fs.readFileSync(path.join(root,'assets/rpg',f),'utf8')]));
 const bundle=await minify(sources,{compress:true,mangle:true,format:{comments:false}});
 fs.writeFileSync(path.join(root,'assets/rpg/game-r2.min.js'),bundle.code);
 const css=new CleanCSS({level:1}).minify(fs.readFileSync(path.join(root,'assets/rpg/rpg-update.css'),'utf8'));
 if(css.errors.length)throw Error(css.errors.join('\n'));
 fs.writeFileSync(path.join(root,'assets/rpg/rpg-update.min.css'),css.styles);
 console.log(`Game bundle: ${Buffer.byteLength(bundle.code)} bytes`);
})().catch(e=>{console.error(e);process.exitCode=1});
