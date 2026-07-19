
const API={
 async videos(){
  const r=await fetch('/data/videos.json');
  return await r.json();
 }
}
