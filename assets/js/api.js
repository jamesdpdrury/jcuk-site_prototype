const API={
 _getApiBase(){
   // Use Netlify Functions on production, local API on localhost
   if(window.location.hostname==='localhost'||window.location.hostname==='127.0.0.1'){
     return '/api';
   }
   return '/.netlify/functions';
 },
 async getContent(){
   const base=this._getApiBase();
   const r=await fetch(`${base}/content`);
   const items=await r.json();
   const getTime=(item)=>{
     const value=item?.published;
     if (!value) return 0;
     const date=new Date(value);
     return Number.isNaN(date.getTime()) ? 0 : date.getTime();
   };
   return items.slice().sort((a,b)=>getTime(b)-getTime(a));
 },
 async getSettings(){
   try{
     const base=this._getApiBase();
     const r=await fetch(`${base}/settings`);
     return await r.json();
   }catch(e){
     return {};
   }
 },
 async getYoutubeChannel(){
   try{
     const base=this._getApiBase();
     const r=await fetch(`${base}/youtube-channel`);
     return await r.json();
   }catch(e){
     return {};
   }
 }
};