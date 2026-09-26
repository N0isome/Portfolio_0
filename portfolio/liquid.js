(()=>{
  const canvas=document.getElementById('liquid');
  if(!canvas)return;
  const gl=canvas.getContext('webgl',{antialias:false,alpha:false,depth:false,stencil:false,powerPreference:'low-power'});
  if(!gl){canvas.hidden=true;return;}
  canvas.style.visibility='hidden';
  const vertex=`attribute vec2 position;void main(){gl_Position=vec4(position,0.0,1.0);}`;
  const fragment=`
    precision highp float;
    uniform vec2 uResolution;
    uniform float uTime;
    uniform vec2 uPointer;

    float hash21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash21(i),hash21(i+vec2(1.,0.)),f.x),mix(hash21(i+vec2(0.,1.)),hash21(i+vec2(1.,1.)),f.x),f.y);}
    mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
    float fbm(vec2 p){float v=0.,a=.53;mat2 m=mat2(.80,.60,-.60,.80);for(int i=0;i<5;i++){v+=a*noise(p);p=m*p*2.02+11.7;a*=.49;}return v;}
    float ridged(vec2 p){float n=fbm(p);return 1.0-abs(2.0*n-1.0);}

    vec2 flow(vec2 p,float t){
      vec2 q=vec2(fbm(p*.72+vec2(-t*.055,t*.040)),fbm(p*.76+vec2(t*.044,-t*.036)+6.8));
      vec2 r=vec2(fbm(p*1.12+3.2*q+vec2(-t*.075,t*.058)+2.2),fbm(p*1.06+2.8*q+vec2(t*.068,t*.052)+9.1));
      return r-.5;
    }

    float smoke(vec2 p,float t){
      vec2 f=flow(p,t);
      vec2 w=p+f*1.26;
      float broad=fbm(w*.92+vec2(-t*.050,t*.024));
      float veins=ridged(w*2.05+flow(w*1.35,t)*1.85);
      float curls=ridged(rot(.18)*w*3.25+vec2(t*.040,-t*.024));
      return broad*.60+veins*.27+curls*.13;
    }

    float blob(vec2 p,vec2 c,vec2 s){vec2 d=(p-c)/s;return exp(-dot(d,d)*1.22);}

    void main(){
      vec2 uv=gl_FragCoord.xy/uResolution.xy;
      vec2 p=uv*2.0-1.0;
      p.x*=uResolution.x/uResolution.y;
      float t=uTime*.62;
      p+=(uPointer-.5)*vec2(.10,-.065);
      p=rot(.05*sin(t*.30))*p;

      vec2 f=flow(p,t);
      vec2 w=p+f*.78;
      float s=smoke(p,t);
      float ridge=ridged(w*2.55+flow(w*1.7,t)*2.0);
      ridge=pow(ridge,3.4);

      vec3 ink=vec3(.024,.030,.021);
      vec3 deep=vec3(.045,.060,.041);
      vec3 teal=vec3(.055,.245,.285);
      vec3 tealSoft=vec3(.095,.330,.350);
      vec3 olive=vec3(.255,.315,.080);
      vec3 acid=vec3(.455,.535,.105);

      vec2 cTeal=vec2(-.86+.20*sin(t*.42),.18+.24*cos(t*.34));
      vec2 cOlive=vec2(.72+.20*cos(t*.38),-.40+.24*sin(t*.32));
      vec2 cOlive2=vec2(.96+.16*sin(t*.26),.70+.16*cos(t*.30));
      float a=blob(w,cTeal,vec2(.88,.84));
      float b=blob(w,cOlive,vec2(1.05,.78));
      float c=blob(w,cOlive2,vec2(.72,.92));

      float centerVoid=blob(p,vec2(.10,.06),vec2(.83,.70));
      float bands=smoothstep(.28,.78,s);
      vec3 col=mix(ink,deep,bands*.72);
      col+=teal*(a*(.35+.65*s));
      col+=olive*(b*(.40+.72*s));
      col+=acid*(c*(.22+.52*s));
      col+=tealSoft*ridge*(.08+.30*a);
      col+=acid*ridge*(.05+.20*b);
      col*=1.0-centerVoid*.36;

      float filament=pow(ridged(w*4.5+flow(w*2.4,t)*2.7),6.0);
      col+=mix(tealSoft,acid,smoothstep(-.2,.65,p.x))*filament*.09;

      float vign=1.0-.34*dot(uv-.5,uv-.5);
      col*=vign;
      col*=.88;
      float grain=(hash21(gl_FragCoord.xy+fract(t)*913.7)-.5)*.026;
      col+=grain;
      col=pow(max(col,0.0),vec3(.94));
      gl_FragColor=vec4(col,1.0);
    }`;
  function compile(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){console.error(gl.getShaderInfoLog(s));return null}return s}
  const program=gl.createProgram(),vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);if(!vs||!fs)return;gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS)){console.error(gl.getProgramInfoLog(program));return}gl.useProgram(program);
  const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  const res=gl.getUniformLocation(program,'uResolution'),time=gl.getUniformLocation(program,'uTime'),ptr=gl.getUniformLocation(program,'uPointer');
  // Same fragment shader and palette; capped rendering, visibility pause, reduced motion.
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const pointer={x:.5,y:.5,tx:.5,ty:.5};
  let frame=0,last=0,elapsed=0,previous=0,paused=false;
  function resize(){const budget=innerWidth<768?480000:950000;const dpr=Math.min(devicePixelRatio||1,1.25,Math.sqrt(budget/(innerWidth*innerHeight)));canvas.width=Math.round(innerWidth*dpr);canvas.height=Math.round(innerHeight*dpr);gl.viewport(0,0,canvas.width,canvas.height)}
  function draw(now){frame=0;if(document.hidden||paused)return;if(now-last>=1000/30||motion.matches){if(previous)elapsed+=Math.min(now-previous,80);previous=now;last=now;pointer.x+=(pointer.tx-pointer.x)*.045;pointer.y+=(pointer.ty-pointer.y)*.045;gl.uniform2f(res,canvas.width,canvas.height);gl.uniform1f(time,motion.matches?0:elapsed*.001);gl.uniform2f(ptr,pointer.x,pointer.y);gl.drawArrays(gl.TRIANGLES,0,6);canvas.style.visibility='visible'}if(!motion.matches)frame=requestAnimationFrame(draw)}
  function resume(){cancelAnimationFrame(frame);previous=0;last=0;if(!document.hidden&&!paused)frame=requestAnimationFrame(draw)}
  addEventListener('resize',()=>{resize();resume()},{passive:true});
  document.addEventListener('visibilitychange',resume);motion.addEventListener('change',resume);
  addEventListener('portfolio-motion',e=>{paused=e.detail;resume()});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);canvas.style.visibility='hidden'});
  addEventListener('pointermove',e=>{if(e.pointerType==='mouse'){pointer.tx=e.clientX/innerWidth;pointer.ty=1-e.clientY/innerHeight}},{passive:true});resize();resume();
})();
