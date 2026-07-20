const Search={
 filter(items,term='',category='All'){
  term=(term||'').toLowerCase().trim();
  return items.filter(i=>{
    const hay=[
      i.title||'',i.summary||'',i.brand||'',i.series||'',
      ...(i.location||[]),...(i.tags||[]),
      ...(Array.isArray(i.hotelBrand)?i.hotelBrand:[]),
      ...(Array.isArray(i.parkName)?i.parkName:[]),
      ...(Array.isArray(i.travelBrand)?i.travelBrand:[]),
      ...(Array.isArray(i.shipName)?i.shipName:[i.shipName||''])
    ].join(' ').toLowerCase();
    const types=Array.isArray(i.type)?i.type:[i.type||''];
    const cats=Array.isArray(i.category)?i.category:[i.category||''];
    const catOk=category==='All'||types.includes(category)||cats.includes(category);
    return (!term||hay.includes(term))&&catOk;
  });
 },
 categories(items){
   const set=new Set(["All"]);
   items.forEach(i=>{
      (Array.isArray(i.type)?i.type:[i.type]).filter(Boolean).forEach(v=>set.add(v));
   });
   return [...set];
 }
};