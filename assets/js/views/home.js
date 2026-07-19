
const HomeView={
 async render(){
  const items=await API.getContent();
  const featured=items.find(i=>i.featured)||items[0];
  const img=(featured.thumbnail&&featured.thumbnail.trim())?
      featured.thumbnail:
      `https://i.ytimg.com/vi/${featured.youtubeId}/maxresdefault.jpg`;

  app.innerHTML=`
    ${Header()}
    <main class="container">
      <section class="hero">
        <img class="hero-image"
             src="${img}"
             alt="${featured.title}"
             onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${featured.youtubeId}/hqdefault.jpg';">
        <h1>${featured.title}</h1>
        <p>${featured.summary||""}</p>

        <div class="grid">
          ${items.map(v=>VideoCard.render(v)).join("")}
        </div>
      </section>
    </main>
    ${Footer()}
  `;
 }
};
