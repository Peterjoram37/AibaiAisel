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
  $stmt->execute([current_user()['id'] ?? 0, $user['id']]);
  $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Exception $e) {
  error_log("Posts error: " . $e->getMessage());
}

// Get user stats
$stats = [];
try {
  // Posts count
  $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM posts WHERE userId = ?");
  $stmt->execute([$user['id']]);
  $stats['posts'] = $stmt->fetchColumn();

  // Followers count
  $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM follows WHERE followingId = ?");
  $stmt->execute([$user['id']]);
  $stats['followers'] = $stmt->fetchColumn();

  // Following count
  $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM follows WHERE followerId = ?");
  $stmt->execute([$user['id']]);
  $stats['following'] = $stmt->fetchColumn();
} catch (Exception $e) {
  error_log("Stats error: " . $e->getMessage());
  $stats = ['posts' => 0, 'followers' => 0, 'following' => 0];
}

// Check if current user follows this user
$isFollowing = false;
if (current_user()) {
  try {
    $stmt = $pdo->prepare("SELECT 1 FROM follows WHERE followerId = ? AND followingId = ?");
    $stmt->execute([current_user()['id'], $user['id']]);
    $isFollowing = $stmt->fetchColumn() > 0;
  } catch (Exception $e) {
    error_log("Follow check error: " . $e->getMessage());
  }
}

// Process posts for display
foreach ($posts as &$post) {
  $post['textHtml'] = escape_html($post['text'] ?? '');
  $post['previewHtml'] = mb_substr_safe($post['textHtml'], 0, 220);
  $post['isTruncated'] = mb_strlen_safe($post['text']) > 220;
  
  // Add author info
  $post['authorName'] = trim(($post['firstName'] ?? '') . ' ' . ($post['lastName'] ?? ''));
  $post['authorVerified'] = $post['verified'] ?? false;
}

$displayName = trim(($user['firstName'] ?? '') . ' ' . ($user['lastName'] ?? ''));
$pageTitle = $displayName ? "$displayName (@{$user['username']}) - SocialLift" : "@{$user['username']} - SocialLift";
?>
<!DOCTYPE html>
<html lang="sw">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?php echo htmlspecialchars($pageTitle); ?></title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  
  <!-- Favicon/SEO -->
  <link rel="icon" type="image/x-icon" href="/assets/favicon.ico" />
  <link rel="canonical" href="https://sociallift.great-site.net/profile.php?user=<?php echo urlencode($user['username']); ?>" />
  <link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png"/>
  <link rel="manifest" href="/site.webmanifest"/>
  <meta name="theme-color" content="#0F172A"/>
  <meta name="robots" content="index,follow"/>
  <meta name="referrer" content="strict-origin-when-cross-origin"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>

  <!-- Open Graph -->
  <meta property="og:site_name" content="SocialLift"/>
  <meta property="og:url" content="https://sociallift.great-site.net/profile.php?user=<?php echo urlencode($user['username']); ?>" />
  <meta property="og:type" content="profile"/>
  <meta property="og:title" content="<?php echo htmlspecialchars($pageTitle); ?>"/>
  <meta property="og:description" content="<?php echo htmlspecialchars($user['bio'] ?? 'User profile on SocialLift'); ?>"/>
  <meta property="og:image" content="https://sociallift.great-site.net/<?php echo htmlspecialchars($user['avatar'] ?? 'uploads/default.png'); ?>"/>

  <!-- Twitter -->
  <meta name="twitter:card" content="summary"/>
  <meta name="twitter:title" content="<?php echo htmlspecialchars($pageTitle); ?>"/>
  <meta name="twitter:description" content="<?php echo htmlspecialchars($user['bio'] ?? 'User profile on SocialLift'); ?>"/>
  <meta name="twitter:image" content="https://sociallift.great-site.net/<?php echo htmlspecialchars($user['avatar'] ?? 'uploads/default.png'); ?>"/>

  <!-- JSON-LD: Person -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "<?php echo htmlspecialchars($displayName); ?>",
    "url": "https://sociallift.great-site.net/profile.php?user=<?php echo urlencode($user['username']); ?>",
    "image": "https://sociallift.great-site.net/<?php echo htmlspecialchars($user['avatar'] ?? 'uploads/default.png'); ?>",
    "sameAs": []
  }
  </script>
</head>
<body class="bg-gray-100 text-gray-900">
  <!-- Header -->
  <div class="bg-white border-b">
    <div class="max-w-4xl mx-auto px-4 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <a href="index.php" class="text-blue-600 hover:underline">← Back to Home</a>
          <h1 class="text-xl font-bold">Profile</h1>
        </div>
        <div class="flex items-center gap-2">
          <?php if (current_user()): ?>
            <span class="text-sm text-gray-600">Welcome, <?php echo htmlspecialchars(current_user()['firstName'] ?? current_user()['username']); ?></span>
            <a href="index.php" class="px-3 py-1 bg-blue-600 text-white rounded">Home</a>
          <?php else: ?>
            <a href="index.php" class="px-3 py-1 bg-blue-600 text-white rounded">Login</a>
          <?php endif; ?>
        </div>
      </div>
    </div>
  </div>

  <div class="max-w-4xl mx-auto px-4 py-6">
    <!-- Profile Header -->
    <div class="bg-white rounded-lg border p-6 mb-6">
      <div class="flex items-start gap-4">
        <img src="<?php echo htmlspecialchars($user['avatar'] ?? 'uploads/default.png'); ?>" 
             alt="Avatar" class="w-24 h-24 rounded-full border">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <h2 class="text-2xl font-bold">
              <?php echo htmlspecialchars($displayName); ?>
              <?php if ($user['verified']): ?>
                <img src="https://od.lk/s/NzhfNjc2MDk0NDRf/Premium%20Vector%20_%20Verification%20checkmark%20blue%20circle%20star%20vector%20Icon%20isolated%20on%20white%20background.jpg" 
                     alt="verified" class="w-5 h-5 inline-block ml-1" />
              <?php endif; ?>
            </h2>
          </div>
          <p class="text-gray-600 mb-2">@<?php echo htmlspecialchars($user['username']); ?></p>
          <?php if ($user['location']): ?>
            <p class="text-gray-500 text-sm mb-2">📍 <?php echo htmlspecialchars($user['location']); ?></p>
          <?php endif; ?>
          <?php if ($user['bio']): ?>
            <p class="text-gray-700 mb-4"><?php echo nl2br(htmlspecialchars($user['bio'])); ?></p>
          <?php endif; ?>
          
          <!-- Stats -->
          <div class="flex gap-6 text-sm">
            <div class="text-center">
              <div class="font-bold text-lg"><?php echo number_format($stats['posts']); ?></div>
              <div class="text-gray-500">Posts</div>
            </div>
            <div class="text-center">
              <div class="font-bold text-lg"><?php echo number_format($stats['followers']); ?></div>
              <div class="text-gray-500">Followers</div>
            </div>
            <div class="text-center">
              <div class="font-bold text-lg"><?php echo number_format($stats['following']); ?></div>
              <div class="text-gray-500">Following</div>
            </div>
          </div>
        </div>
        
        <!-- Follow Button -->
        <?php if (current_user() && current_user()['id'] != $user['id']): ?>
          <div>
            <button id="followBtn" 
                    class="px-4 py-2 rounded border <?php echo $isFollowing ? 'bg-gray-200 text-gray-600' : 'bg-blue-600 text-white'; ?>"
                    onclick="toggleFollow(<?php echo $user['id']; ?>)">
              <?php echo $isFollowing ? 'Following' : 'Follow'; ?>
            </button>
          </div>
        <?php endif; ?>
      </div>
    </div>

    <!-- Posts Section -->
    <div class="bg-white rounded-lg border p-6">
      <h3 class="text-lg font-semibold mb-4">Posts</h3>
      <div id="postsContainer">
        <?php if (empty($posts)): ?>
          <p class="text-gray-500 text-center py-8">No posts yet</p>
        <?php else: ?>
          <?php foreach ($posts as $post): ?>
            <div class="bg-white rounded-lg shadow p-4 mb-4">
              <div class="flex items-center mb-3">
                <img src="https://ui-avatars.com/api/?name=<?php echo urlencode($post['authorName']); ?>&background=4C1D95&color=fff&size=32" class="w-8 h-8 rounded-full mr-3">
                <div>
                  <div class="font-semibold text-gray-900">
                    <?php echo htmlspecialchars($post['authorName']); ?>
                    <?php if ($post['authorVerified']): ?>
                      <img src="https://od.lk/s/NzhfNjc2MDk0NDRf/Premium%20Vector%20_%20Verification%20checkmark%20blue%20circle%20star%20vector%20Icon%20isolated%20on%20white%20background.jpg" 
                           alt="verified" class="w-4 h-4 inline-block ml-1" />
                    <?php endif; ?>
                  </div>
                  <div class="text-sm text-gray-500"><?php echo date('M j, Y g:i A', strtotime($post['createdAt'])); ?></div>
                </div>
              </div>
              
              <div id="pview_<?php echo $post['id']; ?>" class="mb-3">
                <?php if ($post['isTruncated']): ?>
                  <div id="p_prev_<?php echo $post['id']; ?>">
                    <?php echo $post['previewHtml']; ?>
                    <button class="text-blue-600 underline text-sm inline align-baseline" onclick="expandPost('<?php echo $post['id']; ?>')">Read more...</button>
                  </div>
                  <div id="p_full_<?php echo $post['id']; ?>" class="hidden">
                    <?php echo $post['textHtml']; ?>
                  </div>
                <?php else: ?>
                  <div><?php echo $post['textHtml']; ?></div>
                <?php endif; ?>
              </div>
              
              <!-- Media -->
              <?php if ($post['media']): ?>
                <?php $media = json_decode($post['media'], true); ?>
                <?php if (is_array($media)): ?>
                  <div class="space-y-2">
                    <?php foreach ($media as $mediaUrl): ?>
                      <img src="<?php echo htmlspecialchars($mediaUrl); ?>" class="w-full rounded border">
                    <?php endforeach; ?>
                  </div>
                <?php endif; ?>
              <?php endif; ?>
              
              <?php if ($post['videoUrl']): ?>
                <div class="mt-2">
                  <?php if (strpos($post['videoUrl'], 'youtube.com') !== false || strpos($post['videoUrl'], 'youtu.be') !== false): ?>
                    <?php
                    $videoId = '';
                    if (preg_match('/(?:youtu\.be\/|youtube\.com\/watch\?v=)([A-Za-z0-9_\-]+)/', $post['videoUrl'], $matches)) {
                      $videoId = $matches[1];
                    }
                    ?>
                    <?php if ($videoId): ?>
                      <iframe class="w-full aspect-video rounded" src="https://www.youtube.com/embed/<?php echo $videoId; ?>" frameborder="0" allowfullscreen></iframe>
                    <?php endif; ?>
                  <?php elseif (strpos($post['videoUrl'], 'vimeo.com') !== false): ?>
                    <?php
                    $videoId = '';
                    if (preg_match('/vimeo\.com\/(\d+)/', $post['videoUrl'], $matches)) {
                      $videoId = $matches[1];
                    }
                    ?>
                    <?php if ($videoId): ?>
                      <iframe class="w-full aspect-video rounded" src="https://player.vimeo.com/video/<?php echo $videoId; ?>" frameborder="0" allowfullscreen></iframe>
                    <?php endif; ?>
                  <?php else: ?>
                    <video class="w-full rounded border" src="<?php echo htmlspecialchars($post['videoUrl']); ?>" controls playsinline></video>
                  <?php endif; ?>
                </div>
              <?php endif; ?>
              
              <!-- Post Actions -->
              <div class="flex items-center justify-between pt-3 border-t">
                <button onclick="toggleLike('<?php echo $post['id']; ?>', '<?php echo $post['likedByMe'] ? 'unlike' : 'like'; ?>')" 
                        class="flex items-center space-x-1 <?php echo $post['likedByMe'] ? 'text-blue-600' : 'text-gray-700'; ?> hover:text-blue-600">
                  <span><?php echo $post['likedByMe'] ? '👎' : '👍'; ?></span>
                  <span><?php echo $post['likedByMe'] ? 'Dislike' : 'Like'; ?></span>
                  <span>(<?php echo number_format($post['likes']); ?>)</span>
                </button>
                
                <button onclick="toggleComments('<?php echo $post['id']; ?>')" 
                        class="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
                  <span>💬</span>
                  <span>Comment</span>
                  <span>(<?php echo number_format($post['comments']); ?>)</span>
                </button>
                
                <button onclick="openShareModal('<?php echo $post['id']; ?>')" 
                        class="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
                  <span>🔗</span>
                  <span>Share</span>
                </button>
              </div>
              
              <!-- Comments Section -->
              <div id="comments_<?php echo $post['id']; ?>" class="hidden mt-4">
                <div class="border-t pt-3">
                  <div id="commentsList_<?php echo $post['id']; ?>"></div>
                  <div class="mt-3">
                    <input type="text" id="commentInput_<?php echo $post['id']; ?>" 
                           placeholder="Write a comment..." 
                           class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <button onclick="addComment('<?php echo $post['id']; ?>')" 
                            class="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Comment</button>
                  </div>
                </div>
              </div>
            </div>
          <?php endforeach; ?>
        <?php endif; ?>
      </div>
    </div>
  </div>

  <!-- Include app.js -->
  <script src="assets/js/app.js"></script>
  
  <script>
    // Profile-specific functions
    async function toggleFollow(userId) {
      const btn = document.getElementById('followBtn');
      if (!btn) return;
      
      const isFollowing = btn.textContent === 'Following';
      const action = isFollowing ? 'unfollow' : 'follow';
      
      try {
        const response = await fetch('api/follow.php?action=' + action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userId }),
          credentials: 'include'
        });
        
        const data = await response.json();
        if (data.success) {
          if (isFollowing) {
            btn.textContent = 'Follow';
            btn.className = 'px-4 py-2 rounded border bg-blue-600 text-white';
          } else {
            btn.textContent = 'Following';
            btn.className = 'px-4 py-2 rounded border bg-gray-200 text-gray-600';
          }
        } else {
          alert(data.message || 'Failed to update follow status');
        }
      } catch (error) {
        alert('Failed to update follow status');
      }
    }
    
    // Make @mentions clickable
    document.addEventListener('DOMContentLoaded', function() {
      // Add click handlers for @mentions
      document.addEventListener('click', function(e) {
        if (e.target.classList.contains('mention')) {
          e.preventDefault();
          const username = e.target.textContent.replace('@', '');
          window.location.href = 'profile.php?user=' + username;
        }
      });
    });
  </script>
</body>
</html>