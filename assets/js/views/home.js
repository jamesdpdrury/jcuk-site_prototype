const HomeView={
 async render(){
 const items=await API.getContent();
 const featured=items.find(i=>i.featured)||items[0];
 app.innerHTML=`
 <div class="container">
 <section class="hero">
 <h1>James & Chris UK</h1>
 <p>Travel • Cruises • Theme Parks</p>
 <img style="width:100%;border-radius:16px" src="https://i.ytimg.com/vi/${featured.youtubeId}/maxresdefault.jpg">
 <h2>${featured.title}</h2>
 <p>${featured.summary||''}</p>
 <a class="btn" href="/v/${featured.slug}" data-link>Watch Now</a>
 </section>

 <section class="section">
 <h2>Latest Videos</h2>
 <div class="grid">
 ${items.slice(0,6).map(v=>`
 <div class="card">
 <img src="https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg">
 <h3>${v.title}</h3>
 <p>${v.brand||''}</p>
 <a class="btn" href="/v/${v.slug}" data-link>Watch</a>
 </div>`).join("")}
 </div>
 </section>

 <section class="section">
 <h2>Browse</h2>
 <div class="grid">
 <div class="category">🚢 Cruises</div>
 <div class="category">🎢 Theme Parks</div>
 <div class="category">🏙 City Breaks</div>
 <div class="category">✈️ Travel Tips</div>
 </div>
 </section>

 <footer>© James & Chris UK</footer>
 </div>`;
 }
};