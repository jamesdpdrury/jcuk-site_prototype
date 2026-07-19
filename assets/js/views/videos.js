
const VideosView={
 async render(){
  const vids=await API.videos();
  app.innerHTML='<input id=s placeholder="Search videos"><div id=g class="grid"></div>';
  const g=document.getElementById('g');
  function draw(f=''){
   g.innerHTML='';
   vids.filter(v=>v.title.toLowerCase().includes(f)||v.ship.toLowerCase().includes(f)).forEach(v=>{
    g.innerHTML+=`<div class="card"><img class="thumb" src="https://i.ytimg.com/vi/${v.youtubeId}/maxresdefault.jpg"><h3>${v.title}</h3><p>${v.ship}</p><a class="button" href="/v/${v.slug}" data-link>Watch</a></div>`;
   });
  }
  draw();
  document.getElementById('s').oninput=e=>draw(e.target.value.toLowerCase());
 }
}
