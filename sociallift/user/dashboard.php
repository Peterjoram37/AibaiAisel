<?php
// user/dashboard.php
?>
<!DOCTYPE html>
<html lang="sw">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Dashboard - SocialLift</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50 text-gray-900">
    <header class="bg-white border-b">
        <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div class="font-bold">My Dashboard</div>
            <a href="../index.php" class="text-blue-600">Home</a>
        </div>
    </header>
    <main class="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <section class="bg-white border rounded-lg p-4">
            <h3 class="font-semibold mb-3">Profile</h3>
            <div class="grid md:grid-cols-2 gap-4">
                <div><p class="text-sm text-gray-600">Name</p><p id="pfName" class="font-medium">-</p></div>
                <div><p class="text-sm text-gray-600">Username</p><p id="pfUser" class="font-medium">-</p></div>
                <div><p class="text-sm text-gray-600">Email</p><p id="pfEmail" class="font-medium">-</p></div>
                <div><p class="text-sm text-gray-600">Phone</p><p id="pfPhone" class="font-medium">-</p></div>
                <div class="md:col-span-2"><p class="text-sm text-gray-600">Location</p><p id="pfLoc" class="font-medium">-</p></div>
            </div>
        </section>

        <section class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-white border rounded-lg p-4"><p class="text-sm text-gray-600">Total Posts</p><p id="stPosts" class="text-2xl font-bold">0</p></div>
            <div class="bg-white border rounded-lg p-4"><p class="text-sm text-gray-600">Total Likes</p><p id="stLikes" class="text-2xl font-bold">0</p></div>
            <div class="bg-white border rounded-lg p-4"><p class="text-sm text-gray-600">Total Comments</p><p id="stComments" class="text-2xl font-bold">0</p></div>
            <div class="bg-white border rounded-lg p-4"><p class="text-sm text-gray-600">Member Since</p><p id="stSince" class="text-2xl font-bold text-gray-800">-</p></div>
        </section>

        <section class="bg-white border rounded-lg p-4">
            <h3 class="font-semibold mb-3">Follow Stats</h3>
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-gray-50 border rounded p-3">
                    <p class="text-sm text-gray-600">Followers</p>
                    <p id="stFollowers" class="text-xl font-bold">0</p>
                </div>
                <div class="bg-gray-50 border rounded p-3">
                    <p class="text-sm text-gray-600">Following</p>
                    <p id="stFollowing" class="text-xl font-bold">0</p>
                </div>
            </div>
        </section>

        <section class="bg-white border rounded-lg p-4">
            <h3 class="font-semibold mb-3">Wallet</h3>
            <div class="grid md:grid-cols-3 gap-4">
                <div class="bg-gray-50 border rounded p-3">
                    <p class="text-sm text-gray-600">Coins Balance</p>
                    <p id="wlBalance" class="text-2xl font-bold">0</p>
                </div>
                <div class="flex items-end">
                    <button id="btnClaim" class="w-full bg-blue-600 text-white rounded py-2">Claim Rewards</button>
                </div>
                <div class="flex items-end gap-2">
                    <input id="cashoutAmount" type="number" min="2000" class="w-full border rounded p-2" placeholder="Coins to cashout (≥ 2000)">
                    <button id="btnCashout" class="bg-green-600 text-white rounded py-2 px-4">Cashout</button>
                </div>
            </div>
            <p class="text-xs text-gray-500 mt-2">Note: 1000 likes = 250 coins, 1000 comments = 250 coins. Minimum cashout 2000 coins.</p>
        </section>

        <section class="bg-white border rounded-lg p-4">
            <h3 class="font-semibold mb-3">Notifications</h3>
            <div id="notifList" class="space-y-2"></div>
            <div id="notifEmpty" class="text-gray-500 text-sm hidden">No notifications yet</div>
        </section>

        <section class="bg-white border rounded-lg p-4">
            <h3 class="font-semibold mb-3">My Recent Posts</h3>
            <div id="myPosts" class="space-y-3"></div>
        </section>
    </main>
    <script>
        const API = {
            auth:'../api/auth.php',
            posts:'../api/posts.php',
            users:'../api/users.php',
            follow:'../api/follow.php',
            wallet:'../api/wallet.php',
            notifications:'../api/notifications.php'
        };
        let me = null;

        document.addEventListener('DOMContentLoaded', init);

        async function init(){
            const saved = localStorage.getItem('sl_user');
            if (!saved) { alert('Please login'); location.href='../index.php'; return; }
            me = JSON.parse(saved);

            fillProfile(me);
            wireEvents();

            await Promise.all([
                loadMyPosts(),
                loadFollowStats(),
                loadWallet(),
                loadNotifications()
            ]);
        }

        function wireEvents(){
            document.getElementById('btnClaim')?.addEventListener('click', claimRewards);
            document.getElementById('btnCashout')?.addEventListener('click', cashout);
            window.addEventListener('storage', e => {
                if (e.key==='posts_updated') loadMyPosts();
                if (e.key==='wallet_updated' || e.key==='payouts_updated') loadWallet();
                if (e.key==='notifications_updated') loadNotifications();
            });
            window.addEventListener('message', e => {
                if (e?.data?.type==='POSTS_UPDATED') loadMyPosts();
                if (e?.data?.type==='WALLET_UPDATED' || e?.data?.type==='PAYOUTS_UPDATED') loadWallet();
                if (e?.data?.type==='NOTIFICATIONS_UPDATED') loadNotifications();
            });
        }

        function fillProfile(u){
            document.getElementById('pfName').textContent = [u.firstName||'', u.lastName||''].join(' ').trim() || u.username || '-';
            document.getElementById('pfUser').textContent = u.username||'-';
            document.getElementById('pfEmail').textContent = u.email||'-';
            document.getElementById('pfPhone').textContent = u.phone||'-';
            document.getElementById('pfLoc').textContent = u.location||'-';
            document.getElementById('stSince').textContent = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-';
        }

        async function loadMyPosts(){
            const res = await fetch(`${API.posts}?action=list&userId=${encodeURIComponent(me.id)}&t=${Date.now()}`);
            const data = await res.json();
            if (!data.success) return;
            const posts = data.posts||[];
            document.getElementById('stPosts').textContent = posts.length;
            let likes = 0, comments = 0;
            posts.forEach(p => { likes += (p.likes||0); comments += (p.comments||0); });
            document.getElementById('stLikes').textContent = likes;
            document.getElementById('stComments').textContent = comments;
            const out = posts.slice(0,10).map(p => `
                <div class="border rounded p-3">
                    <div class="text-sm text-gray-500">${new Date(p.createdAt).toLocaleString()}</div>
                    <div class="mt-1">${escapeHtml(p.text||'')}</div>
                    <div class="text-sm mt-1">Likes: ${p.likes||0} · Comments: ${p.comments||0}</div>
                </div>
            `).join('');
            document.getElementById('myPosts').innerHTML = out || '<p class="text-gray-500">No posts yet</p>';
        }

        async function loadFollowStats(){
            try{
                const res = await fetch(`${API.follow}?action=stats&userId=${encodeURIComponent(me.id)}&t=${Date.now()}`);
                const data = await res.json();
                if (data.success){
                    document.getElementById('stFollowers').textContent = data.followers ?? 0;
                    document.getElementById('stFollowing').textContent = data.following ?? 0;
                }
            }catch(e){}
        }

        async function loadWallet(){
            try{
                const res = await fetch(`${API.wallet}?action=balance&t=${Date.now()}`, { cache:'no-store' });
                const data = await res.json();
                if (data.success){
                    document.getElementById('wlBalance').textContent = data.coins ?? 0;
                }
            }catch(e){}
        }

        async function claimRewards(){
            try{
                const res = await fetch(`${API.wallet}?action=claim_rewards`, { method:'POST' });
                const data = await res.json();
                if (!data.success) { alert(data.message||'Claim failed'); return; }
                alert(`Rewards claimed: +${data.awarded} coins`);
                localStorage.setItem('wallet_updated', Date.now().toString());
                loadWallet();
            }catch(e){ alert('Error'); }
        }

        async function cashout(){
            const amtEl = document.getElementById('cashoutAmount');
            const coins = parseInt(amtEl.value||'0',10);
            if (isNaN(coins) || coins < 2000) { alert('Minimum cashout is 2000 coins'); return; }
            try{
                const res = await fetch(`${API.wallet}?action=cashout`, {
                    method:'POST', headers:{'Content-Type':'application/json'},
                    body: JSON.stringify({ coins })
                });
                const data = await res.json();
                if (!data.success){ alert(data.message||'Cashout failed'); return; }
                alert('Cashout requested. Pending review.');
                amtEl.value = '';
                localStorage.setItem('payouts_updated', Date.now().toString());
                loadWallet();
            }catch(e){ alert('Error'); }
        }

        async function loadNotifications(){
            try{
                const res = await fetch(`${API.notifications}?action=list&t=${Date.now()}`, { cache:'no-store' });
                const data = await res.json();
                if (!data.success){ showNotifEmpty(); return; }
                const list = data.notifications||[];
                if (list.length===0){ showNotifEmpty(); return; }
                document.getElementById('notifEmpty').classList.add('hidden');
                document.getElementById('notifList').innerHTML = list.slice(0,20).map(n => `
                    <div class="border rounded p-3 flex items-start gap-3 ${n.read ? 'bg-white' : 'bg-blue-50'}">
                        <div class="text-xs text-gray-500 w-32">${new Date(n.createdAt).toLocaleString()}</div>
                        <div class="flex-1">
                            <p class="text-sm">${escapeHtml(n.text||'')}</p>
                            <p class="text-xs text-gray-500">Type: ${escapeHtml(n.type||'')}</p>
                        </div>
                        ${n.read ? '' : `<button onclick="markNotif('${n.id}')" class="text-xs px-2 py-1 rounded border">Mark read</button>`}
                    </div>
                `).join('');
            }catch(e){ showNotifEmpty(); }
        }

        function showNotifEmpty(){
            document.getElementById('notifList').innerHTML = '';
            document.getElementById('notifEmpty').classList.remove('hidden');
        }

        async function markNotif(id){
            try{
                const res = await fetch(`${API.notifications}?action=mark_read`, {
                    method:'POST', headers:{'Content-Type':'application/json'},
                    body: JSON.stringify({ id })
                });
                const data = await res.json();
                if (data.success){
                    localStorage.setItem('notifications_updated', Date.now().toString());
                    loadNotifications();
                }
            }catch(e){}
        }

        function escapeHtml(s){return (s||'').replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;' }[m]));}
    </script>
</body>
</html>

