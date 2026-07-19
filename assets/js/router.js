
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
 render(){
  const p=location.pathname;
  if(p==='/'||p==='/watch') return HomeView.render();
  if(p==='/videos') return VideosView.render();
  if(p.startsWith('/v/')) return DeepLinkView.render(p.slice(3));
  if(p.startsWith('/video/')) return DeepLinkView.render(p.slice(7));
  app.innerHTML="<div class='container'><h1>404</h1></div>";
 }
};
