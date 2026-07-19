
const HomeView={
 async render(){
  const vids=await API.videos();
  vids.sort((a,b)=>new Date(b.published)-new Date(a.published));
  const v=vids[0];
  app.innerHTML=`<section class="hero">
  <h1>${v.title}</h1>
  <img class="thumb" src="https://i.ytimg.com/vi/${v.youtubeId}/maxresdefault.jpg">
  <p>${v.ship}</p>
  <p><a class="button" href="/v/${v.slug}" data-link>Watch Now</a></p>
  </section>`;
 }
}
