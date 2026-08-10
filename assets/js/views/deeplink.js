
const DeepLinkView={
 isSocialInAppBrowser(){
  const ua=(navigator.userAgent||'').toLowerCase();
  return ua.includes('instagram') || ua.includes('fban') || ua.includes('fbav') || ua.includes('fb_iab');
 },
 isAndroid(){
  return /android/i.test(navigator.userAgent||'');
 },
 buildYouTubeAppUrl(youtubeId){
  const encoded=encodeURIComponent(youtubeId);
  if(DeepLinkView.isAndroid()){
   return `intent://www.youtube.com/watch?v=${encoded}#Intent;package=com.google.android.youtube;scheme=https;end`;
  }
  return `youtube://www.youtube.com/watch?v=${encoded}`;
 },
 normalizeSlug(slug){
  const cleaned=String(slug||'').replace(/^\/+|\/+$/g,'');
  try{
   return decodeURIComponent(cleaned);
  }catch(_error){
   return cleaned;
  }
 },
 async render(slug){
  const items=await API.getContent();
  const targetSlug=DeepLinkView.normalizeSlug(slug).toLowerCase();
  const v=items.find(x=>DeepLinkView.normalizeSlug(x.slug).toLowerCase()===targetSlug);
  if(!v){app.innerHTML="<div class='container'><h2>Not found</h2></div>";return;}
  const related=items.filter(i=>DeepLinkView.normalizeSlug(i.slug).toLowerCase()!==targetSlug && (i.brand===v.brand||i.series===v.series)).slice(0,3);
  const thumb=v.thumbnail && v.thumbnail.trim()
    ? v.thumbnail
    : `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`;
  const webWatchUrl=`https://www.youtube.com/watch?v=${encodeURIComponent(v.youtubeId)}`;
  const shortWatchUrl=`https://youtu.be/${encodeURIComponent(v.youtubeId)}`;
  const isSocialBrowser=DeepLinkView.isSocialInAppBrowser();
  const socialHint=isSocialBrowser
    ? `<p class="deeplink-hint">If YouTube does not open, tap Open in YouTube below or open this page in your device browser.</p>`
    : '';
  app.innerHTML=`
  <div class="container">
   <div class="hero">
    <img class="hero-image" src="${thumb}" alt="${v.title}" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg';">
    <h1>${v.title}</h1>
    <p>${v.summary||""}</p>
    ${socialHint}
    <div class="deeplink-actions">
      <a class="btn" id="open-youtube-btn" href="${shortWatchUrl}">Open in YouTube</a>
      ${isSocialBrowser ? `<a class="btn" href="${webWatchUrl}" target="_blank" rel="noopener noreferrer">Open in Browser</a>` : ''}
    </div>
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
            <a class="btn" href="/v/${encodeURIComponent(r.slug||'')}" data-link>View</a>
          </div>
        </article>`).join("") || "<p>No related content yet.</p>"}
    </div>
   </section>
  </div>`;

  if(!document.getElementById('deeplink-social-style')){
   const style=document.createElement('style');
   style.id='deeplink-social-style';
   style.textContent=`
    .deeplink-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}
    .deeplink-hint{margin:0 0 12px;color:#5f584f;font-size:.95rem;}
   `;
   document.head.appendChild(style);
  }

  const openButton=document.getElementById('open-youtube-btn');
  if(openButton){
   openButton.addEventListener('click',event=>{
    if(!isSocialBrowser) return;
    event.preventDefault();
    const appUrl=DeepLinkView.buildYouTubeAppUrl(v.youtubeId);
    window.location.href=appUrl;
    setTimeout(()=>{
     if(document.visibilityState==='visible'){
      window.location.href=webWatchUrl;
     }
    },700);
   });
  }

  setTimeout(()=>{
   if(isSocialBrowser){
    const appUrl=DeepLinkView.buildYouTubeAppUrl(v.youtubeId);
    window.location.href=appUrl;
    setTimeout(()=>{
     if(document.visibilityState==='visible'){
      window.location.href=webWatchUrl;
     }
    },700);
    return;
   }
   window.location.href=shortWatchUrl;
  },800);
 }
};
