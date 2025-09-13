// assets/js/app.js
// SocialLift - Home App v5
// - Modern action icons (Font Awesome)
// - Threaded comments: list, add, reply, like comment
// - Share modal + groups (kept from previous version)
// - User profile functionality

const API = {
  auth: "api/auth.php",
  posts: "api/posts.php",
  users: "api/users.php",
  upload: "api/upload.php",
  follow: "api/follow.php",
  groups: "api/groups.php"
};

let currentUser = null;
let pickedUploadPath = "";
let pickedVideoPath = "";
let cachedGroups = [];
let sharePostId = "";
const postCommentsCache = new Map(); // postId -> { loaded:boolean, items: Comment[] }

document.addEventListener("DOMContentLoaded", () => {
  initAuthUI();
  loadMe().then(async () => {
    if (currentUser) {
      document.getElementById("composer")?.classList.remove("hidden");
      document.getElementById("groupsPanel")?.classList.remove("hidden");
      await loadGroups();
      ensureCookieConsentBanner(); // cookie consent for logged-in users
    }
    loadFeed();
  });

  // Auth modals
  document.getElementById("btnShowLogin")?.addEventListener("click", showLogin);
  document.getElementById("btnShowRegister")?.addEventListener("click", showRegister);
  document.getElementById("closeAuth")?.addEventListener("click", hideAuth);
  document.getElementById("switchAuth")?.addEventListener("click", switchAuth);

  document.getElementById("doLogin")?.addEventListener("click", doLogin);
  document.getElementById("doRegister")?.addEventListener("click", doRegister);

  // Mobile auth buttons (extra safety if inline onclick missing)
  document.getElementById("btnShowLoginMobile")?.addEventListener("click", () => {
    showLogin();
    document.getElementById("mobileMenu")?.classList.add("hidden");
  });
  document.getElementById("btnShowRegisterMobile")?.addEventListener("click", () => {
    showRegister();
    document.getElementById("mobileMenu")?.classList.add("hidden");
  });

  // Composer
  document.getElementById("btnPickFile")?.addEventListener("click", () => document.getElementById("postFile").click());
  document.getElementById("postFile")?.addEventListener("change", handlePickFile);
  document.getElementById("postVideoFile")?.addEventListener("change", handlePickVideo);
  document.getElementById("btnPublish")?.addEventListener("click", createPost);

  // Share modal buttons (external)
  document.getElementById("shareFb")?.addEventListener("click", () => openShareExternal("fb"));
  document.getElementById("shareTw")?.addEventListener("click", () => openShareExternal("tw"));
  document.getElementById("shareWa")?.addEventListener("click", () => openShareExternal("wa"));
  document.getElementById("shareCopy")?.addEventListener("click", copyShareLink);

  // Hide dropdown on outside click
  window.addEventListener("click", (e) => {
    const dd = document.getElementById("userDropdown");
    if (!e.target.closest("#userDropdown") && !e.target.closest("#userMenu")) dd?.classList.add("hidden");
  });
});

// Auth functions
function initAuthUI() {
  const user = current_user();
  if (user) {
    currentUser = user;
    document.getElementById("authSection")?.classList.add("hidden");
    document.getElementById("userSection")?.classList.remove("hidden");
    document.getElementById("userName")?.textContent = user.firstName || user.username || "User";
  } else {
    document.getElementById("authSection")?.classList.remove("hidden");
    document.getElementById("userSection")?.classList.add("hidden");
  }
}

function showLogin() {
  document.getElementById("loginForm")?.classList.remove("hidden");
  document.getElementById("registerForm")?.classList.add("hidden");
  document.getElementById("tabLogin")?.classList.add("border-purple-400");
  document.getElementById("tabLogin")?.classList.remove("text-purple-300");
  document.getElementById("tabRegister")?.classList.remove("border-purple-400");
  document.getElementById("tabRegister")?.classList.add("text-purple-300");
}

function showRegister() {
  document.getElementById("loginForm")?.classList.add("hidden");
  document.getElementById("registerForm")?.classList.remove("hidden");
  document.getElementById("tabRegister")?.classList.add("border-purple-400");
  document.getElementById("tabRegister")?.classList.remove("text-purple-300");
  document.getElementById("tabLogin")?.classList.remove("border-purple-400");
  document.getElementById("tabLogin")?.classList.add("text-purple-300");
}

function hideAuth() {
  document.getElementById("authModal")?.classList.add("hidden");
}

function switchAuth() {
  if (document.getElementById("loginForm")?.classList.contains("hidden")) {
    showLogin();
  } else {
    showRegister();
  }
}

async function doLogin() {
  const email = document.getElementById("loginEmail")?.value.trim();
  const password = document.getElementById("loginPassword")?.value.trim();
  const err = document.getElementById("authError");

  if (!email || !password) {
    err?.classList.remove("hidden");
    err.textContent = "Tafadhali jaza email na password";
    return;
  }

  try {
    const res = await fetch(API.auth, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", email, password })
    });
    const data = await res.json();

    if (data.success) {
      localStorage.setItem("user", JSON.stringify(data.user));
      currentUser = data.user;
      initAuthUI();
      hideAuth();
      loadFeed();
    } else {
      err?.classList.remove("hidden");
      err.textContent = data.message || "Hitilafu ya kuingia";
    }
  } catch (error) {
    err?.classList.remove("hidden");
    err.textContent = "Hitilafu ya mtandao";
  }
}

async function doRegister() {
  const firstName = document.getElementById("regFirst")?.value.trim();
  const lastName = document.getElementById("regLast")?.value.trim();
  const username = document.getElementById("regUsername")?.value.trim();
  const email = document.getElementById("regEmail")?.value.trim();
  const phone = document.getElementById("regPhone")?.value.trim();
  const location = document.getElementById("regLocation")?.value.trim();
  const password = document.getElementById("regPassword")?.value.trim();
  const err = document.getElementById("authError");

  if (!firstName || !lastName || !username || !email || !password) {
    err?.classList.remove("hidden");
    err.textContent = "Tafadhali jaza sehemu zote za lazima";
    return;
  }

  try {
    const res = await fetch(API.auth, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "register",
        firstName,
        lastName,
        username,
        email,
        phone,
        location,
        password
      })
    });
    const data = await res.json();

    if (data.success) {
      localStorage.setItem("user", JSON.stringify(data.user));
      currentUser = data.user;
      initAuthUI();
      hideAuth();
      loadFeed();
    } else {
      err?.classList.remove("hidden");
      err.textContent = data.message || "Hitilafu ya kusajili";
    }
  } catch (error) {
    err?.classList.remove("hidden");
    err.textContent = "Hitilafu ya mtandao";
  }
}

async function loadMe() {
  const user = localStorage.getItem("user");
  if (user) {
    try {
      currentUser = JSON.parse(user);
      initAuthUI();
    } catch (e) {
      localStorage.removeItem("user");
    }
  }
}

function logout() {
  localStorage.removeItem("user");
  currentUser = null;
  initAuthUI();
  loadFeed();
}

// Post functions
async function createPost() {
  const text = document.getElementById("postText")?.value.trim();
  const media = pickedUploadPath;
  const video = pickedVideoPath;
  const err = document.getElementById("postError");

  if (!text && !media && !video) {
    err?.classList.remove("hidden");
    err.textContent = "Tafadhali andika kitu au pakia faili";
    return;
  }

  try {
    const res = await fetch(API.posts, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        text,
        media: media ? [media] : [],
        videoUrl: video || null
      })
    });
    const data = await res.json();

    if (data.success) {
      document.getElementById("postText").value = "";
      document.getElementById("postFile").value = "";
      document.getElementById("postVideoFile").value = "";
      pickedUploadPath = "";
      pickedVideoPath = "";
      document.getElementById("pickedFile")?.classList.add("hidden");
      document.getElementById("pickedVideo")?.classList.add("hidden");
      err?.classList.add("hidden");
      loadFeed();
    } else {
      err?.classList.remove("hidden");
      err.textContent = data.message || "Hitilafu ya kutengeneza post";
    }
  } catch (error) {
    err?.classList.remove("hidden");
    err.textContent = "Hitilafu ya mtandao";
  }
}

async function loadFeed() {
  try {
    const res = await fetch(API.posts + "?action=list");
    const data = await res.json();
    
    if (data.success) {
      renderFeed(data.posts || []);
    }
  } catch (error) {
    console.error("Error loading feed:", error);
  }
}

function renderFeed(posts) {
  const container = document.getElementById("feed");
  if (!container) return;

  container.innerHTML = posts.map(p => renderPost(p)).join("");
}

function renderPost(p) {
  const imgs = (p.media||[]).map(src => `<img src="${src}" class="w-full rounded border">`).join("");
  const video = p.videoUrl ? renderVideo(p.videoUrl) : "";
  const liked = !!p.likedByMe;
  const likeCls = liked ? "text-blue-600" : "text-gray-700";
  const commentsCount = p.comments || 0;
  const likesCount = p.likes || 0;
  const displayName = p.authorName || p.userName || p.username || p.userId;
  const nameWithBadge = `${escapeHtml(String(displayName))}${verifiedIcon(!!(p.authorVerified||p.verified))}`;
  
  // Like/Dislike button with icons
  const likeIcon = liked ? "👎" : "👍";
  const likeText = liked ? "Dislike" : "Like";
  const likeAction = liked ? "unlike" : "like";
  
  return `
    <div class="bg-white rounded-lg shadow p-4 mb-4">
      <div class="flex items-center mb-3">
        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4C1D95&color=fff&size=32" class="w-8 h-8 rounded-full mr-3">
        <div>
          <div class="font-semibold text-gray-900">${nameWithBadge}</div>
          <div class="text-sm text-gray-500">${formatTime(p.createdAt)}</div>
        </div>
      </div>
      
      <div id="pview_${p.id}" class="mb-3">
        ${buildPostContentHTML(p)}
      </div>
      
      ${imgs}
      ${video}
      
      <div class="flex items-center justify-between pt-3 border-t">
        <button onclick="toggleLike('${p.id}', '${likeAction}')" class="flex items-center space-x-1 ${likeCls} hover:text-blue-600">
          <span>${likeIcon}</span>
          <span>${likeText}</span>
          <span>(${likesCount})</span>
        </button>
        
        <button onclick="toggleComments('${p.id}')" class="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
          <span>💬</span>
          <span>Comment</span>
          <span>(${commentsCount})</span>
        </button>
        
        <button onclick="openShareModal('${p.id}')" class="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
          <span>🔗</span>
          <span>Share</span>
        </button>
      </div>
      
      <div id="comments_${p.id}" class="hidden mt-4">
        <div class="border-t pt-3">
          <div id="commentsList_${p.id}"></div>
          <div class="mt-3">
            <input type="text" id="commentInput_${p.id}" placeholder="Write a comment..." class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
            <button onclick="addComment('${p.id}')" class="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Comment</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildPostContentHTML(p) {
  const pid = p.id;
  const preview = p.previewHtml || escapeHtml((p.text||""));
  const full = p.textHtml || escapeHtml((p.text||""));
  const isTrunc = !!p.isTruncated;
  
  if (isTrunc) {
    // Read more... ndani ya mstari huo huo
    const readMoreInline = ` <button class="text-blue-600 underline text-sm inline align-baseline" onclick="expandPost('${pid}')">Read more...</button>`;
    return `
      <div id="p_prev_${pid}">${preview}${readMoreInline}</div>
      <div id="p_full_${pid}" class="hidden">${full}</div>
    `;
  }
  
  return `<div>${full}</div>`;
}

function expandPost(postId) {
  const prev = document.getElementById(`p_prev_${postId}`);
  const full = document.getElementById(`p_full_${postId}`);
  if (!prev || !full) return;
  
  // Hide preview and show full content
  prev.classList.add("hidden");
  full.classList.remove("hidden");
  
  // Add "Show less" button to full content
  const showLessBtn = `<button class="text-blue-600 underline text-sm inline align-baseline ml-2" onclick="collapsePost('${postId}')">Show less</button>`;
  full.innerHTML = full.innerHTML + showLessBtn;
}

function collapsePost(postId) {
  const prev = document.getElementById(`p_prev_${postId}`);
  const full = document.getElementById(`p_full_${postId}`);
  if (!prev || !full) return;
  
  // Show preview and hide full content
  prev.classList.remove("hidden");
  full.classList.add("hidden");
  
  // Remove "Show less" button from full content
  full.innerHTML = full.innerHTML.replace(/<button[^>]*>Show less<\/button>/g, "");
}

function renderVideo(url) {
  if (!url) return "";
  
  // YouTube
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const videoId = url.includes("youtu.be") ? url.split("/").pop().split("?")[0] : url.split("v=")[1]?.split("&")[0];
    if (videoId) {
      return `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen class="rounded"></iframe>`;
    }
  }
  
  // Vimeo
  if (url.includes("vimeo.com")) {
    const videoId = url.split("/").pop().split("?")[0];
    if (videoId) {
      return `<iframe width="100%" height="315" src="https://player.vimeo.com/video/${videoId}" frameborder="0" allowfullscreen class="rounded"></iframe>`;
    }
  }
  
  // Local video
  return `<video width="100%" controls class="rounded"><source src="${url}" type="video/mp4">Your browser does not support the video tag.</video>`;
}

// File upload functions
async function handlePickFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(API.upload, {
      method: "POST",
      body: formData
    });
    const data = await res.json();

    if (data.success) {
      pickedUploadPath = data.url;
      document.getElementById("pickedFile")?.classList.remove("hidden");
      document.getElementById("pickedFile")?.textContent = file.name;
    } else {
      alert(data.message || "Hitilafu ya kupakia faili");
    }
  } catch (error) {
    alert("Hitilafu ya mtandao");
  }
}

async function handlePickVideo(e) {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(API.upload, {
      method: "POST",
      body: formData
    });
    const data = await res.json();

    if (data.success) {
      pickedVideoPath = data.url;
      document.getElementById("pickedVideo")?.classList.remove("hidden");
      document.getElementById("pickedVideo")?.textContent = file.name;
    } else {
      alert(data.message || "Hitilafu ya kupakia video");
    }
  } catch (error) {
    alert("Hitilafu ya mtandao");
  }
}

// Like functions
async function toggleLike(postId, action) {
  if (!currentUser) {
    showLogin();
    return;
  }

  try {
    const res = await fetch(API.posts, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, postId })
    });
    const data = await res.json();

    if (data.success) {
      loadFeed(); // Reload to update like count
    }
  } catch (error) {
    console.error("Error toggling like:", error);
  }
}

// Comment functions
async function toggleComments(postId) {
  const commentsDiv = document.getElementById(`comments_${postId}`);
  if (!commentsDiv) return;

  if (commentsDiv.classList.contains("hidden")) {
    commentsDiv.classList.remove("hidden");
    await loadComments(postId);
  } else {
    commentsDiv.classList.add("hidden");
  }
}

async function loadComments(postId) {
  const commentsList = document.getElementById(`commentsList_${postId}`);
  if (!commentsList) return;

  try {
    const res = await fetch(API.posts + `?action=comments&postId=${postId}`);
    const data = await res.json();

    if (data.success) {
      commentsList.innerHTML = (data.comments || []).map(c => renderComment(c)).join("");
    }
  } catch (error) {
    console.error("Error loading comments:", error);
  }
}

function renderComment(c) {
  const displayName = c.authorName || c.userName || c.username || c.userId;
  const nameWithBadge = `${escapeHtml(String(displayName))}${verifiedIcon(!!(c.authorVerified||c.verified))}`;
  
  return `
    <div class="mb-3 p-3 bg-gray-50 rounded-lg">
      <div class="flex items-center mb-2">
        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4C1D95&color=fff&size=24" class="w-6 h-6 rounded-full mr-2">
        <div class="font-semibold text-sm text-gray-900">${nameWithBadge}</div>
        <div class="text-xs text-gray-500 ml-2">${formatTime(c.createdAt)}</div>
      </div>
      <div class="text-sm text-gray-700">${c.textHtml || escapeHtml(c.text || "")}</div>
    </div>
  `;
}

async function addComment(postId) {
  const input = document.getElementById(`commentInput_${postId}`);
  const text = input?.value.trim();
  
  if (!text || !currentUser) return;

  try {
    const res = await fetch(API.posts, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "comment", postId, text })
    });
    const data = await res.json();

    if (data.success) {
      input.value = "";
      await loadComments(postId);
      loadFeed(); // Update comment count
    }
  } catch (error) {
    console.error("Error adding comment:", error);
  }
}

// Share functions
function openShareModal(postId) {
  sharePostId = postId;
  document.getElementById("shareModal")?.classList.remove("hidden");
}

function closeShareModal() {
  document.getElementById("shareModal")?.classList.add("hidden");
}

function openShareExternal(platform) {
  const url = window.location.origin + "/post.php?id=" + sharePostId;
  
  switch (platform) {
    case "fb":
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
      break;
    case "tw":
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`, "_blank");
      break;
    case "wa":
      window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, "_blank");
      break;
  }
}

async function copyShareLink() {
  const url = window.location.origin + "/post.php?id=" + sharePostId;
  
  try {
    await navigator.clipboard.writeText(url);
    alert("Link imekopishwa!");
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = url;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    alert("Link imekopishwa!");
  }
}

// Groups functions
async function loadGroups() {
  try {
    const res = await fetch(API.groups + "?action=list");
    const data = await res.json();
    
    if (data.success) {
      cachedGroups = data.groups || [];
      renderGroups();
    }
  } catch (error) {
    console.error("Error loading groups:", error);
  }
}

function renderGroups() {
  const container = document.getElementById("groupsList");
  if (!container) return;

  container.innerHTML = cachedGroups.map(g => `
    <div class="p-3 hover:bg-gray-100 rounded-lg cursor-pointer" onclick="selectGroup('${g.id}')">
      <div class="font-semibold">${escapeHtml(g.name)}</div>
      <div class="text-sm text-gray-500">${g.members || 0} members</div>
    </div>
  `).join("");
}

function selectGroup(groupId) {
  // Handle group selection
  console.log("Selected group:", groupId);
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return Math.floor(diff / 60000) + "m ago";
  if (diff < 86400000) return Math.floor(diff / 3600000) + "h ago";
  return Math.floor(diff / 86400000) + "d ago";
}

function verifiedIcon(isVerified) {
  return isVerified ? ' <img src="https://od.lk/s/NzhfNjc2MDk0NDRf/Premium%20Vector%20_%20Verification%20checkmark%20blue%20circle%20star%20vector%20Icon%20isolated%20on%20white%20background.jpg" style="width:14px;height:14px;vertical-align:middle;margin-left:4px;border-radius:9999px;display:inline-block;" />' : "";
}

function linkifyText(text) {
  if (!text) return "";
  
  // Linkify URLs
  text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="text-blue-600 hover:underline">$1</a>');
  
  // Linkify @mentions
  text = text.replace(/@(\w+)/g, '<a href="profile.php?user=$1" class="text-blue-600 hover:underline mention">@$1</a>');
  
  return text;
}

function makePreviewClient(text, maxLength = 200) {
  if (!text) return "";
  
  const plainText = text.replace(/<[^>]*>/g, ""); // Remove HTML tags
  if (plainText.length <= maxLength) return text;
  
  return plainText.substring(0, maxLength) + "...";
}

function normalizeBreaks(html) {
  let s = String(html||"").trim();
  s = s.replace(/(?:<br\s*\/?>\s*){3,}/gi, "<br><br>");
  return s;
}

function stripTrailingBreaks(html) {
  return String(html||"").replace(/(?:\s|<br\s*\/?>)+$/i, "");
}

// Cookie consent
function ensureCookieConsentBanner() {
  if (localStorage.getItem("cookieConsent") === "accepted") return;
  
  const banner = document.createElement("div");
  banner.className = "fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50";
  banner.innerHTML = `
    <div class="max-w-4xl mx-auto flex items-center justify-between">
      <div class="text-sm">
        We use cookies to improve your experience. By continuing to use our site, you accept our use of cookies.
      </div>
      <button onclick="acceptCookies()" class="ml-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
        Accept
      </button>
    </div>
  `;
  
  document.body.appendChild(banner);
}

function acceptCookies() {
  localStorage.setItem("cookieConsent", "accepted");
  document.querySelector(".fixed.bottom-0")?.remove();
}

// Global functions for inline onclick
window.toggleLike = toggleLike;
window.toggleComments = toggleComments;
window.addComment = addComment;
window.openShareModal = openShareModal;
window.closeShareModal = closeShareModal;
window.openShareExternal = openShareExternal;
window.copyShareLink = copyShareLink;
window.selectGroup = selectGroup;
window.acceptCookies = acceptCookies;
window.expandPost = expandPost;
window.collapsePost = collapsePost;
window.logout = logout;
