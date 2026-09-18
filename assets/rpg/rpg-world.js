/* World coordinates describe safe foot positions, not the painted walls. */
(() => {
  DATA.revision = 5;
  DATA.art.assets.music = 'assets/rpg/music-96.mp3';
  for (const [key, source] of Object.entries(DATA.art.assets)) {
    if (source.endsWith('.png')) DATA.art.assets[key] = source.slice(0, -4) + '.webp';
  }
  DATA.flow.find(task => task.id === 'dormReveal').autoEnter = true;
  DATA.flow.find(task => task.id === 'dormReveal').text = '前往男生宿舍，進門後悄悄接近哥哥座位。';
  DATA.events.dormReveal = DATA.events.dormReveal.slice(2);
  DATA.events.dormReveal[0].text = '老哥接招吧！';
  DATA.events.dormReveal[0].mode = '';
  DATA.events.misunderstanding = DATA.events.misunderstanding.filter(line => !line.text?.includes('身高分我一點'));
  DATA.events.misunderstanding.find(line => line.text?.includes('所以我有個提議')).expression = 'smile';
  DATA.art.maps.campus = DATA.art.maps.poolHall = 'assets/rpg/map-campus-v3.webp';

  const campus = DATA.layout.campus;
  // The extra distance below facades accommodates the complete sprite above its feet.
  campus.rects = [[4,8,12,2],[13,9,3,9],[5,17,11,2],[10,18,6,2],[18,3,4,19],[15,9,4,1],[15,13,4,1],[15,16,4,1],[15,19,4,1],[21,13,5,1],[24,12,2,10],[24,11,12,2],[27,10,7,2],[24,20,13,2],[30,19,2,2]];
  campus.blocks = [];
  campus.obstacles = [];
  campus.spawn = [20,13];
  campus.storyNpcs.brother = ['yating','亞廷',8,8,'廷'];
  campus.storyNpcs.farewell = ['kai','凱翔',11,18,'凱'];
  campus.actorHeight = 76;
  const approaches = { studio: [7,8], cafe: [8,17], pool: [30,10], dorm: [30,20] };
  // Door markers are visual anchors; walking still stops on the safe plaza below.
  const doorsteps = {studio:[253,187],cafe:[270,466],pool:[984,250],dorm:[975,558]};
  for(const scene of ['campus','poolHall'])for(const door of DATA.layout[scene].closedDoors||[])if(door.id==='shop-closed')door.marker=[151,706];
  for (const portal of campus.portals) {
    portal.approach = approaches[portal.id];
    portal.doorMarker = portal.marker;
    portal.marker = doorsteps[portal.id];
  }
  Object.assign(DATA.layout.poolHall, {
    rects: structuredClone(campus.rects), blocks: [], obstacles: [], actorHeight: 76,
    spawn: [31,10], npcs: [['kai','凱翔',28,10,'凱']]
  });
  for (const portal of DATA.layout.poolHall.portals) {
    portal.approach = portal.id === 'pool' ? [30,10] : [24,13];
    portal.doorMarker = portal.marker;
    portal.marker = portal.id === 'pool' ? doorsteps.pool : [720,304];
  }
  Object.assign(DATA.layout.studio,{rects:[[13,10,5,8],[17,14,9,4],[22,11,5,8]],obstacles:[],actorHeight:92});
  Object.assign(DATA.layout.cafe,{rects:[[19,12,5,7],[23,18,4,3]],obstacles:[],actorHeight:88,npcs:[['ruby','曉彤',20,13,'彤']]});
  Object.assign(DATA.layout.pool,{rects:[[14,12,14,9],[18,20,4,3]],actorHeight:92,npcs:[['team','泳隊隊員',17,14,'隊'],['chenghan','江承翰',24,14,'翰']]});
  Object.assign(DATA.layout.dorm,{rects:[[18,8,4,13],[19,20,3,2]],actorHeight:74});
  for (const [scene, position] of Object.entries({studio:[25,18],cafe:[25,20],pool:[20,21],dorm:[20,20]})) {
    const portal = DATA.layout[scene].portals[0];
    portal.approach = position;
    portal.marker = [(position[0]+.5)*32,(position[1]+.5)*32+12];
  }

  // Masks use original artwork coordinates. Redrawing these after a passing actor
  // separates the foliage into a depth layer while preserving every original pixel.
  const tree = (x,y,w,h) => ({
    depth: y+h,
    polygon: [[x+w*.44,y],[x+w*.67,y+h*.04],[x+w*.7,y+h*.12],[x+w*.87,y+h*.15],[x+w,y+h*.37],[x+w*.9,y+h*.53],[x+w*.73,y+h*.59],[x+w*.8,y+h],[x+w*.19,y+h],[x+w*.22,y+h*.61],[x+w*.06,y+h*.49],[x,y+h*.32],[x+w*.14,y+h*.15],[x+w*.32,y+h*.12]],
    trunk: [x+w*.22,y+h*.65,w*.56,h*.35]
  });
  const trees = [tree(644,204,83,123),tree(642,366,83,122),tree(618,696,87,122),tree(889,207,76,121),tree(887,366,79,123),tree(894,594,88,119)];
  const lamps = [[685,111,29,92],[684,508,29,97],[900,111,29,92],[900,511,29,94],[917,747,28,97]].map(([x,y,w,h])=>({depth:y+h,polygon:[[x,y],[x+w,y],[x+w,y+h],[x,y+h]],trunk:[x,y+h-24,w,24]}));
  DATA.depthObjects = {campus:[...trees,...lamps],poolHall:[...trees,...lamps]};
  // Keep a buffer around planters and poles; the crown can correctly hide actors behind it.
  for (const scene of ['campus','poolHall']) {
    for (const [i, object] of DATA.depthObjects[scene].entries()) {
      const [x,y,w,h] = object.trunk, scale = 1280/1620;
      const minX = Math.floor((x*scale-9)/32), maxX = Math.floor(((x+w)*scale+9)/32);
      const minY = Math.floor((y*scale-5)/32), maxY = Math.floor(((y+h)*scale+9)/32);
      DATA.layout[scene].obstacles.push({id:'depth-object-'+i,label:'路樹或路燈安全範圍',cells:[minX,minY,maxX-minX+1,maxY-minY+1]});
    }
  }
})();
