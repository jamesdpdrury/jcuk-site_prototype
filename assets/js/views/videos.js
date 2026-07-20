
const VideosView={
 async render(){
 const items=await API.getContent();
 const settings=await API.getSettings();
 VideoCard.logoMap=settings.logos||{};
 
 app.innerHTML=`
 ${Header()}
 <main class="container">
 <h1>Browse Videos</h1>
 <div class="searchbar"><input id="q" placeholder="Search..."></div>
 <div class="filters">
  <span class="chip active" data-cat="All">All</span>
  <span class="chip" data-cat="Cruise">Cruises</span>
  <span class="chip" data-cat="Theme Park">Theme Parks</span>
  <span class="chip" data-cat="City Break">City Breaks</span>
 </div>
 <div id="results" class="grid"></div>
 </main>`;
 let current="All";
 const out=document.getElementById("results");
 const draw=()=>{
   const list=Search.filter(items,document.getElementById("q").value,current);
   out.innerHTML=list.map(v=>VideoCard.render(v)).join("") || "<p>No matching content.</p>";
   VideoCard.hydrateStats();
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
