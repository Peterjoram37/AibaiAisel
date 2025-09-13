<?php
// api/helpers.php
session_start();

function root_dir() {
    return dirname(__DIR__);
}

function data_dir() {
    return root_dir() . '/data';
}

function uploads_dir() {
    return root_dir() . '/uploads';
}

function read_json($path) {
    if (!file_exists($path)) return [];
    $h = fopen($path, 'r');
    if (!$h) return [];
    flock($h, LOCK_SH);
    $content = stream_get_contents($h);
    flock($h, LOCK_UN);
    fclose($h);
    $data = json_decode($content, true);
    return is_array($data) ? $data : [];
}

function write_json($path, $data) {
    $dir = dirname($path);
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    $tmp = $path . '.tmp';
    $json = json_encode($data, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES);
    $h = fopen($tmp, 'w');
    if (!$h) return false;
    flock($h, LOCK_EX);
    fwrite($h, $json);
    fflush($h);
    flock($h, LOCK_UN);
    fclose($h);
    return rename($tmp, $path);
}

function next_id($prefix, $existing, $key = 'id') {
    $max = 0;
    foreach ($existing as $row) {
        if (isset($row[$key]) && preg_match('/\d+$/', (string)$row[$key], $m)) {
            $n = intval($m[0]);
            if ($n > $max) $max = $n;
        }
    }
    return sprintf('%s_%04d', $prefix, $max + 1);
}

function users_path() {
    return data_dir() . '/users.json';
}

function posts_path() {
    return data_dir() . '/posts.json';
}

function comments_path() {
    return data_dir() . '/comments.json';
}

function likes_path() {
    return data_dir() . '/likes.json';
}

function reports_path() {
    return data_dir() . '/reports.json';
}

function follows_path() {
    return data_dir() . '/follows.json';
}

function dm_threads_path() {
    return data_dir() . '/dm_threads.json';
}

function dms_path() {
    return data_dir() . '/dms.json';
}

function notifications_path() {
    return data_dir() . '/notifications.json';
}

function wallets_path() {
    return data_dir() . '/wallets.json';
}

function coin_ledger_path() {
    return data_dir() . '/coin_ledger.json';
}

function payouts_path() {
    return data_dir() . '/payouts.json';
}

function groups_path() {
    return data_dir() . '/groups.json';
}

function group_members_path() {
    return data_dir() . '/group_members.json';
}

function calls_path() {
    return data_dir() . '/calls.json';
}

function load_users() {
    return read_json(users_path());
}

function save_users($users) {
    return write_json(users_path(), $users);
}

function load_posts() {
    return read_json(posts_path());
}

function save_posts($posts) {
    return write_json(posts_path(), $posts);
}

function load_comments() {
    return read_json(comments_path());
}

function save_comments($comments) {
    return write_json(comments_path(), $comments);
}

function load_likes() {
    return read_json(likes_path());
}

function save_likes($likes) {
    return write_json(likes_path(), $likes);
}

function load_follows() {
    return read_json(follows_path());
}

function save_follows($rows) {
    return write_json(follows_path(), $rows);
}

function load_dm_threads() {
    return read_json(dm_threads_path());
}

function save_dm_threads($rows) {
    return write_json(dm_threads_path(), $rows);
}

function load_dms() {
    return read_json(dms_path());
}

function save_dms($rows) {
    return write_json(dms_path(), $rows);
}

function load_notifications() {
    return read_json(notifications_path());
}

function save_notifications($rows) {
    return write_json(notifications_path(), $rows);
}

function load_wallets() {
    return read_json(wallets_path());
}

function save_wallets($rows) {
    return write_json(wallets_path(), $rows);
}

function load_coin_ledger() {
    return read_json(coin_ledger_path());
}

function save_coin_ledger($rows) {
    return write_json(coin_ledger_path(), $rows);
}

function load_payouts() {
    return read_json(payouts_path());
}

function save_payouts($rows) {
    return write_json(payouts_path(), $rows);
}

function load_groups() {
    return read_json(groups_path());
}

function save_groups($rows) {
    return write_json(groups_path(), $rows);
}

function load_group_members() {
    return read_json(group_members_path());
}

function save_group_members($rows) {
    return write_json(group_members_path(), $rows);
}

function load_calls() {
    return read_json(calls_path());
}

function save_calls($rows) {
    return write_json(calls_path(), $rows);
}

// User functions
function current_user() {
    if (!isset($_SESSION['user_id'])) return null;
    
    $users = load_users();
    foreach ($users as $user) {
        if ($user['id'] === $_SESSION['user_id']) {
            return $user;
        }
    }
    return null;
}

function get_user_by_id($id) {
    $users = load_users();
    foreach ($users as $user) {
        if ($user['id'] === $id) {
            return $user;
        }
    }
    return null;
}

function get_user_by_username($username) {
    $users = load_users();
    foreach ($users as $user) {
        if ($user['username'] === $username) {
            return $user;
        }
    }
    return null;
}

function get_user_by_email($email) {
    $users = load_users();
    foreach ($users as $user) {
        if ($user['email'] === $email) {
            return $user;
        }
    }
    return null;
}

// Post functions
function get_user_posts($userId) {
    $posts = load_posts();
    $users = load_users();
    $likes = load_likes();
    $comments = load_comments();
    
    $userPosts = [];
    foreach ($posts as $post) {
        if ($post['userId'] === $userId) {
            // Add user info
            $user = get_user_by_id($post['userId']);
            $post['user'] = $user;
            
            // Add likes count
            $post['likesCount'] = 0;
            foreach ($likes as $like) {
                if ($like['postId'] === $post['id']) {
                    $post['likesCount']++;
                }
            }
            
            // Add comments count
            $post['commentsCount'] = 0;
            foreach ($comments as $comment) {
                if ($comment['postId'] === $post['id']) {
                    $post['commentsCount']++;
                }
            }
            
            // Check if current user liked this post
            $currentUser = current_user();
            $post['likedByMe'] = false;
            if ($currentUser) {
                foreach ($likes as $like) {
                    if ($like['postId'] === $post['id'] && $like['userId'] === $currentUser['id']) {
                        $post['likedByMe'] = true;
                        break;
                    }
                }
            }
            
            $userPosts[] = $post;
        }
    }
    
    // Sort by creation date (newest first)
    usort($userPosts, function($a, $b) {
        return strtotime($b['createdAt']) - strtotime($a['createdAt']);
    });
    
    return $userPosts;
}

// Stats functions
function get_user_stats($userId) {
    $posts = load_posts();
    $follows = load_follows();
    
    $stats = [
        'posts' => 0,
        'followers' => 0,
        'following' => 0
    ];
    
    // Count posts
    foreach ($posts as $post) {
        if ($post['userId'] === $userId) {
            $stats['posts']++;
        }
    }
    
    // Count followers and following
    foreach ($follows as $follow) {
        if ($follow['followingId'] === $userId) {
            $stats['followers']++;
        }
        if ($follow['followerId'] === $userId) {
            $stats['following']++;
        }
    }
    
    return $stats;
}

// Follow functions
function is_following($followerId, $followingId) {
    $follows = load_follows();
    foreach ($follows as $follow) {
        if ($follow['followerId'] === $followerId && $follow['followingId'] === $followingId) {
            return true;
        }
    }
    return false;
}

function follow_user($followerId, $followingId) {
    $follows = load_follows();
    
    // Check if already following
    if (is_following($followerId, $followingId)) {
        return false;
    }
    
    $follows[] = [
        'id' => next_id('follow', $follows),
        'followerId' => $followerId,
        'followingId' => $followingId,
        'createdAt' => date('Y-m-d H:i:s')
    ];
    
    return save_follows($follows);
}

function unfollow_user($followerId, $followingId) {
    $follows = load_follows();
    
    foreach ($follows as $key => $follow) {
        if ($follow['followerId'] === $followerId && $follow['followingId'] === $followingId) {
            unset($follows[$key]);
            return save_follows(array_values($follows));
        }
    }
    
    return false;
}

// Text processing functions
function escape_html($text) {
    return htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
}

function mb_strlen_safe($text) {
    if (function_exists('mb_strlen')) {
        return mb_strlen($text, 'UTF-8');
    }
    return strlen($text);
}

function mb_substr_safe($text, $start, $length) {
    if (function_exists('mb_substr')) {
        return mb_substr($text, $start, $length, 'UTF-8');
    }
    return substr($text, $start, $length);
}

function truncate_plain_text($text, $maxLength = 200) {
    $text = strip_tags($text);
    if (mb_strlen_safe($text) <= $maxLength) {
        return $text;
    }
    return mb_substr_safe($text, 0, $maxLength) . '...';
}

function build_post_preview($text, $maxLength = 200) {
    $text = escape_html($text);
    if (mb_strlen_safe($text) <= $maxLength) {
        return $text;
    }
    return mb_substr_safe($text, 0, $maxLength) . '...';
}

function linkify_and_mentions($text) {
    $text = escape_html($text);
    
    // Linkify URLs
    $text = preg_replace(
        '/(https?:\/\/[^\s]+)/',
        '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>',
        $text
    );
    
    // Linkify @mentions
    $text = preg_replace(
        '/@(\w+)/',
        '<a href="profile.php?user=$1" class="text-blue-600 hover:underline mention">@$1</a>',
        $text
    );
    
    return $text;
}

// Media functions
function render_media($media) {
    if (empty($media)) return '';
    
    $html = '';
    foreach ($media as $item) {
        if ($item['kind'] === 'image') {
            $html .= '<img src="' . escape_html($item['url']) . '" class="max-w-full h-auto rounded-lg" alt="Post image">';
        } elseif ($item['kind'] === 'video') {
            $html .= '<video controls class="max-w-full h-auto rounded-lg"><source src="' . escape_html($item['url']) . '" type="video/mp4">Your browser does not support the video tag.</video>';
        }
    }
    return $html;
}

// Utility functions
function format_time($timestamp) {
    $time = time() - strtotime($timestamp);
    
    if ($time < 60) return 'just now';
    if ($time < 3600) return floor($time / 60) . 'm ago';
    if ($time < 86400) return floor($time / 3600) . 'h ago';
    if ($time < 2592000) return floor($time / 86400) . 'd ago';
    
    return date('M j, Y', strtotime($timestamp));
}

function verified_icon($verified = false) {
    if (!$verified) return '';
    return '<img src="https://od.lk/s/NzhfNjc2MDk0NDRf/Premium%20Vector%20_%20Verification%20checkmark%20blue%20circle%20star%20vector%20Icon%20isolated%20on%20white%20background.jpg" alt="verified" class="w-4 h-4 inline-block ml-1" />';
}