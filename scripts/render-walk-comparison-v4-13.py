"""Encode private browser screenshots; never creates or edits game artwork."""
from pathlib import Path
import argparse, json, subprocess, sys
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('directory')
parser.add_argument('--fps', type=int, default=30)
parser.add_argument('--mp4-only', action='store_true', help='Private compact QA: skip redundant large GIF')
args = parser.parse_args()
folder = Path(args.directory).resolve()
frames = sorted(folder.glob('frame-*.png'))
if not frames:
    raise ValueError('No browser frames')
rgb = [Image.open(f).convert('RGB') for f in frames]
samples = rgb[::max(1, len(rgb)//8)][:8]
atlas = Image.new('RGB', (samples[0].width*2, samples[0].height*4))
for i, im in enumerate(samples):
    atlas.paste(im, (i%2*im.width, i//2*im.height))
palette = atlas.quantize(colors=240, method=Image.Quantize.MEDIANCUT)
quantized = [im.quantize(palette=palette, dither=Image.Dither.NONE) for im in rgb]
duration = [(round((i+1)*1000/args.fps/10)-round(i*1000/args.fps/10))*10 for i in range(len(rgb))]
output = folder/'comparison.gif'
if not args.mp4_only:
    quantized[0].save(output, save_all=True, append_images=quantized[1:],
                      duration=duration, loop=0, disposal=2, optimize=False)
sys.path.insert(0, 'C:/Users/XTIA/.cache/codex-audio-v411')
import imageio_ffmpeg
exe = imageio_ffmpeg.get_ffmpeg_exe()
subprocess.run([exe, '-y', '-loglevel', 'error', '-framerate', str(args.fps),
                '-i', str(folder/'frame-%03d.png'), '-c:v', 'libx264',
                '-crf', '18', '-pix_fmt', 'yuv420p', str(folder/'comparison.mp4')], check=True)
print(json.dumps({'folder': str(folder), 'frames': len(rgb), 'fps': args.fps,
                  'gifBytes': output.stat().st_size if not args.mp4_only else 0, 'mp4Bytes': (folder/'comparison.mp4').stat().st_size}))
