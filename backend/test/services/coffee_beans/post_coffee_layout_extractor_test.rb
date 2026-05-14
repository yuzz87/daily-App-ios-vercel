require "test_helper"

module CoffeeBeans
  class PostCoffeeLayoutExtractorTest < ActiveSupport::TestCase
    test "groups tesseract tsv words into post coffee layout regions" do
      with_stubbed_singleton(Ocr::TesseractClient, :call, ->(**kwargs) {
        kwargs[:lang] == "jpn+eng" ? sample_japanese_tsv : sample_tsv
      }) do
        result = PostCoffeeLayoutExtractor.call(image_path: "package.png")

        assert_equal "IND-0416", result[:region_texts][:code]
        assert_equal "LIGHTROAST", result[:region_texts][:roast_level]
        assert_equal "Frinsa Estate", result[:region_texts][:name]
        assert_equal "インドネシア\nブルーベリーの甘さ。", result[:region_texts][:description_ja]
        assert_equal "Blueberry Kiwi", result[:region_texts][:flavors]
        assert_equal "Region Gunung Cupu\nProcess Natural", result[:region_texts][:specs]
        assert_includes result[:raw_text], "[code]\nIND-0416"
        assert_includes result[:raw_text], "[description_ja]\nインドネシア\nブルーベリーの甘さ。"
        assert_includes result[:raw_text], "[specs]\nRegion Gunung Cupu\nProcess Natural"
        assert_includes result[:raw_text], "[all]\nIND-0416 LIGHTROAST"
      end
    end

    test "falls back when tesseract tsv contains unescaped quote text" do
      with_stubbed_singleton(Ocr::TesseractClient, :call, ->(**kwargs) {
        kwargs[:lang] == "jpn+eng" ? sample_japanese_tsv : malformed_quote_tsv
      }) do
        result = PostCoffeeLayoutExtractor.call(image_path: "package.png")

        assert_includes result[:region_texts][:all], "SPR-001"
        assert_includes result[:region_texts][:all], 'Natural "Special'
        assert_includes result[:raw_text], "[all]"
      end
    end

    private

    def sample_tsv
      rows = [
        %w[level page_num block_num par_num line_num word_num left top width height conf text],
        %w[1 1 0 0 0 0 0 0 1000 1000 -1],
        %w[5 1 1 1 1 1 40 40 120 35 92 IND-0416],
        %w[5 1 1 1 1 2 735 45 150 35 90 LIGHTROAST],
        %w[5 1 2 1 1 1 220 170 100 35 91 Frinsa],
        %w[5 1 2 1 1 2 335 170 100 35 91 Estate],
        %w[5 1 3 1 1 1 100 625 130 32 88 Blueberry],
        %w[5 1 3 1 1 2 250 625 70 32 88 Kiwi],
        %w[5 1 4 1 1 1 90 735 90 30 86 Region],
        %w[5 1 4 1 1 2 195 735 100 30 86 Gunung],
        %w[5 1 4 1 1 3 310 735 70 30 86 Cupu],
        %w[5 1 4 1 2 1 90 790 100 30 86 Process],
        %w[5 1 4 1 2 2 205 790 100 30 86 Natural]
      ]

      rows.map { |row| row.join("\t") }.join("\n")
    end

    def sample_japanese_tsv
      rows = [
        %w[level page_num block_num par_num line_num word_num left top width height conf text],
        %w[1 1 0 0 0 0 0 0 1000 1000 -1],
        %w[5 1 1 1 1 1 80 470 220 34 82 インドネシア],
        %w[5 1 1 1 2 1 80 530 260 34 80 ブルーベリーの甘さ。]
      ]

      rows.map { |row| row.join("\t") }.join("\n")
    end

    def malformed_quote_tsv
      rows = [
        %w[level page_num block_num par_num line_num word_num left top width height conf text],
        %w[1 1 0 0 0 0 0 0 1000 1000 -1],
        %w[5 1 1 1 1 1 40 40 120 35 92 SPR-001],
        ["5", "1", "2", "1", "1", "1", "220", "170", "100", "35", "91", 'Natural "Special']
      ]

      rows.map { |row| row.join("\t") }.join("\n")
    end

    def with_stubbed_singleton(object, method_name, replacement)
      singleton_class = object.singleton_class
      original = object.method(method_name)

      singleton_class.define_method(method_name) do |*args, **kwargs, &block|
        if replacement.respond_to?(:call)
          replacement.call(*args, **kwargs, &block)
        else
          replacement
        end
      end

      yield
    ensure
      singleton_class.define_method(method_name) do |*args, **kwargs, &block|
        original.call(*args, **kwargs, &block)
      end
    end
  end
end
