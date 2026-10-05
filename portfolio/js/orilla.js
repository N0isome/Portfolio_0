var baseMenu=[
{id:"m1",name:"Ostiones a la parmesana",category:"compartir",price:13900,desc:"Ostiones frescos gratinados con parmesano, mantequilla de Cahuil y vino blanco.",origin:"Cahuil",pairing:"Sauvignon Blanc costero",tags:["Producto local","Sin gluten"],soldOut:false,image:"assets/marea/ostiones.webp"},
{id:"m2",name:"Empanadas de mariscos",category:"compartir",price:9900,desc:"Masa crujiente, jaiba, camarón, machas y cilantro fresco.",origin:"Caleta de Pichilemu",pairing:"Chardonnay de la costa",tags:["Producto local"],soldOut:false,image:"assets/marea/empanadas.webp"},
{id:"m3",name:"Ceviche de reineta",category:"compartir",price:11800,desc:"Reineta del día, leche de tigre chilena, cebolla morada, ají verde y cítricos.",origin:"Pescadores artesanales de Pichilemu",pairing:"Sour de la casa",tags:["Recomendación","Sin gluten"],soldOut:false,image:"assets/marea/ceviche.webp"},
{id:"m4",name:"Reineta a la chilena",category:"mar",price:16900,desc:"Filete de reineta, papas doradas, ensalada chilena y limón.",origin:"Caleta de Pichilemu",pairing:"Sauvignon Blanc",tags:["Producto local","Recomendación"],soldOut:false,image:"assets/marea/pesca.webp"},
{id:"m5",name:"Paila marina",category:"mar",price:15800,desc:"Caldo concentrado, camarón, machas, choritos y pescado de roca.",origin:"Costa de Cardenal Caro",pairing:"Pinot Noir costero",tags:["Producto local","Sin gluten"],soldOut:false,image:"assets/orilla/Paila_marina.webp"},
{id:"m6",name:"Costillar asado",category:"tierra",price:15900,desc:"Costillar asado, papas fritas, tomates, encurtidos y salsa de la casa.",origin:"Secano costero",pairing:"Cabernet Sauvignon",tags:["Cocción lenta"],soldOut:false,image:"assets/orilla/plateada.webp"},
{id:"m7",name:"Pastel de choclo",category:"tierra",price:12900,desc:"Pino de vacuno, pollo, huevo, aceituna y pastelera de choclo dulce.",origin:"Valle interior de Marchigüe",pairing:"Carmenere",tags:["Tradición chilena"],soldOut:false,image:"assets/orilla/Pastel_de_choclo.webp"},
{id:"m8",name:"Coliflor a la brasa",category:"tierra",price:10900,desc:"Crema de semillas, chimichurri, almendras tostadas y hierbas.",origin:"Huertos del interior",pairing:"Rosé seco",tags:["Vegetariano"],soldOut:false,image:"assets/marea/coliflor.webp"},
{id:"m9",name:"Leche asada",category:"postres",price:5900,desc:"Huevos de campo, vainilla y caramelo tostado.",origin:"Receta de la casa",pairing:"Late Harvest",tags:["Vegetariano"],soldOut:true,image:"assets/orilla/La_leche_asada.webp"},
{id:"m10",name:"Spritz de pomelo",category:"tragos",price:6900,desc:"Bitter de pomelo, espumante, soda y piel de cítrico.",origin:"Bar Orilla",pairing:"Aperitivo",tags:["Casa"],soldOut:false,image:"assets/marea/pomelo.webp"},
{id:"m11",name:"Negroni de boldo",category:"tragos",price:7200,desc:"Gin, vermut rosso, bitter y cordial de boldo.",origin:"Bar Orilla",pairing:"Después de cena",tags:["Casa"],soldOut:false,image:"assets/orilla/Negroni_(cocktail).webp"},
{id:"m12",name:"Limonada de huerto",category:"sin-alcohol",price:3900,desc:"Limón, pepino, albahaca, jengibre y soda.",origin:"Huerto local",pairing:"Refresco",tags:["Sin alcohol","Vegano"],soldOut:false,image:"assets/marea/limonada.webp"}
];
var menu=JSON.parse(JSON.stringify(baseMenu));try{var stored=JSON.parse(localStorage.getItem("orillaFormalMenuV4"));if(Array.isArray(stored))menu=baseMenu.map(function(p){var old=stored.find(function(x){return x.id===p.id});return Object.assign({},p,old?{price:Number.isFinite(old.price)&&old.price>=0?old.price:p.price,soldOut:!!old.soldOut}:{});});}catch(e){}
var cart=[];try{var storedCart=JSON.parse(localStorage.getItem("orillaFormalCart"));if(Array.isArray(storedCart))cart=storedCart.filter(function(x){return x&&baseMenu.some(function(p){return p.id===x.id})&&Number.isInteger(x.qty)&&x.qty>0&&x.qty<=20});}catch(e){}
var currentCat="todo",selected=null;
function money(n){return "$"+Number(n).toLocaleString("es-CL")}
function save(){try{localStorage.setItem("orillaFormalMenuV4",JSON.stringify(menu));localStorage.setItem("orillaFormalCart",JSON.stringify(cart))}catch(e){}}
function catName(c){return {"compartir":"Para compartir","mar":"Mar","tierra":"Tierra","postres":"Postres","tragos":"Bar","sin-alcohol":"Sin alcohol"}[c]||c}
function renderMenu(){
 var q=document.getElementById("search").value.toLowerCase().trim();
 var list=menu.filter(function(x){return(currentCat==="todo"||x.category===currentCat)&&(!q||(x.name+" "+x.desc+" "+x.origin).toLowerCase().includes(q))});
 var grid=document.getElementById("menuGrid");
 if(!list.length){grid.innerHTML='<div class="empty">No encontramos platos con esos filtros.</div>';return}
 grid.innerHTML=list.map(function(x){
  var tags=x.tags.map(function(t){return '<span class="tag">'+t+'</span>'}).join("");
  return '<article class="dish '+(x.soldOut?'sold':'')+'"><div class="dish-photo"><img src="'+x.image+'" alt="'+x.name+'" loading="lazy">'+(x.soldOut?'<span class="sold-label">Agotado hoy</span>':'')+'</div><div class="dish-body"><div class="dish-top"><h3>'+x.name+'</h3><span class="price">'+money(x.price)+'</span></div><p>'+x.desc+'</p><div class="tags">'+tags+'</div><div class="dish-actions"><button class="text-btn" data-click="openDish(\''+x.id+'\')">Ver detalle</button>'+(x.soldOut?'':'<button class="add" data-click="addCart(\''+x.id+'\',1)">Agregar</button>')+'</div></div></article>'
 }).join("")
}
document.querySelectorAll(".cat").forEach(function(b){b.onclick=function(){document.querySelectorAll(".cat").forEach(function(x){x.classList.remove("active")});b.classList.add("active");currentCat=b.dataset.cat;renderMenu()}});
document.getElementById("search").oninput=renderMenu;
function openDish(id){selected=menu.find(function(x){return x.id===id});if(!selected)return;document.getElementById("modalImage").src=selected.image;document.getElementById("modalImage").alt=selected.name;document.getElementById("modalCat").textContent=catName(selected.category);document.getElementById("modalName").textContent=selected.name;document.getElementById("modalDesc").textContent=selected.desc;document.getElementById("modalOrigin").textContent=selected.origin;document.getElementById("modalPairing").textContent=selected.pairing;document.getElementById("modalQty").value=1;document.getElementById("modalAdd").disabled=selected.soldOut;document.getElementById("modalAdd").textContent=selected.soldOut?"Agotado hoy":"Agregar · "+money(selected.price);openOverlay("dishOverlay")}
document.getElementById("modalAdd").onclick=function(){if(!selected||selected.soldOut)return;addCart(selected.id,Math.max(1,+document.getElementById("modalQty").value||1));closeOverlay("dishOverlay")};
function addCart(id,qty){var p=menu.find(function(x){return x.id===id});if(!p||p.soldOut)return;var it=cart.find(function(x){return x.id===id});if(it)it.qty+=qty;else cart.push({id:id,qty:qty});save();updateCart();toast("Producto agregado al pedido")}
function changeQty(id,d){var it=cart.find(function(x){return x.id===id});if(!it)return;it.qty+=d;if(it.qty<=0)cart=cart.filter(function(x){return x.id!==id});save();updateCart();renderCart()}
function totals(){var count=0,total=0;cart.forEach(function(it){var p=menu.find(function(x){return x.id===it.id});if(p){count+=it.qty;total+=p.price*it.qty}});return{count:count,total:total}}
function updateCart(){var t=totals();document.getElementById("cartCount").textContent=t.count+" · "+money(t.total)}
function openCart(){renderCart();openOverlay("cartOverlay")}
function renderCart(){
 var box=document.getElementById("cartItems"),checkout=document.getElementById("checkout"),t=totals();
 if(!cart.length){box.innerHTML='<div class="empty-cart">Tu pedido está vacío. Agrega platos desde la carta.</div>';checkout.innerHTML="";return}
 box.innerHTML=cart.map(function(it){var p=menu.find(function(x){return x.id===it.id});return p?'<div class="cart-item"><div><strong>'+p.name+'</strong><small>'+money(p.price)+' por unidad</small></div><div class="qty"><button data-click="changeQty(\''+p.id+'\',-1)">−</button><span>'+it.qty+'</span><button data-click="changeQty(\''+p.id+'\',1)">+</button></div></div>':""}).join("");
 checkout.innerHTML='<div class="total"><span>Total</span><b>'+money(t.total)+'</b></div><div class="checkout"><label>Ubicación</label><select><option>Mesa 1</option><option>Mesa 2</option><option>Terraza</option><option>Retiro</option></select><label>Nombre</label><input id="customerName" placeholder="Nombre de la mesa o cliente"><label>Forma de pago</label><label class="pay"><input type="radio" name="pay" checked> Pago online / Webpay</label><label class="pay"><input type="radio" name="pay"> Pago en el local</label><button class="checkout-btn" data-click="demoCheckout()">Continuar pedido</button></div>'
}
function demoCheckout(){var n=document.getElementById("customerName");if(n&&!n.value.trim()){toast("Ingresa un nombre o referencia");return}toast("Demostración: aquí continúa el envío y pago");setTimeout(function(){closeOverlay("cartOverlay")},1300)}
function openService(type){
 var title=document.getElementById("serviceTitle"),text=document.getElementById("serviceText"),opts=document.getElementById("serviceOptions");
 if(type==="waiter"){title.textContent="Llamar garzón";text.textContent="Selecciona el motivo. En una implementación real la solicitud puede llegar al panel del equipo.";opts.innerHTML='<button data-click="serviceDone(\'Atención general\')">Atención general</button><button data-click="serviceDone(\'Cubiertos o servilletas\')">Cubiertos o servilletas</button><button data-click="serviceDone(\'Consulta de ingredientes\')">Consulta de ingredientes</button><button data-click="serviceDone(\'Retiro de platos\')">Retiro de platos</button>'}else{title.textContent="Pedir la cuenta";text.textContent="Indica cómo prefieres pagar. Esta demostración no procesa transacciones.";opts.innerHTML='<button data-click="serviceDone(\'Tarjeta\')">Tarjeta débito o crédito</button><button data-click="serviceDone(\'Efectivo\')">Efectivo</button><button data-click="serviceDone(\'Cuenta dividida\')">Dividir cuenta</button><button data-click="serviceDone(\'Pago online\')">Pago online</button>'}
 openOverlay("serviceOverlay")
}
function serviceDone(v){closeOverlay("serviceOverlay");toast("Solicitud registrada · "+v)}
function openAdmin(){renderAdmin();openOverlay("adminOverlay")}
function renderAdmin(){document.getElementById("adminList").innerHTML=menu.map(function(x){return '<div class="admin-row"><div><strong>'+x.name+'</strong><small>'+catName(x.category)+'</small></div><input type="number" value="'+x.price+'" min="0" step="100" data-change="adminPrice(\''+x.id+'\',this.value)"><button class="toggle '+(!x.soldOut?'on':'')+'" data-click="adminToggle(\''+x.id+'\')">'+(x.soldOut?'Agotado':'Disponible')+'</button></div>'}).join("")}
function adminPrice(id,v){var p=menu.find(function(x){return x.id===id});if(p){p.price=+v;save();renderMenu();updateCart();toast("Precio actualizado")}}
function adminToggle(id){var p=menu.find(function(x){return x.id===id});if(p){p.soldOut=!p.soldOut;cart=cart.filter(function(x){return x.id!==id||!p.soldOut});save();renderMenu();updateCart();renderAdmin();toast(p.soldOut?"Producto marcado agotado":"Producto disponible")}}
function resetDemo(){menu=JSON.parse(JSON.stringify(baseMenu));cart=[];localStorage.removeItem("orillaFormalMenuV4");localStorage.removeItem("orillaFormalCart");renderMenu();updateCart();renderAdmin();toast("Carta restablecida")}
function openOverlay(id){document.getElementById(id).classList.add("open");document.body.style.overflow="hidden"}
function closeOverlay(id){document.getElementById(id).classList.remove("open");document.body.style.overflow=""}
function backdropClose(e,id){if(e.target.classList.contains("modal-wrap"))closeOverlay(id)}
function toast(msg){var t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");clearTimeout(window._toast);window._toast=setTimeout(function(){t.classList.remove("show")},1700)}
renderMenu();updateCart();
try{new QRCode(document.getElementById("qr"),{text:location.href,width:118,height:118,colorDark:"#102436",colorLight:"#ffffff",correctLevel:QRCode.CorrectLevel.M})}catch(e){document.getElementById("qr").textContent="QR"}

const cardActions={openService,openAdmin,openCart,backdropClose,closeOverlay,resetDemo,openDish,addCart,changeQty,demoCheckout,serviceDone,adminPrice,adminToggle};
function dispatchCard(event,attribute){const el=event.target.closest('['+attribute+']');if(!el)return;const expression=el.getAttribute(attribute),match=expression.match(/^(\w+)\((.*)\)$/);if(!match||!cardActions[match[1]])return;const args=(match[2].match(/'[^']*'|"[^"]*"|[^,]+/g)||[]).map(x=>{x=x.trim();if(x==='this')return el;if(x==='event')return event;if(x==='this.value')return el.value;if(/^['"]/.test(x))return x.slice(1,-1);return Number(x)});cardActions[match[1]](...args)}
document.addEventListener('click',e=>dispatchCard(e,'data-click'));document.addEventListener('change',e=>dispatchCard(e,'data-change'));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelectorAll('.overlay.open').forEach(el=>closeOverlay(el.id));}});
