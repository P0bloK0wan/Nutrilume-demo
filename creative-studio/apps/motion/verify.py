"""Verify actual export and generate QA stills using ffmpeg/ffprobe."""
from pathlib import Path
import subprocess,json
root=Path(__file__).resolve().parents[2]
out=root/'artifacts/motion'; video=out/'aura-commercial.mp4'
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(video)]))
v=next(s for s in probe['streams'] if s['codec_type']=='video'); a=next(s for s in probe['streams'] if s['codec_type']=='audio')
checks={'codec_h264':v['codec_name']=='h264','size720p':(v['width'],v['height'])==(1280,720),'fps30':v['r_frame_rate']=='30/1','frames300':int(v['nb_frames'])==300,'duration10s':abs(float(probe['format']['duration'])-10)<.05,'audio_aac48k':a['codec_name']=='aac' and a['sample_rate']=='48000'}
(out/'ffprobe.json').write_text(json.dumps(probe,indent=2))
for frame in (0,150,299):
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(video),'-vf',f'select=eq(n\\,{frame})','-frames:v','1',str(out/f'frame-{frame:03}.png')],check=True)
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(video),'-vf','fps=1,scale=426:240,tile=5x2','-frames:v','1',str(out/'contact-sheet.png')],check=True)
report={'checks':checks,'passed':all(checks.values()),'video':str(video),'method':'ffprobe actual exported MP4; frame extraction FFmpeg; visual review separate'}
(out/'verification.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
assert report['passed']
