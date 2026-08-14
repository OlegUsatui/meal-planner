#!/usr/bin/env python3
"""Extract the bundled lunch PDF into validated JSON and recipe image crops."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import tempfile
from collections import deque
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image


PAGE_GROUPS = (
    (range(13, 23), "lunch-chicken-turkey"),
    (range(25, 35), "lunch-beef-veal"),
    (range(37, 47), "lunch-fish-seafood"),
    (range(49, 59), "lunch-vegetarian-protein"),
    (range(61, 71), "lunch-legumes-grains"),
    (range(73, 83), "lunch-salad-bowls"),
    (range(85, 95), "lunch-wok"),
    (range(97, 108), "lunch-protein-soups"),
    (range(110, 120), "lunch-mediterranean-cafe"),
    (range(122, 140), "lunch-pasta-noodles"),
    (range(142, 148), "lunch-cream-soups"),
    (range(150, 161), "lunch-vegetable-casseroles"),
    (range(163, 174), "lunch-hearty-baked"),
)
RECIPE_PAGES = tuple(page for pages, _ in PAGE_GROUPS for page in pages)
OCR_FIXES = {
    "иогурт": "йогурт",
    "могурт": "йогурт",
    "єдамаме": "едамаме",
    "куннжут": "кунжут",
    "куунжжут": "кунжут",
    "капттуста": "капуста",
    "coyc": "Соус",
    "hyt": "Нут",
    "xB": "хв",
    " ha ": " на ",
    "bnuute": "Влийте",
    "po3nylwitb": "розпушіть",
    "cmakom": "смаком",
    "koyn-cnoy": "коул-слоу",
    "cana[tт]": "Салат",
    "bypak": "Буряк",
    "ogaya": "Подача",
    "kihoa": "кіноа",
    "kypky": "Курку",
    "bamkhitb": "Вимкніть",
    "mico": "місо",
    r"\bta\b": "та",
    r"\bha\b": "На",
    r"\bhe\b": "на",
    r"\bbih\b": "він",
    r"\bkapi\b": "карі",
    r"\bonii\b": "олії",
}
PAGE_OVERRIDES = {
    14: {"caloriesPerServing": 500, "proteinGramsPerServing": 51, "fatGramsPerServing": 13, "carbsGramsPerServing": 51},
    46: {"caloriesPerServing": 649, "proteinGramsPerServing": 52, "fatGramsPerServing": 21, "carbsGramsPerServing": 65},
    70: {"caloriesPerServing": 744, "proteinGramsPerServing": 79, "fatGramsPerServing": 18, "carbsGramsPerServing": 63},
    77: {"caloriesPerServing": 421, "proteinGramsPerServing": 31, "fatGramsPerServing": 18, "carbsGramsPerServing": 36},
    78: {"caloriesPerServing": 727, "proteinGramsPerServing": 42, "fatGramsPerServing": 33, "carbsGramsPerServing": 67},
    79: {"caloriesPerServing": 635, "proteinGramsPerServing": 47, "fatGramsPerServing": 18, "carbsGramsPerServing": 68},
    57: {"preparationTimeMinutes": 40},
    76: {"preparationTimeMinutes": 25},
    90: {"preparationTimeMinutes": 25},
    127: {"preparationTimeMinutes": 15},
    133: {"caloriesPerServing": 541, "proteinGramsPerServing": 44, "fatGramsPerServing": 11, "carbsGramsPerServing": 72},
    135: {"caloriesPerServing": 637, "proteinGramsPerServing": 33, "fatGramsPerServing": 32, "carbsGramsPerServing": 76},
    138: {"caloriesPerServing": 486, "proteinGramsPerServing": 50, "fatGramsPerServing": 11, "carbsGramsPerServing": 52},
    146: {"preparationTimeMinutes": 35},
    154: {"caloriesPerServing": 521, "proteinGramsPerServing": 45, "fatGramsPerServing": 25, "carbsGramsPerServing": 29},
    156: {"caloriesPerServing": 568, "proteinGramsPerServing": 43, "fatGramsPerServing": 28, "carbsGramsPerServing": 20},
    170: {"caloriesPerServing": 692, "proteinGramsPerServing": 50, "fatGramsPerServing": 32, "carbsGramsPerServing": 51},
}
TITLE_OVERRIDES = {
    13: "Курка-гриль з кіноа, броколі та лимонним соусом",
    14: "Індичка в паприці з гречкою та салатом огірок-помідор",
    15: "Курка теріякі лайт з рисом жасмін, огірком та кунжутом",
    16: "Індичка в томатному соусі з булгуром та броколі",
    17: "Курка з грибами та пюре з цвітної капусти і зелені",
    18: "Курка карі лайт з рисом, шпинатом та зеленню",
    19: "Тефтелі з індички з цільнозерновою пастою та томатним соусом",
    20: "Курка BBQ без цукру з бататом та коул-слоу лайт",
    21: "Курка з часником, перловкою та печеними овочами",
    22: "Індичка з кабачком, нутом та йогуртовим соусом",
    25: "Стейк телятини з печеною картоплею та зеленим салатом",
    26: "Яловичина WOK з овочами, рисом та імбиром",
    27: "Чилі кон карне з яловичиною та квасолею",
    28: "Яловичі фрикадельки з пюре з батату та броколі",
    29: "Телятина в гірчичному соусі з гречкою та капустяним салатом",
    30: "Бефстроганов лайт з грибами та булгуром",
    31: "Яловичина з баклажанами і томатами з цільнозерновим кускусом",
    32: "Запечена телятина з перловкою та салатом буряк-рукола",
    33: "Котлети лайт з яловичини з хрумким салатом",
    34: "Яловичина в томатах із сочевицею та зеленню",
    37: "Лосось запечений з кіноа, спаржею та лимоном",
    38: "Стейк тунця з рисом, огірком та авокадо",
    39: "Тріска в травах з печеною картоплею та капустяним салатом",
    40: "Скумбрія запечена з гречкою та буряком",
    41: "Креветки WOK з рисовою локшиною, овочами та лаймом",
    42: "Мідії в томатах з булгуром та зеленню",
    43: "Форель з печеними овочами та соусом йогурт-кріп",
    44: "Сардини та квасоля — салат нісуаз лайт з яйцем",
    45: "Кальмар-гриль з кіноа, шпинатом та лимоном",
    46: "Риба карі з кокосом лайт, басматі та броколі",
    49: "Тофу теріякі з рисом, броколі та кунжутом",
    50: "Темпе-гриль з кіноа, огірком та авокадо",
    51: "Омлет з овочами, шпинатом та рисовим карі",
    52: "Яєчна запіканка з творогом по-грецьки",
    53: "Тофу карі з нутом, шпинатом та лаймом",
    54: "Гречаний боул з яйцями пашот і вершковими грибами",
    55: "Темпе WOK з овочами, рисом та імбиром",
    56: "Тофу «фета» з грецьким салатом та булгуром",
    57: "Яєчні мафіни з овочами, салатом та йогуртовим соусом",
    58: "Смажениця з яйцями, грибами, броколі та зеленню",
    61: "Запечені овочі з нутом та тахіні-лимонним соусом",
    62: "Сочевиця з томатами, шпинатом і йогуртовою заправкою",
    63: "Квасоля з куркою, кукурудзою та перцем під лайм-соусом",
    64: "Булгур з нутом, огірком, томатами, зеленню та сиром",
    65: "Кіноа з квасолею, авокадо, сальсою та куркою",
    66: "Гречка з грибами, цибулею, зеленню та куркою",
    67: "Перловка з телятиною, печерицями, морквою та часником",
    68: "Рис з едамаме, огірком, норі та копченим лососем в азійському стилі",
    69: "Сочевиця з буряком, руколою, фетою та кисломолочним сиром",
    70: "Нутова паста в томатному соусі з базиліком, цвітною капустою та індичкою",
    73: "Боул з куркою та йогуртовою заправкою",
    74: "Боул з лососем, кіноа та лимоном",
    75: "Боул з тунцем, квасолею та яйцем",
    76: "Боул з індичкою, булгуром і хрусткою капустою",
    77: "Боул з креветками, манго та лаймом",
    78: "Боул з тофу, броколі та кунжутним соусом",
    79: "Боул з яловичиною, рисом та чилі-лайт соусом",
    80: "Боул з нутом, печеним гарбузом і тахіні",
    81: "Боул з яйцями, авокадо та хрустким лавашем",
    82: "Боул зі скумбрією, буряком та гречкою",
    85: "Курка з броколі та перцем у соєво-лимонному соусі",
    86: "Індичка з кабачком і булгуром у лимонно-гірчичному соусі",
    87: "Яловичина з рисом, грибами та цибулею в соєво-лимонній глазурі",
    88: "Креветки з овочами та рисовою локшиною в томатно-часниковому соусі",
    89: "Тофу з броколі та рисом під лимонно-йогуртовим соусом",
    90: "Кальмар з перцем, шпинатом і кіноа у гірчично-лимонній глазурі",
    91: "Курка з ананасом, перцем і рисом у кисло-солодкому лайт-соусі",
    92: "Індичка з капустою та гречкою в лимонно-паприковому соусі",
    93: "Яловичина з баклажанами і томатами в соусі з орегано та кускусом",
    94: "Темпе з овочами, рисом та імбиром у кунжутно-оцтовій глазурі",
    97: "Суп-пюре з гарбуза з куркою, йогуртом і зеленню",
    98: "Суп сочевичний з індичкою та лимоном",
    99: "Мінестроне з овочами, квасолею та базиліком",
    100: "Том ям лайт з креветками, грибами та лаймом",
    101: "Рибний суп з тріскою, овочами та зеленню",
    102: "Курячий суп з гречкою, морквою та зеленню",
    103: "Місо-суп з тофу, водоростями та рисом",
    104: "Крем-суп із броколі з яйцем та насінням",
    105: "Борщ лайт з яловичиною, буряком та капустою",
    106: "Грибний суп з індичкою та перловкою",
    107: "Бабусин рибний суп з грибами та картоплею",
    110: "Грецька тарілка з соковитою куркою, фетою та оливками",
    111: "Салат нісуаз лайт з тунцем, яйцем та квасолею",
    112: "Цільнозернова паста з індичкою, томатами та базиліком",
    113: "Риба-гриль з печеними овочами, авокадо та лимонним йогурт-соусом",
    114: "Боул «поке» лайт з лососем, рисом та авокадо",
    115: "Хумус з печеними овочами та цільнозерновим тостом",
    116: "Шаурма-бокс з куркою, булгуром та йогуртовим соусом",
    117: "Кебаб лайт з індички та соусом тахіні-лимон",
    118: "Рагу з яловичиною, овочами, томатами та зеленню",
    119: "Фріттата з овочами та сиром лайт плюс салат",
    122: "Лінгвіні з лососем, шпинатом та едамаме з лаймом",
    123: "Пенне з куркою-гриль та салатом із чері й насінням",
    124: "Лінгвіні з ростбіфом, броколі та перцем з пармезаном",
    125: "Паста з прошуто, руколою, чері та моцарелою",
    126: "Паста з куркою, грибами та зеленою квасолею з кунжутом",
    127: "Середземноморська паста з тунцем, томатами та оливками",
    128: "Паста з індичкою, грибами та шпинатом з лимонним соком",
    129: "Паста з лососем і броколі в лимонно-йогуртовому соусі",
    130: "Паста з куркою та овочами-гриль у легкому томатному соусі",
    131: "Паста з тофу, грибами та шпинатом у соєво-лаймовій заправці",
    132: "Паста з яловичиною та овочами у легкому соусі теріякі",
    133: "Фунчоза з куркою та овочами у соєво-лаймовому соусі",
    134: "Гречана або яєчна лапша з креветками та броколі в соусі теріякі лайт",
    135: "Фунчоза з тофу та овочами у соєво-арахісовому соусі лайт",
    136: "Фунчоза з яловичиною та овочами у соусі теріякі лайт",
    137: "Гречана лапша соба з лососем та едамаме у соєво-лаймовій заправці",
    138: "Яєчна лапша з куркою та грибами у соєвому соусі без вершків",
    139: "Яєчна лапша з креветками та бок-чаєм у імбирно-соєвому соусі",
    142: "Грибний крем-суп з дорблю, куркою та цвітною капустою",
    143: "Грибний крем-суп з дорблю та картоплею",
    144: "Томатний крем-суп з паприкою та цибулею",
    145: "Томатно-сочевичний крем-суп з куркою",
    146: "Томатно-сочевичний крем-суп",
    147: "Крем-суп із броколі та зеленого горошку з куркою",
    150: "Курка «паприка та гриби» під ніжною скоринкою",
    151: "Біла риба під овочевою «шубою»",
    152: "Індичка-паприкаш у формі",
    153: "Шакшука-касероль з фетою",
    154: "Баклажан-парміджана лайт з куркою",
    155: "Запіканка «папільйот» з білою рибою, томатами та оливками",
    156: "Запечена фрітата з броколі та бринзою",
    157: "Запіканка з гарбузом і бринзою",
    158: "Запіканка з кабачком і куркою «середземноморська»",
    159: "Запіканка з цвітною капустою та фаршем",
    160: "Запіканка «грецька» з баклажаном, куркою та фетою",
    163: "Запіканка «тако» з індичкою, квасолею та кукурудзою",
    164: "Запіканка з тунцем і картоплею у вершково-сметанному соусі",
    165: "Запіканка «карі-рис» з куркою та зеленим горошком",
    166: "Запіканка з бататом та фаршем індички",
    167: "Картопляний гратен з куркою та броколі",
    168: "Рисова запіканка «тайська» з креветкою",
    169: "Нутова запіканка з овочами і сиром",
    170: "Тунець-паста бейк",
    171: "Гречка-касероль з грибами і яловичиною",
    172: "Картопляна запіканка з курятиною та броколі",
    173: "Гірська запіканка з рибкою та грибами",
}

INSTRUCTION_OVERRIDES = {
    142: (
        "1. Курку наріжте шматочками. У каструлі розігрійте олію та обсмажте 5–6 хв. "
        "2. Додайте цибулю, нарізану дрібним кубиком, і готуйте 2–3 хв. "
        "3. Додайте печериці, нарізані пластинками, й обсмажте 7–9 хв без кришки. "
        "4. Додайте цвітну капусту, воду, сіль і перець. Варіть 12–15 хв. "
        "5. Додайте часник на 20–30 секунд, вимкніть вогонь, додайте дорблю та пробийте блендером. "
        "6. Подавайте із зеленню."
    ),
    146: (
        "1. У каструлі з олією тушкуйте цибулю й моркву 5–6 хв. "
        "2. Додайте сочевицю, томати, воду, спеції, сіль і перець. "
        "3. Варіть 18–20 хв, потім пробийте блендером. "
        "4. Прогрійте 1 хв і подавайте."
    ),
}


@dataclass(frozen=True)
class ParsedIngredient:
    name: str
    enteredQuantity: float
    enteredUnit: str


def main() -> None:
    args = parse_args()
    source = args.source.resolve()
    output = args.output.resolve()
    pages = tuple(args.pages or RECIPE_PAGES)
    work = args.work.resolve() if args.work else Path(tempfile.mkdtemp(prefix="meal-planner-lunch-pdf-"))
    work.mkdir(parents=True, exist_ok=True)
    output.mkdir(parents=True, exist_ok=True)
    (output / "images").mkdir(exist_ok=True)

    recipes = []
    failures: list[str] = []
    for index, page in enumerate(pages, 1):
        print(f"[{index}/{len(pages)}] PDF page {page}", flush=True)
        try:
            recipes.append(extract_page(source, output, work, page, args.pdftoppm, args.tesseract))
        except Exception as error:  # validation report must include every failed page
            failures.append(f"page {page}: {error}")

    report = validate_dataset(recipes, pages, failures)
    (output / "validation-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if report["errors"]:
        raise SystemExit("PDF extraction failed validation; inspect validation-report.json")
    (output / "lunches.json").write_text(json.dumps(recipes, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if not args.keep_work and not args.work:
        shutil.rmtree(work)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=Path("refs/Велика Книга Корисних Обідів.pdf"))
    parser.add_argument("--output", type=Path, default=Path("public/imported-recipes/lunches-pdf"))
    parser.add_argument("--work", type=Path)
    parser.add_argument("--keep-work", action="store_true")
    parser.add_argument("--pages", type=int, nargs="*")
    parser.add_argument("--pdftoppm", default=find_binary("pdftoppm"))
    parser.add_argument("--tesseract", default=find_binary("tesseract"))
    return parser.parse_args()


def extract_page(source: Path, output: Path, work: Path, page: int, pdftoppm: str, tesseract: str) -> dict:
    image_path = work / f"page-{page:03d}.png"
    if not image_path.exists():
        subprocess.run([
            pdftoppm, "-f", str(page), "-l", str(page), "-r", "180", "-png", "-singlefile",
            str(source), str(image_path.with_suffix("")),
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    image = Image.open(image_path).convert("RGB")
    if image.size != (3600, 2025):
        raise ValueError(f"unexpected rendered size {image.size}")

    title_text = ocr_crop(image, (80, 60, 2450, 600), work / f"title-{page:03d}.png", tesseract, 11)
    nutrition_text = ocr_crop(image, (80, 430, 2050, 820), work / f"nutrition-{page:03d}.png", tesseract, 11)
    ingredients_text = ocr_crop(image, (70, 690, 2220, 1490), work / f"ingredients-{page:03d}.png", tesseract, 6)
    left_steps = ocr_crop(image, (70, 1240, 1800, 2010), work / f"steps-left-{page:03d}.png", tesseract, 6)
    right_steps = ocr_crop(image, (1800, 1240, 3540, 2010), work / f"steps-right-{page:03d}.png", tesseract, 6)
    if page in range(142, 148) or len(re.findall(r"[А-Яа-яІіЇїЄєҐґ]", right_steps)) < 40:
        left_steps = ocr_crop(image, (70, 1240, 2500, 2010), work / f"steps-wide-{page:03d}.png", tesseract, 6)
        right_steps = ""
    time_text = ocr_time(image, work / f"time-{page:03d}.png", tesseract)
    nutrition = parse_nutrition(nutrition_text)
    if nutrition is None:
        nutrition_tight = ocr_crop(image, (100, 570, 2000, 760), work / f"nutrition-tight-{page:03d}.png", tesseract, 7)
        nutrition = parse_nutrition(nutrition_tight)
    if nutrition is None:
        full_text = ocr_crop(image, (0, 0, 3600, 2025), work / f"full-{page:03d}.png", tesseract, 6)
        nutrition = parse_nutrition(full_text)
    ingredients = parse_ingredients(ingredients_text)
    instructions = parse_instructions(left_steps, right_steps)
    title = parse_title(title_text)
    prep_time = parse_time(time_text)
    override = PAGE_OVERRIDES.get(page, {})
    title = TITLE_OVERRIDES.get(page, title)
    instructions = INSTRUCTION_OVERRIDES.get(page, instructions)
    if any(key.endswith("PerServing") for key in override):
        nutrition = {key: value for key, value in override.items() if key.endswith("PerServing")}
    if "preparationTimeMinutes" in override:
        prep_time = override["preparationTimeMinutes"]

    missing = [name for name, value in (
        ("title", title), ("nutrition", nutrition), ("time", prep_time),
        ("ingredients", ingredients), ("instructions", instructions),
    ) if not value]
    if missing:
        raise ValueError(f"missing {', '.join(missing)}")

    photo_name = f"page-{page:03d}.webp"
    photo_path = output / "images" / photo_name
    image.crop((2150, 40, 3550, 1440)).resize((1200, 1200), Image.Resampling.LANCZOS).save(photo_path, "WEBP", quality=84, method=6)
    if not 0 < photo_path.stat().st_size <= 2 * 1024 * 1024:
        raise ValueError("invalid image size")

    category = next(category for group, category in PAGE_GROUPS if page in group)
    return {
        "sourcePage": page,
        "name": title,
        "instructions": instructions,
        **nutrition,
        "preparationTimeMinutes": prep_time,
        "subcategoryId": category,
        "ingredients": [ingredient.__dict__ for ingredient in ingredients],
        "image": f"/imported-recipes/lunches-pdf/images/{photo_name}",
        "imageWidth": 1200,
        "imageHeight": 1200,
    }


def ocr_crop(image: Image.Image, box: tuple[int, int, int, int], path: Path, tesseract: str, psm: int) -> str:
    image.crop(box).save(path)
    result = subprocess.run(
        [tesseract, str(path), "stdout", "-l", "ukr+eng", "--psm", str(psm)],
        check=True, capture_output=True, text=True,
    )
    return result.stdout


def ocr_time(image: Image.Image, path: Path, tesseract: str) -> str:
    source = image.crop((1750, 500, 2150, 850))
    mask = Image.new("L", source.size, 255)
    source_pixels = source.load()
    pixels = mask.load()
    width, height = mask.size
    for y in range(height):
        for x in range(width):
            red, green, blue = source_pixels[x, y]
            if red > 170 and green > 150 and blue > 130:
                pixels[x, y] = 0
    remove_border_components(mask)
    mask.save(path)
    return subprocess.run(
        [tesseract, str(path), "stdout", "-l", "ukr+eng", "--psm", "6"],
        check=True, capture_output=True, text=True,
    ).stdout


def remove_border_components(image: Image.Image) -> None:
    pixels = image.load()
    width, height = image.size
    queue: deque[tuple[int, int]] = deque()
    seen: set[tuple[int, int]] = set()
    for x in range(width):
        for point in ((x, 0), (x, height - 1)):
            if pixels[point] < 128:
                queue.append(point)
                seen.add(point)
    for y in range(height):
        for point in ((0, y), (width - 1, y)):
            if pixels[point] < 128:
                queue.append(point)
                seen.add(point)
    while queue:
        x, y = queue.popleft()
        pixels[x, y] = 255
        for point in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= point[0] < width and 0 <= point[1] < height and point not in seen and pixels[point] < 128:
                seen.add(point)
                queue.append(point)


def parse_title(text: str) -> str:
    lines = []
    for raw in text.splitlines():
        line = clean_ocr(raw)
        if not line or re.search(r"ккал|білки|жири|вуглеводи|інгредієнти", line, re.I):
            continue
        if len(re.findall(r"[А-Яа-яІіЇїЄєҐґ]", line)) < 3:
            continue
        lines.append(line)
    title = " ".join(lines[:3]).strip(" -—,.")
    title = apply_fixes(title).lower()
    return title[:1].upper() + title[1:]


def parse_nutrition(text: str) -> dict[str, int] | None:
    value = clean_ocr(text)
    value = re.sub(r"binku", "Білки", value, flags=re.I)
    value = re.sub(r"kupu", "Жири", value, flags=re.I)
    value = re.sub(r"byrneso\w*", "Вуглеводи", value, flags=re.I)
    value = re.sub(r"жири\s*:?\s*[з3]а(?=\s*г|г)", "Жири:34", value, flags=re.I)
    value = re.sub(r"жири\s*:?\s*[з3]ї(?=\s*г|г)", "Жири:31", value, flags=re.I)
    value = re.sub(r"(б[іi]лк[^0-9]{0,16})б[іiї](?=\s*г|г)", r"\g<1>61", value, flags=re.I)
    value = re.sub(r"(жир[^0-9]{0,16})[їіi]6(?=\s*г|г)", r"\g<1>16", value, flags=re.I)
    value = re.sub(r"(жир[^0-9]{0,16})л[аa](?=\s*г|г)", r"\g<1>14", value, flags=re.I)
    value = re.sub(r"(?i)(жир[^0-9]{0,16})їа", r"\g<1>14", value)
    patterns = {
        "caloriesPerServing": r"(\d{3,4})\s*ккал",
        "proteinGramsPerServing": r"б[іi]лк[^0-9]{0,16}(\d{1,3})",
        "fatGramsPerServing": r"жир[^0-9]{0,16}(\d{1,3})",
        "carbsGramsPerServing": r"вуглевод[^0-9]{0,16}(\d{1,3})",
    }
    result: dict[str, int] = {}
    for key, pattern in patterns.items():
        match = re.search(pattern, value, re.I)
        if not match:
            return None
        result[key] = int(match.group(1))
    if not 100 <= result["caloriesPerServing"] <= 10000 or any(
        not 0 <= result[key] <= 200 for key in (
            "proteinGramsPerServing", "fatGramsPerServing", "carbsGramsPerServing"
        )
    ):
        return None
    return result


def parse_time(text: str) -> int | None:
    match = re.search(r"(\d{1,3})", text)
    return int(match.group(1)) if match else None


def parse_ingredients(text: str) -> list[ParsedIngredient]:
    value = clean_ocr(text).replace("Інгредієнти:", "")
    value = re.split(r"Спосіб\s+приготування", value, flags=re.I)[0]
    segments = re.split(r"[,;\n]", value)
    parsed: list[ParsedIngredient] = []
    for raw in segments:
        segment = re.sub(r"^[^А-Яа-яІіЇїЄєҐґ]+", "", raw).strip()
        if re.search(r"\bабо\b", segment, re.I):
            segment = re.split(r"\bабо\b", segment, maxsplit=1, flags=re.I)[0].strip(" (")
        match = re.match(r"(.{2,80}?)\s*[—–-]{1,2}\s*(.+)$", segment)
        if not match or "за смаком" in match.group(2).lower():
            continue
        amount = parse_amount(match.group(2))
        name = clean_ingredient_name(match.group(1))
        if amount and name and name.lower() not in {"сіль", "чорний перець", "вода"}:
            parsed.append(ParsedIngredient(name, amount[0], amount[1]))
    return deduplicate_ingredients(parsed)


def parse_amount(text: str) -> tuple[float, str] | None:
    normalized = text.lower().replace("мл.", "мл").replace("шт.", "шт")
    parenthetical = re.findall(r"\((\d+(?:[.,]\d+)?)\s*(кг|г|мл|л)\b", normalized)
    first = re.search(r"(\d+(?:[.,]\d+)?|\d+\s*/\s*\d+)\s*(кг|г|мл|л|шт|зубчик\S*|ч\.?\s*л\.?|ст\.?\s*л\.?)\b", normalized)
    if not first:
        return None
    raw_number, raw_unit = first.group(1), first.group(2)
    if parenthetical and re.search(r"шт|зубчик|ч\.?\s*л|ст\.?\s*л", raw_unit):
        raw_number, raw_unit = parenthetical[0]
    quantity = fraction(raw_number)
    unit = normalize_unit(raw_unit)
    if unit == "tsp":
        return quantity * 5, "ml"
    if unit == "tbsp":
        return quantity * 15, "ml"
    return quantity, unit


def parse_instructions(left: str, right: str) -> str:
    parts = []
    for column, text in enumerate((left, right)):
        value = re.split(r"Спосіб\s+приготування\s*:?", clean_ocr(text), maxsplit=1, flags=re.I)[-1]
        first_step = re.search(r"(?:^|\n)\s*\d{1,2}\s*[.)]", value)
        if column == 0 and first_step:
            value = value[first_step.start():]
        value = re.sub(r"(?:^|\n)\s*(\d{1,2})\s*[.)]\s*", r"\n\1. ", value)
        value = re.sub(r"\s+", " ", value).strip(" —-")
        if len(value) >= 20:
            parts.append(value)
    result = apply_fixes(" ".join(parts)).strip()
    result = re.sub(r"(?<=водою)\s+12\b", " 1:2", result, flags=re.I)
    result = re.sub(r"(?<=співвідношенні)\s+12\b", " 1:2", result, flags=re.I)
    return result


def clean_ingredient_name(value: str) -> str:
    value = re.sub(r"^[мМуУу✓У,.'’]+\s*", "", value).strip()
    return apply_fixes(re.sub(r"\s+", " ", value)).strip(" .—-")


def deduplicate_ingredients(items: Iterable[ParsedIngredient]) -> list[ParsedIngredient]:
    result: dict[tuple[str, str], ParsedIngredient] = {}
    for item in items:
        key = (item.name.lower(), item.enteredUnit)
        current = result.get(key)
        result[key] = ParsedIngredient(item.name, round((current.enteredQuantity if current else 0) + item.enteredQuantity, 3), item.enteredUnit)
    return list(result.values())


def clean_ocr(value: str) -> str:
    return value.replace("\u00ad", "").replace("|", " ").replace("--", "—").replace("–", "—").strip()


def apply_fixes(value: str) -> str:
    for wrong, correct in OCR_FIXES.items():
        value = re.sub(wrong, correct, value, flags=re.I)
    value = re.sub(r"\b(?!al\b|dente\b|light\b|BBQ\b|WOK\b)[A-Za-z]{2,}\b", " ", value, flags=re.I)
    return re.sub(r"\s+", " ", value).strip()


def fraction(value: str) -> float:
    value = value.replace(",", ".").replace(" ", "")
    if "/" in value:
        numerator, denominator = value.split("/", 1)
        return float(numerator) / float(denominator)
    return float(value)


def normalize_unit(value: str) -> str:
    value = value.lower().replace(" ", "").replace(".", "")
    if value.startswith("кг"):
        return "kg"
    if value.startswith("мл"):
        return "ml"
    if value == "л":
        return "l"
    if value.startswith("шт") or value.startswith("зубчик"):
        return "pcs"
    if value.startswith("стл"):
        return "tbsp"
    if value.startswith("чл"):
        return "tsp"
    return "g"


def validate_dataset(recipes: list[dict], pages: tuple[int, ...], failures: list[str]) -> dict:
    errors = list(failures)
    found_pages = [recipe["sourcePage"] for recipe in recipes]
    missing = sorted(set(pages) - set(found_pages))
    if missing:
        errors.append(f"missing pages: {missing}")
    names = [recipe["name"].lower() for recipe in recipes]
    if len(names) != len(set(names)):
        errors.append("duplicate recipe names")
    for recipe in recipes:
        if len(recipe["ingredients"]) < 2:
            errors.append(f"page {recipe['sourcePage']}: fewer than two parsed ingredients")
        if len(recipe["instructions"]) < 80:
            errors.append(f"page {recipe['sourcePage']}: instructions too short")
    return {"expected": len(pages), "extracted": len(recipes), "errors": errors}


def find_binary(name: str) -> str:
    resolved = shutil.which(name)
    if resolved:
        return resolved
    bundled = Path.home() / ".cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override" / name
    return str(bundled)


if __name__ == "__main__":
    main()
