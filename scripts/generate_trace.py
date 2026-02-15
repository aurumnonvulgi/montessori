"""Generate a traceable midline SVG from a filled letter asset."""

from pathlib import Path
import argparse

from PIL import Image
import numpy as np
from skimage import morphology
from skimage.measure import find_contours


def load_image(path: Path) -> np.ndarray:
    with Image.open(path) as img:
        img = img.convert("L")
        arr = np.array(img)
    return arr


def skeletonize(arr: np.ndarray) -> np.ndarray:
    thresh = arr < 128
    skeleton = morphology.skeletonize(thresh)
    return skeleton


def contour_to_path(contour: np.ndarray, width: int, height: int) -> str:
    coords = contour[:, ::-1]
    scaled = coords * np.array([1.0, 1.0])
    points = " ".join(f"{x:.2f},{y:.2f}" for x, y in scaled)
    return f"M {points}"


def save_svg(path: Path, d: str) -> None:
    svg = f"""<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1000 1000\"><path d=\"{d}\" stroke=\"#000\" fill=\"none\" stroke-width=\"40\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>"""
    path.write_text(svg)


def generate(letter: str | None, source_override: str | None, output_override: str | None) -> None:
    if source_override:
        source = Path(source_override)
    elif letter:
        source = Path(f"public/assets/language_arts/initial_sound_tracing/{letter}-image.png")
    else:
        raise ValueError("Provide either letter or --source")
    if not source.exists():
        raise FileNotFoundError(source)
    arr = load_image(source)
    skeleton = skeletonize(arr)
    contours = find_contours(skeleton.astype(float), 0.5)
    if not contours:
        raise RuntimeError("No stroke found")
    path = contour_to_path(contours[0], 1000, 1000)
    if output_override:
        target = Path(output_override)
    elif letter:
        target = Path(f"public/assets/language_arts/initial_sound_tracing/{letter}-path.svg")
    else:
        raise ValueError("Provide either letter or --output")
    save_svg(target, path)
    print("saved", target)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("letter", nargs="?", help="letter to process (lowercase)")
    parser.add_argument("--source", help="override source image path")
    parser.add_argument("--output", help="override output SVG path")
    args = parser.parse_args()
    generate(args.letter, args.source, args.output)


if __name__ == "__main__":
    main()
