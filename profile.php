<?php
// profile.php
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
?>

<!DOCTYPE html>
<html lang="sw">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($user['firstName'] . ' ' . $user['lastName']); ?> - Profile - SocialLift</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    
    <!-- Favicon/SEO -->
    <link rel="icon" type="image/x-icon" href="/assets/favicon.ico" />
    <link rel="canonical" href="https://sociallift.great-site.net/profile.php?user=<?php echo urlencode($username); ?>" />
    <link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png"/>
    <link rel="manifest" href="/site.webmanifest"/>
    <meta name="theme-color" content="#0F172A"/>
    <meta name="robots" content="index,follow"/>
    <meta name="referrer" content="strict-origin-when-cross-origin"/>
    <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
    
    <!-- Open Graph -->
    <meta property="og:site_name" content="SocialLift"/>
    <meta property="og:url" content="https://sociallift.great-site.net/profile.php?user=<?php echo urlencode($username); ?>" />
    <meta property="og:type" content="profile"/>
    <meta property="og:title" content="<?php echo htmlspecialchars($user['firstName'] . ' ' . $user['lastName']); ?> - SocialLift"/>
    <meta property="og:description" content="<?php echo htmlspecialchars($user['bio'] ?? 'Check out my profile on SocialLift'); ?>"/>
    <meta property="og:image" content="<?php echo htmlspecialchars($user['avatar'] ?? 'https://sociallift.great-site.net/assets/og/cover.jpg'); ?>"/>
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:title" content="<?php echo htmlspecialchars($user['firstName'] . ' ' . $user['lastName']); ?> - SocialLift"/>
    <meta name="twitter:description" content="<?php echo htmlspecialchars($user['bio'] ?? 'Check out my profile on SocialLift'); ?>"/>
    <meta name="twitter:image" content="<?php echo htmlspecialchars($user['avatar'] ?? 'https://sociallift.great-site.net/assets/og/cover.jpg'); ?>"/>
    
    <!-- JSON-LD: Person -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": "<?php echo htmlspecialchars($user['firstName'] . ' ' . $user['lastName']); ?>",
        "url": "https://sociallift.great-site.net/profile.php?user=<?php echo urlencode($username); ?>",
        "image": "<?php echo htmlspecialchars($user['avatar'] ?? 'https://sociallift.great-site.net/assets/og/cover.jpg'); ?>",
        "description": "<?php echo htmlspecialchars($user['bio'] ?? 'SocialLift user'); ?>"
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
    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b">
        <div class="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="index.php" class="text-xl font-bold text-purple-600">SocialLift</a>
            <div class="flex items-center space-x-4">
                <?php if ($currentUser): ?>
                    <a href="index.php" class="text-gray-600 hover:text-gray-900">Home</a>
                    <a href="messenger.php" class="text-gray-600 hover:text-gray-900">Messages</a>
                    <div class="flex items-center space-x-2">
                        <img src="<?php echo htmlspecialchars($currentUser['avatar'] ?? '/assets/default-avatar.png'); ?>" 
                             alt="Avatar" class="w-8 h-8 rounded-full">
                        <span class="text-sm text-gray-600"><?php echo htmlspecialchars($currentUser['firstName']); ?></span>
                    </div>
                <?php else: ?>
                    <a href="auth.php" class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">Login</a>
                <?php endif; ?>
            </div>
        </div>
    </nav>

    <div class="max-w-4xl mx-auto px-4 py-6">
        <!-- Profile Header -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div class="flex items-start space-x-6">
                <!-- Avatar -->
                <img src="<?php echo htmlspecialchars($user['avatar'] ?? '/assets/default-avatar.png'); ?>" 
                     alt="<?php echo htmlspecialchars($user['firstName'] . ' ' . $user['lastName']); ?>" 
                     class="w-24 h-24 rounded-full object-cover">
                
                <!-- User Info -->
                <div class="flex-1">
                    <h1 class="text-2xl font-bold text-gray-900">
                        <?php echo htmlspecialchars($user['firstName'] . ' ' . $user['lastName']); ?>
                    </h1>
                    <p class="text-gray-600 mb-2">@<?php echo htmlspecialchars($user['username']); ?></p>
                    
                    <?php if (!empty($user['location'])): ?>
                        <p class="text-gray-600 mb-2">📍 <?php echo htmlspecialchars($user['location']); ?></p>
                    <?php endif; ?>
                    
                    <?php if (!empty($user['bio'])): ?>
                        <p class="text-gray-700 mb-4"><?php echo htmlspecialchars($user['bio']); ?></p>
                    <?php endif; ?>
                    
                    <!-- Stats -->
                    <div class="flex space-x-6 mb-4">
                        <div class="text-center">
                            <div class="text-xl font-bold text-gray-900"><?php echo $stats['posts']; ?></div>
                            <div class="text-sm text-gray-600">Posts</div>
                        </div>
                        <div class="text-center">
                            <div class="text-xl font-bold text-gray-900"><?php echo $stats['followers']; ?></div>
                            <div class="text-sm text-gray-600">Followers</div>
                        </div>
                        <div class="text-center">
                            <div class="text-xl font-bold text-gray-900"><?php echo $stats['following']; ?></div>
                            <div class="text-sm text-gray-600">Following</div>
                        </div>
                    </div>
                    
                    <!-- Follow Button -->
                    <?php if ($currentUser && $currentUser['id'] !== $user['id']): ?>
                        <button id="followBtn" 
                                onclick="toggleFollow('<?php echo $user['id']; ?>')"
                                class="<?php echo $isFollowing ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-purple-600 text-white hover:bg-purple-700'; ?> px-6 py-2 rounded-lg font-medium transition-colors">
                            <?php echo $isFollowing ? 'Following' : 'Follow'; ?>
                        </button>
                    <?php endif; ?>
                </div>
            </div>
        </div>

        <!-- Posts Section -->
        <div class="bg-white rounded-lg shadow-sm">
            <div class="p-6 border-b">
                <h2 class="text-xl font-bold text-gray-900">Posts</h2>
            </div>
            
            <div id="postsContainer" class="divide-y">
                <?php if (empty($posts)): ?>
                    <div class="p-6 text-center text-gray-500">
                        <p>No posts yet.</p>
                    </div>
                <?php else: ?>
                    <?php foreach ($posts as $post): ?>
                        <div class="p-6">
                            <!-- Post Header -->
                            <div class="flex items-center space-x-3 mb-4">
                                <img src="<?php echo htmlspecialchars($post['user']['avatar'] ?? '/assets/default-avatar.png'); ?>" 
                                     alt="<?php echo htmlspecialchars($post['user']['firstName'] . ' ' . $post['user']['lastName']); ?>" 
                                     class="w-10 h-10 rounded-full object-cover">
                                <div>
                                    <h3 class="font-semibold text-gray-900">
                                        <a href="profile.php?user=<?php echo urlencode($post['user']['username']); ?>" 
                                           class="hover:text-purple-600">
                                            <?php echo htmlspecialchars($post['user']['firstName'] . ' ' . $post['user']['lastName']); ?>
                                        </a>
                                    </h3>
                                    <p class="text-sm text-gray-600">@<?php echo htmlspecialchars($post['user']['username']); ?></p>
                                </div>
                                <div class="ml-auto text-sm text-gray-500">
                                    <?php echo date('M j, Y', strtotime($post['createdAt'])); ?>
                                </div>
                            </div>

                            <!-- Post Content -->
                            <div class="mb-4">
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
                                                    class="text-purple-600 hover:text-purple-800 font-medium">
                                                Read more...
                                            </button>
                                        </div>
                                    <?php else: ?>
                                        <?php echo $post['textHtml']; ?>
                                    <?php endif; ?>
                                </div>
                            </div>

                            <!-- Post Media -->
                            <?php if (!empty($post['media'])): ?>
                                <div class="mb-4">
                                    <?php foreach ($post['media'] as $media): ?>
                                        <?php if ($media['kind'] === 'image'): ?>
                                            <img src="<?php echo htmlspecialchars($media['url']); ?>" 
                                                 alt="Post image" 
                                                 class="max-w-full h-auto rounded-lg">
                                        <?php elseif ($media['kind'] === 'video'): ?>
                                            <video controls class="max-w-full h-auto rounded-lg">
                                                <source src="<?php echo htmlspecialchars($media['url']); ?>" type="video/mp4">
                                                Your browser does not support the video tag.
                                            </video>
                                        <?php endif; ?>
                                    <?php endforeach; ?>
                                </div>
                            <?php endif; ?>

                            <!-- Post Actions -->
                            <div class="flex items-center space-x-6 text-gray-600">
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
                        btn.className = 'bg-purple-600 text-white hover:bg-purple-700 px-6 py-2 rounded-lg font-medium transition-colors';
                    } else {
                        btn.textContent = 'Following';
                        btn.className = 'bg-gray-200 text-gray-700 hover:bg-gray-300 px-6 py-2 rounded-lg font-medium transition-colors';
                    }
                    
                    // Update follower count
                    const followerCount = document.querySelector('.text-center:nth-child(2) .text-xl');
                    if (followerCount) {
                        const currentCount = parseInt(followerCount.textContent);
                        followerCount.textContent = isFollowing ? currentCount - 1 : currentCount + 1;
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