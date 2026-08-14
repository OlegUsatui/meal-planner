#!/usr/bin/env python3
"""Extract validated breakfast and dinner recipe bundles from the reference PDFs."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import tempfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path

from PIL import Image

from extract_lunch_pdf import (
    ParsedIngredient,
    apply_fixes,
    find_binary,
    ocr_crop,
    ocr_time,
    parse_ingredients,
    parse_instructions,
    parse_nutrition,
    parse_title,
)


BREAKFAST_PAGE_OVERRIDES: dict[int, dict] = {
    15: {"name": "Омлет з грибами та шпинатом"},
    17: {"name": "Омлет з шинкою, сиром і шпинатом + салат і сендвіч"},
    21: {"name": "Ситний скрембл «Індичка & зелень»"},
    27: {"name": "Шакшука (яйця в томатному соусі)"},
    29: {"name": "Яйця + «2 жмені овочів» + сендвіч (універсальний шаблон)"},
    30: {"name": "Скрембл з креветками та зеленню"},
    37: {"name": "Омлет з фетою та зеленню"},
    38: {"name": "Eggs Benedict зі шпинатом і «голландезом»"},
    39: {"name": "Яєчні мафіни з овочами (у духовці)"},
    47: {"name": "Запіканка з тунцем, шпинатом і пекінською капустою + сендвіч"},
    48: {"name": "Фрітата з курячим філе, броколі та пармезаном + зелений салат"},
    50: {"name": "Сендвіч з крем-сиром, лососем і огірком"},
    51: {"name": "Яйце бенедикт (спрощена версія)"},
    53: {"name": "Авокадо-сендвіч з хумусом і лимонною ноткою"},
    59: {"name": "Сендвіч з песто, прошуто та яйцем пашот"},
    60: {"name": "Сендвіч з авокадо, креветками і сальсою"},
    61: {"name": "Скрембл сендвіч з авокадо та огірком"},
    66: {"name": "Сендвіч з куркою гриль, авокадо та салатом"},
    67: {"name": "Eggs Benedict з куркою гриль і печеними овочами (соус лайт)"},
    68: {"name": "Benedict з фетою замість соусу (найпростіший)"},
    69: {"name": "Benedict з песто (½ порції) і руколою (соус не потрібен)"},
    75: {"name": "Сендвіч з хумусом та овочами (Greek Style)"},
    76: {"name": "Сендвіч 2.0: курка гриль + йогуртово-спеційний соус"},
    77: {"name": "Сендвіч 2.0: печені овочі + песто + сир"},
    78: {"name": "Сендвіч з курячим філе та авокадо + гірчично-йогуртова намазанка"},
    79: {"name": "Сендвіч з індичкою, моцарелою та песто + салат"},
    80: {"name": "Сендвіч «Яйце-авокадо» з хрустким беконом + салат"},
    81: {"name": "Бутерброди з курячим філе, йогуртовим соусом і огірком", "caloriesPerServing": 418, "proteinGramsPerServing": 38, "fatGramsPerServing": 13, "carbsGramsPerServing": 37},
    82: {"name": "Сендвічі з тунцем, яйцем і крем-сиром"},
    84: {"name": "Сендвічі з індичкою, крем-сиром і руколою"},
    93: {"name": "Піта з фалафелем, йогуртовим соусом і овочами"},
    94: {"name": "Лаваш з яйцем, сиром і зеленню"},
    97: {"name": "Сніданковий буріто з яйцем та овочами"},
    99: {"name": "Рол у лаваші з індичкою, яйцем і шпинатом + йогуртовий соус"},
    100: {"name": "Рол у лаваші з курячим філе, хумусом і овочами"},
    105: {"name": "Яйця, запечені в авокадо"},
    107: {"name": "Солоний сирник із зеленню та сметаною"},
    112: {"name": "Кіноа з курячим філе, авокадо та зеленню"},
    113: {"name": "Кіноа з курячим філе, шпинатом і крем-сиром"},
    114: {"name": "Гречка з індичкою, йогуртовим соусом і огірком"},
    115: {"name": "Контейнер «Яйця + хумус + овочі» + хлібці"},
    116: {"name": "Кіноа з авокадо та яйцем"},
    118: {"name": "Тепла гречка з яйцем пашот і маслом"},
    120: {"name": "Боул з гречкою, яйцем і авокадо"},
    122: {"name": "Салат-боул «Лосось + яйце + авокадо» (без хліба)"},
    123: {"name": "Боул з квасолею, яйцями та авокадо + йогуртно-гірчична заправка і сендвіч", "preparationTimeMinMinutes": 15, "preparationTimeMaxMinutes": 15},
    125: {"name": "Сирний боул з індичкою та овочами"},
    126: {"name": "Боул з куркою, овочами та рисом басматі + соєво-лимонна заправка"},
    127: {"name": "Боул з білою кіноа та філе білої риби, броколі й цвітна капуста + песто та теріякі", "preparationTimeMinMinutes": 22, "preparationTimeMaxMinutes": 22},
    129: {"name": "Гречаний боул з яйцями, авокадо та салатом"},
    131: {"name": "Гречаний боул з шинкою, яйцями, авокадо та хрустким беконом"},
    132: {"name": "Сир зернистий з лососем і огірком"},
    133: {"name": "Салат із лососем, авокадо та зеленню"},
    134: {"name": "Вега: тофу-скрембл з грибами та куркумою + лаваш-хрустики"},
    130: {"name": "Боул з кіноа, тофу, броколі та солодкою кукурудзою + арахісово-лаймова заправка"},
    145: {"name": "Млинці з сиром"},
    147: {"name": "Сирники з йогуртом"},
    149: {
        "name": "Лінива вівсянка з йогуртом і ягодами",
        "caloriesPerServing": 384, "proteinGramsPerServing": 14, "fatGramsPerServing": 11, "carbsGramsPerServing": 62,
        "ingredients": [
            ParsedIngredient("Вівсяні пластівці", 50, "g"), ParsedIngredient("Йогурт натуральний", 150, "g"),
            ParsedIngredient("Молоко", 50, "ml"), ParsedIngredient("Ягоди", 150, "g"), ParsedIngredient("Мед", 5, "g"),
        ],
    },
    155: {"name": "Вівсянка «кафе-версія» 2.0 з яблуком і корицею + йогурт"},
    152: {"name": "Манна каша на молоці з протеїном"},
    153: {"name": "Рисова каша на молоці з вершковим маслом"},
    157: {"name": "Сендвіч «Сир кисломолочний + ягоди» (солодкий, але білковий)"},
    159: {"name": "Вівсянка «кафе-версія» з яблуком і корицею + йогурт"},
    163: {"name": "Смузі-боул зі шпинатом, бананом та ягодами + протеїн"},
    164: {"name": "Йогурт-боул з інжиром, гранолою та медом + протеїн"},
    165: {"name": "Боул «Banoffee»: творог 20%, банан, какао, кеш’ю + солона карамель без цукру"},
    166: {"name": "Сирний боул з ягодами, арахісовою пастою та льоном"},
    167: {"name": "Йогурт-боул з манго, чіа та кеш’ю + протеїн"},
    169: {"name": "Кіноа з йогуртом, грушею та родзинками + мигдаль"},
    172: {"name": "Боул «Піна-колада» з ананасом, кокосом та протеїном"},
    173: {"name": "Боул «Персик-фісташка»: зернистий сир, крем-сир, персик + мигдальні пластівці"},
    174: {
        "name": "Боул «Персик-фісташка» з протеїном: зернистий сир, крем-сир, персик + мигдальні пластівці",
        "caloriesPerServing": 686, "proteinGramsPerServing": 63, "fatGramsPerServing": 32, "carbsGramsPerServing": 44,
    },
    176: {"name": "Класична сирна запіканка"},
    181: {"name": "Крем-боул з протеїном, вишнею та шоколадною ноткою"},
    184: {
        "caloriesPerServing": 303, "proteinGramsPerServing": 4, "fatGramsPerServing": 13, "carbsGramsPerServing": 45,
        "ingredients": [
            ParsedIngredient("Груша", 1, "pcs"), ParsedIngredient("Волоські горіхи", 20, "g"), ParsedIngredient("Мед", 5, "g"),
        ],
    },
    188: {"name": "Вишнево-шоколадний протеїн-боул + рисові хлібці"},
    187: {"name": "Шоколадний чіа-пудинг з протеїном, малиною та гірким шоколадом"},
    192: {
        "name": "Йогурт у банці з фруктами",
        "ingredients": [
            ParsedIngredient("Йогурт натуральний", 200, "g"), ParsedIngredient("Банан", 0.5, "pcs"),
            ParsedIngredient("Яблуко", 0.5, "pcs"), ParsedIngredient("Мед", 5, "g"),
        ],
    },
    197: {"name": "Хелзі English breakfast light"},
    193: {"name": "Overnight oats у банці: йогурт безлактозний, груша, протеїн"},
    194: {"name": "Йогурт-банка «Шоколад-банан» з протеїном і гірким шоколадом"},
    198: {"name": "Вівсянка по-англійськи (високобілкова)"},
    199: {"caloriesPerServing": 394, "proteinGramsPerServing": 35, "fatGramsPerServing": 13, "carbsGramsPerServing": 34},
    205: {"ingredients": [
        ParsedIngredient("Грецький йогурт", 220, "g"), ParsedIngredient("Гранола", 35, "g"),
        ParsedIngredient("Ягоди", 170, "g"), ParsedIngredient("Насіння чіа", 8, "g"),
        ParsedIngredient("Арахісова паста", 10, "g"),
    ]},
    203: {"name": "Омлет з сиром та томатами"},
    204: {"name": "Avocado toast з яйцями (Cafe-Style)"},
    206: {"name": "Скрембл з овочами (Café Scramble)"},
    207: {"name": "Японський рисовий боул з яйцем (Light Don)"},
    208: {"name": "Лосось-дон light (рисовий боул з лососем)"},
    200: {"name": "Йогуртовий боул з мюслі"},
    209: {"name": "Хачапурі light на лаваші"},
    212: {"name": "Омлет капрезе light (моцарела + томати + базилік)"},
    214: {"name": "Омлет з фетою та овочами (Greek Style)"},
    215: {"name": "Турецький сніданок light (тарілка балансу)"},
    216: {"name": "Чилбір light (йогурт + яйця + спеції)"},
    217: {"name": "Менемен light (яйця з томатами та перцем)"},
    218: {"name": "Сирники хелзі (без доданого цукру)"},
    221: {"name": "Тортилья з яйцями та авокадо (Healthy Breakfast Wrap)"},
    222: {"name": "Мексиканський боул з рисом та квасолею (Light)"},
    223: {"name": "Яйця по-мексиканськи light (Huevos-Style)"},
    225: {"name": "Омлет по-корейськи з овочами (Gyeran-mari Light)"},
    226: {"name": "Боул з лососем та овочами (Korean-Inspired Light)"},
    227: {"name": "В’єтнамський рисовий боул з куркою та зеленню"},
    228: {"name": "В’єтнамський омлет з зеленню та овочами (Light)"},
    229: {"name": "Рисова локшина light з яйцем та зеленню (Pho-Style Quick)"},
    230: {"name": "Тайський рис з яйцями та овочами (Thai-Style Light)"},
    231: {"name": "Тайський боул з куркою та запеченим цукіні (Light)"},
    232: {"name": "Тайський фруктовий боул з йогуртом та насінням (Light)"},
    234: {"name": "Скандинавський сендвіч зі скумбрією та огірком"},
    210: {"name": "Творог з зеленню та волоськими горіхами", "caloriesPerServing": 444, "proteinGramsPerServing": 46, "fatGramsPerServing": 24, "carbsGramsPerServing": 17},
}

DINNER_PAGE_OVERRIDES: dict[int, dict] = {
    18: {"name": "Тріска з травами та печеною цвітною капустою"},
    23: {"name": "Мідії в томатному соусі", "caloriesPerServing": 391, "proteinGramsPerServing": 31, "fatGramsPerServing": 16, "carbsGramsPerServing": 30},
    25: {"name": "Форель з квасолею та цедрою лимона"},
    30: {"name": "Індичка з грибами та шпинатом", "preparationTimeMinMinutes": 22, "preparationTimeMaxMinutes": 28},
    32: {"preparationTimeMinMinutes": 16, "preparationTimeMaxMinutes": 20},
    33: {"name": "Курка з печеними овочами та тахіні-соусом"},
    35: {"name": "Курка карі з цвітною капустою"},
    42: {"name": "Яловичина гриль з руколою"},
    43: {"name": "Тефтелі в томатному соусі з кабачком", "preparationTimeMinMinutes": 30, "preparationTimeMaxMinutes": 35},
    46: {"name": "Чилі лайт з яловичиною та перцем"},
    47: {"name": "Стейк з яловичини та спаржа"},
    48: {"preparationTimeMinMinutes": 30, "preparationTimeMaxMinutes": 35},
    49: {"name": "Телячі медальйони з огірком та авокадо"},
    55: {"name": "Тофу в томатному соусі з баклажаном"},
    56: {"name": "Тофу-скрембл зі шпинатом"},
    57: {"name": "Темпе з печеними овочами та тахіні-соусом"},
    58: {"preparationTimeMinMinutes": 18, "preparationTimeMaxMinutes": 22},
    59: {"preparationTimeMinMinutes": 12, "preparationTimeMaxMinutes": 15},
    60: {"preparationTimeMinMinutes": 15, "preparationTimeMaxMinutes": 20},
    62: {"preparationTimeMinMinutes": 16, "preparationTimeMaxMinutes": 20},
    63: {"name": "Тофу з карі та цвітною капустою", "preparationTimeMinMinutes": 25, "preparationTimeMaxMinutes": 30},
    66: {"preparationTimeMinMinutes": 25, "preparationTimeMaxMinutes": 30},
    67: {"preparationTimeMinMinutes": 25, "preparationTimeMaxMinutes": 30},
    69: {"preparationTimeMinMinutes": 28, "preparationTimeMaxMinutes": 28},
    70: {"preparationTimeMinMinutes": 28, "preparationTimeMaxMinutes": 28},
    78: {"preparationTimeMinMinutes": 8, "preparationTimeMaxMinutes": 12},
    79: {"name": "Яйця пашот з авокадо та тостом"},
    # The source omits carbs on page 83; 16 g is implied by 389 kcal, 41 g protein and 18 g fat.
    81: {"name": "Фрітата «Броколі-пармезан»"},
    83: {"name": "Сир «Тзадзикі-боул» з огірком і зеленню", "caloriesPerServing": 389, "proteinGramsPerServing": 41, "fatGramsPerServing": 18, "carbsGramsPerServing": 16, "preparationTimeMinMinutes": 8, "preparationTimeMaxMinutes": 12},
    84: {"preparationTimeMinMinutes": 7, "preparationTimeMaxMinutes": 10},
    85: {"name": "Яєчня «Чері-рукола»", "preparationTimeMinMinutes": 8, "preparationTimeMaxMinutes": 12},
    92: {"caloriesPerServing": 661, "proteinGramsPerServing": 39, "fatGramsPerServing": 30, "carbsGramsPerServing": 64},
    91: {"name": "Рис «Креветки Wok» з овочами"},
    93: {"caloriesPerServing": 596, "proteinGramsPerServing": 50, "fatGramsPerServing": 13, "carbsGramsPerServing": 70, "preparationTimeMinMinutes": 22, "preparationTimeMaxMinutes": 28},
    96: {"preparationTimeMinMinutes": 25, "preparationTimeMaxMinutes": 30},
    98: {"preparationTimeMinMinutes": 25, "preparationTimeMaxMinutes": 30},
    102: {"preparationTimeMinMinutes": 15, "preparationTimeMaxMinutes": 20},
    103: {"preparationTimeMinMinutes": 12, "preparationTimeMaxMinutes": 15},
    105: {"name": "Салат «Тунець-квасоля» з томатами"},
    107: {"name": "Спаржа з лососем «Лимонний мінімал»"},
    108: {"name": "Цвітна капуста «Паприка-гриль» з нутом", "preparationTimeMinMinutes": 25, "preparationTimeMaxMinutes": 30},
    114: {"name": "Крем-суп «Броколі + курка»", "preparationTimeMinMinutes": 22, "preparationTimeMaxMinutes": 28},
    115: {
        "caloriesPerServing": 571, "proteinGramsPerServing": 57, "fatGramsPerServing": 11, "carbsGramsPerServing": 62,
        "preparationTimeMinMinutes": 25, "preparationTimeMaxMinutes": 30,
    },
    116: {"name": "Місо-суп «Тофу + яйце»", "caloriesPerServing": 332, "proteinGramsPerServing": 34, "fatGramsPerServing": 18, "carbsGramsPerServing": 11},
    117: {"name": "Рибний суп «Тріска + овочі»"},
    118: {"name": "Курячий суп «Овочі + білок»", "preparationTimeMinMinutes": 23, "preparationTimeMaxMinutes": 28},
    119: {"name": "Крем-суп «Цвітна капуста + курка + пармезан»"},
    120: {"name": "Том ям «Лайт-білок» з креветками", "preparationTimeMinMinutes": 12, "preparationTimeMaxMinutes": 16},
    125: {"name": "Яловичина «One-pot» з овочами"},
    121: {"name": "Рагу «Індичка + овочі» в томаті"},
    122: {"name": "Нут «Середземноморське рагу» з баклажаном"},
    127: {"preparationTimeMinMinutes": 15, "preparationTimeMaxMinutes": 20},
    132: {"preparationTimeMinMinutes": 15, "preparationTimeMaxMinutes": 20},
    129: {"name": "Сирники «Солоні» зі шпинатом (без борошна)"},
    130: {"name": "Крем-суп «Гарбуз + курка» (білковий)"},
    134: {"name": "Боул «Тунець + яйце» (супер сито, супер швидко)", "preparationTimeMinMinutes": 12, "preparationTimeMaxMinutes": 15},
    135: {"name": "Омлет-рулет «Сир + зелень»"},
    139: {"name": "Яловичі котлетки з грибною підливкою та огірковим салатом"},
    140: {"name": "Курячі котлетки з зеленим горошком і соусом «Песто-йогурт»"},
    141: {"name": "Домашні котлетки з картопляним пюре"},
    142: {"name": "Котлетки з індички з гарбузовим пюре та часником"},
    144: {"name": "Яловичі котлетки з пюре з цвітної капусти та грибним соусом"},
    146: {"name": "Котлетки з індички та грибів у кремовій підливі"},
    147: {"name": "Нутові котлетки «Фалафель-лайт» з соусом тахіні-йогурт"},
    149: {"name": "Овочеві котлетки «Три кольори» з фетою та йогуртовим дипом"},
    150: {"name": "Сирно-шпинатні котлетки з огірково-кроповим салатом"},
    151: {"name": "Рибні котлетки з білої риби з зеленим салатом і лимоном"},
    153: {"name": "Лососеві котлетки з огірково-авокадним салатом та кунжутом"},
    154: {"name": "Фрикадельки в томаті з овочевим гарніром"},
    155: {"name": "Фрикадельки в соусі «Теріякі-лайт» з броколі та кунжутом"},
    157: {"preparationTimeMinMinutes": 25, "preparationTimeMaxMinutes": 30},
}

BREAKFAST_TITLE_ALIASES: dict[int, list[str]] = {
    53: ["Авокадо-сендвіч з хумусом лимонною ноткою р", "Авокадо-сендвіч з хумусом і лимонною ноткою от а"],
    76: ["2.0: курка гриль + \\", "2.0: курка гриль + \\"],
    83: ["Відкритий сендвіч у, ія зано одно чим альо р ль чиї мч ро юю ро рою р у a т"],
    120: ["Боул з гречкою, яйцем авокадо a", "Боул з гречкою, яйцем авокадо"],
    126: ["Боул з куркою, у усу г жі ру 6 . я"],
    127: ["Боул з білою кіноа жи a рн о роя"],
    130: ["Боул з кіноа, тофу, фе нар гак “ “ ась\"льчіни і сьчін ра ссьччіісьчи ом"],
    134: [": тофу-скрембл з"],
    165: ["Боул “ ”: \\ борін: п/р о a"],
    168: ["Боул \"груша-какао\" гимарл учили а льзчият ат\" р"],
    188: ["Вишнево-шоколадний гук ркероа тр 1 фону гра ро ре дозу ро плини"],
    205: ["Боул з гранолою й"],
}

DINNER_TITLE_ALIASES: dict[int, list[str]] = {
    157: ["Азійський суп з фрикадельками, бибами та водоростями"],
}


@dataclass(frozen=True)
class BookConfig:
    meal_type: str
    source: Path
    output: Path
    categories: tuple[tuple[range, str], ...]

    @property
    def recipe_pages(self) -> tuple[int, ...]:
        return tuple(page for pages, _ in self.categories for page in pages)


BREAKFAST = BookConfig(
    meal_type="breakfast",
    source=Path("refs/Корисні_і_смачні_сніданки_дієтолога_v2_0.pdf"),
    output=Path("public/imported-recipes/breakfasts-pdf"),
    categories=(
        (range(13, 40), "breakfast-eggs"),
        (range(42, 45), "breakfast-hearty-grains"),
        (range(47, 89), "breakfast-bread"),
        (range(91, 102), "breakfast-street-style"),
        (range(104, 110), "breakfast-quick"),
        (range(112, 135), "breakfast-healthy-plates"),
        (range(138, 161), "breakfast-classic-sweet"),
        (range(163, 179), "breakfast-sweet-plates"),
        (range(181, 189), "breakfast-balanced-desserts"),
        (range(191, 195), "breakfast-in-a-jar"),
        (range(197, 233), "breakfast-world"),
        (range(234, 235), "breakfast-world"),
    ),
)

DINNER = BookConfig(
    meal_type="dinner",
    source=Path("refs/Корисні_та_смачні_вечері,_Великий_збірник_.pdf"),
    output=Path("public/imported-recipes/dinners-pdf"),
    categories=(
        (range(17, 27), "dinner-fish"),
        (range(29, 39), "dinner-poultry-protein"),
        (range(41, 51), "dinner-red-meat"),
        (range(53, 61), "dinner-vegetarian"),
        (range(62, 64), "dinner-vegetarian"),
        (range(66, 76), "dinner-legumes"),
        (range(78, 88), "dinner-eggs-cheese"),
        (range(90, 100), "dinner-complete-plate"),
        (range(102, 112), "dinner-light-vegetables"),
        (range(114, 123), "dinner-soups-stews"),
        (range(125, 136), "dinner-mixed"),
        (range(138, 158), "dinner-cutlets-meatballs"),
    ),
)


def main() -> None:
    args = parse_args()
    books = (BREAKFAST, DINNER) if args.meal == "all" else (BREAKFAST if args.meal == "breakfast" else DINNER,)
    for book in books:
        extract_book(book, args)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--meal", choices=("all", "breakfast", "dinner"), default="all")
    parser.add_argument("--work", type=Path)
    parser.add_argument("--keep-work", action="store_true")
    parser.add_argument("--pages", type=int, nargs="*")
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--pdftoppm", default=find_binary("pdftoppm"))
    parser.add_argument("--tesseract", default=find_binary("tesseract"))
    return parser.parse_args()


def extract_book(book: BookConfig, args: argparse.Namespace) -> None:
    source = book.source.resolve()
    output = book.output.resolve()
    pages = tuple(args.pages or book.recipe_pages)
    own_work = args.work is None
    work = (args.work / book.meal_type).resolve() if args.work else Path(tempfile.mkdtemp(prefix=f"meal-planner-{book.meal_type}-pdf-"))
    work.mkdir(parents=True, exist_ok=True)
    output.mkdir(parents=True, exist_ok=True)
    (output / "images").mkdir(exist_ok=True)
    recipes: list[dict] = []
    failures: list[str] = []
    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as pool:
        futures = {pool.submit(extract_page, book, source, output, work, page, args.pdftoppm, args.tesseract): page for page in pages}
        for index, future in enumerate(as_completed(futures), 1):
            page = futures[future]
            try:
                recipes.append(apply_page_overrides(book, future.result()))
            except Exception as error:
                failures.append(f"page {page}: {error}")
            print(f"[{book.meal_type} {index}/{len(pages)}] PDF page {page}", flush=True)
    recipes.sort(key=lambda recipe: recipe["sourcePage"])
    remove_ambiguous_aliases(recipes)
    report = validate_dataset(recipes, pages, failures)
    (output / "validation-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if report["errors"]:
        raise SystemExit(f"{book.meal_type} extraction failed validation")
    (output / "recipes.json").write_text(json.dumps(recipes, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if own_work and not args.keep_work:
        shutil.rmtree(work)


def extract_page(book: BookConfig, source: Path, output: Path, work: Path, page: int, pdftoppm: str, tesseract: str) -> dict:
    parsed_path = work / f"parsed-v1-{page:03d}.json"
    if parsed_path.exists():
        recipe = json.loads(parsed_path.read_text(encoding="utf-8"))
        if "name" not in (BREAKFAST_PAGE_OVERRIDES.get(page, {}) if book.meal_type == "breakfast" else {}):
            image = Image.open(work / f"page-{page:03d}.png").convert("RGB")
            recipe["name"] = extract_title(image, work, page, tesseract)
        return recipe
    image_path = work / f"page-{page:03d}.png"
    if not image_path.exists():
        subprocess.run([
            pdftoppm, "-f", str(page), "-l", str(page), "-r", "180", "-png", "-singlefile",
            str(source), str(image_path.with_suffix("")),
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    image = Image.open(image_path).convert("RGB")
    if image.width not in range(3598, 3602) or image.height != 2025:
        raise ValueError(f"unexpected rendered size {image.size}")
    title = extract_title(image, work, page, tesseract)
    nutrition_text = ocr_crop(image, (60, 400, 2050, 820), work / f"nutrition-{page:03d}.png", tesseract, 12)
    nutrition = parse_nutrition(nutrition_text)
    if nutrition is None:
        nutrition = parse_nutrition(ocr_crop(image, (40, 0, 2200, 900), work / f"nutrition-wide-{page:03d}.png", tesseract, 6))
    if nutrition is None:
        nutrition = parse_nutrition(ocr_crop(image, (0, 0, image.width, 1200), work / f"nutrition-full-{page:03d}.png", tesseract, 6))
    ingredients = parse_ingredients(ocr_crop(image, (50, 650, 2250, 1500), work / f"ingredients-{page:03d}.png", tesseract, 6))
    left_steps, right_steps = ocr_instruction_columns(image_path, tesseract)
    instructions = parse_instructions(left_steps, right_steps)
    time_range = parse_time_range(ocr_time(image, work / f"time-{page:03d}.png", tesseract))
    if time_range is None:
        time_range = parse_time_range(ocr_crop(image, (2250, 0, image.width, 1200), work / f"time-wide-{page:03d}.png", tesseract, 11))
    overrides = BREAKFAST_PAGE_OVERRIDES if book.meal_type == "breakfast" else DINNER_PAGE_OVERRIDES
    override = overrides.get(page, {})
    if "caloriesPerServing" in override:
        nutrition = {key: override[key] for key in (
            "caloriesPerServing", "proteinGramsPerServing", "fatGramsPerServing", "carbsGramsPerServing"
        )}
    if "ingredients" in override:
        ingredients = override["ingredients"]
    if "preparationTimeMinMinutes" in override:
        time_range = (override["preparationTimeMinMinutes"], override["preparationTimeMaxMinutes"])
    missing = [label for label, value in (("title", title), ("nutrition", nutrition), ("time", time_range), ("ingredients", ingredients), ("instructions", instructions)) if not value]
    if missing:
        raise ValueError(f"missing {', '.join(missing)}")
    category = next(category for pages, category in book.categories if page in pages)
    photo_name = f"page-{page:03d}.webp"
    photo_path = output / "images" / photo_name
    image.crop((2150, 30, min(3550, image.width), 1430)).resize((1200, 1200), Image.Resampling.LANCZOS).save(photo_path, "WEBP", quality=84, method=6)
    if not 0 < photo_path.stat().st_size <= 2 * 1024 * 1024:
        raise ValueError("invalid image size")
    recipe = {
        "sourcePage": page,
        "mealType": book.meal_type,
        "name": title,
        "instructions": instructions,
        **nutrition,
        "preparationTimeMinMinutes": time_range[0],
        "preparationTimeMaxMinutes": time_range[1],
        "subcategoryId": category,
        "ingredients": [ingredient.__dict__ for ingredient in ingredients],
        "image": f"/imported-recipes/{book.meal_type}s-pdf/images/{photo_name}",
        "imageWidth": 1200,
        "imageHeight": 1200,
    }
    parsed_path.write_text(json.dumps(recipe, ensure_ascii=False), encoding="utf-8")
    return recipe


def extract_title(image: Image.Image, work: Path, page: int, tesseract: str) -> str:
    cached = work / f"title-v4-{page:03d}.txt"
    if cached.exists():
        return clean_extracted_title(cached.read_text(encoding="utf-8").strip())
    page_path = work / f"page-{page:03d}.png"
    result = subprocess.run(
        [tesseract, str(page_path), "stdout", "-l", "ukr+eng", "--psm", "11", "tsv"],
        check=True, capture_output=True, text=True,
    )
    lines: dict[tuple[int, int, int], list[tuple[int, int, str]]] = {}
    for raw in result.stdout.splitlines()[1:]:
        fields = raw.split("\t", 11)
        if len(fields) != 12 or not fields[11].strip():
            continue
        left, top, height, confidence = int(fields[6]), int(fields[7]), int(fields[9]), float(fields[10])
        if left >= 2100 or not 100 <= top < 580 or height < 55 or confidence < 25:
            continue
        lines.setdefault((int(fields[2]), int(fields[3]), int(fields[4])), []).append((left, top, fields[11].strip()))
    ordered = [" ".join(word for _, _, word in sorted(words)) for _, words in sorted(
        lines.items(), key=lambda item: min(row[1] for row in item[1]) if item[1] else 0
    )]
    title = clean_extracted_title(parse_title("\n".join(ordered)))
    cached.write_text(title, encoding="utf-8")
    return title


def clean_extracted_title(value: str) -> str:
    value = re.sub(r"\s+\d+\s*г(?:\s+\d+\s*г?)*.*$", "", value, flags=re.I)
    value = re.sub(r"\b3\b", "з", value)
    replacements = {
        "песта": "песто", "коем-чилі": "крем-чилі", "бринзою": "бринзою",
        "тягуугччим": "тягучим", "панкенйки": "панкейки", "протеїн": "протеїн",
        "ротеїн": "протеїн", "гроанолою": "гранолою", "тачасником": "та часником",
        "ка пустою": "капустою", "цевитною": "цвітною", "гунцем": "тунцем",
        "чечня": "яєчня", "брокол ": "броколі ", "дазійська": "азійська",
        "тушшкована": "тушкована", "язловичі": "яловичі", "фрикапепь": "фрикадель",
        "бибами": "грибами", "скуморією": "скумбрією",
    }
    for source, target in replacements.items():
        value = re.sub(re.escape(source), target, value, flags=re.I)
    value = re.sub(r"\s+(?:ота|сота|тот|кози|мготу|фут)\s*$", "", value, flags=re.I)
    return re.sub(r"\s+", " ", value).strip(" -—,+/)")


def parse_time_range(text: str) -> tuple[int, int] | None:
    values = [int(value) for value in re.findall(r"\d{1,3}", text)]
    if not values:
        return None
    minimum, maximum = (values[0], values[1]) if len(values) > 1 else (values[0], values[0])
    if minimum > maximum:
        minimum, maximum = maximum, minimum
    return minimum, maximum


def apply_page_overrides(book: BookConfig, recipe: dict) -> dict:
    overrides = BREAKFAST_PAGE_OVERRIDES if book.meal_type == "breakfast" else DINNER_PAGE_OVERRIDES
    title_aliases = BREAKFAST_TITLE_ALIASES if book.meal_type == "breakfast" else DINNER_TITLE_ALIASES
    override = overrides.get(recipe["sourcePage"], {})
    result = {**recipe}
    for key, value in override.items():
        result[key] = [item.__dict__ for item in value] if key == "ingredients" else value
    target_name = apply_fixes(result["name"]).casefold()
    aliases = [recipe["name"], *title_aliases.get(recipe["sourcePage"], [])]
    unique_aliases = []
    seen = set()
    for alias in aliases:
        normalized = apply_fixes(alias).casefold()
        if normalized == target_name or normalized in seen:
            continue
        seen.add(normalized)
        unique_aliases.append(alias)
    if unique_aliases:
        result["previousNames"] = unique_aliases
    return result


def remove_ambiguous_aliases(recipes: list[dict]) -> None:
    counts: dict[str, int] = {}
    for recipe in recipes:
        for alias in recipe.get("previousNames", []):
            normalized = apply_fixes(alias).casefold()
            counts[normalized] = counts.get(normalized, 0) + 1
    for recipe in recipes:
        aliases = [alias for alias in recipe.get("previousNames", []) if counts[apply_fixes(alias).casefold()] == 1]
        if aliases:
            recipe["previousNames"] = aliases
        else:
            recipe.pop("previousNames", None)


def ocr_instruction_columns(image_path: Path, tesseract: str) -> tuple[str, str]:
    result = subprocess.run(
        [tesseract, str(image_path), "stdout", "-l", "ukr+eng", "--psm", "3", "tsv"],
        check=True,
        capture_output=True,
        text=True,
    )
    rows = []
    for raw in result.stdout.splitlines()[1:]:
        fields = raw.split("\t", 11)
        if len(fields) != 12 or not fields[11].strip():
            continue
        rows.append({
            "block": int(fields[2]),
            "paragraph": int(fields[3]),
            "line": int(fields[4]),
            "left": int(fields[6]),
            "top": int(fields[7]),
            "text": fields[11].strip(),
        })
    return columns_from_tsv(rows, 1600)


def columns_from_tsv(rows: list[dict], split_x: int) -> tuple[str, str]:
    lines: dict[tuple[int, int, int], list[dict]] = {}
    for row in rows:
        if row["top"] < 1200:
            continue
        lines.setdefault((row["block"], row["paragraph"], row["line"]), []).append(row)
    columns: list[list[tuple[int, str]]] = [[], []]
    for words in lines.values():
        for column_index, fragment in enumerate((
            [item for item in words if item["left"] < split_x],
            [item for item in words if item["left"] >= split_x],
        )):
            if not fragment:
                continue
            fragment.sort(key=lambda item: item["left"])
            columns[column_index].append((min(item["top"] for item in fragment), " ".join(item["text"] for item in fragment)))
    return tuple("\n".join(text for _, text in sorted(column)) for column in columns)  # type: ignore[return-value]


def validate_dataset(recipes: list[dict], pages: tuple[int, ...], failures: list[str]) -> dict:
    errors = list(failures)
    found = [recipe["sourcePage"] for recipe in recipes]
    missing = sorted(set(pages) - set(found))
    if missing:
        errors.append(f"missing pages: {missing}")
    normalized_names = [apply_fixes(recipe["name"]).casefold() for recipe in recipes]
    if len(normalized_names) != len(set(normalized_names)):
        errors.append("duplicate recipe names")
    for recipe in recipes:
        if len(recipe["ingredients"]) < 2:
            errors.append(f"page {recipe['sourcePage']}: fewer than two ingredients")
        if len(recipe["instructions"]) < 60:
            errors.append(f"page {recipe['sourcePage']}: instructions too short")
        if not 0 < recipe["preparationTimeMinMinutes"] <= recipe["preparationTimeMaxMinutes"] <= 1440:
            errors.append(f"page {recipe['sourcePage']}: invalid preparation time")
    return {"expected": len(pages), "extracted": len(recipes), "errors": errors}


if __name__ == "__main__":
    main()
