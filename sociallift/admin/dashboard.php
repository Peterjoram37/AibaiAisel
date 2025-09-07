<?php
// admin/dashboard.php
session_start();
if (empty($_SESSION['admin'])) { /* demo: allow if not set to preview */ }
require_once __DIR__ . '/../api/helpers.php';

$users = load_users();
$posts = load_posts();

if ($_SERVER['REQUEST_METHOD']==='POST' && isset($_POST['action'])) {
    $act = $_POST['action'];
    if ($act==='toggle_user') {
        $uid = $_POST['userId'] ?? '';
        foreach ($users as &$u) {
            if (($u['id']??'') === $uid) {
                $u['status'] = (($u['status']??'active')==='active') ? 'blocked' : 'active';
                break;
            }
        }
        unset($u);
        save_users($users);
        $_SESSION['flash_success'] = 'User status updated';
        header('Location: dashboard.php'); exit;
    }
    if ($act==='verify_user') {
        $uid = $_POST['userId'] ?? '';
        $verified = ($_POST['verified'] ?? '0') === '1';
        foreach ($users as &$u) {
            if (($u['id']??'') === $uid) { $u['verified'] = $verified; break; }
        }
        unset($u);
        save_users($users);
        $_SESSION['flash_success'] = 'Verification status updated';
        header('Location: dashboard.php'); exit;
    }
    if ($act==='delete_post') {
        $pid = $_POST['postId'] ?? '';
        $before = count($posts);
        $posts = array_values(array_filter($posts, function($p) use ($pid){ return (string)($p['id']??'') !== (string)$pid; }));
        save_posts($posts);
        $_SESSION['flash_success'] = ($before!==count($posts)) ? 'Post deleted' : 'Post not found';
        header('Location: dashboard.php'); exit;
    }
    if ($act==='warn_user') {
        $uid = $_POST['userId'] ?? '';
        $text = trim($_POST['text'] ?? 'Warning: Please avoid spam or harmful content.');
        append_warning($uid, $text, 'warning');
        $_SESSION['flash_success'] = 'Warning sent';
        header('Location: dashboard.php'); exit;
    }
}

// Re-read after changes
$users = load_users();
$posts = load_posts();

// Build mapping userId -> posts
$userPosts = [];
foreach ($posts as $p) {
    $uid = (string)($p['userId'] ?? '');
    if (!isset($userPosts[$uid])) $userPosts[$uid] = [];
    $userPosts[$uid][] = $p;
}
?>
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Admin Dashboard - SocialLift</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body class="bg-gray-100 text-gray-900">
<header class="bg-white border-b">
  <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
    <div class="font-bold">Admin · SocialLift</div>
    <a href="login.php" class="text-blue-600">Admin Home</a>
  </div>
</header>
<main class="max-w-6xl mx-auto px-4 py-6 space-y-6">
  <?php if (!empty($_SESSION['flash_success'])): ?>
    <div class="bg-green-100 border border-green-300 text-green-800 rounded p-3">
      <?php echo htmlspecialchars($_SESSION['flash_success']); unset($_SESSION['flash_success']); ?>
    </div>
  <?php endif; ?>

  <section class="grid sm:grid-cols-3 gap-4">
    <div class="bg-white border rounded p-4"><p class="text-sm text-gray-600">Users</p><p class="text-2xl font-bold"><?php echo count($users); ?></p></div>
    <div class="bg-white border rounded p-4"><p class="text-sm text-gray-600">Posts</p><p class="text-2xl font-bold"><?php echo count($posts); ?></p></div>
    <div class="bg-white border rounded p-4"><p class="text-sm text-gray-600">Verified</p><p class="text-2xl font-bold"><?php echo count(array_filter($users, fn($u)=>!empty($u['verified']))); ?></p></div>
  </section>

  <section class="bg-white border rounded p-4">
    <h3 class="font-semibold mb-3">Users</h3>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead><tr class="bg-gray-50">
          <th class="text-left px-3 py-2">ID</th>
          <th class="text-left px-3 py-2">Name</th>
          <th class="text-left px-3 py-2">Email</th>
          <th class="text-left px-3 py-2">Status</th>
          <th class="text-left px-3 py-2">Verified</th>
          <th class="text-left px-3 py-2">Actions</th>
        </tr></thead>
        <tbody>
          <?php foreach ($users as $u): $uid = (string)($u['id']??''); ?>
            <tr class="border-t align-top">
              <td class="px-3 py-2">
                <?php echo htmlspecialchars($uid); ?>
              </td>
              <td class="px-3 py-2">
                <?php echo htmlspecialchars(($u['firstName']??'').' '.($u['lastName']??'')); ?>
                <?php if (!empty($u['verified'])): ?>
                  <img src="https://od.lk/s/NzhfNjc2MDk0NDRf/Premium%20Vector%20_%20Verification%20checkmark%20blue%20circle%20star%20vector%20Icon%20isolated%20on%20white%20background.jpg" alt="verified" style="width:16px; vertical-align:middle; margin-left:5px;">
                <?php endif; ?>
                <div class="text-xs text-gray-500"><?php echo htmlspecialchars($u['username']??''); ?></div>
              </td>
              <td class="px-3 py-2"><?php echo htmlspecialchars($u['email']??''); ?></td>
              <td class="px-3 py-2"><?php echo htmlspecialchars($u['status']??'active'); ?></td>
              <td class="px-3 py-2"><?php echo !empty($u['verified']) ? 'Yes' : 'No'; ?></td>
              <td class="px-3 py-2 space-y-2">
                <form method="POST" class="inline-block">
                  <input type="hidden" name="action" value="toggle_user">
                  <input type="hidden" name="userId" value="<?php echo htmlspecialchars($uid); ?>">
                  <button class="px-3 py-1 rounded border text-sm">
                    <?php echo (($u['status']??'active')==='active') ? 'Block' : 'Unblock'; ?>
                  </button>
                </form>
                <form method="POST" class="inline-block">
                  <input type="hidden" name="action" value="verify_user">
                  <input type="hidden" name="userId" value="<?php echo htmlspecialchars($uid); ?>">
                  <input type="hidden" name="verified" value="<?php echo !empty($u['verified']) ? '0' : '1'; ?>">
                  <button class="px-3 py-1 rounded border text-sm"><?php echo !empty($u['verified']) ? 'Remove Blue Tick' : 'Give Blue Tick'; ?></button>
                </form>
                <form method="POST" class="block">
                  <input type="hidden" name="action" value="warn_user">
                  <input type="hidden" name="userId" value="<?php echo htmlspecialchars($uid); ?>">
                  <div class="flex items-center gap-2">
                    <input name="text" class="flex-1 border rounded p-1 text-sm" placeholder="Send warning e.g. spam/harmful" />
                    <button class="px-3 py-1 rounded border text-sm">Send</button>
                  </div>
                </form>
                <?php $pList = $userPosts[$uid] ?? []; if ($pList): ?>
                  <details class="mt-2">
                    <summary class="cursor-pointer text-sm text-gray-700">User Posts (<?php echo count($pList); ?>)</summary>
                    <div class="mt-2 space-y-2">
                      <?php foreach ($pList as $p): ?>
                        <div class="border rounded p-2">
                          <div class="text-xs text-gray-500"><?php echo htmlspecialchars($p['id'].' · '.($p['createdAt']??'')); ?></div>
                          <div class="text-sm whitespace-pre-wrap"><?php echo htmlspecialchars($p['text']??''); ?></div>
                          <div class="flex items-center gap-2 text-xs mt-1 text-gray-600">Likes: <?php echo intval($p['likes']??0); ?> · Comments: <?php echo intval($p['comments']??0); ?></div>
                          <form method="POST" class="mt-2">
                            <input type="hidden" name="action" value="delete_post">
                            <input type="hidden" name="postId" value="<?php echo htmlspecialchars($p['id']??''); ?>">
                            <button class="px-2 py-1 rounded border text-xs text-red-600">Delete Post</button>
                          </form>
                        </div>
                      <?php endforeach; ?>
                    </div>
                  </details>
                <?php endif; ?>
              </td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </section>
</main>
</body>
</html>

