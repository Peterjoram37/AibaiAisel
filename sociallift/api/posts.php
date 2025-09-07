<?php
// api/posts.php - Simple JSON file based posts API
// Storage: api/data/posts.json

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$dataDir = __DIR__ . '/data';
$postsFile = $dataDir . '/posts.json';

if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0775, true);
}
if (!file_exists($postsFile)) {
    file_put_contents($postsFile, json_encode([], JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES));
}

function read_json($path) {
    $raw = @file_get_contents($path);
    if ($raw === false || $raw === '') return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function write_json($path, $data) {
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

function now_ts() { return date('Y-m-d H:i:s'); }

function next_id($prefix, $list, $key='id') {
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

function json_input() {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $d = json_decode($raw, true);
    return is_array($d) ? $d : [];
}

$action = $_GET['action'] ?? 'list';
$posts = read_json($postsFile);

// ensure optional counters/fields exist
foreach ($posts as &$p) {
    if (!isset($p['likes'])) $p['likes'] = 0;
    if (!isset($p['comments'])) $p['comments'] = 0;
    if (!isset($p['thread'])) $p['thread'] = [];
}
unset($p);

if ($action === 'list') {
    $userId = $_GET['userId'] ?? '';
    $out = $posts;
    if ($userId !== '') {
        $out = array_values(array_filter($out, function($p) use ($userId){ return (string)($p['userId'] ?? '') === (string)$userId; }));
    }
    usort($out, function($a,$b){ return strcmp($b['createdAt'] ?? '', $a['createdAt'] ?? ''); });
    echo json_encode([ 'success' => true, 'posts' => $out ]);
    exit;
}

if ($action === 'create') {
    $b = json_input();
    $text = trim((string)($b['text'] ?? ''));
    $media = is_array($b['media'] ?? null) ? $b['media'] : [];
    $videoUrl = trim((string)($b['videoUrl'] ?? ''));
    $groupId = $b['groupId'] ?? null;

    // In real app, read from session. Here fallback demo values.
    $userId = $_GET['userId'] ?? 'u_demo';
    $authorName = $_GET['authorName'] ?? 'Guest';

    $id = next_id('p', $posts);
    $now = now_ts();
    $post = [
        'id' => $id,
        'userId' => $userId,
        'authorName' => $authorName,
        'text' => $text,
        'media' => array_values($media),
        'videoUrl' => $videoUrl,
        'groupId' => $groupId,
        'visibility' => 'public',
        'awardedLikesBlocks' => 0,
        'awardedCommentsBlocks' => 0,
        'likes' => 0,
        'comments' => 0,
        'thread' => [],
        'createdAt' => $now,
        'updatedAt' => $now,
    ];
    $posts[] = $post;
    if (!write_json($postsFile, $posts)) {
        echo json_encode(['success'=>false, 'message'=>'Save failed']); exit;
    }
    echo json_encode(['success'=>true, 'post'=>$post]);
    exit;
}

if ($action === 'like') {
    $b = json_input();
    $postId = (string)($b['postId'] ?? '');
    foreach ($posts as &$p) {
        if ((string)($p['id'] ?? '') === $postId) {
            $p['likes'] = intval($p['likes'] ?? 0) + 1;
            $p['updatedAt'] = now_ts();
            if (!write_json($postsFile, $posts)) {
                echo json_encode(['success'=>false, 'message'=>'Save failed']); exit;
            }
            echo json_encode(['success'=>true, 'likes'=>$p['likes']]);
            exit;
        }
    }
    echo json_encode(['success'=>false, 'message'=>'Post not found']);
    exit;
}

if ($action === 'comments') {
    $postId = (string)($_GET['postId'] ?? '');
    foreach ($posts as $p) {
        if ((string)($p['id'] ?? '') === $postId) {
            $comments = array_values($p['thread'] ?? []);
            echo json_encode(['success'=>true, 'comments'=>$comments]);
            exit;
        }
    }
    echo json_encode(['success'=>true, 'comments'=>[]]);
    exit;
}

if ($action === 'comment') {
    $b = json_input();
    $postId = (string)($b['postId'] ?? '');
    $text = trim((string)($b['text'] ?? ''));
    // In real app derive from auth
    $userId = $_GET['userId'] ?? 'u_demo';
    $authorName = $_GET['authorName'] ?? 'Guest';
    foreach ($posts as &$p) {
        if ((string)($p['id'] ?? '') === $postId) {
            if (!isset($p['thread']) || !is_array($p['thread'])) $p['thread'] = [];
            $cid = next_id('c', $p['thread']);
            $c = [
                'id' => $cid,
                'userId' => $userId,
                'authorName' => $authorName,
                'text' => $text,
                'likes' => 0,
                'createdAt' => now_ts(),
                'replies' => []
            ];
            $p['thread'][] = $c;
            $p['comments'] = intval($p['comments'] ?? 0) + 1;
            $p['updatedAt'] = now_ts();
            if (!write_json($postsFile, $posts)) {
                echo json_encode(['success'=>false, 'message'=>'Save failed']); exit;
            }
            echo json_encode(['success'=>true, 'comment'=>$c]);
            exit;
        }
    }
    echo json_encode(['success'=>false, 'message'=>'Post not found']);
    exit;
}

if ($action === 'reply') {
    $b = json_input();
    $postId = (string)($b['postId'] ?? '');
    $commentId = (string)($b['commentId'] ?? '');
    $text = trim((string)($b['text'] ?? ''));
    $userId = $_GET['userId'] ?? 'u_demo';
    $authorName = $_GET['authorName'] ?? 'Guest';
    foreach ($posts as &$p) {
        if ((string)($p['id'] ?? '') === $postId) {
            if (!isset($p['thread']) || !is_array($p['thread'])) $p['thread'] = [];
            foreach ($p['thread'] as &$c) {
                if ((string)($c['id'] ?? '') === $commentId) {
                    if (!isset($c['replies']) || !is_array($c['replies'])) $c['replies'] = [];
                    $rid = next_id('r', $c['replies']);
                    $r = [
                        'id' => $rid,
                        'userId' => $userId,
                        'authorName' => $authorName,
                        'text' => $text,
                        'createdAt' => now_ts()
                    ];
                    $c['replies'][] = $r;
                    $p['comments'] = intval($p['comments'] ?? 0) + 1; // count replies in comments total
                    $p['updatedAt'] = now_ts();
                    if (!write_json($postsFile, $posts)) {
                        echo json_encode(['success'=>false, 'message'=>'Save failed']); exit;
                    }
                    echo json_encode(['success'=>true, 'reply'=>$r]);
                    exit;
                }
            }
        }
    }
    echo json_encode(['success'=>false, 'message'=>'Comment not found']);
    exit;
}

if ($action === 'comment_like') {
    $b = json_input();
    $postId = (string)($b['postId'] ?? '');
    $commentId = (string)($b['commentId'] ?? '');
    foreach ($posts as &$p) {
        if ((string)($p['id'] ?? '') === $postId) {
            foreach ($p['thread'] as &$c) {
                if ((string)($c['id'] ?? '') === $commentId) {
                    $c['likes'] = intval($c['likes'] ?? 0) + 1;
                    $p['updatedAt'] = now_ts();
                    if (!write_json($postsFile, $posts)) {
                        echo json_encode(['success'=>false, 'message'=>'Save failed']); exit;
                    }
                    echo json_encode(['success'=>true, 'likes'=>$c['likes']]);
                    exit;
                }
            }
        }
    }
    echo json_encode(['success'=>false, 'message'=>'Comment not found']);
    exit;
}

echo json_encode(['success'=>false, 'message'=>'Unknown action']);

