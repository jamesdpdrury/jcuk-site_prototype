const HomeView={
 async render(){
 const items=await API.getContent();
 const featured=items.find(i=>i.featured)||items[0];
 let current='All';
 app.innerHTML=`<div class="container">
 <section class="hero">
 <h1>James & Chris UK</h1>
 <p>Travel • Cruises • Theme Parks</p>
 <h2>${featured.title}</h2>
 <div class="searchbar"><input id="homeSearch" placeholder="Search destinations, brands, videos..."></div>
 <div id="chips" class="filters"></div>
 <div id="results" class="grid"></div>
 </section></div>`;
 const chips=document.getElementById("chips");
 Search.categories(items).forEach(c=>{
   const s=document.createElement("span");
   s.className="chip"+(c==="All"?" active":"");
   s.textContent=c;
   s.onclick=()=>{
      current=c;
      document.querySelectorAll("#chips .chip").forEach(x=>x.classList.remove("active"));
      s.classList.add("active");
      draw();
   };
   chips.appendChild(s);
 });
 function draw(){
   const list=Search.filter(items,document.getElementById("homeSearch").value,current);
   document.getElementById("results").innerHTML=list.map(v=>`<div class="card"><h3>${v.title}</h3><p>${v.brand||''}</p><a class="btn" href="/v/${v.slug.trim()}" data-link>Watch</a></div>`).join("")||"<p>No results found.</p>";
 }
 document.getElementById("homeSearch").addEventListener("input",draw);
 draw();
 }
};