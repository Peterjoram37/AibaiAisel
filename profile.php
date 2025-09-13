<?php
// profile.php - User Profile Page
require_once __DIR__ . '/api/helpers.php';

$username = isset($_GET['user']) ? trim($_GET['user']) : '';
if (!$username) {
  header('Location: index.php');
  exit;
}

// Get user data
$user = null;
try {
  $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? OR id = ?");
  $stmt->execute([$username, $username]);
  $user = $stmt->fetch(PDO::FETCH_ASSOC);
} catch (Exception $e) {
  error_log("Profile error: " . $e->getMessage());
}

if (!$user) {
  header('Location: index.php');
  exit;
}

// Get user posts
$posts = [];
try {
  $stmt = $pdo->prepare("
    SELECT p.*, u.firstName, u.lastName, u.username, u.verified,
           COUNT(DISTINCT l.id) as likes,
           COUNT(DISTINCT c.id) as comments,
           CASE WHEN EXISTS(SELECT 1 FROM likes WHERE postId = p.id AND userId = ?) THEN 1 ELSE 0 END as likedByMe
    FROM posts p
    LEFT JOIN users u ON p.userId = u.id
    LEFT JOIN likes l ON p.id = l.postId
    LEFT JOIN comments c ON p.id = c.postId
    WHERE p.userId = ?
    GROUP BY p.id
    ORDER BY p.createdAt DESC
    LIMIT 50
  ");
  $currentUserId = current_user() ? current_user()['id'] : 0;
  $stmt->execute([$currentUserId, $user['id']]);
  $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Exception $e) {
  error_log("Posts error: " . $e->getMessage());
}

// Process posts for display
foreach ($posts as &$post) {
  $post['textHtml'] = linkify_and_mentions($post['text'] ?? '');
  $post['previewHtml'] = build_post_preview($post['text'] ?? '', 220);
  $post['isTruncated'] = mb_strlen_safe($post['text'] ?? '') > 220;
  $post['authorName'] = ($post['firstName'] && $post['lastName']) 
    ? trim($post['firstName'] . ' ' . $post['lastName']) 
    : ($post['username'] ?: 'User ' . $post['userId']);
  $post['authorVerified'] = !!$post['verified'];
}

// Get follow status
$followedByMe = false;
if (current_user()) {
  try {
    $stmt = $pdo->prepare("SELECT 1 FROM follows WHERE followerId = ? AND followingId = ?");
    $stmt->execute([current_user()['id'], $user['id']]);
    $followedByMe = !!$stmt->fetch();
  } catch (Exception $e) {
    error_log("Follow check error: " . $e->getMessage());
  }
}

// Get follower/following counts
$followerCount = 0;
$followingCount = 0;
try {
  $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM follows WHERE followingId = ?");
  $stmt->execute([$user['id']]);
  $followerCount = $stmt->fetch()['count'] ?? 0;
  
  $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM follows WHERE followerId = ?");
  $stmt->execute([$user['id']]);
  $followingCount = $stmt->fetch()['count'] ?? 0;
} catch (Exception $e) {
  error_log("Follow counts error: " . $e->getMessage());
}

$displayName = ($user['firstName'] && $user['lastName']) 
  ? trim($user['firstName'] . ' ' . $user['lastName']) 
  : ($user['username'] ?: 'User ' . $user['id']);

$isOwnProfile = current_user() && current_user()['id'] == $user['id'];
?>
<!DOCTYPE html>
<html lang="sw">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?php echo escape_html($displayName); ?> - SocialLift</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
  
  <!-- Favicon/SEO -->
  <link rel="icon" type="image/x-icon" href="/assets/favicon.ico" />
  <link rel="canonical" href="https://sociallift.great-site.net/profile.php?user=<?php echo urlencode($username); ?>"/>
  <link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png"/>
  <link rel="manifest" href="/site.webmanifest"/>
  <meta name="theme-color" content="#0F172A"/>
  <meta name="robots" content="index,follow"/>
  <meta name="referrer" content="strict-origin-when-cross-origin"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>

  <!-- Open Graph -->
  <meta property="og:site_name" content="SocialLift"/>
  <meta property="og:url" content="https://sociallift.great-site.net/profile.php?user=<?php echo urlencode($username); ?>"/>
  <meta property="og:type" content="profile"/>
  <meta property="og:title" content="<?php echo escape_html($displayName); ?> - SocialLift"/>
  <meta property="og:description" content="Profile ya <?php echo escape_html($displayName); ?> kwenye SocialLift"/>
  <meta property="og:image" content="<?php echo $user['avatar'] ?: 'https://sociallift.great-site.net/uploads/default.png'; ?>"/>

  <!-- Twitter -->
  <meta name="twitter:card" content="summary"/>
  <meta name="twitter:title" content="<?php echo escape_html($displayName); ?> - SocialLift"/>
  <meta name="twitter:description" content="Profile ya <?php echo escape_html($displayName); ?> kwenye SocialLift"/>
  <meta name="twitter:image" content="<?php echo $user['avatar'] ?: 'https://sociallift.great-site.net/uploads/default.png'; ?>"/>

  <style>
    .mention { color: #3B82F6; text-decoration: none; }
    .mention:hover { text-decoration: underline; }
  </style>
</head>
<body class="bg-gray-100 text-gray-900">
  <!-- Header -->
  <div class="bg-white shadow-sm border-b">
    <div class="max-w-4xl mx-auto px-4 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a href="index.php" class="text-blue-600 hover:text-blue-800">
            <i class="fas fa-arrow-left text-xl"></i>
          </a>
          <h1 class="text-xl font-bold"><?php echo escape_html($displayName); ?></h1>
          <?php if ($user['verified']): ?>
            <img src="https://od.lk/s/NzhfNjc2MDk0NDRf/Premium%20Vector%20_%20Verification%20checkmark%20blue%20circle%20star%20vector%20Icon%20isolated%20on%20white%20background.jpg" alt="verified" style="width:20px;height:20px;border-radius:9999px;" />
          <?php endif; ?>
        </div>
        <div class="flex items-center gap-2">
          <?php if (!$isOwnProfile && current_user()): ?>
            <button id="followBtn" onclick="toggleFollow()" class="px-4 py-2 rounded-lg border <?php echo $followedByMe ? 'bg-gray-200 text-gray-600' : 'bg-blue-600 text-white'; ?>">
              <?php echo $followedByMe ? 'Followed' : 'Follow'; ?>
            </button>
          <?php endif; ?>
          <a href="index.php" class="px-4 py-2 rounded-lg border bg-gray-100 hover:bg-gray-200">
            <i class="fas fa-home"></i> Home
          </a>
        </div>
      </div>
    </div>
  </div>

  <div class="max-w-4xl mx-auto px-4 py-6">
    <!-- Profile Header -->
    <div class="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div class="flex flex-col md:flex-row items-start md:items-center gap-6">
        <!-- Avatar -->
        <div class="flex-shrink-0">
          <img src="<?php echo $user['avatar'] ?: 'uploads/default.png'; ?>" 
               alt="<?php echo escape_html($displayName); ?>" 
               class="w-24 h-24 rounded-full border-4 border-white shadow-lg">
        </div>
        
        <!-- Profile Info -->
        <div class="flex-1">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 class="text-2xl font-bold text-gray-900">
                <?php echo escape_html($displayName); ?>
                <?php if ($user['verified']): ?>
                  <img src="https://od.lk/s/NzhfNjc2MDk0NDRf/Premium%20Vector%20_%20Verification%20checkmark%20blue%20circle%20star%20vector%20Icon%20isolated%20on%20white%20background.jpg" alt="verified" style="width:20px;height:20px;vertical-align:middle;margin-left:8px;border-radius:9999px;" />
                <?php endif; ?>
              </h2>
              <p class="text-gray-600">@<?php echo escape_html($user['username']); ?></p>
              <?php if ($user['location']): ?>
                <p class="text-gray-500 text-sm mt-1">
                  <i class="fas fa-map-marker-alt"></i> <?php echo escape_html($user['location']); ?>
                </p>
              <?php endif; ?>
              <?php if ($user['bio']): ?>
                <p class="text-gray-700 mt-2"><?php echo escape_html($user['bio']); ?></p>
              <?php endif; ?>
            </div>
            
            <!-- Stats -->
            <div class="flex gap-6 text-center">
              <div>
                <div class="text-2xl font-bold text-gray-900"><?php echo count($posts); ?></div>
                <div class="text-sm text-gray-500">Posts</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-gray-900"><?php echo $followerCount; ?></div>
                <div class="text-sm text-gray-500">Followers</div>
              </div>
              <div>
                <div class="text-2xl font-bold text-gray-900"><?php echo $followingCount; ?></div>
                <div class="text-sm text-gray-500">Following</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Posts Section -->
    <div class="bg-white rounded-lg shadow-sm border">
      <div class="p-4 border-b">
        <h3 class="text-lg font-semibold">Posts</h3>
      </div>
      
      <div id="postsContainer" class="divide-y">
        <?php if (empty($posts)): ?>
          <div class="p-8 text-center text-gray-500">
            <i class="fas fa-newspaper text-4xl mb-4"></i>
            <p>Hakuna posts bado</p>
          </div>
        <?php else: ?>
          <?php foreach ($posts as $post): ?>
            <div class="p-4">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <img src="<?php echo $user['avatar'] ?: 'uploads/default.png'; ?>" 
                       alt="<?php echo escape_html($displayName); ?>" 
                       class="w-8 h-8 rounded-full">
                  <div>
                    <div class="font-semibold text-sm"><?php echo escape_html($displayName); ?></div>
                    <div class="text-xs text-gray-500"><?php echo date('M j, Y g:i A', strtotime($post['createdAt'])); ?></div>
                  </div>
                </div>
              </div>
              
              <!-- Post Content -->
              <div class="mb-3">
                <?php if ($post['isTruncated']): ?>
                  <div id="preview_<?php echo $post['id']; ?>">
                    <?php echo $post['previewHtml']; ?>
                    <button onclick="expandPost(<?php echo $post['id']; ?>)" class="text-blue-600 underline text-sm">Read more...</button>
                  </div>
                  <div id="full_<?php echo $post['id']; ?>" class="hidden">
                    <?php echo $post['textHtml']; ?>
                    <button onclick="collapsePost(<?php echo $post['id']; ?>)" class="text-blue-600 underline text-sm">Show less</button>
                  </div>
                <?php else: ?>
                  <?php echo $post['textHtml']; ?>
                <?php endif; ?>
              </div>
              
              <!-- Media -->
              <?php if ($post['media']): ?>
                <?php 
                $media = json_decode($post['media'], true);
                if (is_array($media)):
                ?>
                  <div class="mb-3">
                    <?php foreach ($media as $mediaUrl): ?>
                      <?php if (preg_match('/\.(jpg|jpeg|png|gif|webp)$/i', $mediaUrl)): ?>
                        <img src="<?php echo htmlspecialchars($mediaUrl); ?>" class="w-full rounded border max-h-96 object-cover">
                      <?php endif; ?>
                    <?php endforeach; ?>
                  </div>
                <?php endif; ?>
              <?php endif; ?>
              
              <?php if ($post['videoUrl']): ?>
                <div class="mb-3">
                  <?php 
                  // YouTube embed
                  if (preg_match('/(?:youtu\.be\/|youtube\.com\/watch\?v=)([A-Za-z0-9_\-]+)/', $post['videoUrl'], $matches)): ?>
                    <iframe class="w-full aspect-video rounded border" src="https://www.youtube.com/embed/<?php echo $matches[1]; ?>" frameborder="0" allowfullscreen></iframe>
                  <?php 
                  // Vimeo embed
                  elseif (preg_match('/vimeo\.com\/(\d+)/', $post['videoUrl'], $matches)): ?>
                    <iframe class="w-full aspect-video rounded border" src="https://player.vimeo.com/video/<?php echo $matches[1]; ?>" frameborder="0" allowfullscreen></iframe>
                  <?php 
                  // Local video
                  elseif (preg_match('/\.(mp4|webm|ogg|mov|m4v|mkv)$/i', $post['videoUrl'])): ?>
                    <video class="w-full rounded border" src="<?php echo htmlspecialchars($post['videoUrl']); ?>" controls playsinline></video>
                  <?php endif; ?>
                </div>
              <?php endif; ?>
              
              <!-- Post Stats -->
              <div class="flex items-center gap-4 text-sm text-gray-500">
                <span><i class="fas fa-thumbs-up"></i> <?php echo $post['likes']; ?> likes</span>
                <span><i class="fas fa-comment"></i> <?php echo $post['comments']; ?> comments</span>
                <span><i class="fas fa-share"></i> Share</span>
              </div>
            </div>
          <?php endforeach; ?>
        <?php endif; ?>
      </div>
    </div>
  </div>

  <script>
    function expandPost(postId) {
      document.getElementById('preview_' + postId).classList.add('hidden');
      document.getElementById('full_' + postId).classList.remove('hidden');
    }
    
    function collapsePost(postId) {
      document.getElementById('full_' + postId).classList.add('hidden');
      document.getElementById('preview_' + postId).classList.remove('hidden');
    }
    
    async function toggleFollow() {
      const btn = document.getElementById('followBtn');
      if (!btn) return;
      
      const isFollowing = btn.textContent.trim() === 'Followed';
      const action = isFollowing ? 'unfollow' : 'follow';
      
      btn.disabled = true;
      btn.textContent = 'Loading...';
      
      try {
        const response = await fetch('api/follow.php?action=' + action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: <?php echo $user['id']; ?> }),
          credentials: 'include'
        });
        
        const data = await response.json();
        if (data.success) {
          if (isFollowing) {
            btn.textContent = 'Follow';
            btn.className = 'px-4 py-2 rounded-lg border bg-blue-600 text-white';
          } else {
            btn.textContent = 'Followed';
            btn.className = 'px-4 py-2 rounded-lg border bg-gray-200 text-gray-600';
          }
        } else {
          alert(data.message || 'Action failed');
        }
      } catch (error) {
        alert('Action failed');
      } finally {
        btn.disabled = false;
      }
    }
    
    // Make mentions clickable
    document.addEventListener('DOMContentLoaded', function() {
      const mentions = document.querySelectorAll('.mention');
      mentions.forEach(mention => {
        mention.addEventListener('click', function(e) {
          e.preventDefault();
          const username = this.textContent.replace('@', '');
          window.open('profile.php?user=' + encodeURIComponent(username), '_blank');
        });
      });
    });
  </script>
</body>
</html>