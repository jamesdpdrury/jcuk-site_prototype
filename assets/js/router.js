
const app=document.getElementById('app');
const Router={
 normalizeSlug(raw){
  if(!raw) return '';
  const cleaned=String(raw).replace(/^\/+|\/+$/g,'');
  try{
   return decodeURIComponent(cleaned);
  }catch(_error){
   return cleaned;
  }
 },
 renderLoadingShell(){
    app.innerHTML=`
     ${Header()}
     <main class="container page-loading" aria-live="polite" aria-busy="true">
        <div class="loading-line loading-line-title"></div>
        <div class="loading-line loading-line-wide"></div>
        <div class="loading-grid">
            <div class="loading-card"></div>
            <div class="loading-card"></div>
            <div class="loading-card"></div>
        </div>
     </main>`;
 },
 init(){
   if('scrollRestoration' in history){
    history.scrollRestoration='manual';
   }
  document.addEventListener('click',e=>{
   const a=e.target.closest('a[data-link]');
   if(!a)return;
   e.preventDefault();
   history.pushState({},'',a.getAttribute('href'));
   Router.render();
  });
  window.onpopstate=()=>Router.render();
  Router.render();
 },
 async populateHeaderInfo(){
    const profileImg=document.getElementById('channel-profile');
    const subCount=document.getElementById('subscriber-count');
    const channelData=await API.getYoutubeChannel();

    if(profileImg && channelData.profileImageUrl){
     profileImg.src=channelData.profileImageUrl;
     profileImg.classList.remove('is-loading');
    }

    if(subCount){
     const count=parseInt(channelData.subscriberCount)||0;
     if(count>0){
        subCount.textContent=new Intl.NumberFormat().format(count)+' subscribers';
     }else{
        subCount.textContent='Subscribe on YouTube';
     }
     subCount.classList.remove('is-loading');
    }
 },
 async render(){
   window.scrollTo({top:0,left:0,behavior:'auto'});
  const p=location.pathname;
    Router.renderLoadingShell();

    try{
     if(p==='/'||p==='/watch'){
        await HomeView.render();
        Router.populateHeaderInfo();
        return;
     }
     if(p==='/videos'){
        await VideosView.render();
        Router.populateHeaderInfo();
        return;
     }
     if(p.startsWith('/v/')){
        await DeepLinkView.render(p.slice(3));
        Router.populateHeaderInfo();
        return;
     }
     if(p.startsWith('/video/')){
        await DeepLinkView.render(p.slice(7));
        Router.populateHeaderInfo();
        return;
     }
     if(p.startsWith('/p/')){
        await PlaylistDeepLinkView.render(Router.normalizeSlug(p.slice(3)));
        Router.populateHeaderInfo();
        return;
     }
     if(p.startsWith('/playlist/')){
        await PlaylistDeepLinkView.render(Router.normalizeSlug(p.slice(10)));
        Router.populateHeaderInfo();
        return;
     }
     if(p.startsWith('/cruise/')){
        await CruiseFilterView.render(p.slice(8));
        Router.populateHeaderInfo();
        return;
     }
     if(p.startsWith('/park/')){
        await ParkFilterView.render(p.slice(6));
        Router.populateHeaderInfo();
        return;
     }
     app.innerHTML="<div class='container'><h1>404</h1></div>";
    }catch(error){
     console.error(error);
     app.innerHTML="<div class='container'><h1>Something went wrong</h1><p>Please refresh and try again.</p></div>";
    }
 }
};
Router.init();
