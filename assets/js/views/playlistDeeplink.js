const PlaylistDeepLinkView={
 isSocialInAppBrowser(){
  const ua=(navigator.userAgent||'').toLowerCase();
  return ua.includes('instagram') || ua.includes('fban') || ua.includes('fbav') || ua.includes('fb_iab');
 },
 isAndroid(){
  return /android/i.test(navigator.userAgent||'');
 },
 normalizeSlug(value){
  const cleaned=String(value||'').replace(/^\/+|\/+$/g,'').trim().toLowerCase();
  return cleaned;
 },
 slugify(value){
  return String(value||'')
   .trim()
   .toLowerCase()
   .replace(/[^a-z0-9]+/g,'-')
   .replace(/(^-|-$)/g,'');
 },
 buildYouTubeAppUrl(playlistId){
  const encoded=encodeURIComponent(playlistId);
  if(PlaylistDeepLinkView.isAndroid()){
   return `intent://www.youtube.com/playlist?list=${encoded}#Intent;package=com.google.android.youtube;scheme=https;end`;
  }
  return `youtube://www.youtube.com/playlist?list=${encoded}`;
 },
 async render(routeSlug){
  const [items,settings]=await Promise.all([API.getContent(),API.getSettings()]);
  const playlists=settings?.playlists && typeof settings.playlists==='object' ? settings.playlists : {};
  const normalizedRoute=PlaylistDeepLinkView.normalizeSlug(routeSlug);

  const matchEntry=Object.entries(playlists).find(([name])=>{
   const normalizedName=PlaylistDeepLinkView.normalizeSlug(name);
   const normalizedSlug=PlaylistDeepLinkView.normalizeSlug(PlaylistDeepLinkView.slugify(name));
   return normalizedRoute===normalizedName || normalizedRoute===normalizedSlug;
  });

  if(!matchEntry){
   app.innerHTML="<div class='container'><h2>Playlist not found</h2><p>Please check the link and try again.</p></div>";
   return;
  }

  const playlistName=matchEntry[0];
  const playlistData=matchEntry[1]||{};
  const playlistId=String(playlistData.youtubePlaylistId||'').trim();
  const playlistVideos=(Array.isArray(items)?items:[])
   .filter(v=>String(v?.playlist||'').trim()===playlistName)
   .slice(0,8);

  if(!playlistId){
   app.innerHTML=`
   <div class="container">
    <div class="hero">
     <h1>${playlistName}</h1>
     <p>This playlist deep link is not configured yet.</p>
    </div>
   </div>`;
   return;
  }

  const webWatchUrl=`https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`;
  const isSocialBrowser=PlaylistDeepLinkView.isSocialInAppBrowser();

  app.innerHTML=`
  <div class="container">
   <div class="hero">
    <h1>${playlistName}</h1>
    <p>Opening this playlist in YouTube...</p>
    ${isSocialBrowser ? '<p class="deeplink-hint">If prompted, tap OK to open the YouTube app.</p>' : ''}
    <div class="deeplink-actions">
      <a class="btn" id="open-playlist-youtube-btn" href="${webWatchUrl}">Open in YouTube</a>
      <a class="btn" href="${webWatchUrl}" target="_blank" rel="noopener noreferrer">Open in Browser</a>
    </div>
   </div>
   ${playlistVideos.length ? `
   <section class="section">
    <h2>Playlist Videos</h2>
    <div class="grid">
      ${playlistVideos.map(v=>`
        <article class="card">
          <img src="${(v.thumbnail&&v.thumbnail.trim()) ? v.thumbnail : `https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg`}" alt="${v.title||''}" loading="lazy" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg';">
          <div class="card-body">
            <h3 class="card-title">${v.title||''}</h3>
            <a class="btn" href="/v/${encodeURIComponent(v.slug||'')}" data-link>Watch</a>
          </div>
        </article>`).join('')}
    </div>
   </section>` : ''}
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

  const tryOpenPlaylistApp=()=>{
   const appUrl=PlaylistDeepLinkView.buildYouTubeAppUrl(playlistId);
   window.location.href=appUrl;
   setTimeout(()=>{
    if(document.visibilityState==='visible'){
     window.location.href=webWatchUrl;
    }
   },700);
  };

  const openButton=document.getElementById('open-playlist-youtube-btn');
  if(openButton){
   openButton.addEventListener('click',event=>{
    event.preventDefault();
    tryOpenPlaylistApp();
   });
  }

  setTimeout(()=>{
   tryOpenPlaylistApp();
  },800);
 }
};
