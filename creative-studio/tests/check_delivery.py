"""Integration acceptance: real artifacts, local links, media decode and QA reports."""
import json, subprocess, sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
checks = []

def check(name, ok, detail=''):
    checks.append({'name': name, 'passed': bool(ok), 'detail': str(detail)})

class Links(HTMLParser):
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key not in ('href', 'src', 'poster') or not value:
                continue
            ref = urlsplit(value)
            if ref.scheme or ref.netloc or not ref.path:
                continue
            target = ROOT / unquote(ref.path)
            check('gallery link: ' + value, target.exists())

required = ['README.md', 'AGENTS.md', 'docs/REPORT.md', 'docs/STATUS.md',
            'docs/audits/3d.md', 'docs/audits/motion.md', 'docs/audits/orchestration-web.md',
            'docs/SKILL-VALIDATION.md', 'apps/web/dist/index.html', 'apps/web/dist/product.html',
            'apps/web/package-lock.json', 'apps/motion/package-lock.json',
            'artifacts/blender/hero.png', 'artifacts/blender/aura-object-01.blend',
            'artifacts/blender/aura-object-01.glb', 'artifacts/blender/fundamentals-lab.blend']
for name in required:
    p = ROOT / name
    check('nonempty: ' + name, p.is_file() and p.stat().st_size > 0)
Links().feed((ROOT / 'gallery.html').read_text())

audit = ROOT / 'artifacts/qa/audit-coverage.json'
if audit.exists():
    data = json.loads(audit.read_text())
    check('27 source audits', data['documented'] == 27 and not data['missing'])
else:
    check('27 source audits', False, 'Missing audit coverage report')

for group, folder in [('Blender', 'artifacts/blender'), ('Remotion', 'artifacts/motion')]:
    videos = sorted((ROOT / folder).glob('*.mp4'))
    check(group + ' video exists', bool(videos))
    for path in videos:
        cmd = ['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(path)]
        probe = subprocess.run(cmd, capture_output=True, text=True)
        check(group + ' ffprobe', probe.returncode == 0, probe.stderr)
        if probe.returncode != 0:
            continue
        data = json.loads(probe.stdout)
        check(group + ' video duration', float(data['format']['duration']) >= (8 if group == 'Remotion' else 2))
        check(group + ' video stream', any(s['codec_type'] == 'video' for s in data['streams']))
        decoded = subprocess.run(['ffmpeg', '-v', 'error', '-threads', '1', '-i', str(path), '-f', 'null', '-'], capture_output=True, text=True)
        check(group + ' full decode', decoded.returncode == 0 and not decoded.stderr.strip(), decoded.stderr)

result = {'passed': all(c['passed'] for c in checks), 'count': len(checks), 'checks': checks}
out = ROOT / 'artifacts/qa/delivery.json'
out.parent.mkdir(exist_ok=True, parents=True)
out.write_text(json.dumps(result, indent=2, ensure_ascii=False) + '\n')
for c in checks:
    print(('PASS' if c['passed'] else 'FAIL') + ' ' + c['name'])
print(f"{sum(c['passed'] for c in checks)}/{len(checks)} checks passed")
sys.exit(0 if result['passed'] else 1)
