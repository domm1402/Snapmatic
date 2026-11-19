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
 {id:'gta-01',user:'vicecitydaily',place:'VICE CITY',image:'https://www.leftdownrightup.co.uk/images/screenshots/Jason_and_Lucia_03.jpg',caption:'Just another afternoon in Vice City. 🌴 #ViceCity #Leonida',likes:2841,comments:126,time:'18 MIN AGO'},
 {id:'gta-02',user:'leonidastate',place:'LEONIDA KEYS',image:'https://i.imgur.com/u4k973q.jpeg',caption:'No speed limits in the Keys. #Leonida #OnTheRoad',likes:1937,comments:84,time:'42 MIN AGO'},
 {id:'gta-03',user:'305afterdark',place:'VICE CITY',image:'https://gtaintel.com/cdn-cgi/image/width%3D1920%2Cquality%3D75%2Cformat%3Dauto%2Conerror%3Dredirect/images/screenshots/gta-6/138.webp',caption:'Things get complicated after dark. #ViceCityNights',likes:4210,comments:203,time:'1 HOUR AGO'},
 {id:'gta-04',user:'coastlinecruiser',place:'SOUTH BEACH',image:'https://www.igrandtheftauto.com/content/images/jason-lucia-pre-order-background-video-still.jpg',caption:'Found the perfect parking spot. #SouthBeach #Cruising',likes:1672,comments:59,time:'2 HOURS AGO'}
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
