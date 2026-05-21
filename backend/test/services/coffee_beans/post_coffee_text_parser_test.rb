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
      assert_nil result[:farm]
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

    test "corrects flavor note and spec label ocr mistakes" do
      result = PostCoffeeTextParser.call(
        region_texts: {
          flavors: "Flavors: 8lueberry / HIB1SCUS / CH0COLATE",
          specs: "REG10N Gunung Cupu PR0CESS Natural Lactic VAR1ETY Borbor ELEVATI0N 1,300m - 1,500m FARNER Fikri Raihan Hakim FARM Weninggalih",
          all: "PostCoffee"
        }
      )

      assert_equal ["Blueberry", "Hibiscus", "Chocolate"], result[:flavor_notes]
      assert_equal "Gunung Cupu", result[:region]
      assert_equal "Natural Lactic", result[:process]
      assert_equal "Borbor", result[:variety]
      assert_equal "1,300m - 1,500m", result[:elevation]
      assert_equal "Fikri Raihan Hakim", result[:farmer]
      assert_equal "Weninggalih", result[:farm]
    end

    test "extracts japanese name and description from japanese description region" do
      result = PostCoffeeTextParser.call(
        region_texts: {
          description_ja: "インドネシア フリンサエステート ナチュラルラクティック\nブルーベリーヨーグルトのような乳酸感のある酸味とベリーの甘さ。",
          all: "PostCoffee"
        }
      )

      assert_equal "インドネシア フリンサエステート ナチュラルラクティック", result[:name_ja]
      assert_equal "ブルーベリーヨーグルトのような乳酸感のある酸味とベリーの甘さ。", result[:description_ja]
    end

    test "extracts usable fields from noisy peru package OCR" do
      result = PostCoffeeTextParser.call(
        region_texts: {
          code: "|",
          brand: "",
          roast_level: "| PER-0722 PostCoffee LIGHTROAST",
          name: "]\ni",
          country: "| PER-0722 PostCoffee LIGHTROAST",
          description: <<~TEXT,
            Mandarin Orange, Loquat, Prune, Sweet
            | | Region Process Cajamarca, Washed Long Cutervo, Fermentation Callayuc (48h)
            Variety Typica, Caturra, Bourbon
            | Elevation 1,800m - 2,000m
          TEXT
          flavors: "4 | Farmer _ : ROAST DATE. © Celso Juver_ Carrasco Diaz, Carlos & Osvaldo Vasquez, bee kee HlRScRiD=] Ebi sian rags an on os",
          specs: "MAKE TIME TO ENJOY A FRESHLY BREWED CUP OF COFFEE BROUGHT TO YOU BY US.",
          description_ja: "刀 5 失 プ や レ か ー な ン や 醇 訣 味 。 枢 九 の み の よ あ う る な IT や わ ぃ ら 余 か な 韻 が T 、 き じ に ん 、 わ 金 り と 打 長 を く 思 統 ゎ せ き る ま B",
          all: <<~TEXT
            | PER-0722 PostCoffee LIGHTROAST
            Mandarin Orange, Loquat, Prune, Sweet
            | | Region Process Cajamarca, Washed Long Cutervo, Fermentation Callayuc (48h)
            Variety Typica, Caturra, Bourbon
            4 | | Farmer _ : Elevation ROAST DATE. © Celso 1,800m Juver_ Carrasco Diaz, - 2,000m Carlos & Osvaldo Vasquez, bee kee HlRScRiD=] Ebi sian rags an on os
          TEXT
        }
      )

      assert_equal "PostCoffee", result[:brand]
      assert_equal "PER-0722", result[:code]
      assert_equal "PERU", result[:country]
      assert_equal "LIGHTROAST", result[:roast_level]
      assert_nil result[:name]
      assert_nil result[:name_ja]
      assert_nil result[:description_ja]
      assert_equal ["Mandarin Orange", "Loquat", "Prune", "Sweet"], result[:flavor_notes]
      assert_equal "Cajamarca, Cutervo, Callayuc", result[:region]
      assert_equal "Washed Long Fermentation (48h)", result[:process]
      assert_equal "Typica, Caturra, Bourbon", result[:variety]
      assert_equal "1,800m - 2,000m", result[:elevation]
      assert_equal "Celso Juver Carrasco Diaz, Carlos & Osvaldo Vasquez", result[:farmer]
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
