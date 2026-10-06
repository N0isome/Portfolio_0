import {createRequire} from 'node:module';
import {readFileSync,readdirSync} from 'node:fs';
function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(dir+'/'+e.name):e.name.endsWith('.js')?[dir+'/'+e.name]:[])}
const require=createRequire(import.meta.url);const {Miniflare}=require(require.resolve('miniflare',{paths:[require.resolve('wrangler/package.json')]}));
const mf=new Miniflare({modules:[{type:'ESModule',path:process.cwd()+'/dist/server/index.js'},...files(process.cwd()+'/dist/server').filter(p=>p!==process.cwd()+'/dist/server/index.js').map(path=>({type:'ESModule',path}))],modulesRoot:process.cwd()+'/dist/server',modulesRules:[{type:'ESModule',include:['**/*.js'],fallthrough:true}],compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:{DB:'test-db'},r2Buckets:{BUCKET:'test-files'}});
const checks=[];function check(name,truth){if(!truth)throw new Error('FAILED: '+name);checks.push(name)}
const ids=Object.fromEntries(['owner','a','b','outsider','othermaker'].map(n=>[n,'qa-'+n]));
async function call(path='/api/kintsugi',who,body,extra={}){const headers=new Headers(extra.headers);if(who){headers.set('oai-authenticated-user-id',ids[who]);headers.set('oai-authenticated-user-email',who+'@example.invalid')}let payload=body;if(body instanceof FormData){const formRequest=new Request('http://kintsugi.test',{method:'POST',body});headers.set('Content-Type',formRequest.headers.get('Content-Type'));payload=await formRequest.arrayBuffer()}if(body&&!(body instanceof FormData)){headers.set('Content-Type','application/json');payload=JSON.stringify(body)}const r=await mf.dispatchFetch('http://kintsugi.test'+path,{...extra,headers,...payload?{method:'POST',body:payload}:{}});let data;const content=await r.arrayBuffer();try{data=JSON.parse(new TextDecoder().decode(content))}catch{data=content}return {status:r.status,data,headers:r.headers}}
const api=(who,action,body={})=>call('/api/kintsugi',who,action?{action,...body}:undefined);
try{
const db=await mf.getD1Database('DB');const sql=readFileSync('drizzle/0000_high_sentinel.sql','utf8').replaceAll('--> statement-breakpoint','');await db.batch(sql.split(';').map(s=>s.trim()).filter(Boolean).map(s=>db.prepare(s)));
check('anonymous writes rejected',(await api(null,'demo',{exampleId:'vase'})).status===401);
for(const who of Object.keys(ids))check('profile initializes '+who,(await api(who)).status===200);
for(const who of ['a','b','othermaker'])check('maker profile '+who,(await api(who,'joinMaker',{name:'QA '+who,commune:'Santiago',bio:'Restauración de objetos de prueba.',specialties:['Cerámica'],basePrice:25000})).status===200);
let data=new FormData();data.set('file',new Blob([readFileSync('public/assets/vase.webp')],{type:'image/webp'}),'vase.webp');const up=await call('/api/images','owner',data);check('private upload',up.status===200);const iid=up.data.id;
check('anonymous photo access rejected',(await call('/api/images?id='+iid)).status===401);
check('other user cannot view unattached photo',(await call('/api/images?id='+iid,'outsider')).status===404);
check('cannot attach someone else photo',(await api('outsider','create',{name:'Invalid',category:'Cerámica',description:'Una descripción.',commune:'Santiago',imageId:iid})).status===400);
const created=await api('owner','create',{name:'Objeto QA',category:'Cerámica',description:'Objeto de integración local.',commune:'Santiago',imageId:iid,status:'completed'});check('request published',created.status===200);const rid=created.data.id;
check('client cannot force status',(await api('owner')).data.requests.find(x=>x.id===rid).status==='open');
check('non-maker cannot offer',(await api('outsider','offer',{requestId:rid,price:10000,days:4,message:'No autorizado.'})).status===409);
check('other user cannot read requests',!(await api('outsider')).data.requests.some(x=>x.id===rid));
check('maker can view open request image',(await call('/api/images?id='+iid,'a')).status===200);
check('private image is not publicly cached',(await call('/api/images?id='+iid,'owner')).headers.get('cache-control')==='private, no-store');
const oids=[];for(const [who,price] of [['a',20000],['b',25000]]){const r=await api(who,'offer',{requestId:rid,price,days:4,message:'Incluye materiales.'});check('maker submits offer '+who,r.status===200);oids.push(r.data.id)}
check('one offer per maker',(await api('a','offer',{requestId:rid,price:22000,days:2,message:'Duplicada.'})).status===409);
check('maker sees only own offer',(await api('a')).data.offers.filter(x=>x.request_id===rid).length===1);
check('non-owner cannot accept',(await api('outsider','accept',{offerId:oids[0]})).status===409);
const raced=await Promise.all(oids.map(offerId=>api('owner','accept',{offerId})));check('concurrent accept has one winner',raced.map(x=>x.status).sort().join(',')==='200,409');
let s=(await api('owner')).data;let r=s.requests.find(x=>x.id===rid);const os=s.offers.filter(x=>x.request_id===rid);check('atomic accepted/rejected states',r.status==='in_progress'&&os.map(x=>x.status).sort().join(',')==='accepted,rejected');const accepted=os.find(x=>x.status==='accepted');
check('review cannot precede completion',(await api('owner','review',{offerId:accepted.id,rating:5,comment:'Too early.'})).status===409);
check('unrelated maker cannot read closed request',!(await api('othermaker')).data.requests.some(x=>x.id===rid));
check('unrelated maker cannot read closed image',(await call('/api/images?id='+iid,'othermaker')).status===404);
check('only owner can complete',(await api('outsider','complete',{requestId:rid})).status===409);
check('owner completes repair',(await api('owner','complete',{requestId:rid})).status===200);
check('verified review saved',(await api('owner','review',{offerId:accepted.id,rating:5,comment:'Objeto recuperado.'})).status===200);
check('one review per offer',(await api('owner','review',{offerId:accepted.id,rating:2,comment:'Duplicada.'})).status===409);
s=(await api('owner')).data;check('verified real rating computed',s.makers.find(x=>x.id===accepted.maker_id).rating_count===1);
const demo=await api('owner','demo',{exampleId:'vase'});check('demo repair created',demo.status===200);s=(await api('owner')).data;const demoOffers=s.offers.filter(x=>x.request_id===demo.data.id);check('demo two proposals',demoOffers.length===2);
check('demo acceptance',(await api('owner','accept',{offerId:demoOffers[0].id})).status===200);check('demo completion',(await api('owner','complete',{requestId:demo.data.id})).status===200);check('demo review',(await api('owner','review',{offerId:demoOffers[0].id,rating:5,comment:'Recorrido de prueba.'})).status===200);
check('demo makers excluded from real reputation',!(await api('owner')).data.makers.some(x=>x.id.startsWith('demo-')));
const demo2=await api('owner','demo',{exampleId:'chair'});check('cancellation saved',(await api('owner','cancel',{requestId:demo2.data.id})).status===200);check('cancellation rejects active offers',(await api('owner')).data.offers.filter(x=>x.request_id===demo2.data.id).every(x=>x.status==='rejected'));
const rq2=await api('owner','create',{name:'Objeto QA 2',category:'Cerámica',description:'Otra prueba.',commune:'Santiago',imageId:iid});const rid2=rq2.data.id;const o=await api('a','offer',{requestId:rid2,price:15000,days:3,message:'Oferta de retiro.'});check('maker can withdraw',(await api('a','withdraw',{offerId:o.data.id})).status===200);check('withdrawn offer cannot be accepted',(await api('owner','accept',{offerId:o.data.id})).status===409);
check('profile rejects malformed values',(await api('owner','profile',{name:'',commune:'Santiago',bio:'',specialties:[],basePrice:-1})).status===400);
await api('owner','joinMaker',{name:'QA owner',commune:'Santiago',bio:'Restauración de pruebas.',specialties:['Cerámica'],basePrice:0});check('self offer rejected',(await api('owner','offer',{requestId:rid2,price:15000,days:3,message:'Oferta propia.'})).status===409);
check('repeated acceptance rejected',(await api('owner','accept',{offerId:accepted.id})).status===409);
check('origin protection',(await call('/api/kintsugi','owner',{action:'cancel',requestId:rid2},{headers:{origin:'https://other.test'}})).status===403);
const badfile=new FormData();badfile.set('file',new Blob(['<svg>fake</svg>'],{type:'image/png'}),'fake.png');check('spoofed image rejected',(await call('/api/images','owner',badfile)).status===400);
s=(await api('owner')).data;check('fresh read preserves finished state',s.requests.find(x=>x.id===rid).status==='completed'&&s.offers.find(x=>x.id===accepted.id).review_rating===5);
check('public maker shape hides email',s.makers.every(x=>!('email' in x)));
const page=await call('/');check('HTML product rendered',page.status===200&&new TextDecoder().decode(page.data).includes('kintsugi'));
console.log(JSON.stringify({passed:checks.length,checks},null,2));
}finally{await mf.dispose()}
