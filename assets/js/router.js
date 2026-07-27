
const app=document.getElementById('app');
const Router={
 init(){
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
  const channelData=await API.getYoutubeChannel();
  if(channelData.profileImageUrl){
   const profileImg=document.getElementById('channel-profile');
   const subCount=document.getElementById('subscriber-count');
   if(profileImg) profileImg.src=channelData.profileImageUrl;
   if(subCount){
    const count=parseInt(channelData.subscriberCount)||0;
    if(count>0){
     subCount.textContent=new Intl.NumberFormat().format(count)+' subscribers';
    }
   }
  }
 },
 render(){
  const p=location.pathname;
  if(p==='/'||p==='/watch') return HomeView.render().then(()=>Router.populateHeaderInfo());
  if(p==='/videos') return VideosView.render().then(()=>Router.populateHeaderInfo());
  if(p.startsWith('/v/')) return DeepLinkView.render(p.slice(3)).then(()=>Router.populateHeaderInfo());
  if(p.startsWith('/video/')) return DeepLinkView.render(p.slice(7)).then(()=>Router.populateHeaderInfo());
  if(p.startsWith('/cruise/')) return CruiseFilterView.render(p.slice(8)).then(()=>Router.populateHeaderInfo());
  if(p.startsWith('/park/')) return ParkFilterView.render(p.slice(6)).then(()=>Router.populateHeaderInfo());
  app.innerHTML="<div class='container'><h1>404</h1></div>";
 }
};
Router.init();
