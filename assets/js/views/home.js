
const HomeView={
 async render(){
  const items=await API.getContent();
  const featured=items.find(i=>i.featured)||items[0];
  const featuredThumb=featured.thumbnail&&featured.thumbnail.trim()
      ? featured.thumbnail
      : `https://i.ytimg.com/vi/${featured.youtubeId}/maxresdefault.jpg`;

  app.innerHTML=`
  <div class="container">
    <section class="hero">
      <h1>James & Chris UK</h1>
      <p>Travel • Cruises • Theme Parks</p>
      <img class="hero-image"
           src="${featuredThumb}"
           onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${featured.youtubeId}/hqdefault.jpg';">
      <h2>${featured.title}</h2>
      <p>${featured.summary||''}</p>

      <div class="searchbar">
        <input id="homeSearch" placeholder="Search...">
      </div>

      <div id="results" class="grid"></div>
    </section>
  </div>`;

  const results=document.getElementById("results");

  function draw(list){
    results.innerHTML=list.map(v=>VideoCard.render(v)).join("");
  }

  draw(items);

  document.getElementById("homeSearch").addEventListener("input",e=>{
    draw(Search.filter(items,e.target.value,"All"));
  });
 }
};
