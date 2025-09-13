<?php
// auth.php - Force login/register gate
require_once __DIR__ . '/api/helpers.php';

$next = isset($_GET['next']) && $_GET['next'] !== '' ? $_GET['next'] : 'index.php';
if (current_user()) {
  header('Location: ' . $next);
  exit;
}
?>
<!DOCTYPE html>
<html lang="sw">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ingia au Sajili - SocialLift</title>

  <!-- Tailwind -->
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">

  <!-- Favicon/SEO -->
  <link rel="icon" type="image/x-icon" href="/assets/favicon.ico" />
  <link rel="canonical" href="https://sociallift.great-site.net/">
  <link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png"/>
  <link rel="manifest" href="/site.webmanifest"/>
  <meta name="theme-color" content="#4C1D95"/>
  <meta name="robots" content="index,follow"/>
  <meta name="referrer" content="strict-origin-when-cross-origin"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>

  <!-- Open Graph -->
  <meta property="og:site_name" content="SocialLift"/>
  <meta property="og:url" content="https://sociallift.great-site.net/"/>
  <meta property="og:type" content="website"/>
  <meta property="og:title" content="Ingia au Sajili - SocialLift"/>
  <meta property="og:description" content="Ungana na marafiki, shiriki mawazo, picha na video kwenye SocialLift."/>
  <meta property="og:image" content="https://sociallift.great-site.net/assets/og/cover.jpg"/>

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="Ingia au Sajili - SocialLift"/>
  <meta name="twitter:description" content="Ungana na marafiki, shiriki mawazo, picha na video kwenye SocialLift."/>
  <meta name="twitter:image" content="https://sociallift.great-site.net/assets/og/cover.jpg"/>
</head>
<body class="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-900 to-black">

  <div class="w-full max-w-sm bg-gradient-to-b from-purple-800 to-purple-900 p-6 rounded-2xl shadow-2xl text-white">
    <!-- Title -->
    <h1 class="text-center text-2xl font-bold mb-6">SocialLift</h1>

    <!-- Tabs -->
    <div class="flex border-b border-purple-600 mb-6">
      <button id="tabLogin" class="flex-1 py-2 text-center font-semibold border-b-2 border-purple-400">Login</button>
      <button id="tabRegister" class="flex-1 py-2 text-center text-purple-300">Register</button>
    </div>

    <!-- Login Form -->
    <div id="loginForm">
      <input id="loginEmail" class="w-full bg-purple-700 rounded p-2 mb-3 placeholder-gray-300 text-white focus:outline-none" placeholder="Email au Username">
      <input id="loginPassword" type="password" class="w-full bg-purple-700 rounded p-2 mb-3 placeholder-gray-300 text-white focus:outline-none" placeholder="Password">
      <button id="doLogin" class="w-full bg-purple-500 hover:bg-purple-600 text-white rounded-lg py-2 font-semibold transition">Login</button>
    </div>

    <!-- Register Form -->
    <div id="registerForm" class="hidden">
     <input id="regFirst" class="w-full bg-purple-700 rounded p-2 mb-3 placeholder-gray-300 text-white focus:outline-none" placeholder="First name">
          <input id="regLast" class="w-full bg-purple-700 rounded p-2 mb-3 placeholder-gray-300 text-white focus:outline-none" placeholder="Last name">
      <input id="regUsername" class="w-full bg-purple-700 rounded p-2 mb-3 placeholder-gray-300 text-white focus:outline-none" placeholder="Username">
      <input id="regEmail" class="w-full bg-purple-700 rounded p-2 mb-3 placeholder-gray-300 text-white focus:outline-none" placeholder="Email">
      <input id="regPhone" class="w-full bg-purple-700 rounded p-2 mb-3 placeholder-gray-300 text-white focus:outline-none" placeholder="Phone">
      <input id="regLocation" class="w-full bg-purple-700 rounded p-2 mb-3 placeholder-gray-300 text-white focus:outline-none" placeholder="mfano(Tanzania,Mbeya)">
      <input id="regPassword" type="password" class="w-full bg-purple-700 rounded p-2 mb-3 placeholder-gray-300 text-white focus:outline-none" placeholder="Password">
      <button id="doRegister" class="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg py-2 font-semibold transition">Sign Up</button>
    </div>

    <p id="err" class="mt-3 text-sm text-red-400 hidden"></p>
    <p class="mt-3 text-center text-xs text-purple-300">Ukishaingia, utapelekwa: <span id="nextPath" class="font-medium"></span></p>
  </div>

  <script>
    const API = { auth:'api/auth.php' };
    const nextUrl = new URLSearchParams(location.search).get('next') || 'index.php';
    document.getElementById('nextPath').textContent = nextUrl;

    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const err = document.getElementById('err');

    tabLogin.addEventListener('click', ()=>{
      tabLogin.classList.add('border-purple-400','text-white');
      tabRegister.classList.remove('border-purple-400','text-white');
      tabRegister.classList.add('text-purple-300');
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
      err.classList.add('hidden'); err.textContent='';
    });

    tabRegister.addEventListener('click', ()=>{
      tabRegister.classList.add('border-purple-400','text-white');
      tabLogin.classList.remove('border-purple-400','text-white');
      tabLogin.classList.add('text-purple-300');
      registerForm.classList.remove('hidden');
      loginForm.classList.add('hidden');
      err.classList.add('hidden'); err.textContent='';
    });

    // Login API
    document.getElementById('doLogin').addEventListener('click', async ()=>{
      err.classList.add('hidden'); err.textContent='';
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      if (!email || !password){ showErr('Weka email/username na password'); return; }
      try{
        const r = await fetch(API.auth+'?action=login', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ email, password }),
          credentials:'include'
        });
        const d = await r.json();
        if (!d?.success){ showErr(d?.message || 'Login failed'); return; }
        localStorage.setItem('sl_user', JSON.stringify(d.user));
        location.href = nextUrl;
      }catch(_){ showErr('Login failed'); }
    });

    // Register API
    document.getElementById('doRegister').addEventListener('click', async ()=>{
      err.classList.add('hidden'); err.textContent='';
      const payload = {
        firstName: document.getElementById('regFirst').value.trim(),
        lastName: document.getElementById('regLast').value.trim(),
        username: document.getElementById('regUsername').value.trim(),
        email: document.getElementById('regEmail').value.trim(),
        phone: document.getElementById('regPhone').value.trim(),
        location: document.getElementById('regLocation').value.trim(),
        password: document.getElementById('regPassword').value
      };
      if (!payload.firstName || !payload.lastName || !payload.username || !payload.email || !payload.password){
        showErr('Jaza taarifa muhimu zote'); return;
      }
      try{
        const r = await fetch(API.auth+'?action=register', {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify(payload),
          credentials:'include'
        });
        const d = await r.json();
        if (!d?.success){ showErr(d?.message || 'Registration failed'); return; }
        localStorage.setItem('sl_user', JSON.stringify(d.user));
        location.href = nextUrl;
      }catch(_){ showErr('Registration failed'); }
    });

    function showErr(msg){
      err.textContent = msg;
      err.classList.remove('hidden');
    }
  </script>
</body>
</html>