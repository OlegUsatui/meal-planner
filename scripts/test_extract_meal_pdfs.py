import unittest

from extract_meal_pdfs import BREAKFAST, DINNER, columns_from_tsv, parse_time_range, remove_ambiguous_aliases


class MealPdfParserTest(unittest.TestCase):
    def test_recipe_page_ranges_match_book_navigation(self):
        self.assertEqual(len(BREAKFAST.recipe_pages), 200)
        self.assertEqual(len(DINNER.recipe_pages), 120)
        self.assertEqual(BREAKFAST.recipe_pages[0], 13)
        self.assertEqual(BREAKFAST.recipe_pages[-1], 234)
        self.assertEqual(DINNER.recipe_pages[0], 17)
        self.assertEqual(DINNER.recipe_pages[-1], 157)

    def test_preserves_exact_and_ranged_preparation_times(self):
        self.assertEqual(parse_time_range("25 хв"), (25, 25))
        self.assertEqual(parse_time_range("20-25 хв"), (20, 25))
        self.assertEqual(parse_time_range("20–25 хв"), (20, 25))

    def test_reconstructs_instruction_columns_from_word_coordinates(self):
        rows = [
            {"block": 1, "paragraph": 1, "line": 1, "left": 100, "top": 1300, "text": "1."},
            {"block": 1, "paragraph": 1, "line": 1, "left": 160, "top": 1300, "text": "Почніть"},
            {"block": 2, "paragraph": 1, "line": 1, "left": 2100, "top": 1300, "text": "4."},
            {"block": 2, "paragraph": 1, "line": 1, "left": 2160, "top": 1300, "text": "Подайте"},
        ]
        self.assertEqual(columns_from_tsv(rows, 1800), ("1. Почніть", "4. Подайте"))

    def test_removes_aliases_that_cannot_identify_one_source_recipe(self):
        recipes = [
            {"previousNames": ["Однакова стара назва", "Унікальна"]},
            {"previousNames": ["Однакова стара назва"]},
        ]
        remove_ambiguous_aliases(recipes)
        self.assertEqual(recipes, [{"previousNames": ["Унікальна"]}, {}])


if __name__ == "__main__":
    unittest.main()
