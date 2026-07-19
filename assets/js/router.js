
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
  window.addEventListener('popstate',Router.render);
  Router.render();
 },
 render(){
  const p=location.pathname;
  if(p==='/'||p==='/watch') return HomeView.render();
  if(p==='/videos') return VideosView.render();
  if(p.startsWith('/v/')) return DeepLinkView.render(p.substring(3));
  app.innerHTML='<h1>404</h1>';
 }
}
