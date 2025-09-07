// SocialLift - Home App v5
// - Modern action icons (Font Awesome)
// - Threaded comments: list, add, reply, like comment
// - Share modal + groups (kept from previous version)

const API = {
  auth: 'api/auth.php',
  posts: 'api/posts.php',
  users: 'api/users.php',
  upload: 'api/upload.php',
  follow: 'api/follow.php',
  groups: 'api/groups.php'
};

let currentUser = null;
let pickedUploadPath = '';
let cachedGroups = [];
let sharePostId = '';
const postCommentsCache = new Map(); // postId -> { loaded:boolean, items: Comment[] }

document.addEventListener('DOMContentLoaded', () => {
  initAuthUI();
  loadMe().then(async () => {
    if (currentUser) {
      document.getElementById('composer')?.classList.remove('hidden');
      document.getElementById('groupsPanel')?.classList.remove('hidden');
      document.getElementById('userNav')?.classList.remove('hidden');
      await loadGroups();
    }
    loadFeed();
  });

  // Auth modals
  document.getElementById('btnShowLogin')?.addEventListener('click', showLogin);
  document.getElementById('btnShowRegister')?.addEventListener('click', showRegister);
  document.getElementById('closeAuth')?.addEventListener('click', hideAuth);
  document.getElementById('switchAuth')?.addEventListener('click', switchAuth);

  document.getElementById('doLogin')?.addEventListener('click', doLogin);
  document.getElementById('doRegister')?.addEventListener('click', doRegister);

  // Composer
  document.getElementById('btnPickFile')?.addEventListener('click', () => document.getElementById('postFile').click());
  document.getElementById('postFile')?.addEventListener('change', handlePickFile);
  document.getElementById('btnPublish')?.addEventListener('click', createPost);

  // Share modal buttons (external)
  document.getElementById('shareFb')?.addEventListener('click', () => openShareExternal('fb'));
  document.getElementById('shareTw')?.addEventListener('click', () => openShareExternal('tw'));
  document.getElementById('shareWa')?.addEventListener('click', () => openShareExternal('wa'));
  document.getElementById('shareCopy')?.addEventListener('click', copyShareLink);

  // Hide dropdown on outside click
  window.addEventListener('click', (e) => {
    const dd = document.getElementById('userDropdown');
    if (!e.target.closest('#userDropdown') && !e.target.closest('#userMenu')) dd?.classList.add('hidden');
  });
});

/* ============== Auth UI ============== */
function initAuthUI() {
  const saved = localStorage.getItem('sl_user');
  if (saved) currentUser = JSON.parse(saved);
  const guest = document.getElementById('guestActions');
  const menu = document.getElementById('userMenu');
  const name = document.getElementById('userName');
  if (currentUser) {
    guest?.classList.add('hidden');
    menu?.classList.remove('hidden');
    document.getElementById('userNav')?.classList.remove('hidden');
    if (name) {
      const displayName = currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName||''}`.trim() : (currentUser.username || 'User');
      name.innerHTML = `${escapeHtml(displayName)}${verifiedIcon(!!currentUser.verified)}`;
    }
  } else {
    guest?.classList.remove('hidden');
    menu?.classList.add('hidden');
    document.getElementById('userNav')?.classList.add('hidden');
  }
}

function toggleUserDropdown() {
  document.getElementById('userDropdown')?.classList.toggle('hidden');
}

function showLogin() { showAuth(true); }
function showRegister() { showAuth(false); }
function showAuth(isLogin) {
  document.getElementById('authModal')?.classList.remove('hidden');
  document.getElementById('authTitle').textContent = isLogin ? 'Login' : 'Register';
  document.getElementById('loginForm').classList.toggle('hidden', !isLogin);
  document.getElementById('registerForm').classList.toggle('hidden', isLogin);
}
function hideAuth() { document.getElementById('authModal')?.classList.add('hidden'); }
function switchAuth() {
  const isLogin = !document.getElementById('loginForm').classList.contains('hidden');
  showAuth(!isLogin);
}

async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const res = await fetch(API.auth+'?action=login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) });
  const data = await res.json();
  if (!data.success) return alert(data.message || 'Login failed');
  currentUser = data.user;
  localStorage.setItem('sl_user', JSON.stringify(currentUser));
  hideAuth(); initAuthUI();
  document.getElementById('composer')?.classList.remove('hidden');
  loadGroups();
  loadFeed();
}

async function doRegister() {
  const payload = {
    firstName: document.getElementById('regFirst').value.trim(),
    lastName: document.getElementById('regLast').value.trim(),
    username: document.getElementById('regUsername').value.trim(),
    email: document.getElementById('regEmail').value.trim(),
    phone: document.getElementById('regPhone').value.trim(),
    location: document.getElementById('regLocation').value.trim(),
    password: document.getElementById('regPassword').value
  };
  const res = await fetch(API.auth+'?action=register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
  const data = await res.json();
  if (!data.success) return alert(data.message || 'Registration failed');
  currentUser = data.user;
  localStorage.setItem('sl_user', JSON.stringify(currentUser));
  hideAuth(); initAuthUI();
  document.getElementById('composer')?.classList.remove('hidden');
  loadGroups();
}

async function loadMe() {
  try {
    const res = await fetch(API.auth+'?action=me');
    const data = await res.json();
    if (data.success) {
      currentUser = data.user;
      localStorage.setItem('sl_user', JSON.stringify(currentUser));
    }
  } catch(e) {}
  initAuthUI();
}

/* ============== Upload & Composer ============== */
async function handlePickFile(e) {
  const f = e.target.files[0];
  if (!f) return;
  if (f.size > 5*1024*1024) { alert('Max 5MB'); return; }
  const fd = new FormData();
  fd.append('file', f);
  const res = await fetch(API.upload, { method:'POST', body: fd });
  const data = await res.json();
  if (!data.success) return alert(data.message || 'Upload failed');
  pickedUploadPath = data.path;
  const pickedEl = document.getElementById('pickedFile');
  if (pickedEl) pickedEl.textContent = pickedUploadPath.split('/').pop();
}

async function createPost() {
  if (!currentUser) return alert('Login first');
  const text = document.getElementById('postText').value.trim();
  const media = pickedUploadPath ? [pickedUploadPath] : [];
  const videoInput = document.getElementById('postVideoUrl');
  const videoUrl = videoInput ? videoInput.value.trim() : '';
  const groupSelect = document.getElementById('postGroupSelect');
  const groupId = groupSelect ? (groupSelect.value || '') : '';
  const btn = document.getElementById('btnPublish');
  const feed = document.getElementById('feed');
  const original = btn ? btn.textContent : '';

  if (btn) { btn.disabled = true; btn.textContent = 'Posting...'; }

  const body = { text, media };
  if (videoUrl) body.videoUrl = videoUrl;
  if (groupId) body.groupId = groupId;

  try {
    const res = await fetch(API.posts+'?action=create', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!data.success) return alert(data.message || 'Failed to post');

    // clear inputs (guard pickedFile)
    pickedUploadPath = '';
    const pickedEl = document.getElementById('pickedFile');
    if (pickedEl) pickedEl.textContent = '';
    document.getElementById('postText').value = '';
    if (videoInput) videoInput.value = '';
    if (groupSelect) groupSelect.value = '';

    // prepend instantly
    const newPost = data.post || {
      id: data.id || String(Date.now()),
      text,
      media,
      videoUrl,
      userId: currentUser.id,
      authorName: currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName||''}`.trim() : (currentUser.username || 'You'),
      authorVerified: !!currentUser.verified,
      createdAt: new Date().toISOString(),
      likes: 0,
      likedByMe: false,
      comments: 0
    };
    if (feed) feed.insertAdjacentHTML('afterbegin', renderPost(newPost));

    // optional sync with server
    // loadFeed();
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = original; }
  }
}

/* ============== Feed ============== */
async function loadFeed() {
  const res = await fetch(API.posts+'?action=list&t=' + Date.now(), { cache:'no-store' });
  const data = await res.json();
  if (!data.success) return;
  const feed = document.getElementById('feed');
  feed.innerHTML = (data.posts||[]).map(renderPost).join('');
}

// Video helpers (YouTube/Vimeo)
function youtubeEmbed(url){
  const m = (url||'').match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([A-Za-z0-9_\-]+)/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}
function vimeoEmbed(url){
  const m = (url||'').match(/vimeo\.com\/(\d+)/);
  return m ? `https://player.vimeo.com/video/${m[1]}` : null;
}
function renderVideo(url){
  if (!url) return '';
  const y = youtubeEmbed(url); if (y) return `<div class="mt-2"><iframe class="w-full aspect-video" src="${y}" frameborder="0" allowfullscreen></iframe></div>`;
  const v = vimeoEmbed(url); if (v) return `<div class="mt-2"><iframe class="w-full aspect-video" src="${v}" frameborder="0" allowfullscreen></iframe></div>`;
  return '';
}

async function followUser(userId){
  if (!currentUser) return alert('Login first');
  const res = await fetch(API.follow+'?action=follow', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ userId }) });
  const data = await res.json();
  if (!data.success) return alert(data.message || 'Failed to follow');
  alert('Followed');
}

function renderPost(p) {
  const imgs = (p.media||[]).map(src => `<img src="${src}" class="w-full rounded border">`).join('');
  const video = p.videoUrl ? renderVideo(p.videoUrl) : '';
  const liked = !!p.likedByMe;
  const likeCls = liked ? 'text-blue-600' : 'text-gray-700';
  const commentsCount = p.comments || 0;
  const likesCount = p.likes || 0;
  const displayName = p.authorName || p.userName || p.username || p.userId;
  const nameWithBadge = `${escapeHtml(String(displayName))}${verifiedIcon(!!(p.authorVerified||p.verified))}`;
  const likeLabel = likesCount > 0 ? `Like (${likesCount})` : 'Like';
  const commentLabel = commentsCount > 0 ? `Comment (${commentsCount})` : 'Comment';
  return `
    <div class="bg-white border rounded-lg p-4 mb-4" id="post-${p.id}">
      <div class="flex items-center justify-between">
        <div class="font-semibold">${nameWithBadge}</div>
        <div class="flex items-center gap-2">
          ${currentUser && currentUser.id!==p.userId ? `<button onclick="followUser('${p.userId}')" class="px-2 py-1 rounded border text-sm">Follow</button>` : ''}
          <div class="text-xs text-gray-500">${new Date(p.createdAt).toLocaleString()}</div>
        </div>
      </div>
      <div class="mt-2 whitespace-pre-wrap">${escapeHtml(p.text||'')}</div>
      ${video}
      <div class="mt-2 space-y-2">${imgs}</div>
      <div class="mt-3 flex items-center gap-3 text-sm">
        <button onclick="likePost('${p.id}')" class="px-2 py-1 rounded border ${likeCls}">${likeLabel}</button>
        <button onclick="toggleComments('${p.id}')" class="px-2 py-1 rounded border">${commentLabel}</button>
        <button onclick="openShare('${p.id}')" class="px-2 py-1 rounded border">Share</button>
      </div>
      <div id="comments_${p.id}" class="hidden mt-3">
        <div class="flex items-start gap-2">
          <textarea id="ct_${p.id}" class="flex-1 w-full border rounded p-2" rows="2" placeholder="Andika maoni..."></textarea>
          <button onclick="sendComment('${p.id}')" class="px-3 py-2 rounded bg-blue-600 text-white"><i class="fa-solid fa-paper-plane"></i></button>
        </div>
        <div id="clist_${p.id}" class="mt-3 space-y-2"></div>
      </div>
    </div>
  `;
}

function escapeHtml(s){return (s||'').toString().replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;' }[m]));}

// Verified badge helper
function verifiedIcon(isVerified){
  if (!isVerified) return '';
  return ' <i class="fa-solid fa-circle-check text-blue-600" aria-label="verified"></i>';
}

function toggleComments(postId){
  const box = document.getElementById('comments_'+postId);
  box?.classList.toggle('hidden');
  if (!box?.classList.contains('hidden')) {
    loadComments(postId);
  }
}

async function loadComments(postId){
  try{
    const cached = postCommentsCache.get(postId);
    if (cached?.loaded) { renderComments(postId, cached.items); return; }
    const res = await fetch(`${API.posts}?action=comments&postId=${encodeURIComponent(postId)}&t=${Date.now()}`, { cache:'no-store' });
    const data = await res.json();
    if (!data.success) { document.getElementById('clist_'+postId).innerHTML = '<p class="text-sm text-gray-500">Hakuna maoni bado</p>'; return; }
    const items = Array.isArray(data.comments) ? data.comments : [];
    postCommentsCache.set(postId, { loaded:true, items });
    renderComments(postId, items);
  }catch(e){ document.getElementById('clist_'+postId).innerHTML = '<p class="text-sm text-gray-500">Hakuna maoni bado</p>'; }
}

function renderComments(postId, comments){
  const box = document.getElementById('clist_'+postId);
  if (!box) return;
  const html = (comments||[]).map(c => renderComment(postId, c)).join('');
  box.innerHTML = html || '<p class="text-sm text-gray-500">Hakuna maoni bado</p>';
}

function renderComment(postId, c){
  const liked = !!c.likedByMe;
  const likeIcon = liked ? 'fa-solid fa-thumbs-up' : 'fa-regular fa-thumbs-up';
  const likeCls = liked ? 'text-blue-600' : 'text-gray-700';
  const replies = Array.isArray(c.replies) ? c.replies : [];
  const nameWithBadge = `${escapeHtml(c.authorName||('User '+c.userId))}${verifiedIcon(!!c.authorVerified)}`;
  return `
    <div class="border rounded p-2">
      <div class="text-sm"><span class="font-medium">${nameWithBadge}</span> <span class="text-gray-500">• ${new Date(c.createdAt||Date.now()).toLocaleString()}</span></div>
      <div class="mt-1 text-sm whitespace-pre-wrap">${escapeHtml(c.text||'')}</div>
      <div class="mt-2 flex items-center gap-3 text-xs">
        <button onclick="likeComment('${postId}','${c.id}')" class="px-2 py-0.5 rounded border flex items-center gap-1 ${likeCls}"><i class="${likeIcon}"></i><span>${c.likes||0}</span></button>
        <button onclick="toggleReply('${postId}','${c.id}')" class="px-2 py-0.5 rounded border flex items-center gap-1"><i class="fa-regular fa-comment-dots"></i><span>Reply</span></button>
      </div>
      <div id="replybox_${postId}_${c.id}" class="hidden mt-2">
        <div class="flex items-start gap-2">
          <input id="rinput_${postId}_${c.id}" class="flex-1 w-full border rounded p-2" placeholder="Jibu..."/>
          <button onclick="sendReply('${postId}','${c.id}')" class="px-3 py-2 rounded bg-blue-600 text-white"><i class="fa-solid fa-reply"></i></button>
        </div>
      </div>
      <div class="mt-2 pl-4 border-l space-y-2" id="replies_${postId}_${c.id}">
        ${replies.map(r => renderReply(r)).join('')}
      </div>
    </div>
  `;
}

function renderReply(r){
  const nameWithBadge = `${escapeHtml(r.authorName||('User '+r.userId))}${verifiedIcon(!!r.authorVerified)}`;
  return `
    <div class="text-sm">
      <span class="font-medium">${nameWithBadge}</span>
      <span class="text-gray-500">• ${new Date(r.createdAt||Date.now()).toLocaleString()}</span>
      <div class="mt-0.5 whitespace-pre-wrap">${escapeHtml(r.text||'')}</div>
    </div>
  `;
}

function toggleReply(postId, commentId){
  document.getElementById(`replybox_${postId}_${commentId}`)?.classList.toggle('hidden');
}

async function sendComment(postId){
  if (!currentUser) return alert('Login first');
  const t = document.getElementById('ct_'+postId).value.trim();
  if (!t) return;
  const res = await fetch(API.posts+'?action=comment', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ postId, text:t }) });
  const data = await res.json();
  if (data.success){
    document.getElementById('ct_'+postId).value = '';
    // Invalidate cache then reload
    postCommentsCache.delete(postId);
    loadComments(postId);
    loadFeed();
  } else {
    alert(data.message||'Failed');
  }
}

async function sendReply(postId, commentId){
  if (!currentUser) return alert('Login first');
  const inp = document.getElementById(`rinput_${postId}_${commentId}`);
  const text = (inp?.value||'').trim();
  if (!text) return;
  try{
    const res = await fetch(`${API.posts}?action=reply`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ postId, commentId, text }) });
    const data = await res.json();
    if (!data.success){ alert(data.message||'Reply failed'); return; }
    inp.value = '';
    postCommentsCache.delete(postId);
    loadComments(postId);
  }catch(e){ alert('Reply failed'); }
}

async function likePost(id){
  if (!currentUser) return alert('Login first');
  await fetch(API.posts+'?action=like', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ postId:id }) });
  loadFeed();
}

async function likeComment(postId, commentId){
  if (!currentUser) return alert('Login first');
  try{
    const res = await fetch(`${API.posts}?action=comment_like`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ postId, commentId }) });
    const data = await res.json();
    if (!data.success){ alert(data.message||'Failed'); return; }
    postCommentsCache.delete(postId);
    loadComments(postId);
  }catch(e){ alert('Failed'); }
}

/* ============== Groups (for composer + share modal) ============== */
async function loadGroups(){
  try{
    const res = await fetch(`${API.groups}?action=list&t=${Date.now()}`, { cache:'no-store' });
    const data = await res.json();
    if (!data.success) return;
    cachedGroups = data.groups || [];

    // Populate composer select
    const sel = document.getElementById('postGroupSelect');
    if (sel) {
      const opts = ['<option value="">Post to: Public</option>']
        .concat(cachedGroups.map(g => `<option value="${g.id}">${escapeHtml(g.name||'Group')}</option>`));
      sel.innerHTML = opts.join('');
    }

    // Populate share modal group list
    renderShareGroups();
  }catch(e){}
}

function renderShareGroups(){
  const box = document.getElementById('shareGroups');
  const empty = document.getElementById('shareGroupsEmpty');
  if (!box || !empty) return;
  if (!cachedGroups.length){
    box.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  box.innerHTML = cachedGroups.map(g => `
    <div class="flex items-center justify-between border rounded p-2">
      <div class="text-sm font-medium">${escapeHtml(g.name||'')}</div>
      <button onclick="shareToGroup('${g.id}')" class="text-sm px-2 py-1 rounded border">Share</button>
    </div>
  `).join('');
}

/* ============== Share Modal ============== */
function openShare(postId){
  sharePostId = postId;
  document.getElementById('shareModal')?.classList.remove('hidden');
}
function closeShare(){
  document.getElementById('shareModal')?.classList.add('hidden');
  sharePostId = '';
}
function currentShareLink(){
  const base = location.origin + location.pathname;
  return `${base}#post-${sharePostId}`;
}
function openShareExternal(kind){
  const url = encodeURIComponent(currentShareLink());
  const text = encodeURIComponent('Check my post on SocialLift');
  let shareUrl = '';
  if (kind==='fb') shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
  if (kind==='tw') shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
  if (kind==='wa') shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`;
  if (shareUrl) window.open(shareUrl, '_blank','noopener,noreferrer');
}
async function copyShareLink(){
  try{
    await navigator.clipboard.writeText(currentShareLink());
    alert('Link copied!');
  }catch(e){ alert(currentShareLink()); }
}
async function shareToGroup(groupId){
  if (!currentUser) return alert('Login first');
  const text = `Shared: ${currentShareLink()}`;
  const res = await fetch(API.posts+'?action=create', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text, media:[], videoUrl:'', groupId }) });
  const data = await res.json();
  if (!data.success){ alert(data.message||'Share failed'); return; }
  alert('Shared to group');
  closeShare();
}

/* ============== Logout ============== */
function logout(){
  localStorage.removeItem('sl_user');
  fetch(API.auth+'?action=logout').finally(()=>location.reload());
}

