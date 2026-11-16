import { CATEGORY_DATA } from './category-data.js';
import ICON_METADATA from './icon-metadata.json' with { type: 'json' };

const DB_NAME = 'icon-maker-ai-categorization';
const STORE_NAME = 'results';
const PAGE_SIZE = 30;
const iconNames = Object.keys(ICON_METADATA).sort((a,b)=>a.localeCompare(b));
const categoryNames = CATEGORY_DATA.map(item=>item.name);
const $ = id => document.getElementById(id);
let db;
let pendingImport = null;
let currentPage = 0;
let filteredRecords = [];

function openDatabase(){
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,1);
    request.onupgradeneeded=()=>{
      if(!request.result.objectStoreNames.contains(STORE_NAME))
        request.result.createObjectStore(STORE_NAME,{keyPath:'name'});
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}
function transact(mode, action){
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE_NAME,mode);
    const store=tx.objectStore(STORE_NAME);
    let result;
    try{result=action(store)}catch(error){reject(error);return}
    tx.oncomplete=()=>resolve(result?.result);
    tx.onerror=()=>reject(tx.error);
    tx.onabort=()=>reject(tx.error||new Error('IndexedDB transaction aborted'));
  });
}
const getAll=()=>transact('readonly',s=>s.getAll());
const saveMany=records=>transact('readwrite',s=>{records.forEach(r=>s.put(r));return null});
const unique=items=>[...new Set((items||[]).filter(x=>typeof x==='string'&&x.trim()).map(x=>x.trim()))];

function setStatus(message,isError=false){
  $('status').textContent=message;
  $('status').className=isError?'status warning':'status muted';
}
function validatePayload(payload){
  if(!payload||typeof payload!=='object'||!payload.predictions||typeof payload.predictions!=='object')
    throw new Error('This JSON does not contain a predictions object.');
  const entries=Object.entries(payload.predictions);
  if(!entries.length)throw new Error('The predictions object is empty.');
  const known=new Set(iconNames);
  const unknown=entries.map(([name])=>name).filter(name=>!known.has(name));
  if(unknown.length)throw new Error('Unknown icon names ('+unknown.length+'): '+unknown.slice(0,8).join(', '));
  const allowed=new Set(categoryNames);
  let withSuggestions=0,total=0;
  for(const [icon,items] of entries){
    if(!Array.isArray(items))throw new Error('Invalid prediction list for '+icon+'.');
    const seen=new Set();
    for(const item of items){
      if(!item||typeof item.category!=='string'||!allowed.has(item.category))
        throw new Error('Unknown category for '+icon+': '+(item?.category||'(missing)'));
      const score=Number(item.score);
      if(!Number.isFinite(score)||score<0||score>1)throw new Error('Invalid score for '+icon+'/'+item.category+'.');
      if(seen.has(item.category))throw new Error('Duplicate category for '+icon+': '+item.category);
      seen.add(item.category);
    }
    if(items.length)withSuggestions++;
    total+=items.length;
  }
  return {iconCount:entries.length,withSuggestions,total,empty:entries.length-withSuggestions};
}
async function importPredictions(){
  const {payload,stats}=pendingImport;
  const existing=await getAll();
  const byName=new Map(existing.map(record=>[record.name,record]));
  const writes=iconNames.map(name=>{
    const record=byName.get(name)||{name};
    record.externalPredictions={
      source:payload.model||'external-prediction-export',
      engineVersion:payload.engineVersion??null,
      importedAt:new Date().toISOString(),
      filter:payload.filter||null,
      suggestions:payload.predictions[name]||[]
    };
    return record;
  });
  for(let i=0;i<writes.length;i+=100){
    await saveMany(writes.slice(i,i+100));
    $('progress').max=writes.length;
    $('progress').value=Math.min(i+100,writes.length);
    setStatus('Importing… '+Math.min(i+100,writes.length)+' / '+writes.length+'. Existing manual reviews and AI results are preserved.');
  }
  pendingImport=null;
  $('import-btn').disabled=true;
  setStatus('Import complete: '+stats.iconCount+' source icons, '+stats.total+' suggestions. '+stats.empty+' source icons have no suggestions. All '+writes.length+' catalog icons are represented.');
  await refresh();
}
async function refresh(){
  const records=await getAll();
  const byName=new Map(records.map(r=>[r.name,r]));
  const all=iconNames.map(name=>byName.get(name)||{name});
  $('total').textContent=all.length.toLocaleString();
  $('with-predictions').textContent=all.filter(r=>r.externalPredictions?.suggestions?.length).length.toLocaleString();
  $('without-predictions').textContent=all.filter(r=>r.externalPredictions&&!r.externalPredictions.suggestions?.length).length.toLocaleString();
  $('reviewed').textContent=all.filter(r=>r.reviewedAt&&Array.isArray(r.manualCategories)).length.toLocaleString();
  $('imported').textContent=all.some(r=>r.externalPredictions)?'Yes':'No';
  $('progress').max=all.length;
  $('progress').value=all.filter(r=>r.externalPredictions).length;
  render(all);
}
function makeChip(name,checked,score=null,title=''){
  const label=document.createElement('label');label.className='chip';
  const input=document.createElement('input');input.type='checkbox';input.value=name;input.checked=checked;
  const text=document.createElement('span');text.textContent=name;label.append(input,text);
  if(score!==null){const small=document.createElement('small');small.textContent=' · '+(Number(score)*100).toFixed(1)+'% similarity';label.append(small);}
  if(title)label.title=title;
  return label;
}
function render(records){
  const query=$('search').value.trim().toLowerCase(),filter=$('filter').value,sort=$('sort').value;
  filteredRecords=records.filter(r=>{
    const suggestions=r.externalPredictions?.suggestions||[];
    if(query&&!r.name.toLowerCase().includes(query))return false;
    if(filter==='suggestions'&&!suggestions.length)return false;
    if(filter==='empty'&&suggestions.length)return false;
    if(filter==='reviewed'&&!r.reviewedAt)return false;
    if(filter==='unreviewed'&&r.reviewedAt)return false;
    return true;
  });
  const top=r=>Number(r.externalPredictions?.suggestions?.[0]?.score)||0;
  const gap=r=>{const a=r.externalPredictions?.suggestions||[];return a.length>1?Number(a[0].score)-Number(a[1].score):Infinity;};
  if(sort==='score')filteredRecords.sort((a,b)=>top(b)-top(a)||a.name.localeCompare(b.name));
  else if(sort==='ambiguous')filteredRecords.sort((a,b)=>gap(a)-gap(b)||a.name.localeCompare(b.name));
  else if(sort==='lowest')filteredRecords.sort((a,b)=>top(a)-top(b)||a.name.localeCompare(b.name));
  else if(sort==='reviewed')filteredRecords.sort((a,b)=>Number(Boolean(b.reviewedAt))-Number(Boolean(a.reviewedAt))||a.name.localeCompare(b.name));
  else filteredRecords.sort((a,b)=>a.name.localeCompare(b.name));
  const pages=Math.max(1,Math.ceil(filteredRecords.length/PAGE_SIZE));
  currentPage=Math.min(currentPage,pages-1);
  $('page-label').textContent=$('page-label-bottom').textContent='Page '+(currentPage+1)+' of '+pages+' · '+filteredRecords.length+' icons';
  ['previous','previous-bottom'].forEach(id=>$(id).disabled=currentPage===0);
  ['next','next-bottom'].forEach(id=>$(id).disabled=currentPage>=pages-1);
  const root=$('results');root.replaceChildren();
  const items=filteredRecords.slice(currentPage*PAGE_SIZE,(currentPage+1)*PAGE_SIZE);
  if(!items.length){const p=document.createElement('p');p.className='empty';p.textContent='No icons match this filter.';root.append(p);return;}
  items.forEach(record=>root.append(createCard(record)));
}
function createCard(record){
  const card=document.createElement('article');card.className='item';
  const heading=document.createElement('h3');heading.textContent=record.name;
  const badge=document.createElement('span');badge.className='tag';badge.textContent=record.reviewedAt?'Manually reviewed':'Not reviewed';
  card.append(heading,badge);
  const metadata=ICON_METADATA[record.name]||{},lucide=metadata.lucide||{};
  const official=unique((lucide.categories||[]).filter(x=>typeof x==='string'&&!/^\$(group|extends):/i.test(x)));
  const existingManual=Array.isArray(record.manualCategories)?record.manualCategories:[];
  const defaults=existingManual.length?existingManual:official;
  const suggestions=record.externalPredictions?.suggestions||[];
  if(suggestions.length>1){
    const p=document.createElement('p');p.className='muted';
    p.textContent='Top-two similarity gap: '+((Number(suggestions[0].score)-Number(suggestions[1].score))*100).toFixed(1)+' points. Smaller gaps indicate greater ambiguity.';
    card.append(p);
  }
  const section=(title)=>{const el=document.createElement('div');el.className='section-label';el.textContent=title;card.append(el);return el;};
  const officialBox=document.createElement('div');officialBox.className='chips';section('Official Lucide categories');
  if(official.length)official.forEach(n=>officialBox.append(makeChip(n,defaults.includes(n),null,'Official Lucide category')));
  else officialBox.textContent='No official category labels available.';
  card.append(officialBox);
  const aiBox=document.createElement('div');aiBox.className='chips';section('Imported AI suggestions (similarity, not probability)');
  if(suggestions.length)suggestions.forEach(s=>aiBox.append(makeChip(s.category,defaults.includes(s.category),s.score,'Imported prediction')));
  else aiBox.textContent=record.externalPredictions?'No suggestion in this export.':'No prediction imported.';
  card.append(aiBox);
  const addSource=(title,items)=>{
    if(!Array.isArray(items)||!items.length)return;
    const box=document.createElement('div');box.className='chips';section(title);
    items.forEach(item=>{const name=item?.name||item?.category;if(!name)return;const score=Number(item.confidence??item.score);box.append(makeChip(name,defaults.includes(name),Number.isFinite(score)?score:null,title));});
    card.append(box);
  };
  addSource('Existing text-only benchmark',record.textBenchmark?.suggestions);
  addSource('Existing shared-engine AI suggestions',record.aiSuggestions);
  addSource('Existing visual-model scores',record.visualScores);
  const allBox=document.createElement('div');allBox.className='chips';section('All available categories');
  categoryNames.forEach(n=>{if(!suggestions.some(s=>s.category===n)&&!official.includes(n))allBox.append(makeChip(n,defaults.includes(n)));});
  card.append(allBox);
  const customRow=document.createElement('div');customRow.className='controls';
  const custom=document.createElement('input');custom.placeholder='Add a custom category';
  const add=document.createElement('button');add.textContent='Add';
  add.addEventListener('click',()=>{
    const value=custom.value.trim();if(!value)return;
    const exists=[...card.querySelectorAll('input[type=checkbox]')].some(i=>i.value.toLowerCase()===value.toLowerCase());
    if(!exists)allBox.append(makeChip(value,true));
    custom.value='';
  });
  customRow.append(custom,add);card.append(customRow);
  const actions=document.createElement('div');actions.className='item-actions';
  const save=document.createElement('button');save.className='primary';save.textContent='Save manual categories';
  save.addEventListener('click',async()=>{
    const chosen=unique([...card.querySelectorAll('input[type=checkbox]:checked')].map(i=>i.value));
    if(!chosen.length){setStatus('Choose at least one category before saving.',true);return;}
    const latest=(await getAll()).find(r=>r.name===record.name)||{name:record.name};
    latest.manualCategories=chosen;latest.reviewedAt=new Date().toISOString();latest.categorySource='manual';
    await saveMany([latest]);
    setStatus('Saved manual categories for '+record.name+'. Manual selections remain separate and take priority.');
    await refresh();
  });
  const apply=document.createElement('button');apply.textContent='Apply reviewed categories to Gallery';
  apply.disabled=!record.reviewedAt||!existingManual.length;
  apply.title=apply.disabled?'Save manual categories first.':'Apply this manual selection to matching finished Gallery icons.';
  apply.addEventListener('click',()=>{
    try{
      const raw=localStorage.getItem('iconMakerProjects');
      if(!raw)throw new Error('No saved Icon Maker PRO projects were found in this browser.');
      const manager=JSON.parse(raw);
      if(!manager||!Array.isArray(manager.projects))throw new Error('Saved project data has an unexpected format.');
      const normalize=v=>String(v||'').trim().toLowerCase().replace(/[_\s]+/g,'-').replace(/-+/g,'-');
      const matches=manager.projects.filter(p=>normalize(p.name)===normalize(record.name)&&p.status==='finished');
      if(!matches.length)throw new Error('No finished Gallery icon named "'+record.name+'" was found.');
      matches.forEach(p=>{p.manualCategories=[...existingManual];p.categories=[...existingManual];p.categorySource='manual';p.category=existingManual[0];});
      localStorage.setItem('iconMakerProjects',JSON.stringify(manager));
      apply.textContent='Applied to Gallery ('+matches.length+')';apply.disabled=true;
      setStatus('Applied manual categories to '+matches.length+' finished Gallery project(s). Refresh the main Icon Maker page.');
    }catch(error){setStatus('Could not apply categories: '+error.message,true);}
  });
  actions.append(save,apply);card.append(actions);
  return card;
}
async function exportBackup(){
  const records=await getAll();
  const payload={exportedAt:new Date().toISOString(),catalogIconCount:iconNames.length,
    importedPredictionRecords:records.filter(r=>r.externalPredictions).length,
    reviewedRecords:records.filter(r=>r.reviewedAt).map(r=>({name:r.name,manualCategories:r.manualCategories,reviewedAt:r.reviewedAt})),
    records:records.filter(r=>r.externalPredictions||r.reviewedAt)};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='icon-maker-ai-category-review-backup.json';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  setStatus('Review backup exported.');
}
$('prediction-file').addEventListener('change',async event=>{
  const file=event.target.files?.[0];if(!file){pendingImport=null;$('import-btn').disabled=true;return;}
  try{
    const payload=JSON.parse(await file.text()),stats=validatePayload(payload);
    pendingImport={payload,stats};$('import-btn').disabled=false;
    setStatus('Validated '+stats.iconCount+' icons and '+stats.total+' suggestions. '+stats.empty+' icons have no suggestions. Existing AI and manual fields will be preserved.');
  }catch(error){pendingImport=null;$('import-btn').disabled=true;setStatus('Validation failed: '+error.message,true);}
});
$('import-btn').addEventListener('click',async()=>{
  $('import-btn').disabled=true;
  try{await importPredictions();}
  catch(error){setStatus('Import stopped: '+error.message+'. Completed batches remain saved; reselect the same file to resume safely.',true);$('import-btn').disabled=false;}
});
$('export-btn').addEventListener('click',exportBackup);
$('search').addEventListener('input',()=>{currentPage=0;refresh();});
$('filter').addEventListener('change',()=>{currentPage=0;refresh();});
$('sort').addEventListener('change',()=>{currentPage=0;refresh();});
['previous','previous-bottom'].forEach(id=>$(id).addEventListener('click',()=>{currentPage=Math.max(0,currentPage-1);refresh();}));
['next','next-bottom'].forEach(id=>$(id).addEventListener('click',()=>{currentPage++;refresh();}));
(async()=>{
  try{
    if(!iconNames.length)throw new Error('Icon metadata did not load.');
    db=await openDatabase();await refresh();
    setStatus('Ready. Import your prediction JSON. This page shares AI Category Lab IndexedDB and does not clear existing records.');
  }catch(error){setStatus('Initialization failed: '+error.message,true);}
})();