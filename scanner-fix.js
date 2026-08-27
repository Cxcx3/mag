/* SpotLIGHT 360 scanner fix — additive, editor-only.
 * Captures a guided ring of camera frames, reprojects them into a real
 * 2:1 equirectangular panorama, uploads the result, and saves it as a room.
 */
(function () {
  'use strict';
  if (window.__SPOTLIGHT_SCANNER_FIX__) return;
  window.__SPOTLIGHT_SCANNER_FIX__ = true;

  const N = 18;
  const ANGLES = Array.from({ length: N }, (_, i) => i * (360 / N));
  let stream = null;
  let video = null;
  let modal = null;
  let slots = [];
  let yaw = 0;
  let pitch = 0;
  let baseAlpha = null;
  let orientationHandler = null;
  let alignedIndex = -1;
  let alignTimer = null;
  let autoSnap = true;
  let cameraReady = false;

  const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const norm = a => ((a % 360) + 360) % 360;
  const diff = (a,b) => { let d=(a-b+540)%360-180; return d; };

  function editorUnlocked() {
    return !!(window.isEditorUnlocked || document.getElementById('editorPanel')?.classList.contains('open'));
  }

  function buildUI() {
    if (document.getElementById('spotlightFixedScanner')) return;
    const s = document.createElement('style');
    s.id = 'spotlightFixedScannerStyles';
    s.textContent = `
      #spotlightFixedScanner{position:fixed;inset:0;z-index:1000001;background:#07070b;color:#fff;font-family:Space Grotesk,-apple-system,sans-serif;display:none;flex-direction:column;overflow:hidden;touch-action:none}
      #spotlightFixedScanner.show{display:flex}
      .sfs-head{height:auto;min-height:54px;padding:max(9px,env(safe-area-inset-top)) 12px 9px;background:rgba(10,9,14,.97);display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px solid rgba(255,255,255,.12);z-index:4}
      .sfs-title{font-weight:900;font-size:12px;color:#FFD23F;letter-spacing:.06em}.sfs-sub{font-size:9px;color:rgba(255,255,255,.62);margin-top:2px}
      .sfs-close,.sfs-switch{border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#fff;border-radius:8px;padding:8px 10px;font-size:11px;font-weight:800;min-height:38px}
      .sfs-view{position:relative;flex:1;min-height:0;background:#000;overflow:hidden}
      #sfsVideo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#000}
      .sfs-shade{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,transparent 25%,rgba(0,0,0,.35) 100%)}
      .sfs-guide{position:absolute;inset:0;pointer-events:none}
      .sfs-ring{position:absolute;left:50%;top:50%;width:min(46vw,260px);height:min(46vw,260px);transform:translate(-50%,-50%);border:2px solid rgba(255,210,63,.9);border-radius:50%;box-shadow:0 0 0 9999px rgba(0,0,0,.08),0 0 30px rgba(255,210,63,.18)}
      .sfs-ring:before,.sfs-ring:after{content:"";position:absolute;background:#FFD23F;opacity:.75}.sfs-ring:before{width:1px;height:100%;left:50%;top:0}.sfs-ring:after{height:1px;width:100%;top:50%;left:0}
      .sfs-level{position:absolute;left:50%;top:50%;width:110px;height:1px;background:#06D6A0;transform:translate(-50%,-50%);opacity:.9}
      .sfs-node{position:absolute;transform:translate(-50%,-50%);width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid rgba(255,255,255,.75);background:rgba(10,9,14,.7);color:#fff;font-size:9px;font-weight:900;box-shadow:0 4px 15px rgba(0,0,0,.5);transition:all .12s}
      .sfs-node.active{width:54px;height:54px;border-color:#FFD23F;background:rgba(255,210,63,.2);box-shadow:0 0 25px rgba(255,210,63,.55)}
      .sfs-node.done{border-color:#06D6A0;color:#06D6A0;background:rgba(6,214,160,.2)}
      .sfs-center{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:7px;text-align:center;pointer-events:none}
      .sfs-lock{width:72px;height:72px;border-radius:50%;border:3px solid rgba(255,255,255,.45);display:flex;align-items:center;justify-content:center;font-size:24px;background:rgba(10,9,14,.3)}
      .sfs-lock.locked{border-color:#06D6A0;box-shadow:0 0 24px rgba(6,214,160,.45)}
      .sfs-status{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;background:rgba(7,7,11,.78);padding:6px 9px;border-radius:999px;white-space:nowrap}
      .sfs-hud{position:absolute;top:10px;left:10px;right:10px;display:flex;justify-content:space-between;gap:8px;pointer-events:none}.sfs-pill{background:rgba(7,7,11,.82);border:1px solid rgba(255,255,255,.16);border-radius:8px;padding:6px 9px;font-size:10px;font-weight:800}.sfs-pill b{color:#FFD23F}
      .sfs-guide-text{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);width:min(92%,520px);text-align:center;background:rgba(7,7,11,.84);border:1px solid rgba(255,210,63,.28);border-radius:10px;padding:8px 10px;font-size:10px;font-weight:700;color:rgba(255,255,255,.86)}
      .sfs-bottom{background:#111017;border-top:1px solid rgba(255,255,255,.12);padding:8px 10px max(9px,env(safe-area-inset-bottom));z-index:4}
      .sfs-progress{height:6px;background:rgba(255,255,255,.08);border-radius:5px;overflow:hidden;margin-bottom:7px}.sfs-progress>i{display:block;height:100%;width:0;background:linear-gradient(90deg,#FFD23F,#06D6A0);transition:width .2s}
      .sfs-row{display:flex;align-items:center;justify-content:space-between;gap:8px}.sfs-row-left,.sfs-row-right{display:flex;align-items:center;gap:6px}.sfs-btn{border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#fff;border-radius:9px;padding:9px 11px;font-size:10px;font-weight:900;min-height:40px}.sfs-shot{width:70px;height:70px;border-radius:50%;border:5px solid #FFD23F;background:#fff;color:#14121A;font-size:10px;font-weight:900;box-shadow:0 4px 20px rgba(255,210,63,.35)}.sfs-finish{background:#06D6A0;color:#071511;border:0}.sfs-finish:disabled{opacity:.45}.sfs-check{font-size:10px;color:#fff;display:flex;align-items:center;gap:5px}.sfs-check input{accent-color:#06D6A0;width:16px;height:16px}
      @media(max-width:520px){.sfs-ring{width:58vw;height:58vw}.sfs-node{width:36px;height:36px;font-size:8px}.sfs-node.active{width:48px;height:48px}.sfs-lock{width:62px;height:62px}.sfs-shot{width:62px;height:62px}.sfs-btn{padding:8px 9px}}
    `;
    document.head.appendChild(s);
    modal=document.createElement('div'); modal.id='spotlightFixedScanner';
    modal.innerHTML=`
      <div class="sfs-head"><div><div class="sfs-title">📸 SPOTLIGHT 360° ROOM SCANNER</div><div class="sfs-sub">Editor only · Hold phone level and slowly rotate in place</div></div><div style="display:flex;gap:5px"><button class="sfs-switch" id="sfsSwitch">↻</button><button class="sfs-close" id="sfsClose">✕</button></div></div>
      <div class="sfs-view" id="sfsView"><video id="sfsVideo" autoplay muted playsinline webkit-playsinline></video><div class="sfs-shade"></div><div class="sfs-guide"><div class="sfs-ring"></div><div class="sfs-level"></div><div id="sfsNodes"></div><div class="sfs-center"><div class="sfs-lock" id="sfsLock">＋</div><div class="sfs-status" id="sfsStatus">Point at a circle</div></div><div class="sfs-hud"><div class="sfs-pill">ANGLE <b id="sfsAngle">0°</b></div><div class="sfs-pill" id="sfsSensor">TOUCH GUIDE</div></div><div class="sfs-guide-text" id="sfsGuideText">Turn until the highlighted circle reaches the center. Keep the phone level.</div></div></div>
      <div class="sfs-bottom"><div class="sfs-progress"><i id="sfsProgress"></i></div><div class="sfs-row"><div class="sfs-row-left"><label class="sfs-check"><input type="checkbox" id="sfsAuto" checked> Auto</label><button class="sfs-btn" id="sfsReset">RESET</button></div><button class="sfs-shot" id="sfsShot">CAPTURE</button><div class="sfs-row-right"><button class="sfs-btn sfs-finish" id="sfsFinish" disabled>STITCH & USE</button></div></div></div>`;
    document.body.appendChild(modal);
    video=document.getElementById('sfsVideo');
    document.getElementById('sfsClose').onclick=close;
    document.getElementById('sfsSwitch').onclick=async()=>{window.__sfsFacing=window.__sfsFacing==='user'?'environment':'user';await startCamera()};
    document.getElementById('sfsShot').onclick=captureCurrent;
    document.getElementById('sfsFinish').onclick=finish;
    document.getElementById('sfsReset').onclick=()=>{if(confirm('Clear all captured angles?')){resetSlots();render()}};
    document.getElementById('sfsAuto').onchange=e=>autoSnap=e.target.checked;
  }

  function resetSlots(){slots=ANGLES.map(a=>({angle:a,canvas:null,captured:false}));alignedIndex=-1;if(alignTimer)clearTimeout(alignTimer)}

  async function startCamera(){
    if(stream) stream.getTracks().forEach(t=>t.stop());
    try{
      stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:window.__sfsFacing||'environment',width:{ideal:1920,min:640},height:{ideal:1080,min:480}},audio:false});
      video.srcObject=stream; await video.play().catch(()=>{}); cameraReady=true;
      render();
    }catch(e){cameraReady=false;setStatus('CAMERA PERMISSION REQUIRED','#FF4D6D');}
  }

  function setStatus(t,c){const el=document.getElementById('sfsStatus');if(el){el.textContent=t;el.style.color=c||'#fff'}}

  async function enableOrientation(){
    if(typeof DeviceOrientationEvent==='undefined') return false;
    try{
      if(typeof DeviceOrientationEvent.requestPermission==='function'){
        const r=await DeviceOrientationEvent.requestPermission(); if(r!=='granted') return false;
      }
      if(orientationHandler)window.removeEventListener('deviceorientation',orientationHandler,true);
      baseAlpha=null;
      orientationHandler=e=>{
        if(e.alpha==null)return;
        if(baseAlpha==null)baseAlpha=e.alpha;
        yaw=norm((e.alpha-baseAlpha)*-1);
        pitch=Math.max(-25,Math.min(25,(e.beta||90)-90));
        render();
      };
      window.addEventListener('deviceorientation',orientationHandler,true);
      const p=document.getElementById('sfsSensor');if(p){p.textContent='📳 GYRO ACTIVE';p.style.color='#06D6A0';p.style.borderColor='#06D6A0'}
      return true;
    }catch(e){return false}
  }

  function bindTouchFallback(){
    const v=document.getElementById('sfsView'); if(!v||v.__sfsTouch)return; v.__sfsTouch=true;
    let down=false,sx=0,sy=0,syaw=0,sp=0;
    v.addEventListener('touchstart',e=>{if(e.touches.length!==1)return;down=true;sx=e.touches[0].clientX;sy=e.touches[0].clientY;syaw=yaw;sp=pitch},{passive:true});
    v.addEventListener('touchmove',e=>{if(!down||e.touches.length!==1)return;const t=e.touches[0];yaw=norm(syaw-(t.clientX-sx)*.3);pitch=Math.max(-25,Math.min(25,sp+(t.clientY-sy)*.2));render()},{passive:true});
    v.addEventListener('touchend',()=>down=false,{passive:true});
  }

  function projectNode(angle){
    const d=diff(angle,yaw); const w=modal?.querySelector('.sfs-view')?.clientWidth||innerWidth; const h=modal?.querySelector('.sfs-view')?.clientHeight||innerHeight;
    const x=w/2+(d/55)*w; const y=h/2-(pitch/35)*h; return {x,y,d};
  }

  function render(){
    if(!modal||!modal.classList.contains('show'))return;
    const nodes=document.getElementById('sfsNodes');if(!nodes)return;
    const w=modal.querySelector('.sfs-view')?.clientWidth||innerWidth; const h=modal.querySelector('.sfs-view')?.clientHeight||innerHeight;
    let closest=-1,best=999;
    nodes.innerHTML=slots.map((s,i)=>{
      const p=projectNode(s.angle); const dist=Math.hypot(p.d,pitch); if(!s.captured&&dist<best){best=dist;closest=i}
      if(Math.abs(p.d)>58||Math.abs(pitch)>38)return '';
      const active=dist<5.5; if(active)alignedIndex=i;
      return `<button class="sfs-node ${s.captured?'done':''} ${active?'active':''}" style="left:${p.x}px;top:${p.y}px" onclick="window.__sfsCapture(${i})">${s.captured?'✓':Math.round(s.angle)+'°'}</button>`;
    }).join('');
    const target=closest>=0?slots[closest]:null;
    if(target){const d=diff(target.angle,yaw);const txt=Math.abs(d)<5?'CENTERED — HOLD STEADY':`TURN ${d>0?'RIGHT':'LEFT'} ${Math.abs(Math.round(d))}°`;document.getElementById('sfsGuideText').textContent=txt;document.getElementById('sfsAngle').textContent=Math.round(yaw)+'°';}
    const lock=document.getElementById('sfsLock');
    if(alignedIndex>=0&&!slots[alignedIndex].captured){lock.classList.add('locked');lock.textContent='✓';setStatus('TARGET LOCKED','#06D6A0');if(autoSnap){const idx=alignedIndex;clearTimeout(alignTimer);alignTimer=setTimeout(()=>{if(alignedIndex===idx&&!slots[idx].captured)capture(idx)},420)}}else{lock.classList.remove('locked');lock.textContent='＋';if(best<999)setStatus('CENTER A CIRCLE','#FFD23F')}
    const count=slots.filter(s=>s.captured).length;document.getElementById('sfsProgress').style.width=(count/N*100)+'%';document.getElementById('sfsFinish').disabled=count<8;document.getElementById('sfsFinish').textContent=count<8?`STITCH (${count}/${N})`:`STITCH & USE (${count}/${N})`;
  }

  function capture(i){
    if(!cameraReady||!video||!video.videoWidth)return;
    if(i<0||i>=slots.length)return;
    const c=document.createElement('canvas');c.width=video.videoWidth;c.height=video.videoHeight;c.getContext('2d').drawImage(video,0,0,c.width,c.height);
    slots[i].canvas=c;slots[i].captured=true;alignedIndex=-1;
    if(navigator.vibrate)navigator.vibrate(35); render();
  }
  function captureCurrent(){let idx=-1,b=999;slots.forEach((s,i)=>{if(s.captured)return;const d=Math.abs(diff(s.angle,yaw))+Math.abs(pitch)*.3;if(d<b){b=d;idx=i}});if(idx>=0)capture(idx)}
  window.__sfsCapture=capture;

  function sampleBilinear(ctx,x,y,w,h){
    x=Math.max(0,Math.min(w-1,x));y=Math.max(0,Math.min(h-1,y));
    const p=ctx.getImageData(Math.floor(x),Math.floor(y),1,1).data;return [p[0],p[1],p[2],255];
  }

  async function stitch(){
    const W=2048,H=1024;const out=document.createElement('canvas');out.width=W;out.height=H;const octx=out.getContext('2d',{willReadFrequently:true});
    octx.fillStyle='#111';octx.fillRect(0,0,W,H);
    const sources=slots.filter(s=>s.canvas).map(s=>({slot:s,ctx:s.canvas.getContext('2d',{willReadFrequently:true}),w:s.canvas.width,h:s.canvas.height}));
    if(sources.length<8)throw new Error('Capture more angles first.');
    // Reproject each camera frame into the equirectangular panorama using an estimated
    // camera FOV. Overlapping frames are feathered toward their center angle.
    const outImg=octx.createImageData(W,H),data=outImg.data;
    const HFOV=70*Math.PI/180;const VFOV=HFOV*(sources[0].h/sources[0].w);const tanH=Math.tan(HFOV/2),tanV=Math.tan(VFOV/2);
    for(let py=0;py<H;py++){
      const lat=(0.5-py/H)*Math.PI;const cl=Math.cos(lat),sl=Math.sin(lat);
      for(let px=0;px<W;px++){
        const lon=(px/W-0.5)*Math.PI*2;const dx=Math.sin(lon)*cl,dz=Math.cos(lon)*cl,dy=sl;
        let r=0,g=0,b=0,weightSum=0;
        for(const src of sources){
          const rel=diff(lon*180/Math.PI,src.slot.angle)*Math.PI/180;
          const forwardZ=Math.cos(rel)*cl+dy*0.0; const side=Math.sin(rel)*cl; const up=dy;
          if(forwardZ<=0.02)continue;
          const nx=side/forwardZ, ny=up/forwardZ;
          if(Math.abs(nx)>tanH||Math.abs(ny)>tanV)continue;
          const u=(nx/tanH*0.5+0.5)*src.w; const v=(0.5-ny/tanV*0.5)*src.h;
          const edge=Math.max(0,1-Math.abs(nx/tanH)); const w=Math.pow(edge,1.8);
          if(w<=0)continue; const c=sampleBilinear(src.ctx,u,v,src.w,src.h);r+=c[0]*w;g+=c[1]*w;b+=c[2]*w;weightSum+=w;
        }
        const k=(py*W+px)*4;if(weightSum){data[k]=r/weightSum;data[k+1]=g/weightSum;data[k+2]=b/weightSum;data[k+3]=255}else{data[k]=16;data[k+1]=15;data[k+2]=20;data[k+3]=255}
      }
    }
    octx.putImageData(outImg,0,0);
    // Soft wrap seam by drawing the first/last few degrees over the join.
    const seam=W*.02;octx.save();octx.globalAlpha=.22;octx.drawImage(out,0,0,seam,H,W-seam,0,seam,H);octx.drawImage(out,W-seam,0,seam,H,0,0,seam,H);octx.restore();
    return out;
  }

  async function finish(){
    if(slots.filter(s=>s.captured).length<8)return;
    const btn=document.getElementById('sfsFinish');btn.disabled=true;btn.textContent='STITCHING…';
    try{
      const pano=await stitch();
      const blob=await new Promise(r=>pano.toBlob(r,'image/jpeg',.9));
      let url='';
      if(typeof window.uploadToSupabaseStorage==='function'){
        const file=new File([blob],`spotlight-360-${Date.now()}.jpg`,{type:'image/jpeg'});const res=await window.uploadToSupabaseStorage(file);url=res.url;
      }else{url=pano.toDataURL('image/jpeg',.88)}
      await saveRoom(url);
      show('✅ 360° room stitched and saved');
      close();
      if(typeof window.applyMagazineUpdates==='function')window.applyMagazineUpdates();
    }catch(e){console.error('[SpotLIGHT scanner fix]',e);alert('Could not stitch/save the room. '+(e?.message||''));btn.disabled=false;render()}
  }

  async function saveRoom(url){
    let data=null;
    const ref=window.currentEditingAdRef;
    if(ref){
      try{data=ref.tour3d?JSON.parse(ref.tour3d):null}catch(e){}
      if(!data||!Array.isArray(data.scenes))data={scenes:[]};
      const scene={id:'room-'+Date.now(),name:'New 360° Room',location:'',tag:'360° Room',panoUrl:url,tourUrl:'',blurb:'',hotspots:[]};
      if(window.__sfsScanMode==='replace_room'&&data.scenes.length)data.scenes[0]={...data.scenes[0],panoUrl:url,tourUrl:''};else data.scenes.push(scene);
      const json=JSON.stringify(data);ref.tour3d=json;ref.tourUrl=json;ref.tourConfig=data;
      if(window.MAGAZINE?.cities)window.MAGAZINE.cities.forEach(c=>(c.ads||[]).forEach(a=>{if(a===ref){a.tour3d=json;a.tourUrl=json;a.tourConfig=data}}));
      if(typeof window.saveMagazineData==='function'&&window.isEditorUnlocked)await window.saveMagazineData(window.MAGAZINE);
      return;
    }
    if(window.currentEditingSpotId&&typeof window.saveCommunitySpotTour==='function'){
      try{let p=(window.COMMUNITY_POSTS||[]).find(x=>String(x.id)===String(window.currentEditingSpotId));let d=p?.tour3d?JSON.parse(p.tour3d):{scenes:[]};d.scenes=d.scenes||[];d.scenes.push({id:'room-'+Date.now(),name:'New 360° Room',location:p?.location||'',tag:'360° Room',panoUrl:url,tourUrl:'',blurb:'',hotspots:[]});await window.saveCommunitySpotTour(window.currentEditingSpotId,JSON.stringify(d))}catch(e){throw e}
    }
  }

  function show(msg){if(typeof window.showToast==='function')window.showToast(msg);}
  function close(){if(!modal)return;modal.classList.remove('show');if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}if(orientationHandler)window.removeEventListener('deviceorientation',orientationHandler,true);orientationHandler=null;if(alignTimer)clearTimeout(alignTimer)}

  window.open360CameraScanner=async function(mode='new_room'){
    if(!editorUnlocked()){show('🔒 360 scanner is only available inside the unlocked editor.');return}
    buildUI();window.__sfsScanMode=mode;resetSlots();yaw=0;pitch=0;baseAlpha=null;alignedIndex=-1;modal.classList.add('show');bindTouchFallback();
    await startCamera();
    const gyro=await enableOrientation(); if(!gyro){const p=document.getElementById('sfsSensor');if(p){p.textContent='👆 TOUCH GUIDE';p.style.color='#FFD23F'}}
    render();show('📸 Rotate slowly and capture each center-locked circle.');
  };

  // Visitors can still view a tour, but never see the build/edit controls.
  const hideVisitorBuilder=()=>{
    const btn=document.getElementById('tourEditModeBtn');
    if(btn)btn.style.display=editorUnlocked()?'inline-flex':'none';
    const bar=document.getElementById('tourEditorBar');
    if(bar)bar.style.display=editorUnlocked()&&window.__spotlightTourBuilderOn?'flex':'none';
  };
  const wrapTourOpen=()=>{hideVisitorBuilder();setTimeout(hideVisitorBuilder,100);setTimeout(hideVisitorBuilder,500)};
  const oldOpen=window.open3dTourModal;
  if(typeof oldOpen==='function')window.open3dTourModal=function(){const r=oldOpen.apply(this,arguments);wrapTourOpen();return r};
  const obs=new MutationObserver(hideVisitorBuilder);obs.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('resize',()=>{if(modal?.classList.contains('show'))render()});
})();
