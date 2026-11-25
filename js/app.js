(() => {
"use strict";
const KEY = "redeMaisAdminDemo_v1";
const SETTINGS_KEY = "redeMaisAdminSettings_v1";
const supabase = window.redeMaisSupabase;
let products = [];
let editingId = null;
let categories = [];
const $ = id => document.getElementById(id);

function load(key, fallback) {
 try { return JSON.parse(localStorage.getItem(key)) ?? fallback }
 catch { return fallback }
}

function save() {
 localStorage.setItem(KEY, JSON.stringify(products))
}

async function loadRemoteData() {
 if (!supabase) {
  throw new Error("Conexão com o Supabase não encontrada.");
 }
 
 
   const [categoryResult, productResult] = await Promise.all([
  supabase
  .from("categories")
  .select("name, icon, note, is_active, sort_order")
  .order("sort_order"),
  supabase
  .from("products")
  .select("*")
  .order("name")
 ]);
 
 if (categoryResult.error) throw categoryResult.error;
 if (productResult.error) throw productResult.error;
 
 categories = categoryResult.data || [];
 
 products = (productResult.data || []).map(p => ({
  id: p.id,
  name: p.name,
  brand: p.brand || "",
  category: p.category,
  price: p.price,
  stock: p.stock,
  keywords: p.keywords || "",
  description: p.description || "",
  image: p.image_url || "",
  active: p.active,
  updatedAt: p.updated_at
 }));
 
 populateCategorySelects();
}

function populateCategorySelects() {
 const filter = $("categoryFilter");
 const form = $("productCategory");
 
 const previousFilter = filter.value;
 const previousCategory = form.value;
 
 filter.replaceChildren(
  new Option("Todas as categorias", "")
 );
 
 form.replaceChildren(
  new Option("Selecione", "")
 );
 
 categories.forEach(category => {
  filter.add(new Option(category.name, category.name));
  form.add(new Option(category.name, category.name));
 });
 
 if (categories.some(c => c.name === previousFilter)) {
  filter.value = previousFilter;
 }
 
 if (categories.some(c => c.name === previousCategory)) {
  form.value = previousCategory;
 }
}
window.redeMaisLoadRemoteData = loadRemoteData;
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

function getStoragePath(url) {
 const marker = "/storage/v1/object/public/product-images/";
 if (!url || !url.includes(marker)) return null;

 try {
  return decodeURIComponent(url.split(marker)[1]);
 } catch {
  return null;
 }
}

async function saveProduct(e) {
 e.preventDefault();

 const name = $("productName").value.trim();
 const category = $("productCategory").value;
 const stock = Number($("productStock").value);
 const price = $("productPrice").value === "" ? null : Number($("productPrice").value);

 if (!name || !category || !Number.isInteger(stock) || stock < 0 ||
  (price !== null && (!Number.isFinite(price) || price < 0))) {
  $("productFeedback").textContent = "Confira os campos obrigatórios e os valores informados.";
  return;
 }

 const file = $("productImage").files[0];
 const current = editingId ? products.find(p => p.id === editingId) : null;
 let image = current?.image || "";
 let uploadedPath = null;

 if (file) {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];

  if (!allowed.includes(file.type) || file.size > 5 * 1024 * 1024) {
   $("productFeedback").textContent = "Escolha JPG, PNG, WEBP ou AVIF com até 5 MB.";
   return;
  }
 }

 const button = $("productForm").querySelector('[type="submit"]');
 if (button) button.disabled = true;

 $("productFeedback").textContent = "Salvando produto...";

 try {
  if (!supabase) throw new Error("Conexão com o banco não encontrada.");

  if (file) {
   const extension = file.type === "image/jpeg" ? "jpg" :
    file.type === "image/png" ? "png" :
    file.type === "image/avif" ? "avif" : "webp";

   uploadedPath = `${crypto.randomUUID()}.${extension}`;

   const upload = await supabase.storage
    .from("product-images")
    .upload(uploadedPath, file, {
     contentType: file.type,
     upsert: false
    });

   if (upload.error) throw upload.error;

   const publicResult = supabase.storage
    .from("product-images")
    .getPublicUrl(uploadedPath);

   image = publicResult.data.publicUrl;
  }

  const payload = {
   name,
   brand: $("productBrand").value.trim(),
   category,
   price,
   stock,
   keywords: $("productKeywords").value.trim(),
   description: $("productDescription").value.trim(),
   image_url: image || null,
   active: $("productActive").checked,
   updated_at: new Date().toISOString()
  };

  let result;

  if (editingId) {
   result = await supabase
    .from("products")
    .update(payload)
    .eq("id", editingId)
    .select()
    .single();
  } else {
   result = await supabase
    .from("products")
    .insert(payload)
    .select()
    .single();
  }

  if (result.error) throw result.error;

  if (file && current?.image) {
   const oldPath = getStoragePath(current.image);

   if (oldPath) {
    await supabase.storage.from("product-images").remove([oldPath]);
   }
  }

  const p = result.data;

  const savedProduct = {
   id: p.id,
   name: p.name,
   brand: p.brand || "",
   category: p.category,
   price: p.price,
   stock: p.stock,
   keywords: p.keywords || "",
   description: p.description || "",
   image: p.image_url || "",
   active: p.active,
   updatedAt: p.updated_at
  };

  if (editingId) {
   products = products.map(item => item.id === editingId ? savedProduct : item);
  } else {
   products.push(savedProduct);
  }

  
   const wasEditing = Boolean(editingId);
   closeProduct();
   refresh();
   toast(wasEditing ? "Produto atualizado no banco." : "Produto cadastrado no banco.");


 } catch (error) {
  console.error("Erro ao salvar produto:", error);

  if (uploadedPath) {
   await supabase.storage.from("product-images").remove([uploadedPath]);
  }

  $("productFeedback").textContent =
   error.message || "Não foi possível salvar o produto.";

 } finally {
  if (button) button.disabled = false;
 }
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

async function deleteProduct(id) {
 const p = products.find(item => item.id === id);

 if (!p || !confirm(`Excluir "${p.name}" permanentemente do banco?`)) return;

 try {
  const { error } = await supabase
   .from("products")
   .delete()
   .eq("id", id);

  if (error) throw error;

  if (p.image) {
   const path = getStoragePath(p.image);

   if (path) {
    const { error: imageError } = await supabase.storage
     .from("product-images")
     .remove([path]);

    if (imageError) console.warn("Produto excluído, mas a foto não foi removida:", imageError);
   }
  }

  products = products.filter(item => item.id !== id);
  refresh();
  toast("Produto excluído do banco.");

 } catch (error) {
  console.error("Erro ao excluir produto:", error);
  toast(error.message || "Não foi possível excluir o produto.");
 }
}

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
window.redeMaisRefresh = refresh;
})();