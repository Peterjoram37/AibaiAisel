<?php
// api/helpers.php
session_start();

function root_dir() { return dirname(__DIR__); }
function data_dir() { return root_dir() . '/data'; }
function uploads_dir() { return root_dir() . '/uploads'; }

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
        if (isset($row[$key]) && preg_match('/\d+$/', $row[$key], $m)) {
            $n = intval($m[0]);
            if ($n > $max) $max = $n;
        }
    }
    return sprintf('%s_%04d', $prefix, $max + 1);
}

function users_path() { return data_dir() . '/users.json'; }
function posts_path() { return data_dir() . '/posts.json'; }
function comments_path() { return data_dir() . '/comments.json'; }
function likes_path() { return data_dir() . '/likes.json'; }
function reports_path() { return data_dir() . '/reports.json'; }

function follows_path() { return data_dir() . '/follows.json'; }
function dm_threads_path() { return data_dir() . '/dm_threads.json'; }
function dms_path() { return data_dir() . '/dms.json'; }

function notifications_path() { return data_dir() . '/notifications.json'; }
function wallets_path() { return data_dir() . '/wallets.json'; }
function coin_ledger_path() { return data_dir() . '/coin_ledger.json'; }
function payouts_path() { return data_dir() . '/payouts.json'; }

function groups_path() { return data_dir() . '/groups.json'; }
function group_members_path() { return data_dir() . '/group_members.json'; }

function load_users() { return read_json(users_path()); }
function save_users($users) { return write_json(users_path(), $users); }
function load_posts() { return read_json(posts_path()); }
function save_posts($posts) { return write_json(posts_path(), $posts); }
function load_comments() { return read_json(comments_path()); }
function save_comments($comments) { return write_json(comments_path(), $comments); }
function load_likes() { return read_json(likes_path()); }
function save_likes($likes) { return write_json(likes_path(), $likes); }

function load_follows() { return read_json(follows_path()); }
function save_follows($rows) { return write_json(follows_path(), $rows); }

function load_dm_threads() { return read_json(dm_threads_path()); }
function save_dm_threads($rows) { return write_json(dm_threads_path(), $rows); }
function load_dms() { return read_json(dms_path()); }
function save_dms($rows) { return write_json(dms_path(), $rows); }

function load_notifications() { return read_json(notifications_path()); }
function save_notifications($rows) { return write_json(notifications_path(), $rows); }

function load_wallets() { return read_json(wallets_path()); }
function save_wallets($rows) { return write_json(wallets_path(), $rows); }
function load_coin_ledger() { return read_json(coin_ledger_path()); }
function save_coin_ledger($rows) { return write_json(coin_ledger_path(), $rows); }
function load_payouts() { return read_json(payouts_path()); }
function save_payouts($rows) { return write_json(payouts_path(), $rows); }

function load_groups() { return read_json(groups_path()); }
function save_groups($rows) { return write_json(groups_path(), $rows); }
function load_group_members() { return read_json(group_members_path()); }
function save_group_members($rows) { return write_json(group_members_path(), $rows); }

function find_user_by_email_or_username($list, $login) {
    foreach ($list as $u) {
        if (strcasecmp($u['email'] ?? '', $login) === 0 || strcasecmp($u['username'] ?? '', $login) === 0) {
            return $u;
        }
    }
    return null;
}
function get_user_by_id($list, $userId) {
    foreach ($list as $u) if (($u['id'] ?? '') === $userId) return $u;
    return null;
}
function current_user() {
    if (!empty($_SESSION['user_id'])) {
        $users = load_users();
        return get_user_by_id($users, $_SESSION['user_id']);
    }
    return null;
}
function require_login_json() {
    $u = current_user();
    if (!$u || ($u['status'] ?? 'active') !== 'active') {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit;
    }
    return $u;
}

// Notifications helper
function add_notification($userId, $type, $refId, $text) {
    $rows = load_notifications();
    $id = next_id('n', $rows);
    $rows[] = [
        'id' => $id,
        'userId' => $userId,
        'type' => $type,
        'refId' => $refId,
        'text' => $text,
        'read' => false,
        'createdAt' => date('Y-m-d H:i:s')
    ];
    save_notifications($rows);
    return $id;
}

// Compatibility wrapper for admin warnings
function append_warning($userId, $text, $type='warning') {
    add_notification($userId, $type, '', $text);
    return true;
}

// Wallet helper
function get_wallet(&$wallets, $userId) {
    foreach ($wallets as &$w) if (($w['userId']??'') === $userId) return $w;
    $w = ['userId'=>$userId,'coins'=>0,'updatedAt'=>date('Y-m-d H:i:s')];
    $wallets[] = $w;
    return $wallets[array_key_last($wallets)];
}
