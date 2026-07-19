const API={
 async getContent(){
   const r=await fetch('/data/content.json');
   return await r.json();
 }
};