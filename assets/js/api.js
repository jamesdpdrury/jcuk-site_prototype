const API={
 _cache:{
   content:null,
   settings:null,
   youtubeChannel:null
 },
 _getApiBase(){
   // Use Netlify Functions on production, local API on localhost
   if(window.location.hostname==='localhost'||window.location.hostname==='127.0.0.1'){
     return '/api';
   }
   return '/.netlify/functions';
 },
 async getContent(forceRefresh=false){
   if(!forceRefresh && Array.isArray(this._cache.content)) return this._cache.content;
   const base=this._getApiBase();
   const r=await fetch(`${base}/content`);
   if(!r.ok) throw new Error(`Failed to load content (${r.status})`);
   const items=await r.json();
   const getTime=(item)=>{
     const value=item?.published;
     if (!value) return 0;
     const date=new Date(value);
     return Number.isNaN(date.getTime()) ? 0 : date.getTime();
   };
   const sorted=items.slice().sort((a,b)=>getTime(b)-getTime(a));
   this._cache.content=sorted;
   return sorted;
 },
 async getSettings(forceRefresh=false){
   try{
     if(!forceRefresh && this._cache.settings) return this._cache.settings;
     const base=this._getApiBase();
     const r=await fetch(`${base}/settings`);
     if(!r.ok) throw new Error(`Failed to load settings (${r.status})`);
     const settings=await r.json();
     this._cache.settings=settings && typeof settings==='object' ? settings : {};
     return this._cache.settings;
   }catch(e){
     return {};
   }
 },
 async getYoutubeChannel(forceRefresh=false){
   try{
     if(!forceRefresh && this._cache.youtubeChannel) return this._cache.youtubeChannel;
     const base=this._getApiBase();
     const r=await fetch(`${base}/youtube-channel`);
     if(!r.ok) throw new Error(`Failed to load channel (${r.status})`);
     const channel=await r.json();
     this._cache.youtubeChannel=channel && typeof channel==='object' ? channel : {};
     return this._cache.youtubeChannel;
   }catch(e){
     return {};
   }
 }
};