
const DeepLinkView={
 async render(slug){
  const items=await API.getContent();
  const v=items.find(x=>x.slug===slug);
  if(!v){app.innerHTML="<div class='container'><h2>Not found</h2></div>";return;}
  const related=items.filter(i=>i.slug!==slug && (i.brand===v.brand||i.series===v.series)).slice(0,3);
  app.innerHTML=`
  <div class="container">
   <div class="hero">
    <h1>${v.title}</h1>
    <p>${v.summary||""}</p>
    <a class="btn" href="https://youtu.be/${v.youtubeId}">Open in YouTube</a>
   </div>
   <section class="section">
    <h2>Related Content</h2>
    <div class="grid">
      ${related.map(r=>`<div class="card"><h3>${r.title}</h3><a class="btn" href="/v/${r.slug}" data-link>View</a></div>`).join("") || "<p>No related content yet.</p>"}
    </div>
   </section>
  </div>`;
  setTimeout(()=>location.href=`https://youtu.be/${v.youtubeId}`,800);
 }
};
