// assets/js/app.js
// SocialLift - Home App v5
// - Modern action icons (Font Awesome)
// - Threaded comments: list, add, reply, like comment
// - Share modal + groups (kept from previous version)
// - User profile functionality

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
let pickedVideoPath = '';
let cachedGroups = [];
let sharePostId = '';
const postCommentsCache = new Map(); // postId -> { loaded:boolean, items: Comment[] }

document.addEventListener('DOMContentLoaded', () => {
  initAuthUI();
  loadMe().then(async () => {
    if (currentUser) {
      document.getElementById('composer')?.classList.remove('hidden');
      document.getElementById('groupsPanel')?.classList.remove('hidden');
      await loadGroups();
      ensureCookieConsentBanner(); // cookie consent for logged-in users
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

  // Mobile auth buttons (extra safety if inline onclick missing)
  document.getElementById('btnShowLoginMobile')?.addEventListener('click', () => {
    showLogin();
    document.getElementById('mobileMenu')?.classList.add('hidden');
  });
  document.getElementById('btnShowRegisterMobile')?.addEventListener('click', () => {
    showRegister();
    document.getElementById('mobileMenu')?.classList.add('hidden');
  });

  // Composer
  document.getElementById('btnPickFile')?.addEventListener('click', () => document.getElementById('postFile').click());
  document.getElementById('postFile')?.addEventListener('change', handlePickFile);
  document.getElementById('postVideoFile')?.addEventListener('change', handlePickVideo);
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
  try {
    const saved = localStorage.getItem('sl_user');
    currentUser = saved ? JSON.parse(saved) : null;
  } catch (e) {
    currentUser = null;
  }

  const isLoggedIn = !!currentUser;

  // Desktop
  const guest = document.getElementById('guestActions');
  const menu = document.getElementById('userMenu');
  const name = document.getElementById('userName');
  if (guest) guest.classList.toggle('hidden', isLoggedIn);
  if (menu) menu.classList.toggle('hidden', !isLoggedIn);

  if (isLoggedIn) {
    if (name) {
      const displayName = currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName||''}`.trim() : (currentUser.username || 'User');
      name.innerHTML = `${escapeHtml(displayName)}${verifiedIcon(!!currentUser.verified)}`;
    }
    const avatarEl = document.getElementById('userAvatar');
    if (avatarEl) {
      const avatarSrc = (currentUser.avatar && currentUser.avatar.trim()!=='') ? currentUser.avatar : 'uploads/default.png';
      avatarEl.src = avatarSrc;
    }
  } else {
    const avatarEl = document.getElementById('userAvatar');
    if (avatarEl) avatarEl.src = 'uploads/default.png';
  }

  // Mobile
  const mobileLogin = document.getElementById('btnShowLoginMobile');
  const mobileRegister = document.getElementById('btnShowRegisterMobile');
  const mobileLogout = document.getElementById('mobileLogoutLink');
  const mobileDashboard = document.getElementById('mobileDashboardLink');
  if (mobileLogin) mobileLogin.classList.toggle('hidden', isLoggedIn);
  if (mobileRegister) mobileRegister.classList.toggle('hidden', isLoggedIn);
  if (mobileLogout) mobileLogout.classList.toggle('hidden', !isLoggedIn);
  if (mobileDashboard) mobileDashboard.classList.toggle('hidden', !isLoggedIn);

  // Sections that depend on auth
  document.getElementById('composer')?.classList.toggle('hidden', !isLoggedIn);
  document.getElementById('groupsPanel')?.classList.toggle('hidden', !isLoggedIn);
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
  const res = await fetch(API.auth+'?action=login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password }), credentials:'include' });
  const data = await res.json();
  if (!data.success) return alert(data.message || 'Login failed');
  currentUser = data.user;
  localStorage.setItem('sl_user', JSON.stringify(currentUser));
  hideAuth(); initAuthUI();
  document.getElementById('composer')?.classList.remove('hidden');
  ensureCookieConsentBanner(); // show once for this user
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
  const res = await fetch(API.auth+'?action=register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload), credentials:'include' });
  const data = await res.json();
  if (!data.success) return alert(data.message || 'Registration failed');
  currentUser = data.user;
  localStorage.setItem('sl_user', JSON.stringify(currentUser));
  hideAuth(); initAuthUI();
  document.getElementById('composer')?.classList.remove('hidden');
  ensureCookieConsentBanner(); // show once for this user
  loadGroups();
}

async function loadMe() {
  try {
    const res = await fetch(API.auth+'?action=me', { credentials:'include' });
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
  const res = await fetch(API.upload, { method:'POST', body: fd, credentials:'include' });
  const data = await res.json();
  if (!data.success) return alert(data.message || 'Upload failed');
  pickedUploadPath = data.path;
  const pickedEl = document.getElementById('pickedFile');
  if (pickedEl) pickedEl.textContent = pickedUploadPath.split('/').pop();
}

async function handlePickVideo(e){
  const f = e.target.files[0];
  if (!f) return;
  if (!/^video\//i.test(f.type)) { alert('Chagua faili la video'); return; }
  const fd = new FormData();
  fd.append('file', f);
  const res = await fetch(API.upload, { method:'POST', body: fd, credentials:'include' });
  const data = await res.json();
  if (!data.success) return alert(data.message || 'Upload failed');
  pickedVideoPath = data.path;
  const el = document.getElementById('pickedVideo');
  if (el) el.textContent = pickedVideoPath.split('/').pop();
}

async function createPost() {
  if (!currentUser) return alert('Login first');
  const text = document.getElementById('postText').value.trim();
  const media = pickedUploadPath ? [pickedUploadPath] : [];
  const videoInput = document.getElementById('postVideoUrl');
  const videoUrl = pickedVideoPath ? pickedVideoPath : (videoInput ? videoInput.value.trim() : '');
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
      body: JSON.stringify(body),
      credentials:'include'
    });
    const data = await res.json();
    if (!data.success) return alert(data.message || 'Failed to post');

    pickedUploadPath = '';
    pickedVideoPath = '';
    const pickedEl = document.getElementById('pickedFile');
    if (pickedEl) pickedEl.textContent = '';
    const pickedVidEl = document.getElementById('pickedVideo');
    if (pickedVidEl) pickedVidEl.textContent = '';
    document.getElementById('postText').value = '';
    if (videoInput) videoInput.value = '';
    if (groupSelect) groupSelect.value = '';

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
      comments: 0,
      followedByMe: false
    };
    // ensure preview/full fallbacks if API didn't include (older server)
    if (!newPost.textHtml) newPost.textHtml = escapeHtml(newPost.text||'');
    if (!('previewHtml' in newPost) || !('isTruncated' in newPost)) {
      const pv = makePreviewClient(newPost.text||'', 220);
      newPost.previewHtml = pv.html;
      newPost.isTruncated = pv.truncated;
    }

    if (feed) {
      feed.insertAdjacentHTML('afterbegin', renderPost(newPost));
      hydrateFollowButtons();
    }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = original; }
  }
}

/* ============== Feed ============== */
async function loadFeed() {
  const res = await fetch(API.posts+'?action=list&t=' + Date.now(), { cache:'no-store', credentials:'include' });
  const data = await res.json();
  if (!data.success) return;
  const feed = document.getElementById('feed');
  const posts = (data.posts||[]).map(p => {
    // client-side safety if server missed preview/textHtml
    if (!p.textHtml) p.textHtml = escapeHtml(p.text||'');
    if (!('previewHtml' in p) || !('isTruncated' in p)) {
      const pv = makePreviewClient(p.text||'', 220);
      p.previewHtml = pv.html;
      p.isTruncated = pv.truncated;
    }
    return p;
  });
  feed.innerHTML = posts.map(renderPost).join('');
  hydrateFollowButtons();
}

// client-side preview fallback
function makePreviewClient(text, limit){
  const s = (text||'').toString();
  if (s.length <= limit) return { html: escapeHtml(s), truncated: false };
  let cut = s.slice(0, limit);
  const sp = cut.lastIndexOf(' ');
  if (sp > limit - 40) cut = cut.slice(0, sp);
  return { html: escapeHtml(cut), truncated: true };
}

// Video helpers (YouTube/Vimeo + local uploads)
function youtubeEmbed(url){
  const m = (url||'').match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([A-Za-z0-9_\-]+)/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}
function vimeoEmbed(url){
  const m = (url||'').match(/vimeo\.com\/(\d+)/);
  return m ? `https://player.vimeo.com/video/${m[1]}` : null;
}
function isVideoFile(url){
  return /\.(mp4|webm|ogg|mov|m4v|mkv)$/i.test(url||'') || /^\/?uploads\//i.test(url||'');
}
function renderVideo(url){
  if (!url) return '';
  const y = youtubeEmbed(url); if (y) return `<div class="mt-2"><iframe class="w-full aspect-video" src="${y}" frameborder="0" allowfullscreen></iframe></div>`;
  const v = vimeoEmbed(url); if (v) return `<div class="mt-2"><iframe class="w-full aspect-video" src="${v}" frameborder="0" allowfullscreen></iframe></div>`;
  if (isVideoFile(url)) {
    return `<video class="mt-2 w-full rounded border" src="${url}" controls playsinline></video>`;
  }
  return '';
}

function renderPost(p) {
  const imgs = (p.media||[]).map(src => `<img src="${src}" class="w-full rounded border">`).join('');
  const video = p.videoUrl ? renderVideo(p.videoUrl) : '';
  const liked = !!p.likedByMe;
  const likeCls = liked ? 'text-blue-600' : 'text-gray-700';
  const commentsCount = p.comments || 0;
  const likesCount = p.likes || 0;
  const displayName = p.authorName || p.userName || p.username || p.userId;
  const username = p.username || p.userId; // Use username for profile link
  const nameWithBadge = `${escapeHtml(String(displayName))}${verifiedIcon(!!(p.authorVerified||p.verified))}`;
  
  // Like/Dislike button with icons
  const likeIcon = liked ? '👎' : '👍';
  const likeText = liked ? 'Dislike' : 'Like';
  const likeLabel = likesCount > 0 ? `${likeText} (${likesCount})` : likeText;
  
  const commentLabel = commentsCount > 0 ? `💬 Comment (${commentsCount})` : '💬 Comment';
  
  const followBtn = currentUser && currentUser.id!==p.userId
    ? `<button id="follow-btn-${p.userId}" data-follow-user="${p.userId}" onclick="followUser('${p.userId}')" class="px-2 py-1 rounded border text-sm ${p.followedByMe ? 'bg-gray-200 text-gray-600 cursor-default' : ''}" ${p.followedByMe ? 'disabled' : ''}>${p.followedByMe ? 'Followed' : 'Follow'}</button>`
    : '';
  const owner = currentUser && String(currentUser.id) === String(p.userId);
  const ownerControls = owner
    ? `<div class="inline-flex items-center gap-2">
         <button onclick="startEditPost('${p.id}')" class="px-2 py-1 rounded border text-xs sm:text-sm">Edit</button>
         <button onclick="deletePost('${p.id}')" class="px-2 py-1 rounded border text-xs sm:text-sm text-red-600">Delete</button>
       </div>`
    : '';

  return `
    <div class="bg-white border rounded-lg p-4 mb-4" id="post-${p.id}">
      <div class="flex items-center justify-between">
        <div class="font-semibold">
          <a href="profile.php?user=${encodeURIComponent(username)}" class="text-blue-600 hover:underline">
            ${nameWithBadge}
          </a>
        </div>
        <div class="flex items-center gap-2">
          ${followBtn}
          <div class="text-xs text-gray-500">${new Date(p.createdAt).toLocaleString()}</div>
        </div>
      </div>

      <div id="pview_${p.id}" class="mt-2">
        ${buildPostContentHTML(p)}
      </div>
      <div id="peditbox_${p.id}" class="mt-2 hidden">
        <textarea id="pedit_${p.id}" class="w-full border rounded p-2" rows="3">${escapeHtml(p.text||'')}</textarea>
        <div class="mt-2 flex items-center gap-2">
          <button onclick="saveEditPost('${p.id}')" class="px-3 py-1 rounded bg-blue-600 text-white">Save</button>
          <button onclick="cancelEditPost('${p.id}')" class="px-3 py-1 rounded border">Cancel</button>
        </div>
      </div>

      ${video}
      <div class="mt-2 space-y-2">${imgs}</div>

      <div class="mt-3 flex flex-wrap items-center gap-3 text-sm">
        ${ownerControls}
        <button onclick="likePost('${p.id}')" class="px-2 py-1 rounded border ${likeCls} flex items-center gap-1">
          <span>${likeIcon}</span>
          <span>${likeLabel}</span>
        </button>
        <button onclick="toggleComments('${p.id}')" class="px-2 py-1 rounded border flex items-center gap-1">
          <span>💬</span>
          <span>${commentLabel.replace('💬 ', '')}</span>
        </button>
        <button onclick="openShare('${p.id}')" class="px-2 py-1 rounded border flex items-center gap-1">
          <span>🔗</span>
          <span>Share</span>
        </button>
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
  return ' <img src="https://od.lk/s/NzhfNjc2MDk0NDRf/Premium%20Vector%20_%20Verification%20checkmark%20blue%20circle%20star%20vector%20Icon%20isolated%20on%20white%20background.jpg" alt="verified" style="width:14px;height:14px;vertical-align:middle;margin-left:4px;border-radius:9999px;display:inline-block;" />';
}

/* ============== Read More (Posts) ============== */
function buildPostContentHTML(p){
  const pid = p.id;
  const preview = p.previewHtml || escapeHtml((p.text||''));
  const full = p.textHtml || escapeHtml((p.text||''));
  const isTrunc = !!p.isTruncated;
  
  if (isTrunc) {
    // Read more... ndani ya mstari huo huo
    const readMoreInline = ` <button class="text-blue-600 underline text-sm inline align-baseline" onclick="expandPost('${pid}')">Read more...</button>`;
    return `
      <div id="p_prev_${pid}">${preview}${readMoreInline}</div>
      <div id="p_full_${pid}" class="hidden">${full}</div>
    `;
  }
  
  return `
    <div id="p_prev_${pid}">${preview}</div>
    <div id="p_full_${pid}" class="hidden">${full}</div>
  `;
}

function expandPost(postId){
  const prev = document.getElementById(`p_prev_${postId}`);
  const full = document.getElementById(`p_full_${postId}`);
  if (!prev || !full) return;
  
  // Hide preview and show full content
  prev.classList.add('hidden');
  full.classList.remove('hidden');
  
  // Add "Show less" button to full content
  const showLessBtn = `<button class="text-blue-600 underline text-sm inline align-baseline ml-2" onclick="collapsePost('${postId}')">Show less</button>`;
  full.innerHTML = full.innerHTML + showLessBtn;
}

function collapsePost(postId){
  const prev = document.getElementById(`p_prev_${postId}`);
  const full = document.getElementById(`p_full_${postId}`);
  if (!prev || !full) return;
  
  // Hide full content and show preview
  full.classList.add('hidden');
  prev.classList.remove('hidden');
  
  // Remove "Show less" button from full content
  const originalContent = full.innerHTML.replace(/<button[^>]*>Show less<\/button>/g, '');
  full.innerHTML = originalContent;
}

/* ============== Follow ============== */
function markFollowed(userId){
  const btns = document.querySelectorAll('[data-follow-user]');
  btns.forEach(b=>{
    if (String(b.getAttribute('data-follow-user')) === String(userId)){
      b.textContent = 'Followed';
      b.disabled = true;
      b.classList.add('bg-gray-200','text-gray-600','cursor-default');
      b.removeAttribute('onclick');
    }
  });
}

async function followUser(userId){
  if (!currentUser) return alert('Login first');
  const btns = document.querySelectorAll('[data-follow-user]');
  btns.forEach(b=>{
    if (String(b.getAttribute('data-follow-user')) === String(userId)){
      b.disabled = true;
      b.textContent = 'Following...';
    }
  });
  try{
    const res = await fetch(API.follow+'?action=follow', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ userId }),
      credentials:'include'
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message||'Failed');
    markFollowed(userId);
  }catch(e){
    alert(e.message||'Failed');
    btns.forEach(b=>{
      if (String(b.getAttribute('data-follow-user')) === String(userId)){
        b.disabled = false;
        b.textContent = 'Follow';
        b.classList.remove('bg-gray-200','text-gray-600','cursor-default');
      }
    });
  }
}

// After rendering posts, hydrate follow buttons using backend status
async function hydrateFollowButtons(){
  if (!currentUser) return;
  const btns = Array.from(document.querySelectorAll('[data-follow-user]'));
  if (!btns.length) return;
  const ids = [...new Set(btns.map(b => b.getAttribute('data-follow-user')))]
    .filter(id => id && id!==String(currentUser.id));
  await Promise.all(ids.map(async (uid)=>{
    try{
      const r = await fetch(`${API.follow}?action=is_following&userId=${encodeURIComponent(uid)}&t=${Date.now()}`, { cache:'no-store', credentials:'include' });
      const d = await r.json();
      if (d?.success && d.following){
        markFollowed(uid);
      }
    }catch(_){}
  }));
}

/* ============== Comments ============== */
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
    const res = await fetch(`${API.posts}?action=comments&postId=${encodeURIComponent(postId)}&t=${Date.now()}`, { cache:'no-store', credentials:'include' });
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
      <div class="text-sm">
        <a href="profile.php?user=${encodeURIComponent(c.username||c.userId)}" class="font-medium text-blue-600 hover:underline">
          ${nameWithBadge}
        </a>
        <span class="text-gray-500">• ${new Date(c.createdAt||Date.now()).toLocaleString()}</span>
      </div>
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
      <a href="profile.php?user=${encodeURIComponent(r.username||r.userId)}" class="font-medium text-blue-600 hover:underline">
        ${nameWithBadge}
      </a>
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
  const res = await fetch(API.posts+'?action=comment', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ postId, text:t }), credentials:'include' });
  const data = await res.json();
  if (data.success){
    document.getElementById('ct_'+postId).value = '';
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
    const res = await fetch(`${API.posts}?action=reply`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ postId, commentId, text }), credentials:'include' });
    const data = await res.json();
    if (!data.success){ alert(data.message||'Reply failed'); return; }
    inp.value = '';
    postCommentsCache.delete(postId);
    loadComments(postId);
  }catch(e){ alert('Reply failed'); }
}

/* ============== Likes ============== */
async function likePost(id){
  if (!currentUser) return alert('Login first');
  
  // Check current like status
  const btn = document.querySelector(`button[onclick="likePost('${id}')"]`);
  const isCurrentlyLiked = btn?.classList.contains('text-blue-600');
  
  try {
    const res = await fetch(API.posts+'?action=like', { 
      method:'POST', 
      headers:{'Content-Type':'application/json'}, 
      body: JSON.stringify({ postId:id }), 
      credentials:'include' 
    });
    const data = await res.json();
    
    if (data.success) {
      // Update button appearance immediately
      if (btn) {
        if (isCurrentlyLiked) {
          btn.classList.remove('text-blue-600');
          btn.classList.add('text-gray-700');
          const span = btn.querySelector('span');
          if (span) span.textContent = '👍';
          const textSpan = btn.querySelectorAll('span')[1];
          if (textSpan) textSpan.textContent = textSpan.textContent.replace('Dislike', 'Like');
        } else {
          btn.classList.remove('text-gray-700');
          btn.classList.add('text-blue-600');
          const span = btn.querySelector('span');
          if (span) span.textContent = '👎';
          const textSpan = btn.querySelectorAll('span')[1];
          if (textSpan) textSpan.textContent = textSpan.textContent.replace('Like', 'Dislike');
        }
      }
    }
    
    // Refresh feed to get updated counts
    loadFeed();
  } catch(e) {
    console.error('Like failed:', e);
  }
}

async function likeComment(postId, commentId){
  if (!currentUser) return alert('Login first');
  try{
    const res = await fetch(`${API.posts}?action=comment_like`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ postId, commentId }), credentials:'include' });
    const data = await res.json();
    if (!data.success){ alert(data.message||'Failed'); return; }
    postCommentsCache.delete(postId);
    loadComments(postId);
  }catch(e){ alert('Failed'); }
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

/* ============== Groups ============== */
async function loadGroups(){
  try{
    const res = await fetch(`${API.groups}?action=list&t=${Date.now()}`, { cache:'no-store', credentials:'include' });
    const data = await res.json();
    if (!data.success) return;
    cachedGroups = data.groups || [];

    const sel = document.getElementById('postGroupSelect');
    if (sel) {
      const opts = ['<option value="">Post to: Public</option>']
        .concat(cachedGroups.map(g => `<option value="${g.id}">${escapeHtml(g.name||'Group')}</option>`));
      sel.innerHTML = opts.join('');
    }

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

async function shareToGroup(groupId){
  if (!currentUser) return alert('Login first');
  const text = `Shared: ${currentShareLink()}`;
  const res = await fetch(API.posts+'?action=create', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text, media:[], videoUrl:'', groupId }), credentials:'include' });
  const data = await res.json();
  if (!data.success){ alert(data.message||'Share failed'); return; }
  alert('Shared to group');
  closeShare();
}

/* ============== Edit/Delete Posts ============== */
function startEditPost(postId){
  document.getElementById(`pview_${postId}`)?.classList.add('hidden');
  const box = document.getElementById(`peditbox_${postId}`);
  if (box) {
    box.classList.remove('hidden');
    const ta = document.getElementById(`pedit_${postId}`);
    if (ta) { ta.focus(); ta.selectionStart = ta.value.length; }
  }
}

function cancelEditPost(postId){
  document.getElementById(`peditbox_${postId}`)?.classList.add('hidden');
  document.getElementById(`pview_${postId}`)?.classList.remove('hidden');
}

async function saveEditPost(postId){
  const ta = document.getElementById(`pedit_${postId}`);
  const text = (ta?.value||'').trim();
  try{
    const r = await fetch(API.posts+'?action=update', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ postId, text }),
      credentials:'include'
    });
    const d = await r.json();
    if (!d?.success){ alert(d?.message||'Update failed'); return; }
    // refresh content with preview/full
    const p = d.post || { id: postId, text };
    if (!p.textHtml) p.textHtml = escapeHtml(p.text||'');
    if (!('previewHtml' in p) || !('isTruncated' in p)) {
      const pv = makePreviewClient(p.text||'', 220);
      p.previewHtml = pv.html;
      p.isTruncated = pv.truncated;
    }
    const holder = document.getElementById(`pview_${postId}`);
    if (holder) holder.innerHTML = buildPostContentHTML(p);
    cancelEditPost(postId);
  }catch(_){ alert('Update failed'); }
}

async function deletePost(postId){
  if (!confirm('Delete this post?')) return;
  try{
    const r = await fetch(API.posts+'?action=delete', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ postId }),
      credentials:'include'
    });
    const d = await r.json();
    if (!d?.success){ alert(d?.message||'Delete failed'); return; }
    const el = document.getElementById(`post-${postId}`);
    if (el) el.remove();
  }catch(_){ alert('Delete failed'); }
}

/* ============== Cookie Consent ============== */
function ensureCookieConsentBanner(){
  if (!currentUser) return;
  const key = `sl_cookie_consent_${String(currentUser.id)}`;
  if (localStorage.getItem(key) === 'yes') return;
  if (document.getElementById('cookieConsent')) return;

  const wrap = document.createElement('div');
  wrap.id = 'cookieConsent';
  wrap.className = 'fixed inset-x-0 bottom-0 z-50';
  wrap.innerHTML = `
    <div class="mx-auto max-w-5xl bg-gray-900 text-gray-100 border-t border-gray-700 rounded-t-lg shadow-lg m-2">
      <div class="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div class="text-sm leading-5">
          Tunatumia cookies kuboresha uzoefu wako. Angalia
          <a href="/privacy-policy.php" class="underline">Privacy</a> na
          <a href="/cookie.php" class="underline">Cookies</a>. Ukibofya "Allow", unakubali matumizi ya cookies.
        </div>
        <div class="flex gap-2 sm:ml-auto">
          <a href="/privacy-policy.php" class="px-3 py-2 text-sm border rounded bg-gray-800 hover:bg-gray-700">Learn more</a>
          <button id="cookieAllow" class="px-3 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700">Allow</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);

  document.getElementById('cookieAllow')?.addEventListener('click', () => {
    localStorage.setItem(key, 'yes');
    document.cookie = 'sl_cookie_consent=yes; path=/; max-age=' + (365*24*60*60) + '; SameSite=Lax';
    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        ad_user_data: 'granted',
        ad_personalization: 'granted',
        ad_storage: 'granted',
        analytics_storage: 'granted'
      });
    }
    document.getElementById('cookieConsent')?.remove();
  });
}

/* ============== Logout ============== */
function logout(){
  localStorage.removeItem('sl_user');
  fetch(API.auth+'?action=logout', { credentials:'include' }).finally(()=>location.reload());
}

/* ============== Global fallbacks for inline onclick ============== */
window.showLogin = showLogin;
window.showRegister = showRegister;
window.toggleUserDropdown = toggleUserDropdown;
window.logout = logout;
window.openShare = openShare;
window.closeShare = closeShare;
window.expandPost = expandPost;
window.collapsePost = collapsePost;
window.toggleLike = likePost;
window.toggleComments = toggleComments;
window.sharePost = openShare;
window.showComments = toggleComments;
