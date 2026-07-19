
const VideosView={
 async render(){
 const items=await API.getContent();
 app.innerHTML=`
 <div class="container">
 <h1>Browse Videos</h1>
 <div class="searchbar"><input id="q" placeholder="Search..."></div>
 <div class="filters">
  <span class="chip active" data-cat="All">All</span>
  <span class="chip" data-cat="Cruise">Cruises</span>
  <span class="chip" data-cat="Theme Park">Theme Parks</span>
  <span class="chip" data-cat="City Break">City Breaks</span>
 </div>
 <div id="results" class="grid"></div>
 </div>`;
 let current="All";
 const out=document.getElementById("results");
 const draw=()=>{
   const list=Search.filter(items,document.getElementById("q").value,current);
   out.innerHTML=list.map(v=>`
   <div class="card">
    <img src="https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg">
    <h3>${v.title}</h3>
    <p>${v.brand||''}</p>
    <a class="btn" href="/v/${v.slug}" data-link>Watch</a>
   </div>`).join("") || "<p>No matching content.</p>";
 };
 draw();
 document.getElementById("q").oninput=draw;
 document.querySelectorAll(".chip").forEach(c=>c.onclick=()=>{
   document.querySelectorAll(".chip").forEach(x=>x.classList.remove("active"));
   c.classList.add("active");
   current=c.dataset.cat;
   draw();
 });
 }
};
