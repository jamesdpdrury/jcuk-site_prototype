
const DeepLinkView={
 async render(slug){
  const vids=await API.videos();
  const v=vids.find(x=>x.slug===slug);
  if(!v){app.innerHTML='<h2>Video not found</h2>';return;}
  app.innerHTML=`<div class="card"><h2>Opening YouTube...</h2><p>${v.title}</p><p><a class="button" href="https://youtu.be/${v.youtubeId}">Open in YouTube</a></p></div>`;
  setTimeout(()=>window.location.href=`https://youtu.be/${v.youtubeId}`,700);
 }
}
