require "test_helper"

module CoffeeBeans
  class PostCoffeeTextParserTest < ActiveSupport::TestCase
    test "extracts brand country farm and corrected code from raw text" do
      raw_text = <<~TEXT
        10-0816. PostCoffee

        Frinsa Es Jatt

        NDONES
      TEXT

      result = PostCoffeeTextParser.call(raw_text: raw_text)

      assert_equal "PostCoffee", result[:brand]
      assert_equal "INDONESIA", result[:country]
      assert_equal "Frinsa Estate", result[:farm]
      assert_equal "IND-0416", result[:code]
    end

    test "extracts canonical code and post coffee with a space" do
      result = PostCoffeeTextParser.call(raw_text: "IND-0416 Post Coffee INDONESI")

      assert_equal "PostCoffee", result[:brand]
      assert_equal "INDONESIA", result[:country]
      assert_equal "IND-0416", result[:code]
    end

    test "extracts fields from post coffee layout regions" do
      result = PostCoffeeTextParser.call(
        region_texts: {
          code: "IND-0416",
          brand: "PostCoffee",
          roast_level: "LIGHTROAST",
          name: "Frinsa Estate Natural Lactic",
          country: "INDONESIA",
          flavors: "Blueberry / Kiwi / Raspberry / Hibiscus",
          specs: "Region Gunung Cupu Process Natural Lactic Variety Borbor Elevation 1,300m - 1,500m Farmer Fikri Raihan Hakim Farm Weninggalih",
          all: "IND-0416 PostCoffee LIGHTROAST Frinsa Estate Natural Lactic INDONESIA LIMITED"
        }
      )

      assert_equal "PostCoffee", result[:brand]
      assert_equal "IND-0416", result[:code]
      assert_equal "LIGHTROAST", result[:roast_level]
      assert_equal "Frinsa Estate Natural Lactic", result[:name]
      assert_equal "INDONESIA", result[:country]
      assert_equal ["Blueberry", "Kiwi", "Raspberry", "Hibiscus"], result[:flavor_notes]
      assert_equal "Natural Lactic", result[:process]
      assert_equal "Borbor", result[:variety]
      assert_equal "Weninggalih", result[:farm]
      assert_equal true, result[:is_limited]
    end

    test "corrects common ocr mistakes in high value fields" do
      result = PostCoffeeTextParser.call(
        region_texts: {
          code: "IND 0416",
          brand: "P0st C0ffee",
          roast_level: "L1GHT R0AST",
          country: "IND0NESIA",
          all: "P0st C0ffee IND 0416 L1GHT R0AST IND0NESIA"
        }
      )

      assert_equal "PostCoffee", result[:brand]
      assert_equal "IND-0416", result[:code]
      assert_equal "LIGHTROAST", result[:roast_level]
      assert_equal "INDONESIA", result[:country]
    end

    test "returns nil values when fields are not found" do
      result = PostCoffeeTextParser.call(raw_text: "unrelated text")

      assert_nil result[:brand]
      assert_nil result[:country]
      assert_nil result[:farm]
      assert_nil result[:code]
    end

    test "returns an empty hash for nil or empty raw text" do
      assert_equal({}, PostCoffeeTextParser.call(raw_text: nil))
      assert_equal({}, PostCoffeeTextParser.call(raw_text: "   "))
    end
  end
end
