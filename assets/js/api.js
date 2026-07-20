const API={
 async getContent(){
   const r=await fetch('/data/content.json');
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
     const r=await fetch('/api/settings');
     return await r.json();
   }catch(e){
     return {};
   }
 },
 async getYoutubeChannel(){
   try{
     const r=await fetch('/api/youtube-channel');
     return await r.json();
   }catch(e){
     return {};
   }
 }
};