import json
import os
import ssl
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(ROOT, 'data', 'content.json')
SETTINGS_FILE = os.path.join(ROOT, 'data', 'settings.json')
STATS_CACHE_FILE = os.path.join(ROOT, 'data', 'youtube-stats-cache.json')

MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
}


def read_items():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r', encoding='utf-8') as handle:
        return json.load(handle)


def write_items(items):
    with open(DATA_FILE, 'w', encoding='utf-8') as handle:
        json.dump(items, handle, indent=2)
        handle.write('\n')


def read_settings():
    if not os.path.exists(SETTINGS_FILE):
        return {}
    with open(SETTINGS_FILE, 'r', encoding='utf-8') as handle:
        return json.load(handle)


def write_settings(settings):
    with open(SETTINGS_FILE, 'w', encoding='utf-8') as handle:
        json.dump(settings, handle, indent=2)
        handle.write('\n')


def read_stats_cache():
    if not os.path.exists(STATS_CACHE_FILE):
        return {}
    with open(STATS_CACHE_FILE, 'r', encoding='utf-8') as handle:
        return json.load(handle)


def write_stats_cache(cache):
    with open(STATS_CACHE_FILE, 'w', encoding='utf-8') as handle:
        json.dump(cache, handle, indent=2)
        handle.write('\n')


def slugify(value):
    value = value.strip().lower()
    cleaned = ''.join(ch if ch.isalnum() else '-' for ch in value)
    cleaned = cleaned.strip('-')
    return cleaned or 'video'


def slugify_underscore(value):
    value = str(value or '').strip().lower()
    cleaned = ''.join(ch if ch.isalnum() else '_' for ch in value)
    cleaned = cleaned.strip('_')
    return cleaned or 'video'


def sort_items(items):
    return sorted(items, key=lambda item: get_publish_time(item.get('published')) or 0, reverse=True)


SPECIAL_SLUG_PLAYLISTS = {
    'ride pov': {'suffix': '_ride_pov', 'fallback': 'ride_pov'},
    'fireworks and shows': {'suffix': '_fs', 'fallback': 'fireworks_and_shows_fs'},
}


def build_slug_from_payload(payload, fallback_title=''):
    playlist = (payload.get('playlist') or '').strip()
    special_slug_config = SPECIAL_SLUG_PLAYLISTS.get(playlist.lower())
    if special_slug_config:
        title = (payload.get('title') or fallback_title or '').strip()
        title_slug = slugify_underscore(title)
        return f"{title_slug}{special_slug_config['suffix']}" if title_slug else special_slug_config['fallback']

    episode = str(payload.get('episode') or '').strip()
    parts = []
    if playlist:
        parts.append(slugify(playlist))
    if episode:
        parts.append(f"part-{slugify(episode)}")
    if parts:
        return '-'.join(parts)
    return 'video'


def ensure_unique_special_slug(items, base_slug, fallback_slug='video', current_video_id=None):
    base = str(base_slug or '').strip().lower() or str(fallback_slug or 'video').strip().lower() or 'video'
    existing_slugs = {
        str(item.get('slug') or '').strip().lower()
        for item in items
        if str(item.get('slug') or '').strip()
        and (current_video_id is None or item.get('id') != current_video_id)
    }

    if base not in existing_slugs:
        return base

    suffix = 2
    while f"{base}_{suffix}" in existing_slugs:
        suffix += 1
    return f"{base}_{suffix}"


def normalize_list_value(value):
    if value is None:
        return None
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    return [item.strip() for item in str(value).split(',') if item.strip()]


def normalize_text_value(value):
    if value is None:
        return None
    if isinstance(value, list):
        for item in value:
            text = str(item).strip()
            if text:
                return text
        return ''
    return str(value).strip()


def get_publish_time(value):
    if not value:
        return None
    if isinstance(value, (int, float)):
        return int(value)
    try:
        parsed = datetime.fromisoformat(str(value))
    except ValueError:
        try:
            parsed = datetime.strptime(str(value), '%Y-%m-%d')
        except ValueError:
            return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return int(parsed.timestamp() * 1000)


def is_publicly_visible(video):
    published = video.get('published')
    if not published:
        return True
    publish_time = get_publish_time(published)
    if publish_time is None:
        return True
    now = int(datetime.now(timezone.utc).timestamp() * 1000)
    return now >= publish_time + (11 * 60 * 60 * 1000)


def normalize_video_id(value):
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return int(value)
    if isinstance(value, str):
        stripped = value.strip()
        if stripped.isdigit():
            return int(stripped)
    return value


def find_existing_video(items, video_id, youtube_id):
    if video_id is not None:
        for index, item in enumerate(items):
            if item.get('id') == video_id:
                return index, item

    if youtube_id:
        matches = [
            (index, item)
            for index, item in enumerate(items)
            if str(item.get('youtubeId') or '').strip() == youtube_id
        ]
        if len(matches) == 1:
            return matches[0]

    return None, None


class AdminHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path in ('/api/videos', '/api/videos/'):
            items = sort_items(read_items())
            if parsed.query and 'mode=all' in parsed.query:
                self.send_json(200, items)
                return
            visible_items = [item for item in items if is_publicly_visible(item)]
            self.send_json(200, visible_items)
            return

        if path in ('/api/content', '/api/content/'):
            items = sort_items(read_items())
            visible_items = [item for item in items if is_publicly_visible(item)]
            self.send_json(200, visible_items)
            return

        if path in ('/data/content.json', '/data/content.json/'):
            items = sort_items(read_items())
            visible_items = [item for item in items if is_publicly_visible(item)]
            self.send_json(200, visible_items)
            return

        if path in ('/api/settings', '/api/settings/'):
            if self.command == 'GET':
                self.send_json(200, read_settings())
            else:
                self.handle_settings_post()
            return

        if path == '/api/youtube-stats':
            self.handle_youtube_stats(parsed)
            return

        if path == '/api/youtube-channel':
            self.handle_youtube_channel(parsed)
            return

        if path in ('/admin', '/admin/'):
            self.serve_file('admin.html')
            return

        if path == '/':
            self.serve_file('index.html')
            return

        # For all other paths, try to serve as a file first, then fall back to index.html for SPA routing
        requested = path.lstrip('/')
        safe_path = requested.replace('..', '')
        full_path = os.path.join(ROOT, safe_path)
        
        # If it's a real file that exists, serve it
        if os.path.exists(full_path) and os.path.isfile(full_path):
            self.serve_file(requested)
            return
        
        # Otherwise, for SPA routing, serve index.html
        self.serve_file('index.html')

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == '/api/settings':
            self.handle_settings_post()
            return

        if parsed.path == '/api/videos/duplicate':
            self.handle_duplicate_video()
            return

        if parsed.path != '/api/videos':
            self.send_json(404, {'error': 'Not found'})
            return

        content_length = int(self.headers.get('Content-Length', '0'))
        body = self.rfile.read(content_length).decode('utf-8') if content_length else '{}'

        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            self.send_json(400, {'error': 'Invalid JSON body'})
            return

        title = (payload.get('title') or '').strip()
        youtube_id = (payload.get('youtubeId') or '').strip()
        if not title or not youtube_id:
            self.send_json(400, {'error': 'Title and YouTube ID are required.'})
            return

        items = read_items()
        slug_value = (payload.get('slug') or '').strip()
        video_id = normalize_video_id(payload.get('id'))
        index, existing = find_existing_video(items, video_id, youtube_id)
        if index is not None:
            type_values = normalize_list_value(payload.get('type'))
            if type_values is None:
                type_values = normalize_list_value(existing.get('type')) or []

            playlist_value = (payload.get('playlist') or existing.get('playlist') or '').strip()
            episode_value = (payload.get('episode') or existing.get('episode') or '').strip()
            if playlist_value.lower() in SPECIAL_SLUG_PLAYLISTS:
                episode_value = ''

            hotel_brand_values = normalize_list_value(payload.get('hotelBrand'))
            if hotel_brand_values is None:
                hotel_brand_values = normalize_list_value(existing.get('hotelBrand')) or []

            travel_brand_values = normalize_list_value(payload.get('travelBrand'))
            if travel_brand_values is None:
                travel_brand_values = normalize_list_value(existing.get('travelBrand')) or []

            brand_value = normalize_text_value(payload.get('brand'))
            if brand_value is None:
                brand_value = normalize_text_value(existing.get('brand')) or ''

            ship_name_value = normalize_text_value(payload.get('shipName'))
            if ship_name_value is None:
                ship_name_value = normalize_text_value(existing.get('shipName')) or ''

            park_name_values = normalize_list_value(payload.get('parkName'))
            if park_name_values is None:
                park_name_values = normalize_list_value(existing.get('parkName')) or []

            next_slug = slug_value or build_slug_from_payload({**existing, **payload})
            if playlist_value.lower() in SPECIAL_SLUG_PLAYLISTS:
                fallback_slug = SPECIAL_SLUG_PLAYLISTS[playlist_value.lower()]['fallback']
                next_slug = ensure_unique_special_slug(items, next_slug, fallback_slug=fallback_slug, current_video_id=existing.get('id'))

            items[index] = {
                **existing,
                'title': title,
                'slug': next_slug,
                'youtubeId': youtube_id,
                'published': payload.get('published') or existing.get('published') or __import__('datetime').datetime.utcnow().strftime('%Y-%m-%d'),
                'featured': bool(payload.get('featured')),
                'playlist': playlist_value,
                'episode': episode_value,
                'summary': (payload.get('summary') or existing.get('summary') or '').strip(),
                'thumbnail': (payload.get('thumbnail') or existing.get('thumbnail') or '').strip(),
                'type': type_values,
                'brand': brand_value,
                'shipName': ship_name_value,
                'parkName': park_name_values,
                'hotelBrand': hotel_brand_values,
                'travelBrand': travel_brand_values,
                'series': (payload.get('series') or existing.get('series') or '').strip(),
                'location': [item.strip() for item in str(payload.get('location') or existing.get('location') or '').split(',') if item.strip()],
                'tags': [item.strip() for item in str(payload.get('tags') or existing.get('tags') or '').split(',') if item.strip()],
            }
            items[index].pop('category', None)
            write_items(items)
            self.send_json(200, {'ok': True, 'video': items[index]})
            return

        type_values = normalize_list_value(payload.get('type')) or []
        hotel_brand_values = normalize_list_value(payload.get('hotelBrand')) or []
        travel_brand_values = normalize_list_value(payload.get('travelBrand')) or []
        brand_value = normalize_text_value(payload.get('brand')) or ''
        ship_name_value = normalize_text_value(payload.get('shipName')) or ''
        park_name_values = normalize_list_value(payload.get('parkName')) or []
        playlist_value = (payload.get('playlist') or '').strip()
        episode_value = (payload.get('episode') or '').strip()
        if playlist_value.lower() in SPECIAL_SLUG_PLAYLISTS:
            episode_value = ''

        next_slug = slug_value or build_slug_from_payload(payload)
        if playlist_value.lower() in SPECIAL_SLUG_PLAYLISTS:
            fallback_slug = SPECIAL_SLUG_PLAYLISTS[playlist_value.lower()]['fallback']
            next_slug = ensure_unique_special_slug(items, next_slug, fallback_slug=fallback_slug)

        video = {
            'id': int(__import__('time').time() * 1000),
            'contentType': 'video',
            'title': title,
            'slug': next_slug,
            'youtubeId': youtube_id,
            'published': payload.get('published') or __import__('datetime').datetime.utcnow().strftime('%Y-%m-%d'),
            'featured': bool(payload.get('featured')),
            'playlist': playlist_value,
            'episode': episode_value,
            'summary': (payload.get('summary') or '').strip(),
            'thumbnail': (payload.get('thumbnail') or '').strip(),
            'type': type_values,
            'brand': brand_value,
            'shipName': ship_name_value,
            'parkName': park_name_values,
            'hotelBrand': hotel_brand_values,
            'travelBrand': travel_brand_values,
            'series': (payload.get('series') or '').strip(),
            'location': [item.strip() for item in str(payload.get('location') or '').split(',') if item.strip()],
            'tags': [item.strip() for item in str(payload.get('tags') or '').split(',') if item.strip()],
        }
        items.insert(0, video)
        write_items(items)
        self.send_json(201, {'ok': True, 'video': video})

    def do_DELETE(self):
        parsed = urlparse(self.path)
        if parsed.path != '/api/videos':
            self.send_json(404, {'error': 'Not found'})
            return

        content_length = int(self.headers.get('Content-Length', '0'))
        body = self.rfile.read(content_length).decode('utf-8') if content_length else '{}'
        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            self.send_json(400, {'error': 'Invalid JSON body'})
            return

        video_id = normalize_video_id(payload.get('id'))
        items = read_items()
        filtered = [item for item in items if item.get('id') != video_id]
        if len(filtered) == len(items):
            self.send_json(404, {'error': 'Video not found'})
            return
        write_items(filtered)
        self.send_json(200, {'ok': True})

    def handle_duplicate_video(self):
        content_length = int(self.headers.get('Content-Length', '0'))
        body = self.rfile.read(content_length).decode('utf-8') if content_length else '{}'
        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            self.send_json(400, {'error': 'Invalid JSON body'})
            return

        video_id = normalize_video_id(payload.get('id'))
        items = read_items()
        source = None
        for item in items:
            if item.get('id') == video_id:
                source = item
                break
        if not source:
            self.send_json(404, {'error': 'Video not found'})
            return

        duplicate = dict(source)
        duplicate['id'] = int(__import__('time').time() * 1000)
        duplicate['title'] = f"{source.get('title', 'Untitled video')} (Copy)"
        duplicate['slug'] = f"{(source.get('slug') or slugify(source.get('title', 'Untitled video'))) }-copy"
        items.insert(0, duplicate)
        write_items(items)
        self.send_json(201, {'ok': True, 'video': duplicate})

    def handle_settings_post(self):
        content_length = int(self.headers.get('Content-Length', '0'))
        body = self.rfile.read(content_length).decode('utf-8') if content_length else '{}'
        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            self.send_json(400, {'error': 'Invalid JSON body'})
            return
        settings = read_settings()
        if 'youtubeApiKey' in payload:
            settings['youtubeApiKey'] = (payload.get('youtubeApiKey') or '').strip()
        for key, value in payload.items():
            if key == 'youtubeApiKey':
                continue
            settings[key] = value
        write_settings(settings)
        self.send_json(200, settings)

    def handle_youtube_stats(self, parsed):
        params = parse_qs(parsed.query)
        video_ids = params.get('videoId', [''])
        ids = [item.strip() for item in video_ids[0].split(',') if item.strip()]
        if not ids:
            self.send_json(200, {'stats': {}})
            return

        cache = read_stats_cache()
        stats = {video_id: cache.get(video_id, {'viewCount': None, 'commentCount': None, 'likeCount': None}) for video_id in ids}

        api_key = read_settings().get('youtubeApiKey', '').strip() or os.environ.get('YOUTUBE_API_KEY', '').strip()
        if api_key:
            try:
                url = 'https://www.googleapis.com/youtube/v3/videos?part=statistics&id=' + ','.join(ids) + '&key=' + api_key
                context = ssl._create_unverified_context()
                with urllib.request.urlopen(url, timeout=20, context=context) as response:
                    payload = json.load(response)
            except Exception:
                pass
            else:
                for item in payload.get('items', []):
                    snippet = item.get('statistics', {})
                    record = {
                        'viewCount': int(snippet.get('viewCount', 0) or 0),
                        'commentCount': int(snippet.get('commentCount', 0) or 0),
                        'likeCount': int(snippet.get('likeCount', 0) or 0),
                    }
                    stats[item.get('id')] = record
                    cache[item.get('id')] = record

        write_stats_cache(cache)
        self.send_json(200, {'stats': stats})

    def handle_youtube_channel(self, parsed):
        settings = read_settings()
        channel_id = settings.get('youtubeChannelId', '').strip()
        api_key = settings.get('youtubeApiKey', '').strip() or os.environ.get('YOUTUBE_API_KEY', '').strip()
        
        if not channel_id or not api_key:
            self.send_json(200, {'channel': None, 'error': 'Missing channel ID or API key'})
            return
        
        try:
            url = 'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=' + channel_id + '&key=' + api_key
            context = ssl._create_unverified_context()
            with urllib.request.urlopen(url, timeout=20, context=context) as response:
                payload = json.load(response)
                if payload.get('items'):
                    item = payload['items'][0]
                    channel_data = {
                        'title': item.get('snippet', {}).get('title', ''),
                        'picture': item.get('snippet', {}).get('thumbnails', {}).get('medium', {}).get('url', ''),
                        'subscriberCount': item.get('statistics', {}).get('subscriberCount', '0'),
                    }
                    self.send_json(200, {'channel': channel_data})
                else:
                    self.send_json(200, {'channel': None, 'error': 'Channel not found'})
        except Exception as e:
            self.send_json(200, {'channel': None, 'error': str(e)})

    def send_json(self, status_code, payload):
        body = json.dumps(payload).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.end_headers()
        self.wfile.write(body)

    def serve_file(self, relative_path):
        safe_path = relative_path.replace('..', '')
        full_path = os.path.join(ROOT, safe_path)
        if not os.path.exists(full_path) or os.path.isdir(full_path):
            self.send_response(404)
            self.send_header('Content-Type', 'text/plain; charset=utf-8')
            self.end_headers()
            self.wfile.write(b'Not found')
            return

        ext = os.path.splitext(full_path)[1].lower()
        mime_type = MIME_TYPES.get(ext, 'application/octet-stream')
        with open(full_path, 'rb') as handle:
            body = handle.read()

        self.send_response(200)
        self.send_header('Content-Type', mime_type)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.end_headers()
        self.wfile.write(body)


if __name__ == '__main__':
    server = ThreadingHTTPServer(('0.0.0.0', 3000), AdminHandler)
    print('Admin server running at http://localhost:3000')
    print('Open http://localhost:3000/admin to add videos')
    server.serve_forever()
