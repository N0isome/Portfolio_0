

(() => {
  'use strict';
  const root = document.getElementById('lc-real');
  const ui = Object.fromEntries(['kind','device','connect','record','gain','gain-value','monitor','play','download','name','meta','status','clock','canvas','wave-box','empty','wave-label','fill-l','fill-r','level-l','level-r','open','view','theme','dial','sample-drag','sample-canvas','sample-empty','drag-caption','save','drop','channel-name','channel-play'].map(id => [id, root.querySelector('#lc-'+id)]));
  const workletSource = `
class CaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super(); this.active=false; this.id=0; this.frames=0; this.used=0; this.maxFrames=0;
    this.left=new Float32Array(2048); this.right=new Float32Array(2048);
    this.port.onmessage=e=>{
      const m=e.data;
      if(m.type==='start' && !this.active){this.id=m.id;this.frames=0;this.used=0;this.maxFrames=m.maxFrames;this.active=true;}
      if(m.type==='stop' && this.active && m.id===this.id)this.finish('manual');
    };
  }
  flush() {
    if(!this.used)return;
    const l=this.left.slice(0,this.used),r=this.right.slice(0,this.used);
    this.port.postMessage({type:'chunk',id:this.id,left:l,right:r,frames:this.frames},[l.buffer,r.buffer]);this.used=0;
  }
  finish(reason) {this.active=false;this.flush();this.port.postMessage({type:'stopped',id:this.id,frames:this.frames,reason});}
  process(inputs,outputs) {
    const a=inputs[0]||[],out=outputs[0]||[];
    const n=out[0]?out[0].length:128;
    for(let i=0;i<n;i++){
      const l=a[0]?a[0][i]:0,r=a[1]?a[1][i]:l;
      if(out[0])out[0][i]=l;if(out[1])out[1][i]=r;
      if(this.active){this.left[this.used]=l;this.right[this.used]=r;this.used++;this.frames++;
        if(this.used===2048)this.flush();if(this.frames>=this.maxFrames)this.finish('limit');}
    }
    return true;
  }
}
registerProcessor('lc-capture',CaptureProcessor);
`;
  function encodeWav(left,right,rate) {
    const n=left.length,buffer=new ArrayBuffer(44+n*6),v=new DataView(buffer);
    const str=(p,s)=>{for(let i=0;i<s.length;i++)v.setUint8(p+i,s.charCodeAt(i));};
    str(0,'RIFF');v.setUint32(4,36+n*6,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);
    v.setUint16(20,1,true);v.setUint16(22,2,true);v.setUint32(24,rate,true);v.setUint32(28,rate*6,true);v.setUint16(32,6,true);v.setUint16(34,24,true);str(36,'data');v.setUint32(40,n*6,true);
    let p=44;
    for(let i=0;i<n;i++)for(const raw of [left[i],right[i]]){
      const x=Number.isFinite(raw)?Math.max(-1,Math.min(1,raw)):0;
      const q=Math.round(x*(x<0?8388608:8388607));
      v.setUint8(p++,q&255);v.setUint8(p++,(q>>8)&255);v.setUint8(p++,(q>>16)&255);
    }
    return buffer;
  }
  let ctx,worker,gain,monitor,split,analysers=[],source,stream;
  let connecting=false,mode='idle',takeId=0,frames=0,chunks=[],envelope=[],sample=null,blobUrl='',playback=null;
  let rate=48000,lastTick=0,drawTime=0,peaks=[-90,-90],clipUntil=[0,0],waveSize=[1,1];
  let enginePromise=null;
  let saving=false,sampleSize=[1,1],playStart=0,channelSample=null,channelPlayback=null,dropGeneration=0;
  const scopes=[new Float32Array(2048),new Float32Array(2048)];
  const embedded=window.top!==window.self;
  function status(s){ui.status.textContent=s;}
  function time(n){const ms=Math.floor(n/rate*1000);return String(Math.floor(ms/60000)).padStart(2,'0')+':'+String(Math.floor(ms/1000)%60).padStart(2,'0')+'.'+String(ms%1000).padStart(3,'0');}
  function refresh(){
    const busy=mode==='recording'||mode==='stopping';
    ui.connect.disabled=connecting||mode==='stopping'||embedded;
    ui.connect.textContent=stream?'Desconectar':connecting?'Conectando…':'Conectar';
    ui.kind.disabled=!!stream||connecting;ui.device.disabled=ui.kind.value!=='input'||!!stream||connecting;
    ui.record.disabled=mode==='stopping'||connecting||(!stream&&mode!=='recording');
    ui.record.textContent=mode==='recording'?'Stop':mode==='stopping'?'Guardando…':'Record';
    ui.record.dataset.active=String(mode==='recording');ui.play.disabled=!sample||busy;
    ui.play.textContent=playback?'Detener':'Escuchar';
    ui.save.disabled=!sample||busy||saving;ui.save.textContent=saving?'Guardando…':'Guardar como';
    ui['sample-drag'].draggable=!!sample&&!busy;
    ui['sample-empty'].style.visibility=sample&&!busy?'hidden':'visible';
    ui['drag-caption'].textContent=sample&&!busy?'Arrastra la onda al canal de prueba o exporta el WAV.':'Arrastra la onda cuando esté lista.';
    ui.download.setAttribute('aria-disabled',String(!sample||busy));
    ui.empty.style.visibility=stream?'hidden':'visible';
  }
  async function engine(){
    if(enginePromise)return enginePromise;
    enginePromise=(async()=>{
      const C=window.AudioContext||window.webkitAudioContext;
      if(!C)throw new Error('Este navegador no ofrece Web Audio.');
      ctx=new C({latencyHint:'interactive'});rate=ctx.sampleRate;
      const url=URL.createObjectURL(new Blob([workletSource],{type:'application/javascript'}));
      try{await ctx.audioWorklet.addModule(url);}finally{URL.revokeObjectURL(url);}
      worker=new AudioWorkletNode(ctx,'lc-capture',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[2],channelCount:2,channelCountMode:'explicit'});
      gain=ctx.createGain();gain.channelCount=2;gain.channelCountMode='explicit';gain.gain.value=10**(Number(ui.gain.value)/20);
      monitor=ctx.createGain();monitor.gain.value=ui.monitor.checked?1:0;
      gain.connect(worker);worker.connect(monitor);monitor.connect(ctx.destination);
      split=ctx.createChannelSplitter(2);gain.connect(split);
      analysers=[0,1].map(i=>{const a=ctx.createAnalyser();a.fftSize=2048;split.connect(a,i);return a;});
      worker.port.onmessage=handleCapture;
    })().catch(async e=>{if(ctx)await ctx.close().catch(()=>{});ctx=null;enginePromise=null;throw e;});
    return enginePromise;
  }
  async function listDevices(){
    try{
      const current=ui.device.value,all=await navigator.mediaDevices.enumerateDevices();
      ui.device.replaceChildren(new Option('Entrada predeterminada','default'));
      all.filter(d=>d.kind==='audioinput'&&d.deviceId!=='default').forEach((d,i)=>ui.device.add(new Option(d.label||'Entrada '+(i+1),d.deviceId)));
      if(Array.from(ui.device.options).some(o=>o.value===current))ui.device.value=current;
    }catch{}
  }
  function stopPlayback(){if(playback){const p=playback;playback=null;p.onended=null;try{p.stop();}catch{}p.disconnect();}refresh();}
  function disconnect(reason='Fuente desconectada. Puedes conservar la toma grabada.'){
    if(mode==='recording')stopRecording();
    const old=stream;stream=null;if(source){source.disconnect();source=null;}
    if(old)old.getTracks().forEach(t=>{t.onended=null;t.stop();});
    ui.monitor.checked=false;if(monitor)monitor.gain.setTargetAtTime(0,ctx.currentTime,.005);
    peaks=[-90,-90];status(reason);refresh();
  }
  ui.connect.onclick=async()=>{
    if(stream){disconnect();return;}
    if(embedded){status('Abre la página para autorizar la captura real.');return;}
    if(!navigator.mediaDevices){status('Se requiere un navegador compatible y una página HTTPS.');return;}
    connecting=true;refresh();let next;
    try{
      // The permission request runs before the first await to preserve user activation.
      const kind=ui.kind.value;
      let request;
      if(kind==='display'){
        if(!navigator.mediaDevices.getDisplayMedia)throw new Error('La captura compartida no está disponible. Usa Chrome/Edge de escritorio o una entrada de audio.');
        request=navigator.mediaDevices.getDisplayMedia({video:true,audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},systemAudio:'include',selfBrowserSurface:'exclude',surfaceSwitching:'include'});
      }else{
        request=navigator.mediaDevices.getUserMedia({video:false,audio:{...(ui.device.value!=='default'?{deviceId:{exact:ui.device.value}}:{}),channelCount:{ideal:2},echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
      }
      next=await request;
      if(!next.getAudioTracks().length)throw new Error('La fuente compartida no incluye audio. Selecciona una pestaña y activa «Compartir audio», o usa una entrada de cable virtual.');
      await engine();await ctx.resume();
      stream=next;source=ctx.createMediaStreamSource(new MediaStream(next.getAudioTracks()));source.connect(gain);
      next.getTracks().forEach(t=>t.onended=()=>{if(stream===next)disconnect('El navegador terminó la captura.');});
      const label=next.getAudioTracks()[0].label||'Audio autorizado';
      status('Conectado: '+label+'. Pulsa Record para grabar.');
      if(kind==='input')await listDevices();
    }catch(e){
      if(next)next.getTracks().forEach(t=>t.stop());stream=null;
      status(e.name==='NotAllowedError'?'Permiso denegado o captura bloqueada por el navegador. Abre esta página directamente y vuelve a conectar.':e.message||'No se pudo conectar la fuente.');
    }finally{connecting=false;refresh();}
  };
  ui.kind.onchange=()=>{
    ui.device.replaceChildren(new Option(ui.kind.value==='input'?'Entrada predeterminada':'Seleccionar al compartir','default'));
    if(ui.kind.value==='input'&&ctx)listDevices();refresh();
  };
  function stopRecording(){if(mode!=='recording')return;mode='stopping';worker.port.postMessage({type:'stop',id:takeId});status('Finalizando WAV…');refresh();}
  ui.record.onclick=async()=>{
    if(mode==='recording'){stopRecording();return;}
    if(!stream||mode==='stopping')return;
    try{await ctx.resume();}catch(e){status(e.message);return;}
    if(!stream||mode==='recording'||mode==='stopping')return;
    stopPlayback();if(blobUrl){URL.revokeObjectURL(blobUrl);blobUrl='';}sample=null;ui.download.removeAttribute('href');ui['sample-drag'].removeAttribute('href');
    takeId++;chunks=[];envelope=[];frames=0;mode='recording';
    ui.name.textContent='Capturando audio entrante…';ui.meta.textContent='WAV · 24-bit PCM · estéreo';
    ui['wave-label'].textContent='GRABANDO · L / R';
    worker.port.postMessage({type:'start',id:takeId,maxFrames:Math.floor(rate*60)});
    status('Grabando la fuente conectada. Stop cierra la toma.');refresh();
  };
  function handleCapture(e){
    const m=e.data;if(m.id!==takeId)return;
    if(m.type==='chunk'){
      chunks.push([m.left,m.right]);frames=m.frames;
      for(let p=0;p<m.left.length;p+=256){
        let minL=0,maxL=0,minR=0,maxR=0;
        for(let i=p;i<Math.min(p+256,m.left.length);i++){minL=Math.min(minL,m.left[i]);maxL=Math.max(maxL,m.left[i]);minR=Math.min(minR,m.right[i]);maxR=Math.max(maxR,m.right[i]);}
        envelope.push([minL,maxL,minR,maxR]);
      }
    }else if(m.type==='stopped'){
      frames=m.frames;mode='idle';
      if(!frames){ui.name.textContent='Muestra grabada';ui.meta.textContent='La toma no recibió audio.';status('La toma no contiene muestras. Vuelve a grabar.');refresh();return;}
      const left=new Float32Array(frames),right=new Float32Array(frames);let offset=0;
      chunks.forEach(([l,r])=>{left.set(l,offset);right.set(r,offset);offset+=l.length;});chunks=[];
      const wav=encodeWav(left,right,rate);
      const filename='JUCE_PLUGGIN_'+new Date().toISOString().replace(/[:.]/g,'-')+'.wav';
      const file=new File([wav],filename,{type:'audio/wav'});blobUrl=URL.createObjectURL(file);
      sample={left,right,rate,frames,file,envelope:envelope.slice()};ui.download.href=blobUrl;ui.download.download=filename;
      ui['sample-drag'].href=blobUrl;ui['sample-drag'].download=filename;
      ui.name.textContent=filename;ui.name.setAttribute('data-tooltip',filename);
      ui.meta.textContent=(rate/1000).toFixed(1)+' kHz · 24-bit · estéreo · '+time(frames);
      ui['wave-label'].textContent='ENTRADA · L / R';
      status(m.reason==='limit'?'Se alcanzaron 60 s. WAV listo para escuchar y descargar.':'Muestra lista debajo: escucha, arrastra o guarda el WAV.');refresh();
    }
  }
  ui.gain.oninput=()=>{const db=Number(ui.gain.value);ui['gain-value'].textContent=(db>0?'+':'')+db.toFixed(1);ui.dial.style.setProperty('--lc-turn',((db+24)/36*270)+'deg');if(gain)gain.gain.setTargetAtTime(10**(db/20),ctx.currentTime,.015);};
  ui.monitor.onchange=async()=>{
    if(!stream){ui.monitor.checked=false;status('Conecta una fuente para monitorear.');return;}
    await ctx.resume();monitor.gain.setTargetAtTime(ui.monitor.checked?1:0,ctx.currentTime,.005);
  };
  ui.play.onclick=async()=>{
    if(playback){stopPlayback();return;}if(!sample)return;
    try{
      await ctx.resume();const b=ctx.createBuffer(2,sample.frames,sample.rate);
      // Preview matches PCM saturation in the exported file.
      [sample.left,sample.right].forEach((ch,k)=>{const d=b.getChannelData(k);for(let i=0;i<d.length;i++)d[i]=Number.isFinite(ch[i])?Math.max(-1,Math.min(1,ch[i])):0;});
      const p=ctx.createBufferSource();p.buffer=b;p.connect(ctx.destination);playback=p;playStart=ctx.currentTime;
      p.onended=()=>{if(playback===p){playback=null;refresh();}p.disconnect();};p.start();refresh();
    }catch(e){status('No se pudo reproducir: '+e.message);}
  };
  ui.download.onclick=e=>{if(!sample||mode==='recording'||mode==='stopping')e.preventDefault();};
  let knobGesture=null;
  ui.dial.onpointerdown=e=>{e.preventDefault();knobGesture={id:e.pointerId,y:e.clientY,db:Number(ui.gain.value)};ui.dial.setPointerCapture(e.pointerId);};
  ui.dial.onpointermove=e=>{if(!knobGesture||knobGesture.id!==e.pointerId)return;const db=Math.max(-24,Math.min(12,knobGesture.db+(knobGesture.y-e.clientY)*(e.shiftKey ? 0.025 : 0.15)));ui.gain.value=db.toFixed(1);ui.gain.oninput();};
  ui.dial.onpointerup=e=>{if(knobGesture?.id===e.pointerId){knobGesture=null;ui.dial.releasePointerCapture(e.pointerId);}};
  ui.dial.onpointercancel=()=>{knobGesture=null;};
  ui.dial.ondblclick=()=>{ui.gain.value='0';ui.gain.oninput();};
  ui.view.onchange=()=>{root.dataset.view=ui.view.value;try{localStorage.setItem('juce-interface',ui.view.value);}catch{}};
  ui.theme.onclick=()=>{applyTheme(root.dataset.theme==='light'?'dark':'light');};
  function applyTheme(theme){root.dataset.theme=theme;ui.theme.textContent=theme==='light'?'Modo oscuro':'Modo claro';ui.theme.setAttribute('aria-pressed',String(theme==='light'));try{localStorage.setItem('juce-theme',theme);}catch{}}
  try{
    const query=new URLSearchParams(location.search),view=query.get('interface')||localStorage.getItem('juce-interface');
    if(['rack','mesa'].includes(view)){root.dataset.view=view;ui.view.value=view;}
    const theme=query.get('theme')||localStorage.getItem('juce-theme');if(['dark','light'].includes(theme))applyTheme(theme);
  }catch{}
  ui.save.onclick=async()=>{
    if(!sample||mode==='recording'||mode==='stopping'||saving)return;
    const take=sample;
    if(typeof window.showSaveFilePicker!=='function'){
      ui.download.click();status('Descarga iniciada. Para elegir carpeta, activa «Preguntar dónde guardar» en tu navegador.');return;
    }
    saving=true;refresh();let writable;
    try{
      const handle=await window.showSaveFilePicker({suggestedName:take.file.name,id:'juce-pluggin-wav',types:[{description:'Audio WAV estéreo',accept:{'audio/wav':['.wav']}}]});
      writable=await handle.createWritable();await writable.write(take.file);await writable.close();writable=null;
      status('WAV guardado: '+handle.name);
    }catch(e){if(writable)await writable.abort().catch(()=>{});status(e.name==='AbortError'?'Guardado cancelado. La muestra sigue disponible.':'No se pudo guardar: '+e.message);}
    finally{saving=false;refresh();}
  };
  ui['sample-drag'].onclick=e=>e.preventDefault();
  ui['sample-drag'].ondragstart=e=>{
    if(!sample||mode==='recording'||mode==='stopping'){e.preventDefault();return;}
    const transfer=e.dataTransfer;if(!transfer)return;transfer.effectAllowed='copy';
    transfer.setData('application/x-juce-take',String(takeId));
    transfer.setData('DownloadURL','audio/wav:'+sample.file.name+':'+blobUrl);
    transfer.setData('text/plain',sample.file.name);
    try{transfer.items.add(sample.file);}catch{}
    status('Arrastrando WAV. El arrastre fuera del navegador depende del destino.');
  };
  ui.drop.ondragover=e=>{const types=Array.from(e.dataTransfer?.types||[]);if(types.includes('application/x-juce-take')||types.includes('Files')){e.preventDefault();e.dataTransfer.dropEffect='copy';ui.drop.dataset.drag='true';}};
  ui.drop.ondragleave=e=>{if(!ui.drop.contains(e.relatedTarget))ui.drop.dataset.drag='false';};
  ui.drop.ondrop=async e=>{
    e.preventDefault();ui.drop.dataset.drag='false';const request=++dropGeneration;
    const id=e.dataTransfer.getData('application/x-juce-take');
    const file=id===String(takeId)&&sample?sample.file:e.dataTransfer.files?.[0];
    if(!file){status('No se recibió un archivo WAV.');return;}
    if(!file.name.toLowerCase().endsWith('.wav')){status('El canal de prueba acepta archivos WAV.');return;}
    if(file.size>100*1024*1024){status('El WAV supera el límite de 100 MB del canal de prueba.');return;}
    try{
      await engine();const buffer=await ctx.decodeAudioData(await file.arrayBuffer());
      if(request!==dropGeneration)return;stopChannelPlayback();channelSample={buffer,name:file.name};
      ui['channel-name'].textContent=file.name;ui['channel-name'].setAttribute('data-tooltip',file.name);ui['channel-play'].disabled=false;
      status('WAV cargado en el canal de prueba. Puedes escucharlo allí.');
    }catch(e){status('No se pudo leer el WAV: '+e.message);}
  };
  function stopChannelPlayback(){if(channelPlayback){const p=channelPlayback;channelPlayback=null;p.onended=null;try{p.stop();}catch{}p.disconnect();}ui['channel-play'].textContent='Escuchar';}
  ui['channel-play'].onclick=async()=>{
    if(channelPlayback){stopChannelPlayback();return;}if(!channelSample)return;
    try{await ctx.resume();const p=ctx.createBufferSource();p.buffer=channelSample.buffer;p.connect(ctx.destination);channelPlayback=p;
      p.onended=()=>{if(channelPlayback===p){channelPlayback=null;ui['channel-play'].textContent='Escuchar';}p.disconnect();};p.start();ui['channel-play'].textContent='Detener';
    }catch(e){status('No se pudo escuchar el canal: '+e.message);}
  };
  const painter=ui.canvas.getContext('2d'),samplePainter=ui['sample-canvas'].getContext('2d');
  const resize=new ResizeObserver(entries=>{
    const dpr=Math.min(window.devicePixelRatio||1,2);
    for(const entry of entries){const r=entry.contentRect,isSample=entry.target===ui['sample-drag'],canvas=isSample?ui['sample-canvas']:ui.canvas,paint=isSample?samplePainter:painter;
      if(isSample)sampleSize=[r.width,r.height];else waveSize=[r.width,r.height];
      canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));paint.setTransform(dpr,0,0,dpr,0,0);
    }
  });resize.observe(ui['wave-box']);resize.observe(ui['sample-drag']);
  function baselines(p,w,h,line){p.clearRect(0,0,w,h);p.strokeStyle=line;p.lineWidth=1;for(const y of [h*.25,h*.75]){p.beginPath();p.moveTo(0,y);p.lineTo(w,y);p.stroke();}}
  function drawEnvelope(p,data,w,h,accent){
    if(!data.length)return;const count=Math.max(1,Math.floor(w)),bins=data.length;p.strokeStyle=accent;p.beginPath();
    for(let x=0;x<count;x++){
      const a=Math.floor(x*bins/count),b=Math.max(a+1,Math.floor((x+1)*bins/count));const lo=[0,0],hi=[0,0];
      for(let j=a;j<Math.min(b,bins);j++){lo[0]=Math.min(lo[0],data[j][0]);hi[0]=Math.max(hi[0],data[j][1]);lo[1]=Math.min(lo[1],data[j][2]);hi[1]=Math.max(hi[1],data[j][3]);}
      for(let k=0;k<2;k++){const c=h*(k?.75:.25),scale=h*.20;p.moveTo(x,c-Math.min(1,hi[k])*scale);p.lineTo(x,c-Math.max(-1,lo[k])*scale);}
    }p.stroke();
  }
  function drawWave(){
    const [w,h]=waveSize,css=getComputedStyle(root),accent=css.getPropertyValue('--lc-accent'),line=css.getPropertyValue('--lc-line');
    baselines(painter,w,h,'#332b3d');painter.strokeStyle='#bda4f5';
    if(stream)for(let k=0;k<2;k++){painter.beginPath();const c=h*(k?.75:.25);for(let x=0;x<w;x++){const y=c-Math.max(-1,Math.min(1,scopes[k][Math.floor(x/w*2048)]))*h*.2;if(x===0)painter.moveTo(x,y);else painter.lineTo(x,y);}painter.stroke();}
    const [sw,sh]=sampleSize;baselines(samplePainter,sw,sh,line);
    if(sample){drawEnvelope(samplePainter,sample.envelope,sw,sh,accent);
      if(playback){const ratio=Math.min(1,(ctx.currentTime-playStart)/(sample.frames/sample.rate));samplePainter.strokeStyle=css.getPropertyValue('--lc-text');samplePainter.beginPath();samplePainter.moveTo(ratio*sw,0);samplePainter.lineTo(ratio*sw,sh);samplePainter.stroke();}
    }
  }
  function tick(t){
    if(!root.isConnected){resize.disconnect();disconnect();stopPlayback();stopChannelPlayback();if(ctx)ctx.close();if(blobUrl)URL.revokeObjectURL(blobUrl);return;}
    const dt=Math.min(.1,(t-lastTick)/1000||1/60);lastTick=t;
    for(let k=0;k<2;k++){
      let amplitude=0;if(stream&&analysers[k]){analysers[k].getFloatTimeDomainData(scopes[k]);for(const x of scopes[k])amplitude=Math.max(amplitude,Math.abs(x));}
      const db=amplitude>0?20*Math.log10(amplitude):-90;peaks[k]=Math.max(db,peaks[k]-26*dt);
      if(db>=0)clipUntil[k]=t+1000;
      const side=k?'r':'l',fill=ui['fill-'+side];fill.style.transform='scaleY('+Math.max(0,Math.min(1,(peaks[k]+60)/60))+')';fill.style.background=t<clipUntil[k]?'#efb87c':'#bda4f5';
      ui['level-'+side].textContent=peaks[k]<=-60?'−∞ dB':peaks[k].toFixed(1);
    }
    ui.clock.textContent=time(frames);if(t-drawTime>=1000/60){drawWave();drawTime=t;}requestAnimationFrame(tick);
  }
  if(embedded){status('Vista de interfaz. Autoriza la fuente en «Abrir captura real».');ui.kind.disabled=true;}
  else{ui.open.textContent='Captura local · audio no subido';ui.open.removeAttribute('href');ui.open.removeAttribute('target');}
  refresh();requestAnimationFrame(tick);
  window.addEventListener('pagehide',()=>{disconnect();stopPlayback();stopChannelPlayback();if(ctx)ctx.close();},{once:true});
})();

