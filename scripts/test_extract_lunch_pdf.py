import unittest

from extract_lunch_pdf import parse_ingredients, parse_instructions, parse_nutrition, parse_title, parse_time


class PdfRecipeParserTest(unittest.TestCase):
    def test_parses_title_and_nutrition(self):
        self.assertEqual(
            parse_title("КУРКА-ГРИЛЬ\nз кіноа, броколі\nта ЛИМОННИМ СОУСОМ\n619 ккал"),
            "Курка-гриль з кіноа, броколі та лимонним соусом",
        )
        self.assertEqual(parse_nutrition("619 ккал на порцію Білки:56 г Жири:25 г Вуглеводи:47 г"), {
            "caloriesPerServing": 619,
            "proteinGramsPerServing": 56,
            "fatGramsPerServing": 25,
            "carbsGramsPerServing": 47,
        })

    def test_parses_time_and_quantified_ingredients(self):
        self.assertEqual(parse_time("30 хв"), 30)
        ingredients = parse_ingredients("""Інгредієнти:
        ✓ Куряче філе — 180 г, часник — 1 зубчик (5 г)
        ✓ Кіноа суха — 40 г (або булгур сухий), сіль — за смаком
        Спосіб приготування:""")
        self.assertEqual([(item.name, item.enteredQuantity, item.enteredUnit) for item in ingredients], [
            ("Куряче філе", 180, "g"),
            ("часник", 5, "g"),
            ("Кіноа суха", 40, "g"),
        ])

    def test_cleans_and_orders_two_column_instructions(self):
        self.assertEqual(
            parse_instructions(
                "Сіль — за смаком\nСпосіб приготування:\n1. Кіноа залийте водою 12.\n2. Залиште на 5 xB.",
                "3. Bnuute соус.\n4. Подавайте.",
            ),
            "1. Кіноа залийте водою 1:2. 2. Залиште на 5 хв. 3. Влийте соус. 4. Подавайте.",
        )


if __name__ == "__main__":
    unittest.main()
