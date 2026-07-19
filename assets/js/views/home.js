
const HomeView={
 async render(){
 const items=await API.getContent();
 const featured=items.find(i=>i.featured)||items[0];
 app.innerHTML=`
<header>
<div class="nav">
<div class="brand">James & Chris UK</div>
<div class="hamburger" id="ham">☰</div>
<nav class="menu" id="menu">
<a href="/" data-link>Home</a>
<a href="/videos" data-link>Videos</a>
<a href="#">Cruises</a>
<a href="#">Theme Parks</a>
</nav>
</div>
</header>

<div class="container">
<section class="hero">
<h1>${featured.title}</h1>
<p>${featured.summary||""}</p>
<img style="width:100%;border-radius:16px" src="https://i.ytimg.com/vi/${featured.youtubeId}/maxresdefault.jpg">
<p><a class="btn" href="/v/${featured.slug}" data-link>Watch Now</a></p>
</section>

<div class="searchbar">
<input id="search" placeholder="Search videos, destinations, cruise lines...">
</div>

<div class="filters">
<span class="chip active">All</span>
<span class="chip">Cruises</span>
<span class="chip">Theme Parks</span>
<span class="chip">City Breaks</span>
<span class="chip">Travel Tips</span>
</div>

<section>
<h2>Latest Content</h2>
<div class="grid">
${items.map(v=>`
<div class="card">
<img src="https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg">
<h3>${v.title}</h3>
<p><strong>${v.brand||""}</strong></p>
<p>${v.category||""}</p>
<a class="btn" href="/v/${v.slug}" data-link>Watch</a>
</div>`).join("")}
</div>
</section>
</div>
`;
const ham=document.getElementById("ham");
const menu=document.getElementById("menu");
ham.onclick=()=>menu.classList.toggle("open");
 }
}
