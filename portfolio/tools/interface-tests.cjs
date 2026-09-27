const {JSDOM}=require('jsdom');const fs=require('fs'),path=require('path'),assert=require('assert/strict');const root=path.resolve(__dirname,'..');
const dom=new JSDOM(fs.readFileSync(path.join(root,'proyectos.html'),'utf8'),{url:'https://portfolio.test/proyectos.html',runScripts:'outside-only'});const w=dom.window,d=w.document;
w.matchMedia=()=>({matches:false,addEventListener(){}});w.eval(fs.readFileSync(path.join(root,'interactions.js'),'utf8'));
const click=s=>d.querySelector(s).click();
click('.menu-toggle');assert.equal(d.querySelector('.menu-toggle').getAttribute('aria-expanded'),'true');
w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape'}));assert.equal(d.querySelector('.menu-toggle').getAttribute('aria-expanded'),'false');
click('[data-project-filter="marcas"]');assert.equal([...d.querySelectorAll('.project-card')].filter(e=>!e.hidden).length,2);
click('[data-project-filter="sistemas"]');assert.equal([...d.querySelectorAll('.project-card')].filter(e=>!e.hidden).length,3);
click('[data-project-filter="todos"]');assert.equal([...d.querySelectorAll('.project-card')].filter(e=>!e.hidden).length,5);
click('.motion-button');assert.equal(w.sessionStorage.getItem('nc-motion-paused'),'true');assert.ok(d.documentElement.classList.contains('motion-paused'));
click('.motion-button');assert.equal(w.sessionStorage.getItem('nc-motion-paused'),'false');
for(const file of fs.readdirSync(root).filter(n=>n.endsWith('.html'))){const doc=new JSDOM(fs.readFileSync(path.join(root,file),'utf8')).window.document;const ids=[...doc.querySelectorAll('[id]')].map(e=>e.id);assert.equal(ids.length,new Set(ids).size,file+' duplicate IDs');for(const el of doc.querySelectorAll('[src],link[href],a[href]')){const ref=el.getAttribute('src')||el.getAttribute('href');if(!ref||/^(https?:|mailto:|data:|#)/.test(ref))continue;const target=ref.split(/[?#]/)[0].replace(/^\//,'');assert.ok(fs.existsSync(path.join(root,target)),file+' missing '+ref)}for(const el of doc.querySelectorAll('script:not([src])'))assert.equal(el.textContent.trim(),'','CSP blocks inline script in '+file);}
console.log('PASS: menu, keyboard, filters, motion persistence, unique IDs, local assets, and no blocked inline scripts.');
