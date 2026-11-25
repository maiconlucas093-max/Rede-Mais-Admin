(() => {
"use strict";
const KEY="redeMaisAdminDemo_v1";
const SETTINGS_KEY="redeMaisAdminSettings_v1";
let products=load(KEY,[]);
let editingId=null;
const $=id=>document.getElementById(id);
const categories=["Medicamentos (consultar regras)","Higiene pessoal","Cuidados com a pele","Vitaminas e suplementos","Produtos infantis","Cuidados com os cabelos","Saúde e bem-estar","Primeiros socorros","Perfumaria","Conveniência","Outros"];
function load(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}}
function save(){localStorage.setItem(KEY,JSON.stringify(products))}
function money(v){return v===""||v===null||v===undefined?"A confirmar":Number(v).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
function safe(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),2600)}
function setPage(name){document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id==="page-"+name));document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===name));const labels={dashboard:"Visão geral",products:"Produtos",stock:"Estoque",orders:"Pedidos WhatsApp",sales:"Vendas",settings:"Configurações"};$("pageTitle").textContent=labels[name]||"Painel";$("sidebar").classList.remove("open");window.scrollTo({top:0,behavior:"smooth"});if(name==="products")renderProducts();if(name==="stock")renderStock()}
document.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>setPage(b.dataset.page)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>setPage(b.dataset.go)));

$("mobileMenu").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
$("newProduct").addEventListener("click",()=>openProduct());
$("emptyNewProduct").addEventListener("click",()=>openProduct());
$("closeModal").addEventListener("click",closeProduct);
$("cancelModal").addEventListener("click",closeProduct);
$("productDialog").addEventListener("click",e=>{if(e.target===$("productDialog"))closeProduct()});
$("productSearch").addEventListener("input",renderProducts);
$("categoryFilter").addEventListener("change",renderProducts);
$("productForm").addEventListener("submit",saveProduct);
function openProduct(id=null){
 editingId=id;const p=id?products.find(x=>x.id===id):null;
 $("productForm").reset();$("productActive").checked=p?p.active:true;$("productStock").value=p?p.stock:0;
 $("modalTitle").textContent=p?"Editar produto":"Cadastrar produto";$("productFeedback").textContent="";
 if(p){$("productName").value=p.name;$("productBrand").value=p.brand||"";$("productCategory").value=p.category;$("productPrice").value=p.price??"";$("productKeywords").value=p.keywords||"";$("productDescription").value=p.description||""}
 $("productDialog").showModal();
}
function closeProduct(){$("productDialog").close();editingId=null}
async function saveProduct(e){
 e.preventDefault();
 const name=$("productName").value.trim(),category=$("productCategory").value,stock=Number($("productStock").value),price=$("productPrice").value===""?null:Number($("productPrice").value);
 if(!name||!category||!Number.isInteger(stock)||stock<0||(price!==null&&(!Number.isFinite(price)||price<0))){$("productFeedback").textContent="Confira os campos obrigatórios e os valores informados.";return}
 const file=$("productImage").files[0];let image=editingId?(products.find(p=>p.id===editingId)?.image||""):"";
 if(file){if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>1024*1024){$("productFeedback").textContent="Escolha JPG, PNG ou WEBP com até 1 MB.";return}image=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})}
 const item={id:editingId||("rm-"+Date.now()),name,brand:$("productBrand").value.trim(),category,price,stock,keywords:$("productKeywords").value.trim(),description:$("productDescription").value.trim(),image,active:$("productActive").checked,updatedAt:new Date().toISOString()};
 if(editingId)products=products.map(p=>p.id===editingId?item:p);else products.unshift(item);
 save();closeProduct();refresh();renderProducts();toast(editingId?"Produto atualizado.":"Produto cadastrado.");
}
function renderProducts(){
 const q=norm($("productSearch").value),cat=$("categoryFilter").value;
 const list=products.filter(p=>(!cat||p.category===cat)&&(!q||norm([p.name,p.brand,p.category,p.keywords,p.description].join(" ")).includes(q)));
 $("productCount").textContent=`${list.length} ${list.length===1?"produto":"produtos"} encontrados`;
 $("productsEmpty").hidden=list.length>0;$("productsTableWrap").hidden=list.length===0;
 $("productsTable").innerHTML=list.map(p=>`<tr><td><div class="product-cell">${p.image?`<img src="${p.image}" alt="">`:`<span class="mini-thumb">＋</span>`}<span><strong>${safe(p.name)}</strong><br><small>${safe(p.brand||"Marca não informada")}</small></span></div></td><td>${safe(p.category)}</td><td>${money(p.price)}</td><td>${p.stock}</td><td><span class="status-badge ${p.active?"":"off"}">${p.active?"Ativo":"Inativo"}</span></td><td><div class="table-actions"><button data-edit="${safe(p.id)}">Editar</button><button class="delete" data-delete="${safe(p.id)}">Excluir</button></div></td></tr>`).join("");
 $("productsTable").querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>openProduct(b.dataset.edit)));
 $("productsTable").querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>deleteProduct(b.dataset.delete)));
}
function deleteProduct(id){const p=products.find(x=>x.id===id);if(!p||!confirm(`Excluir "${p.name}" deste navegador?`))return;products=products.filter(x=>x.id!==id);save();refresh();renderProducts();toast("Produto excluído dos dados locais.")}
function renderStock(){
 const total=products.reduce((s,p)=>s+p.stock,0),low=products.filter(p=>p.stock>0&&p.stock<=5).length,zero=products.filter(p=>p.stock===0).length;
 $("stockTotal").textContent=total;$("stockLow").textContent=low;$("stockZero").textContent=zero;$("stockEmpty").hidden=products.length>0;
 $("stockTable").innerHTML=products.map(p=>`<tr><td><strong>${safe(p.name)}</strong></td><td>${safe(p.category)}</td><td>${p.stock}</td><td><span class="status-badge ${p.stock===0||p.stock<=5?"low":""}">${p.stock===0?"Sem estoque":p.stock<=5?"Estoque baixo":"Regular"}</span></td><td><div class="table-actions"><button data-stock-edit="${safe(p.id)}">Editar</button></div></td></tr>`).join("");
 $("stockTable").querySelectorAll("[data-stock-edit]").forEach(b=>b.addEventListener("click",()=>openProduct(b.dataset.stockEdit)));
}
function refresh(){
 const active=products.filter(p=>p.active).length,total=products.reduce((s,p)=>s+p.stock,0),low=products.filter(p=>p.stock<=5).length;
 $("statProducts").textContent=products.length;$("statActive").textContent=active;$("statStock").textContent=total;$("statLow").textContent=low;
 $("recentProducts").innerHTML=products.slice(0,4).map(p=>`<div class="recent-row">${p.image?`<img class="recent-thumb" src="${p.image}" alt="">`:`<span class="recent-thumb">＋</span>`}<div><strong>${safe(p.name)}</strong><small>${safe(p.category)} · ${money(p.price)}</small></div></div>`).join("")||'<div class="empty-inline">Nenhum produto cadastrado ainda.</div>';
 renderProducts();renderStock();
}
function norm(s){return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim()}
$("settingsForm").addEventListener("submit",e=>{e.preventDefault();const s={name:$("storeName").value.trim(),whatsapp:$("storeWhatsapp").value.replace(/\D/g,""),city:$("storeCity").value.trim(),address:$("storeAddress").value.trim(),hours:$("storeHours").value.trim()};localStorage.setItem(SETTINGS_KEY,JSON.stringify(s));$("settingsFeedback").textContent="Configurações salvas neste navegador.";toast("Configurações locais salvas.")});
const savedSettings=load(SETTINGS_KEY,null);if(savedSettings){$("storeName").value=savedSettings.name||"Drogaria Rede Mais";$("storeWhatsapp").value=savedSettings.whatsapp||"";$("storeCity").value=savedSettings.city||"";$("storeAddress").value=savedSettings.address||"";$("storeHours").value=savedSettings.hours||""}
$("exportData").addEventListener("click",()=>{const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),products},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="drogaria-rede-mais-produtos.json";a.click();URL.revokeObjectURL(url);toast("Arquivo JSON exportado.")});
$("clearData").addEventListener("click",()=>{if(!confirm("Isso apagará os produtos salvos neste navegador. Deseja continuar?"))return;products=[];save();refresh();toast("Dados locais apagados.")});
})();