export type Profile={id:string;name:string;role:'user'|'maker';commune:string;lat:number;lng:number;bio:string;specialties:string[];base_price:number};
export type Repair={id:string;user_id:string;item_name:string;category:string;description:string;image_id:string|null;commune:string;status:string;is_demo:number;created_at:string;accepted_offer_id:string|null;offer_count:number};
export type Offer={id:string;request_id:string;maker_id:string;name:string;price:number;message:string;days:number;status:string;review_rating?:number|null};
export type Maker=Profile & {rating:number;rating_count:number;demo?:boolean};
export type State={user:Profile|null;requests:Repair[];offers:Offer[];makers:Maker[]};
export const categories=['Todos','Cerámica','Muebles','Iluminación','Electrónica','Textiles','Otros'];
export const communes:Record<string,[number,number]>={Santiago:[-33.4489,-70.6693],Providencia:[-33.4314,-70.6093],Ñuñoa:[-33.4569,-70.5975],Independencia:[-33.4144,-70.6654],Recoleta:[-33.4069,-70.6407],Maipú:[-33.5106,-70.7577],'Las Condes':[-33.4085,-70.5671],'La Florida':[-33.5227,-70.5983],Temuco:[-38.7359,-72.5904],Valparaíso:[-33.0472,-71.6127]};
export const examples=[
 {id:'vase',item_name:'El florero de la abuela',category:'Cerámica',description:'Se quebró al moverlo. Conservo las piezas y me gustaría recuperarlo, aunque las uniones queden visibles.',commune:'Providencia',image:'/assets/vase.webp',price:28000},
 {id:'chair',item_name:'Una silla con historia',category:'Muebles',description:'La pata delantera se mueve y el asiento necesita ajuste. Quiero conservar la madera original.',commune:'Ñuñoa',image:'/assets/chair.webp',price:35000},
 {id:'lamp',item_name:'Mi lámpara de escritorio',category:'Iluminación',description:'Dejó de encender. Quiero revisar el cableado y el interruptor antes de reemplazarla.',commune:'Santiago',image:'/assets/lamp.webp',price:22000}
];
export const demoMakers:Maker[]=[
 {id:'demo-ceramic',name:'Taller Azul',role:'maker',commune:'Providencia',lat:-33.4314,lng:-70.6093,bio:'Restauración de cerámica y porcelana. Uniones visibles y recuperación de piezas.',specialties:['Cerámica'],base_price:25000,rating:0,rating_count:0,demo:true},
 {id:'demo-wood',name:'Segunda Madera',role:'maker',commune:'Ñuñoa',lat:-33.4569,lng:-70.5975,bio:'Reparación de muebles de madera, ensambles y restauración de asientos.',specialties:['Muebles'],base_price:30000,rating:0,rating_count:0,demo:true},
 {id:'demo-electric',name:'Luz de Nuevo',role:'maker',commune:'Santiago',lat:-33.4489,lng:-70.6693,bio:'Revisión y reparación de lámparas, cables e interruptores.',specialties:['Iluminación','Electrónica'],base_price:20000,rating:0,rating_count:0,demo:true}
];
export function money(value:number){return new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(value)}
export function distance(a:number,b:number,c:number,d:number){const r=Math.PI/180;const k=Math.sin((c-a)*r/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin((d-b)*r/2)**2;return 6371*2*Math.atan2(Math.sqrt(k),Math.sqrt(Math.max(0,1-k)))}
