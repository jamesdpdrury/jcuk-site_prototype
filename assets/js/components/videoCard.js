
const VideoCard={
 logoMap: {},
 render(v){
  const slug=(v.slug||'').trim();
  const thumb=v.thumbnail && v.thumbnail.trim()
      ? v.thumbnail
      : `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`;
  const seriesLabel=(v.playlist||v.series||'').trim();
  const episodeNumber=(v.episode!=null&&v.episode!=='')?String(v.episode):'';
  const episodeLabel=seriesLabel && episodeNumber?`${seriesLabel} - Part ${episodeNumber}`:seriesLabel;
  
  // Build logo display in order: Transport, Hotel, Cruise, Theme Park
  const logos = [];
  if (v.travelBrand && Array.isArray(v.travelBrand)) {
    v.travelBrand.forEach(brand => {
      if (VideoCard.logoMap.travelBrand?.[brand]) {
        logos.push(`<img src="${VideoCard.logoMap.travelBrand[brand]}" alt="${brand}" class="card-logo">`);
      }
    });
  }
  if (v.hotelBrand && Array.isArray(v.hotelBrand)) {
    v.hotelBrand.forEach(brand => {
      if (VideoCard.logoMap.hotelBrand?.[brand]) {
        logos.push(`<img src="${VideoCard.logoMap.hotelBrand[brand]}" alt="${brand}" class="card-logo">`);
      }
    });
  }
  if (v.brand && VideoCard.logoMap.brand?.[v.brand]) {
    logos.push(`<img src="${VideoCard.logoMap.brand[v.brand]}" alt="${v.brand}" class="card-logo">`);
  }
  if (v.parkName && Array.isArray(v.parkName)) {
    v.parkName.forEach(park => {
      if (VideoCard.logoMap.parkName?.[park]) {
        logos.push(`<img src="${VideoCard.logoMap.parkName[park]}" alt="${park}" class="card-logo">`);
      }
    });
  }
  const logoHTML = logos.length ? `<div class="card-logos">${logos.join('')}</div>` : '';
  
  return `
    <article class="card">
      <a href="/v/${slug}" data-link style="display: block; text-decoration: none;">
        <img
          src="${thumb}"
          alt="${v.title}"
          loading="lazy"
          style="display: block; width: 100%; height: auto; cursor: pointer; border-radius: 10px 10px 0 0;"
          onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg';">
      </a>
      <div class="card-body">
        ${episodeLabel?`<div class="pill">${episodeLabel}</div>`:''}
        <h3 class="card-title">${v.title}</h3>
        <p class="card-description">${v.summary||''}</p>
        ${logoHTML}
        <div class="card-stats" data-video-id="${v.youtubeId || ''}">Loading stats…</div>
        <a class="btn" href="/v/${slug}" data-link>WATCH</a>
      </div>
    </article>`;
 },
 async hydrateStats(){
  const ids=[...new Set([...document.querySelectorAll('.card-stats[data-video-id]')]
    .map(node=>node.getAttribute('data-video-id'))
    .filter(Boolean))];
  if(!ids.length) return;
  try{
   const response=await fetch(`/api/youtube-stats?videoId=${encodeURIComponent(ids.join(','))}`);
   const data=await response.json();
   const stats=data.stats||{};
   document.querySelectorAll('.card-stats[data-video-id]').forEach(node=>{
    const videoId=node.getAttribute('data-video-id');
    const info=stats[videoId]||{};
    const views=info.viewCount!=null?new Intl.NumberFormat().format(info.viewCount):'—';
    const comments=info.commentCount!=null?new Intl.NumberFormat().format(info.commentCount):'—';
    node.innerHTML=`<span class="stat-pill">👁 ${views}</span><span class="stat-pill">💬 ${comments}</span>`;
   });
  }catch(error){
   document.querySelectorAll('.card-stats[data-video-id]').forEach(node=>{
    node.innerHTML='<span class="stat-pill">Stats unavailable</span>';
   });
  }
 }
};
