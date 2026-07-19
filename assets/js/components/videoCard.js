
const VideoCard={
 render(v){
  const slug=(v.slug||'').trim();
  const thumb=v.thumbnail && v.thumbnail.trim()
      ? v.thumbnail
      : `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`;
  return `
    <article class="card">
      <img
        src="${thumb}"
        alt="${v.title}"
        loading="lazy"
        onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg';">
      <div class="card-body">
        <small>${v.brand||''}</small>
        <h3>${v.title}</h3>
        <p>${v.summary||''}</p>
        <a class="btn" href="/v/${slug}" data-link>Watch</a>
      </div>
    </article>`;
 }
};
