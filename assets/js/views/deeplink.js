
const DeepLinkView={
 async render(slug){
  const items=await API.getContent();
  const v=items.find(x=>x.slug===slug);
  if(!v){app.innerHTML="<div class='container'><h2>Not found</h2></div>";return;}
  const related=items.filter(i=>i.slug!==slug && (i.brand===v.brand||i.series===v.series)).slice(0,3);
  const thumb=v.thumbnail && v.thumbnail.trim()
    ? v.thumbnail
    : `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`;
  app.innerHTML=`
  <div class="container">
   <div class="hero">
    <img class="hero-image" src="${thumb}" alt="${v.title}" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg';">
    <h1>${v.title}</h1>
    <p>${v.summary||""}</p>
    <a class="btn" href="https://youtu.be/${v.youtubeId}">Open in YouTube</a>
   </div>
   <section class="section">
    <h2>Related Content</h2>
    <div class="grid">
      ${related.map(r=>`
        <article class="card">
          <img src="https://i.ytimg.com/vi/${r.youtubeId}/mqdefault.jpg" alt="${r.title}" loading="lazy" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${r.youtubeId}/hqdefault.jpg';">
          <div class="card-body">
            <small>${r.brand||''}</small>
            <h3 class="card-title">${r.title}</h3>
            <p class="card-description">${r.summary||''}</p>
            <a class="btn" href="/v/${r.slug}" data-link>View</a>
          </div>
        </article>`).join("") || "<p>No related content yet.</p>"}
    </div>
   </section>
  </div>`;
  setTimeout(()=>location.href=`https://youtu.be/${v.youtubeId}`,800);
 }
};
