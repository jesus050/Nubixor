from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'site/assets/og-cover.png'
LOGO = ROOT / 'site/assets/logo-light.png'
WIDTH, HEIGHT = 1200, 630
STOPS = [(0, (0, 186, 242)), (.42, (119, 70, 242)), (.72, (238, 43, 178)), (1, (255, 152, 29))]

def color_at(position):
    for (left, start), (right, end) in zip(STOPS, STOPS[1:]):
        if position <= right:
            ratio = (position - left) / (right - left)
            return tuple(round(a + (b - a) * ratio) for a, b in zip(start, end))
    return STOPS[-1][1]

def main():
    canvas = Image.new('RGB', (WIDTH, HEIGHT), '#071D59')
    for x in range(WIDTH):
        canvas.paste(color_at(x / (WIDTH - 1)), (x, 0, x + 1, 8))
    logo = Image.open(LOGO).convert('RGBA')
    target_width = 460
    target_height = round(logo.height * target_width / logo.width)
    logo.thumbnail((target_width, target_height), Image.Resampling.LANCZOS)
    canvas.alpha_composite(logo, ((WIDTH - logo.width) // 2, round(HEIGHT * .45 - logo.height / 2))) if canvas.mode == 'RGBA' else canvas.paste(logo, ((WIDTH - logo.width) // 2, round(HEIGHT * .45 - logo.height / 2)), logo)
    canvas.save(OUT, 'PNG', optimize=True)

if __name__ == '__main__': main()
