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
