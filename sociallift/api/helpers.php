<?php
// api/helpers.php - JSON storage helpers for SocialLift

function sl_data_dir(): string {
    $dir = __DIR__ . '/data';
    if (!is_dir($dir)) @mkdir($dir, 0775, true);
    return $dir;
}

function sl_path(string $filename): string {
    return sl_data_dir() . '/' . $filename;
}

function sl_read_json(string $path): array {
    if (!file_exists($path)) return [];
    $raw = @file_get_contents($path);
    if ($raw === false || $raw === '') return [];
    $d = json_decode($raw, true);
    return is_array($d) ? $d : [];
}

function sl_write_json(string $path, array $data): bool {
    $fp = fopen($path, 'c+');
    if (!$fp) return false;
    flock($fp, LOCK_EX);
    ftruncate($fp, 0);
    fwrite($fp, json_encode($data, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    return true;
}

function sl_now(): string { return date('Y-m-d H:i:s'); }

function sl_next_id(string $prefix, array $list, string $key='id'): string {
    $max = 0;
    foreach ($list as $it) {
        if (!isset($it[$key])) continue;
        if (preg_match('/^' . preg_quote($prefix,'/') . '_(\d{4,})$/', (string)$it[$key], $m)) {
            $n = intval($m[1]);
            if ($n > $max) $max = $n;
        }
    }
    return sprintf('%s_%04d', $prefix, $max + 1);
}

// Users
function load_users(): array {
    $path = sl_path('users.json');
    $users = sl_read_json($path);
    // normalize
    foreach ($users as &$u) {
        if (!isset($u['status'])) $u['status'] = 'active';
        if (!isset($u['verified'])) $u['verified'] = false;
    }
    unset($u);
    return $users;
}

function save_users(array $users): bool { return sl_write_json(sl_path('users.json'), $users); }

// Posts
function load_posts(): array { return sl_read_json(sl_path('posts.json')); }
function save_posts(array $posts): bool { return sl_write_json(sl_path('posts.json'), $posts); }

// Notifications
function load_notifications(): array { return sl_read_json(sl_path('notifications.json')); }
function save_notifications(array $list): bool { return sl_write_json(sl_path('notifications.json'), $list); }

function append_warning(string $userId, string $text, string $type='warning'): bool {
    $list = load_notifications();
    $id = sl_next_id('n', $list);
    $list[] = [
        'id' => $id,
        'userId' => $userId,
        'type' => $type,
        'text' => $text,
        'read' => false,
        'createdAt' => sl_now()
    ];
    return save_notifications($list);
}

