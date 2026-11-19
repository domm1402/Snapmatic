const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const STORE='snapmatic-library-v2',PREF='snapmatic-prefs-v2';
let photos=loadPhotos(),stream=null,facing='environment',activeLook='original',activeId=null,activeGallery='all',newest=true,timerMode=0,timerHandle=null,flashMode=0,profileName=localStorage.getItem('snapmatic-name')||'DM';
let prefs={ratio:'4:3',quality:'0.92',grid:true,stamp:true,...JSON.parse(localStorage.getItem(PREF)||'{}')};
const looks={original:'none',golden:'sepia(.22) saturate(1.35) contrast(1.06) brightness(1.04)',noir:'grayscale(1) contrast(1.22) brightness(.94)',vice:'hue-rotate(315deg) saturate(1.4) contrast(1.05)',retro:'sepia(.42) saturate(.82) contrast(.92) brightness(1.06)',chrome:'saturate(.72) contrast(1.25) brightness(1.02)'};
function loadPhotos(){try{return JSON.parse(localStorage.getItem(STORE)||'[]')}catch{return []}}
function saveLibrary(){try{localStorage.setItem(STORE,JSON.stringify(photos));return true}catch(e){toast('Storage full. Export or delete some photos.');return false}}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2300)}
function openModal(id){$('#'+id).classList.remove('hidden')}function closeModals(){$$('.modal').forEach(m=>m.classList.add('hidden'))}
function stopCamera(){if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}const v=$('#video');v.pause();v.srcObject=null;v.classList.remove('show')}
function screen(name){$$('.screen').forEach(s=>s.classList.toggle('active',s.id===name+'Screen'));$$('.tab').forEach(b=>b.classList.toggle('active',b.dataset.screen===name));if(name!=='camera')stopCamera();if(name==='gallery')renderGallery();if(name==='profile')renderProfile()}
async function startCamera(){screen('camera');const v=$('#video');$('#stillPreview').classList.remove('show');v.classList.add('show');$('#cameraHint').textContent='CONNECTING CAMERA';try{if(!navigator.mediaDevices?.getUserMedia)throw Error('No camera API');stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:facing},width:{ideal:1920},height:{ideal:1440}}});v.srcObject=stream;await v.play();$('#cameraHint').textContent='READY';applyLook()}catch(e){$('#cameraHint').textContent='CAMERA UNAVAILABLE · IMPORT A PHOTO';toast('Camera permission required. You can import a photo.')}} 
function applyLook(){const v=$('#video');v.style.filter=looks[activeLook]||'none'}
function setLook(name){activeLook=name;$$('[data-look]').forEach(b=>b.classList.toggle('active',b.dataset.look===name));$$('[data-edit-look]').forEach(b=>b.classList.toggle('active',b.dataset.editLook===name));applyLook();applyEditPreview()}
function switchCamera(){facing=facing==='environment'?'user':'environment';startCamera()}
function updateClock(){const now=new Date();$('#statusTime').textContent=now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});$('#clockLabel').textContent=now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
function renderGallery(){const grid=$('#galleryGrid');grid.innerHTML='';let list=[...photos].sort((a,b)=>newest?b.created-a.created:a.created-b.created);if(activeGallery==='favourites')list=list.filter(p=>p.liked);$('#photoCount').textContent=list.length+' PHOTOS';if(!list.length){grid.innerHTML='<div class="empty-state"><span>▧</span><h2>No photos here yet</h2><p>Take a picture or import one from your device to start your Snapmatic collection.</p></div>';return}list.forEach(p=>{const tile=document.createElement('button');tile.className='photo-tile';tile.innerHTML='<img alt="Snapmatic photo"><span class="tile-meta"></span>'+(p.liked?'<b class="fav-mark">♥</b>':'');tile.querySelector('img').src=p.data;tile.querySelector('.tile-meta').textContent=p.date+' · '+(p.location||'LOS SANTOS');tile.onclick=()=>openPhoto(p.id);grid.append(tile)})}
function renderProfile(){$('#statPhotos').textContent=photos.length;$('#statLikes').textContent=photos.filter(p=>p.liked).length;$('.profile-avatar').textContent=profileName;$('#profileOpen').textContent=profileName}
function persistPhoto(photo){photos.unshift(photo);if(!saveLibrary()){photos.shift();return}renderGallery();renderProfile();renderFeed();toast('POST ADDED TO YOUR FEED')}
function makePhoto(data){const now=new Date();return{id:crypto.randomUUID(),data,created:Date.now(),date:now.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}),time:now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),look:activeLook,caption:'',location:prefs.stamp?'Los Santos, San Andreas':'',liked:false}}
function canvasShot(){const v=$('#video');if(!stream||!v.videoWidth){toast('Camera is not ready');return}let w=v.videoWidth,h=v.videoHeight;const ratio=prefs.ratio;if(ratio==='1:1'){const side=Math.min(w,h);w=side;h=side}else if(ratio==='16:9'){if(w/h>16/9)w=Math.round(h*16/9);else h=Math.round(w*9/16)}else{if(w/h>4/3)w=Math.round(h*4/3);else h=Math.round(w*3/4)}const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.filter=looks[activeLook]||'none';if(facing==='user'){ctx.translate(w,0);ctx.scale(-1,1)}ctx.drawImage(v,(v.videoWidth-w)/2,(v.videoHeight-h)/2,w,h,0,0,w,h);const photo=makePhoto(c.toDataURL('image/jpeg',Number(prefs.quality)));persistPhoto(photo);$('#lastShot').dataset.id=photo.id}
function takePhoto(){if(timerMode){const delay=timerMode;toast('SELF TIMER · '+delay+' SECONDS');$('#cameraHint').textContent='GET READY…';timerHandle=setTimeout(()=>{canvasShot();$('#cameraHint').textContent='READY'},delay*1000)}else canvasShot()}
function importFile(file){if(!file)return;const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{const max=2400,scale=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);const ctx=c.getContext('2d');ctx.filter=looks[activeLook]||'none';ctx.drawImage(img,0,0,c.width,c.height);persistPhoto(makePhoto(c.toDataURL('image/jpeg',Number(prefs.quality))))};img.onerror=()=>toast('Could not open that image');img.src=reader.result};reader.readAsDataURL(file)}
function openPhoto(id){activeId=id;const p=photos.find(x=>x.id===id);if(!p)return;$('#detailImage').src=p.data;$('#detailDate').textContent=p.date+' · '+p.time;$('#detailCaption').textContent=p.caption||'No caption';$('#detailLocation').textContent='⌖ '+(p.location||'LOCATION NOT SET').toUpperCase();$('#likePhoto').textContent=p.liked?'♥':'♡';$('#likePhoto').classList.toggle('liked',p.liked);openModal('detailModal')}
function currentPhoto(){return photos.find(p=>p.id===activeId)}
function applyEditPreview(){const p=currentPhoto();if(!p)return;$('#editImage').style.filter=(looks[activeLook]||'none')+' brightness('+$('#brightness').value+'%) contrast('+$('#contrast').value+'%) saturate('+$('#saturation').value+'%)'}
function openEditor(){const p=currentPhoto();if(!p)return;closeModals();$('#editImage').src=p.data;$('#captionInput').value=p.caption||'';$('#locationInput').value=p.location||'';activeLook=p.look||'original';$$('[data-edit-look]').forEach(b=>b.classList.toggle('active',b.dataset.editLook===activeLook));$('#brightness').value=100;$('#contrast').value=100;$('#saturation').value=100;applyEditPreview();openModal('editModal')}
function saveEdit(){const p=currentPhoto();if(!p)return;const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const ctx=c.getContext('2d');ctx.filter=(looks[activeLook]||'none')+' brightness('+$('#brightness').value+'%) contrast('+$('#contrast').value+'%) saturate('+$('#saturation').value+'%)';ctx.drawImage(img,0,0);p.data=c.toDataURL('image/jpeg',.92);p.look=activeLook;p.caption=$('#captionInput').value.trim();p.location=$('#locationInput').value.trim();if(saveLibrary()){closeModals();renderGallery();renderFeed();openPhoto(p.id);toast('PHOTO UPDATED')}};img.src=p.data}
async function sharePhoto(){const p=currentPhoto();if(!p)return;try{const blob=await(await fetch(p.data)).blob(),file=new File([blob],'snapmatic-photo.jpg',{type:'image/jpeg'});if(navigator.share&&navigator.canShare?.({files:[file]}))await navigator.share({files:[file],title:'Snapmatic photo',text:p.caption});else{const a=document.createElement('a');a.href=p.data;a.download='snapmatic-photo.jpg';a.click();toast('PHOTO EXPORTED')}}catch(e){if(e.name!=='AbortError')toast('Could not share photo')}}
function deletePhoto(){if(!currentPhoto()||!confirm('Delete this photo permanently?'))return;photos=photos.filter(p=>p.id!==activeId);saveLibrary();closeModals();renderGallery();renderProfile();renderFeed();toast('PHOTO DELETED')}
function exportAll(){if(!photos.length){toast('NO PHOTOS TO EXPORT');return}photos.forEach((p,i)=>{const a=document.createElement('a');a.href=p.data;a.download='snapmatic-'+(i+1)+'.jpg';a.click()});toast('EXPORTING '+photos.length+' PHOTOS')}
function savePrefs(){prefs={ratio:$('#ratioSelect').value,quality:$('#qualitySelect').value,grid:$('#gridToggle').checked,stamp:$('#locationToggle').checked};localStorage.setItem(PREF,JSON.stringify(prefs));$('#gridLines').classList.toggle('show',prefs.grid);closeModals();toast('CAMERA SETTINGS SAVED')}
$('[data-screen]').forEach(b=>b.addEventListener('click',()=>{if(b.getAttribute('aria-label')==='Likes'){activeGallery='favourites';$('[data-gallery]').forEach(x=>x.classList.toggle('selected',x.dataset.gallery==='favourites'));}else if(b.dataset.screen==='gallery'){activeGallery='all';$('[data-gallery]').forEach(x=>x.classList.toggle('selected',x.dataset.gallery==='all'));}screen(b.dataset.screen);if(b.dataset.screen==='camera')startCamera()}));
$('#profileOpen').onclick=()=>screen('profile');$('#shutter').onclick=takePhoto;$('#flipBtn').onclick=switchCamera;$('#importBtn').onclick=()=>$('#fileInput').click();$('#galleryImport').onclick=()=>$('#fileInput').click();$('#fileInput').onchange=e=>{importFile(e.target.files[0]);e.target.value=''};$('#lastShot').onclick=()=>{if(photos[0])openPhoto(photos[0].id);else toast('NO PHOTOS YET')};
$$('[data-look]').forEach(b=>b.onclick=()=>setLook(b.dataset.look));$$('[data-edit-look]').forEach(b=>b.onclick=()=>setLook(b.dataset.editLook));['brightness','contrast','saturation'].forEach(id=>$('#'+id).oninput=applyEditPreview);
$('#timerBtn').onclick=()=>{timerMode=timerMode===0?3:timerMode===3?10:0;$('#timerText').textContent=timerMode?'TIMER '+timerMode+'S':'TIMER OFF';$('#timerBtn').classList.toggle('active',!!timerMode)};
$('#flashBtn').onclick=async()=>{flashMode=(flashMode+1)%3;const track=stream?.getVideoTracks()[0],caps=track?.getCapabilities?.();if(caps?.torch){try{await track.applyConstraints({advanced:[{torch:flashMode===1}]})}catch{}}$('#flashLabel').textContent=['FLASH AUTO','FLASH ON','FLASH OFF'][flashMode];$('#flashBtn').classList.toggle('active',flashMode!==0);toast(caps?.torch?'FLASH UPDATED':'Flash depends on your device camera')};
$('#gridBtn').onclick=()=>{$('#gridLines').classList.toggle('show');$('#gridBtn').classList.toggle('active')};$('#settingsOpen').onclick=()=>{ $('#ratioSelect').value=prefs.ratio;$('#qualitySelect').value=prefs.quality;$('#gridToggle').checked=prefs.grid;$('#locationToggle').checked=prefs.stamp;openModal('settingsModal')};$('#savePrefs').onclick=savePrefs;$('#ratioSelect').onchange=()=>{};$('#settingsModal').querySelectorAll('select,input').forEach(x=>x.addEventListener('change',()=>{prefs.ratio=$('#ratioSelect').value}));
$$('[data-close]').forEach(b=>b.onclick=closeModals);$('#detailDone').onclick=closeModals;$('#editOpen').onclick=openEditor;$('#saveEdit').onclick=saveEdit;$('#sharePhoto').onclick=sharePhoto;$('#deletePhoto').onclick=deletePhoto;$('#likePhoto').onclick=()=>{const p=currentPhoto();if(!p)return;p.liked=!p.liked;saveLibrary();openPhoto(p.id);renderProfile();renderFeed();toast(p.liked?'ADDED TO FAVOURITES':'REMOVED FROM FAVOURITES')};
$$('[data-gallery]').forEach(b=>b.onclick=()=>{activeGallery=b.dataset.gallery;$$('[data-gallery]').forEach(x=>x.classList.toggle('selected',x===b));renderGallery()});$('#sortBtn').onclick=()=>{newest=!newest;$('#sortBtn').textContent=newest?'NEWEST FIRST ↓':'OLDEST FIRST ↑';renderGallery()};
$('#exportAll').onclick=exportAll;$('#clearAll').onclick=()=>{if(!photos.length){toast('LIBRARY IS ALREADY EMPTY');return}if(confirm('Delete every photo in your Snapmatic library?')){photos=[];saveLibrary();renderGallery();renderProfile();renderFeed();toast('LIBRARY CLEARED')}};
$('#editProfile').onclick=()=>{ $('#displayName').value=profileName;openModal('captionModal')};$('#saveProfile').onclick=()=>{profileName=$('#displayName').value.trim()||'DM';localStorage.setItem('snapmatic-name',profileName);renderProfile();renderFeed();closeModals();toast('PROFILE UPDATED')};
$('#gridLines').classList.toggle('show',prefs.grid);updateClock();setInterval(updateClock,15000);renderGallery();renderProfile();$('#ratioSelect').value=prefs.ratio;$('#qualitySelect').value=prefs.quality;$('#gridToggle').checked=prefs.grid;$('#locationToggle').checked=prefs.stamp;
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));



const GTA_POSTS = [
 {id:'gta-01',user:'vicecitydaily',place:'VICE CITY',image:'https://www.gta6everything.com/images/official/gta-6-jason-and-lucia-dancing-nightclub-lasers.jpg',caption:"Vice City after hours. #ViceCity #AfterDark",likes:850,comments:358,time:'7 MIN AGO'},
 {id:'gta-02',user:'leonida_unfiltered',place:'VICE CITY',image:'https://www.gta6everything.com/images/official/gta-6-jason-and-lucia-fleeca-bank-robbery.jpg',caption:"Some nights do not go to plan. #Leonida",likes:2929,comments:303,time:'19 MIN AGO'},
 {id:'gta-03',user:'sunsetstate',place:'GRASSRIVERS',image:'https://www.gta6everything.com/images/official/gta-6-jason-and-lucia-pickup-hilltop-sunset-deer.jpg',caption:"Out where the city noise fades. #LeonidaKeys",likes:4872,comments:158,time:'31 MIN AGO'},
 {id:'gta-04',user:'305streetlife',place:'VICE CITY',image:'https://www.gta6everything.com/images/official/gta-6-jason-and-lucia-pistol-at-car-door.jpg',caption:"Keep your eyes on the road. #JasonAndLucia",likes:6553,comments:68,time:'1 HOURS AGO'},
 {id:'gta-05',user:'rustyanchor',place:'LEONIDA KEYS',image:'https://www.gta6everything.com/images/official/gta-6-rusty-anchor-bar-interior-locals-toasting.jpg',caption:"The Rusty Anchor is getting lively. #RustyAnchor",likes:7860,comments:242,time:'1 HOURS AGO'},
 {id:'gta-06',user:'vicecitywire',place:'LEONIDA',image:'https://www.gta6everything.com/images/official/gta-6-lucia-firing-rifle-from-car-police-chase.jpg',caption:"Wrong place, wrong time. #ViceCity",likes:8710,comments:345,time:'1 HOURS AGO'},
 {id:'gta-07',user:'neon305',place:'VICE CITY',image:'https://www.gta6everything.com/images/official/gta-6-jason-and-lucia-convertible-pistols-night.jpg',caption:"Neon looks better after midnight. #ViceCityNights",likes:9045,comments:343,time:'2 HOURS AGO'},
 {id:'gta-08',user:'coast2coast',place:'VICE CITY',image:'https://www.gta6everything.com/images/official/gta-6-jason-duval-sport-bike-police-pursuit-rain.jpg',caption:"Rain, roads and a little trouble. #Leonida",likes:8845,comments:237,time:'2 HOURS AGO'},
 {id:'gta-09',user:'stateofleonida',place:'PORT GELLHORN',image:'https://www.gta6everything.com/images/official/gta-6-jason-duval-handgun-standoff-bikers.jpg',caption:"Not everyone is here to make friends. #Leonida",likes:8122,comments:61,time:'2 HOURS AGO'},
 {id:'gta-10',user:'mallrats305',place:'VICE CITY',image:'https://www.gta6everything.com/images/official/gta-6-jason-duval-dirt-bikes-mall-shootout.jpg',caption:"Mall security having a long shift. #ViceCity",likes:6924,comments:164,time:'3 HOURS AGO'},
 {id:'gta-11',user:'musclebeach',place:'VICE CITY',image:'https://www.gta6everything.com/images/official/gta-6-jason-duval-bench-press-gym.jpg',caption:"No days off. #GymLife",likes:5329,comments:307,time:'3 HOURS AGO'},
 {id:'gta-12',user:'nightshift305',place:'VICE CITY',image:'https://www.gta6everything.com/images/official/gta-6-jason-duval-gas-station-police-at-night.jpg',caption:"Quick stop turned into a whole situation. #Leonida",likes:3441,comments:357,time:'3 HOURS AGO'},
 {id:'gta-13',user:'vicecruisers',place:'VICE CITY',image:'https://www.gta6everything.com/images/official/gta-6-jason-duval-driving-with-passenger-night.jpg',caption:"Windows down, music up. #Cruising",likes:1383,comments:299,time:'4 HOURS AGO'},
 {id:'gta-14',user:'violetvice',place:'VICE CITY',image:'https://www.gta6everything.com/images/official/gta-6-lucia-caminos-pistol-rainy-window.jpg',caption:"Rainy nights in the city. #Lucia",likes:2408,comments:151,time:'4 HOURS AGO'},
 {id:'gta-15',user:'rushhour305',place:'VICE CITY',image:'https://www.gta6everything.com/images/official/gta-6-lucia-caminos-driving-aiming-handgun.jpg',caption:"Traffic is getting ridiculous. #Leonida",likes:4398,comments:75,time:'4 HOURS AGO'},
 {id:'gta-16',user:'luciacaptures',place:'VICE CITY',image:'https://www.gta6everything.com/images/official/gta-6-lucia-caminos-aiming-pistol-closeup.jpg',caption:"Don't ask questions. #Leonida",likes:6157,comments:248,time:'5 HOURS AGO'},
 {id:'gta-17',user:'swampwatch',place:'GRASSRIVERS',image:'https://www.gta6everything.com/images/official/gta-6-grassrivers-alligator-airboat-night-mist.jpg',caption:"Something moved in the water. #Grassrivers",likes:7568,comments:347,time:'5 HOURS AGO'},
 {id:'gta-18',user:'clubscene305',place:'VICE CITY',image:'https://www.gta6everything.com/images/official/gta-6-vice-city-nightclub-crowd-hanging-plants.jpg',caption:"Friday night looks packed. #Nightlife",likes:8541,comments:340,time:'5 HOURS AGO'},
 {id:'gta-19',user:'marinaviews',place:'VICE CITY',image:'https://www.gta6everything.com/images/official/gta-6-vice-city-marina-yachts-skyline.jpg',caption:"Morning view from the marina. #ViceCity",likes:9010,comments:231,time:'6 HOURS AGO'},
 {id:'gta-20',user:'citylines',place:'VICE CITY',image:'https://www.gta6everything.com/images/official/gta-6-vice-city-skyline-waterfront.jpg',caption:"The skyline never gets old. #ViceCity",likes:8947,comments:53,time:'6 HOURS AGO'},
 {id:'gta-21',user:'vicecitysign',place:'VICE CITY',image:'https://www.gta6everything.com/images/official/gta-6-vice-city-sign-sunset.jpg',caption:"Welcome to Vice City. #Leonida",likes:8353,comments:171,time:'6 HOURS AGO'},
 {id:'gta-22',user:'highabove305',place:'VICE CITY',image:'https://www.gta6everything.com/images/official/gta-6-vice-city-aerial-day.jpg',caption:"A little bird's-eye view. #ViceCity",likes:7270,comments:311,time:'7 HOURS AGO'},
 {id:'gta-23',user:'duskdrive',place:'VICE CITY',image:'https://www.gta6everything.com/images/official/gta-6-vice-city-dusk.jpg',caption:"Golden hour over the water. #ViceCity",likes:5766,comments:357,time:'7 HOURS AGO'},
 {id:'gta-24',user:'hotelviews',place:'VICE CITY',image:'https://www.gta6everything.com/images/official/gta-6-vice-city-hotel-balcony.jpg',caption:"Wish you were here. #ViceCity",likes:3942,comments:295,time:'7 HOURS AGO'},
 {id:'gta-25',user:'nightowl305',place:'VICE CITY',image:'https://www.gta6everything.com/images/official/gta-6-vice-city-night-ferris-wheel.jpg',caption:"City lights for miles. #ViceCityNights",likes:1915,comments:144,time:'8 HOURS AGO'},
 {id:'gta-26',user:'streetspotted',place:'VICE CITY',image:'https://www.gta6everything.com/images/official/gta-6-vice-city-street-bikes.jpg',caption:"The streets are alive tonight. #ViceCity",likes:1881,comments:83,time:'8 HOURS AGO'},
 {id:'gta-27',user:'leonidatraffic',place:'VICE CITY',image:'https://www.gta6everything.com/images/official/gta-6-vice-city-highway-traffic-skyline.jpg',caption:"Rush hour with a view. #ViceCity",likes:3910,comments:253,time:'8 HOURS AGO'},
 {id:'gta-28',user:'beachside305',place:'VICE CITY',image:'https://www.gta6everything.com/images/official/gta-6-vice-city-beach-club-highway-skyline-aerial.jpg',caption:"Beach day, no plans. #ViceCity",likes:5739,comments:348,time:'9 HOURS AGO'},
 {id:'gta-29',user:'portside',place:'VICE CITY',image:'https://www.gta6everything.com/images/official/gta-6-vice-city-port-and-skyline-dusk-aerial.jpg',caption:"Last light at the port. #Leonida",likes:7248,comments:338,time:'9 HOURS AGO'},
 {id:'gta-30',user:'lowandslow305',place:'VICE CITY',image:'https://www.gta6everything.com/images/official/gta-6-vice-city-neon-street-orange-supercar-after-rain.jpg',caption:"That paint under the neon. #CarSpotting",likes:8339,comments:225,time:'9 HOURS AGO'},
 {id:'gta-31',user:'leonidacarmeets',place:'VICE CITY',image:'https://www.gta6everything.com/images/official/gta-6-night-car-meet-from-above-underglow.jpg',caption:"Who brought the cleanest build? #CarMeet",likes:8941,comments:46,time:'10 HOURS AGO'},
 {id:'gta-32',user:'keyscruiser',place:'LEONIDA KEYS',image:'https://www.gta6everything.com/images/official/gta-6-leonida-keys-aerial.jpg',caption:"The Keys are calling. #LeonidaKeys",likes:9014,comments:178,time:'10 HOURS AGO'},
 {id:'gta-33',user:'dockside_daily',place:'LEONIDA KEYS',image:'https://www.gta6everything.com/images/official/gta-6-leonida-keys-rusty-anchor.jpg',caption:"Meet you at the dock. #RustyAnchor",likes:8553,comments:315,time:'10 HOURS AGO'},
 {id:'gta-34',user:'boatlifefl',place:'LEONIDA KEYS',image:'https://www.gta6everything.com/images/official/gta-6-leonida-keys-boat-party.jpg',caption:"Out on the water. #LeonidaKeys",likes:7588,comments:357,time:'11 HOURS AGO'}
];
let likedGta = JSON.parse(localStorage.getItem('snapmatic-gta-likes') || '[]');
let gtaComments = JSON.parse(localStorage.getItem('snapmatic-gta-comments') || '{}');
let commentTarget=null;
function renderFeed(){
 const host=$('#feedPosts'); if(!host)return;
 host.innerHTML='';
 const items=[
  ...GTA_POSTS.map(p=>({...p,type:'gta'})),
  ...[...photos].sort((a,b)=>b.created-a.created).map(p=>({...p,id:'local-'+p.id,type:'local',photoId:p.id,user:profileName,place:p.location||'MY PHOTOS',image:p.data,likes:p.liked?1:0,comments:(p.comments||[]).length,time:p.date+' · '+p.time}))
 ];
 items.forEach(p=>{
  const post=document.createElement('article');post.className='feed-post '+(p.type==='local'?'local-post':'gta-post');
  const image=document.createElement('img');image.className='post-image';image.alt='Snapmatic post from '+p.place;image.src=p.image;image.loading='lazy';
  const content=document.createElement('div');content.className='post-content';
  const userline=document.createElement('div');userline.className='post-userline';
  const avatar=document.createElement('span');avatar.className='post-avatar initials';avatar.textContent=p.user.slice(0,2).toUpperCase();
  const username=document.createElement('b');username.textContent='@'+p.user;
  userline.append(avatar,username);
  const caption=document.createElement('p');caption.className='post-caption';caption.textContent=p.caption||'';
  const actions=document.createElement('div');actions.className='post-actions';
  const liked=p.type==='gta'?likedGta.includes(p.id):!!photos.find(x=>x.id===p.photoId)?.liked;
  const like=document.createElement('button');like.className='like-feed'+(liked?' liked':'');like.textContent=liked?'♥':'♡';like.setAttribute('aria-label','Like post');
  const likes=document.createElement('span');likes.className='post-count';likes.textContent=(p.likes+(p.type==='gta'&&liked?1:0)).toLocaleString();
  const comment=document.createElement('button');comment.className='comment-feed';comment.textContent='▢';comment.setAttribute('aria-label','Comments');
  const comments=document.createElement('span');comments.className='post-count';comments.textContent=p.type==='gta'?String(p.comments+(gtaComments[p.id]||[]).length):String((photos.find(x=>x.id===p.photoId)?.comments||[]).length);
  like.onclick=()=>{
   if(p.type==='gta'){likedGta=likedGta.includes(p.id)?likedGta.filter(x=>x!==p.id):likedGta.concat(p.id);localStorage.setItem('snapmatic-gta-likes',JSON.stringify(likedGta))}
   else{const own=photos.find(x=>x.id===p.photoId);if(own){own.liked=!own.liked;saveLibrary();renderGallery();renderProfile()}}
   renderFeed();
  };
  comment.onclick=()=>openComments(p.type==='gta'?{type:'gta',id:p.id}:{type:'local',id:p.photoId});
  actions.append(like,likes,comment,comments);
  const timestamp=document.createElement('div');timestamp.className='post-time';timestamp.textContent=p.time||'JUST NOW';
  content.append(userline,caption,actions,timestamp);post.append(image,content);host.append(post);
 });
}
function openComments(target){
 commentTarget=target;const list=$('#commentsList');list.innerHTML='';
 let entries=[];
 if(target.type==='gta')entries=gtaComments[target.id]||[];
 else entries=(photos.find(x=>x.id===target.id)?.comments||[]);
 if(!entries.length){const empty=document.createElement('p');empty.className='no-comments';empty.textContent='No comments yet. Start the conversation.';list.append(empty)}
 entries.forEach(c=>{const item=document.createElement('div');item.className='comment-item';const name=document.createElement('b');name.textContent=c.name||profileName;const body=document.createElement('p');body.textContent=c.text;item.append(name,body);list.append(item)});
 openModal('commentsModal');
}
$('#commentForm').onsubmit=e=>{
 e.preventDefault();const input=$('#commentInput'),value=input.value.trim();if(!commentTarget||!value)return;
 const entry={name:profileName,text:value,created:Date.now()};
 if(commentTarget.type==='gta'){gtaComments[commentTarget.id]=gtaComments[commentTarget.id]||[];gtaComments[commentTarget.id].push(entry);localStorage.setItem('snapmatic-gta-comments',JSON.stringify(gtaComments))}
 else{const p=photos.find(x=>x.id===commentTarget.id);if(!p)return;p.comments=p.comments||[];p.comments.push(entry);if(!saveLibrary())return}
 input.value='';openComments(commentTarget);renderFeed();toast('COMMENT SAVED ON THIS PHONE');
};
$('#feedCamera').onclick=()=>startCamera();
renderFeed();
