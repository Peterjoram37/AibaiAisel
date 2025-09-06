<?php
// index.php - SocialLift (modernized UI)
?>
<!DOCTYPE html>
<html lang="sw">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SocialLift</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet" />
</head>
<body class="bg-gray-100 text-gray-900">
    <header class="bg-white border-b sticky top-0 z-40">
        <div class="max-w-5xl mx-auto px-4 py-3">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded bg-blue-600 grid place-items-center text-white font-bold">S</div>
                    <span class="font-bold">SocialLift</span>
                </div>
                <div class="flex items-center gap-3">
                    <div class="hidden md:block relative">
                        <input class="pl-9 w-72 border rounded py-1.5" placeholder="Tafuta kwenye SocialLift"/>
                        <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs"></i>
                    </div>
                    <div id="guestActions" class="flex items-center gap-2">
                        <button id="btnShowLogin" class="px-3 py-1 rounded bg-blue-600 text-white">Login</button>
                        <button id="btnShowRegister" class="px-3 py-1 rounded border">Register</button>
                    </div>
                    <div id="userMenu" class="hidden relative">
                        <button onclick="toggleUserDropdown()" class="px-3 py-1 rounded border bg-white flex items-center gap-2">
                            <img id="userAvatar" src="" alt="me" class="w-6 h-6 rounded-full hidden">
                            <span id="userName">User</span>
                            <i class="fas fa-chevron-down ml-1 text-xs"></i>
                        </button>
                        <div id="userDropdown" class="hidden absolute right-0 mt-2 w-56 bg-white border rounded shadow text-sm">
                            <a href="user/dashboard.php" class="block px-4 py-2 hover:bg-gray-50">My Dashboard</a>
                            <a id="adminVerifyLink" href="#" onclick="openVerify();return false;" class="hidden block px-4 py-2 hover:bg-gray-50 text-blue-600">Manage Blue Ticks</a>
                            <a href="#" onclick="logout();return false;" class="block px-4 py-2 text-red-600 hover:bg-gray-50">Logout</a>
                        </div>
                    </div>
                </div>
            </div>
            <div id="userNav" class="hidden mt-3 flex flex-wrap items-center gap-2">
                <a href="user/dashboard.php" class="px-3 py-1.5 rounded border bg-white text-sm">My Dashboard</a>
                <a href="groups.php" class="px-3 py-1.5 rounded border bg-white text-sm">Group</a>
                <a href="online.php" class="px-3 py-1.5 rounded border bg-white text-sm">User Online</a>
                <a href="messenger.php" class="px-3 py-1.5 rounded border bg-white text-sm">Messenger</a>
            </div>
        </div>
    </header>

    <main class="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div id="composer" class="bg-white border rounded-lg p-4 hidden">
            <div class="flex items-start gap-3">
                <img id="meAvatar" class="w-10 h-10 rounded-full hidden" />
                <div class="flex-1">
                    <textarea id="postText" class="w-full border rounded p-2" rows="3" placeholder="Unafikiri nini leo?"></textarea>
                    <input id="postVideoUrl" type="url" class="w-full border rounded p-2 mt-2" placeholder="Video URL (YouTube/Vimeo) - optional">
                    <div class="grid md:grid-cols-3 gap-2 mt-2">
                        <div class="flex items-center gap-2">
                            <input type="file" id="postFile" accept="image/*" class="hidden" />
                            <button id="btnPickFile" class="px-3 py-1 rounded border"><i class="fa-regular fa-image mr-1"></i> Ongeza Picha</button>
                            <span id="pickedFile" class="text-sm text-gray-600"></span>
                        </div>
                        <div>
                            <select id="postGroupSelect" class="w-full border rounded p-2">
                                <option value="">Post to: Public</option>
                            </select>
                        </div>
                        <div class="flex items-center justify-end">
                            <button id="btnPublish" class="px-4 py-1.5 rounded bg-blue-600 text-white">Chapisha</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <section id="groupsPanel" class="bg-white border rounded-lg p-4 hidden">
            <div class="flex items-center justify-between mb-3">
                <h3 class="font-semibold">Groups</h3>
                <a href="groups.php" class="px-3 py-1 rounded border text-sm">Open Groups Page</a>
            </div>
        </section>

        <div id="feed" class="space-y-4"></div>
    </main>

    <div id="shareModal" class="hidden fixed inset-0 bg-black bg-opacity-40 z-50">
        <div class="min-h-screen w-full flex items-center justify-center p-4">
            <div class="bg-white rounded-lg w-full max-w-lg p-4">
                <div class="flex items-center justify-between">
                    <h3 class="font-semibold">Share Post</h3>
                    <button onclick="closeShare()" class="text-gray-500">✕</button>
                </div>
                <div class="mt-3">
                    <p class="text-sm text-gray-600 mb-2">Share externally</p>
                    <div class="flex flex-wrap gap-2">
                        <button id="shareFb" class="px-3 py-1 rounded border text-sm"><i class="fa-brands fa-facebook mr-1"></i> Facebook</button>
                        <button id="shareTw" class="px-3 py-1 rounded border text-sm"><i class="fa-brands fa-x-twitter mr-1"></i> Twitter</button>
                        <button id="shareWa" class="px-3 py-1 rounded border text-sm"><i class="fa-brands fa-whatsapp mr-1"></i> WhatsApp</button>
                        <button id="shareCopy" class="px-3 py-1 rounded border text-sm"><i class="fa-regular fa-copy mr-1"></i> Copy Link</button>
                    </div>
                </div>
                <div class="mt-4">
                    <p class="text-sm text-gray-600 mb-2">Share to Groups</p>
                    <div id="shareGroups" class="max-h-64 overflow-y-auto space-y-2"></div>
                    <div id="shareGroupsEmpty" class="text-sm text-gray-500">No groups</div>
                </div>
            </div>
        </div>
    </div>

    <div id="verifyModal" class="hidden fixed inset-0 bg-black bg-opacity-40 z-50">
        <div class="min-h-screen w-full flex items-center justify-center p-4">
            <div class="bg-white rounded-lg w-full max-w-lg p-4">
                <div class="flex items-center justify-between">
                    <h3 class="font-semibold">Manage Blue Ticks</h3>
                    <button onclick="closeVerify()" class="text-gray-500">✕</button>
                </div>
                <div id="verifyUsersList" class="mt-3 divide-y"></div>
                <div class="mt-4 flex justify-end">
                    <button onclick="closeVerify()" class="px-3 py-1 rounded border">Close</button>
                </div>
            </div>
        </div>
    </div>

    <div id="authModal" class="hidden fixed inset-0 bg-black bg-opacity-40 grid place-items-center">
        <div class="bg-white rounded-lg p-5 w-full max-w-md">
            <h3 id="authTitle" class="font-bold mb-3">Login</h3>
            <div id="loginForm">
                <input id="loginEmail" class="w-full border rounded p-2 mb-2" placeholder="Email or username">
                <input id="loginPassword" type="password" class="w-full border rounded p-2 mb-2" placeholder="Password">
                <button id="doLogin" class="w-full bg-blue-600 text-white rounded py-2">Login</button>
            </div>
            <div id="registerForm" class="hidden">
                <div class="grid grid-cols-2 gap-2">
                    <input id="regFirst" class="border rounded p-2" placeholder="First name">
                    <input id="regLast" class="border rounded p-2" placeholder="Last name">
                </div>
                <input id="regUsername" class="w-full border rounded p-2 mt-2" placeholder="Username">
                <input id="regEmail" class="w-full border rounded p-2 mt-2" placeholder="Email">
                <input id="regPhone" class="w-full border rounded p-2 mt-2" placeholder="Phone">
                <input id="regLocation" class="w-full border rounded p-2 mt-2" placeholder="Location">
                <input id="regPassword" type="password" class="w-full border rounded p-2 mt-2" placeholder="Password">
                <button id="doRegister" class="w-full bg-green-600 text-white rounded py-2 mt-3">Create Account</button>
            </div>
            <div class="text-center mt-3">
                <button id="switchAuth" class="text-blue-600 text-sm">Switch</button>
                <button id="closeAuth" class="ml-3 text-sm">Close</button>
            </div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const saved = localStorage.getItem('sl_user');
            if (saved) {
                document.getElementById('userNav')?.classList.remove('hidden');
            }
        });
        function toggleUserDropdown(){
            document.getElementById('userDropdown')?.classList.toggle('hidden');
        }
    </script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/js/all.min.js" defer></script>
    <script src="assets/js/app.js?v=5" defer></script>
</body>
</html>

