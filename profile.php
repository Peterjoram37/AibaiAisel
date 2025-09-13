<?php
// profile.php - User Profile Page
require_once __DIR__ . '/api/helpers.php';

// Get user parameter
$username = $_GET['user'] ?? '';
if (empty($username)) {
    header('Location: index.php');
    exit;
}

// Get current user
$currentUser = current_user();

// Get user data
$user = get_user_by_username($username);
if (!$user) {
    header('Location: index.php');
    exit;
}

// Get user posts
$posts = get_user_posts($user['id']);

// Get user stats
$stats = get_user_stats($user['id']);

// Check if current user is following this user
$isFollowing = false;
if ($currentUser) {
    $isFollowing = is_following($currentUser['id'], $user['id']);
}

// Process posts for display
foreach ($posts as &$post) {
    $post['textHtml'] = linkify_and_mentions($post['text']);
    $post['previewHtml'] = build_post_preview($post['text'], 200);
    $post['isTruncated'] = mb_strlen_safe($post['text']) > 200;
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
    
    <style>
        .mention {
            color: #3b82f6;
            text-decoration: none;
            font-weight: 500;
        }
        .mention:hover {
            text-decoration: underline;
        }
    </style>
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
                    <?php if ($currentUser): ?>
                        <span class="text-sm text-gray-600">Welcome, <?php echo htmlspecialchars($currentUser['firstName'] ?? $currentUser['username']); ?></span>
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
                            <?php if ($user['verified'] ?? false): ?>
                                <img src="https://od.lk/s/NzhfNjc2MDk0NDRf/Premium%20Vector%20_%20Verification%20checkmark%20blue%20circle%20star%20vector%20Icon%20isolated%20on%20white%20background.jpg" 
                                     alt="verified" class="w-5 h-5 inline-block ml-1" />
                            <?php endif; ?>
                        </h2>
                    </div>
                    <p class="text-gray-600 mb-2">@<?php echo htmlspecialchars($user['username']); ?></p>
                    <?php if ($user['location'] ?? false): ?>
                        <p class="text-gray-500 text-sm mb-2">📍 <?php echo htmlspecialchars($user['location']); ?></p>
                    <?php endif; ?>
                    <?php if ($user['bio'] ?? false): ?>
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
                <?php if ($currentUser && $currentUser['id'] != $user['id']): ?>
                    <div>
                        <button id="followBtn" 
                                class="px-4 py-2 rounded border <?php echo $isFollowing ? 'bg-gray-200 text-gray-600' : 'bg-blue-600 text-white'; ?>"
                                onclick="toggleFollow('<?php echo $user['id']; ?>')">
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
                        <div class="border rounded-lg p-4 mb-4">
                            <div class="flex items-center justify-between mb-2">
                                <div class="font-semibold">
                                    <a href="profile.php?user=<?php echo urlencode($post['user']['username']); ?>" 
                                       class="hover:text-blue-600">
                                        <?php echo htmlspecialchars($post['user']['firstName'] . ' ' . $post['user']['lastName']); ?>
                                    </a>
                                    <?php if ($post['user']['verified'] ?? false): ?>
                                        <img src="https://od.lk/s/NzhfNjc2MDk0NDRf/Premium%20Vector%20_%20Verification%20checkmark%20blue%20circle%20star%20vector%20Icon%20isolated%20on%20white%20background.jpg" 
                                             alt="verified" class="w-4 h-4 inline-block ml-1" />
                                    <?php endif; ?>
                                </div>
                                <div class="text-xs text-gray-500">
                                    <?php echo date('M j, Y g:i A', strtotime($post['createdAt'])); ?>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <div id="pview_<?php echo $post['id']; ?>" class="text-gray-800">
                                    <?php if ($post['isTruncated']): ?>
                                        <div id="preview_<?php echo $post['id']; ?>">
                                            <?php echo $post['previewHtml']; ?>
                                        </div>
                                        <div id="full_<?php echo $post['id']; ?>" class="hidden">
                                            <?php echo $post['textHtml']; ?>
                                        </div>
                                        <div class="mt-2">
                                            <button onclick="expandPost('<?php echo $post['id']; ?>')" 
                                                    class="text-blue-600 hover:text-blue-800 font-medium">
                                                Read more...
                                            </button>
                                        </div>
                                    <?php else: ?>
                                        <?php echo $post['textHtml']; ?>
                                    <?php endif; ?>
                                </div>
                            </div>
                            
                            <!-- Media -->
                            <?php if (!empty($post['media'])): ?>
                                <div class="mb-4">
                                    <?php 
                                    $media = is_string($post['media']) ? json_decode($post['media'], true) : $post['media'];
                                    if (is_array($media)): 
                                        foreach ($media as $mediaItem):
                                            if (is_array($mediaItem) && isset($mediaItem['kind'])): ?>
                                                <?php if ($mediaItem['kind'] === 'image'): ?>
                                                    <img src="<?php echo htmlspecialchars($mediaItem['url']); ?>" 
                                                         class="w-full rounded border" alt="Post image">
                                                <?php elseif ($mediaItem['kind'] === 'video'): ?>
                                                    <video controls class="w-full rounded border">
                                                        <source src="<?php echo htmlspecialchars($mediaItem['url']); ?>" type="video/mp4">
                                                        Your browser does not support the video tag.
                                                    </video>
                                                <?php endif; ?>
                                            <?php elseif (is_string($mediaItem)): ?>
                                                <img src="<?php echo htmlspecialchars($mediaItem); ?>" 
                                                     class="w-full rounded border" alt="Post image">
                                            <?php endif; ?>
                                        <?php endforeach; ?>
                                    <?php endif; ?>
                                </div>
                            <?php endif; ?>
                            
                            <?php if (!empty($post['videoUrl'])): ?>
                                <div class="mt-2">
                                    <?php if (strpos($post['videoUrl'], 'youtube.com') !== false || strpos($post['videoUrl'], 'youtu.be') !== false): ?>
                                        <?php
                                        $videoId = '';
                                        if (preg_match('/(?:youtu\.be\/|youtube\.com\/watch\?v=)([A-Za-z0-9_\-]+)/', $post['videoUrl'], $matches)) {
                                            $videoId = $matches[1];
                                        }
                                        ?>
                                        <?php if ($videoId): ?>
                                            <iframe class="w-full aspect-video" src="https://www.youtube.com/embed/<?php echo $videoId; ?>" frameborder="0" allowfullscreen></iframe>
                                        <?php endif; ?>
                                    <?php elseif (strpos($post['videoUrl'], 'vimeo.com') !== false): ?>
                                        <?php
                                        $videoId = '';
                                        if (preg_match('/vimeo\.com\/(\d+)/', $post['videoUrl'], $matches)) {
                                            $videoId = $matches[1];
                                        }
                                        ?>
                                        <?php if ($videoId): ?>
                                            <iframe class="w-full aspect-video" src="https://player.vimeo.com/video/<?php echo $videoId; ?>" frameborder="0" allowfullscreen></iframe>
                                        <?php endif; ?>
                                    <?php else: ?>
                                        <video class="w-full rounded border" src="<?php echo htmlspecialchars($post['videoUrl']); ?>" controls playsinline></video>
                                    <?php endif; ?>
                                </div>
                            <?php endif; ?>
                            
                            <!-- Post Actions -->
                            <div class="mt-3 flex items-center gap-4 text-sm text-gray-600">
                                <button onclick="toggleLike('<?php echo $post['id']; ?>')" 
                                        class="flex items-center space-x-2 hover:text-purple-600">
                                    <span><?php echo $post['likedByMe'] ? '👎' : '👍'; ?></span>
                                    <span><?php echo $post['likedByMe'] ? 'Dislike' : 'Like'; ?></span>
                                    <span class="text-sm">(<?php echo $post['likesCount']; ?>)</span>
                                </button>
                                
                                <button onclick="showComments('<?php echo $post['id']; ?>')" 
                                        class="flex items-center space-x-2 hover:text-purple-600">
                                    <span>💬</span>
                                    <span>Comment</span>
                                    <span class="text-sm">(<?php echo $post['commentsCount']; ?>)</span>
                                </button>
                                
                                <button onclick="sharePost('<?php echo $post['id']; ?>')" 
                                        class="flex items-center space-x-2 hover:text-purple-600">
                                    <span>🔗</span>
                                    <span>Share</span>
                                </button>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <!-- Include app.js for functionality -->
    <script src="assets/js/app.js"></script>
    
    <script>
        // Follow/Unfollow functionality
        function toggleFollow(userId) {
            if (!<?php echo $currentUser ? 'true' : 'false'; ?>) {
                alert('Please login to follow users');
                return;
            }

            const btn = document.getElementById('followBtn');
            const isFollowing = btn.textContent === 'Following';
            
            fetch('api/follow.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: isFollowing ? 'unfollow' : 'follow',
                    userId: userId
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    if (isFollowing) {
                        btn.textContent = 'Follow';
                        btn.className = 'px-4 py-2 rounded border bg-blue-600 text-white';
                    } else {
                        btn.textContent = 'Following';
                        btn.className = 'px-4 py-2 rounded border bg-gray-200 text-gray-600';
                    }
                    
                    // Update follower count
                    const followerCount = document.querySelector('.text-center:nth-child(2) .text-lg');
                    if (followerCount) {
                        const currentCount = parseInt(followerCount.textContent.replace(/,/g, ''));
                        followerCount.textContent = isFollowing ? 
                            (currentCount - 1).toLocaleString() : 
                            (currentCount + 1).toLocaleString();
                    }
                } else {
                    alert('Error: ' + (data.message || 'Failed to update follow status'));
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred');
            });
        }

        // Make mentions clickable
        document.addEventListener('DOMContentLoaded', function() {
            const mentions = document.querySelectorAll('.mention');
            mentions.forEach(mention => {
                mention.addEventListener('click', function(e) {
                    e.preventDefault();
                    const username = this.textContent.substring(1); // Remove @
                    window.location.href = 'profile.php?user=' + encodeURIComponent(username);
                });
            });
        });
    </script>
</body>
</html>