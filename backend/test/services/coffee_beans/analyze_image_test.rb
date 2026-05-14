require "test_helper"

module CoffeeBeans
  class AnalyzeImageTest < ActiveSupport::TestCase
    test "puts tesseract result into raw_text without filling mock extraction fields" do
      with_stubbed_singleton(Ocr::TesseractClient, :call, ->(image_path:) {
        assert_equal "sample.jpg", image_path
        "OCR result text"
      }) do
        result = AnalyzeImage.call(image_path: "sample.jpg")

        assert_equal "OCR result text", result[:raw_text]
        assert_nil result[:brand]
        assert_nil result[:code]
        assert_nil result[:country]
        assert_nil result[:farm]
        assert_nil result[:process]
        assert_equal [], result[:flavor_notes]
        assert_equal false, result[:is_limited]
        assert_equal "draft", result[:status]
      end
    end

    test "returns empty extraction with nil raw_text when tesseract fails" do
      logger = CapturingLogger.new

      with_stubbed_singleton(Rails, :logger, logger) do
        with_stubbed_singleton(Ocr::TesseractClient, :call, ->(image_path:) {
          raise Ocr::TesseractClient::ExecutionFailed, "cannot read input"
        }) do
          result = AnalyzeImage.call(image_path: "sample.jpg")

          assert_nil result[:raw_text]
          assert_nil result[:brand]
          assert_nil result[:code]
          assert_nil result[:country]
          assert_nil result[:farm]
          assert_equal [], result[:flavor_notes]
          assert_equal false, result[:is_limited]
          assert_equal ["Tesseract OCR failed: CoffeeBeans::Ocr::TesseractClient::ExecutionFailed: cannot read input"], logger.warnings
        end
      end
    end

    test "returns nil raw_text when tesseract returns an empty string" do
      with_stubbed_singleton(Ocr::TesseractClient, :call, "") do
        result = AnalyzeImage.call(image_path: "sample.jpg")

        assert_nil result[:raw_text]
        assert_nil result[:brand]
        assert_nil result[:code]
        assert_nil result[:country]
        assert_equal [], result[:flavor_notes]
      end
    end

    test "uses preprocessed image path for OCR when preprocessing succeeds" do
      with_stubbed_singleton(ImagePreprocessor, :call, "preprocessed.png") do
        with_stubbed_singleton(Ocr::TesseractClient, :call, ->(image_path:, **_kwargs) {
          assert_equal "preprocessed.png", image_path
          "OCR result text"
        }) do
          result = AnalyzeImage.call(image_path: "sample.jpg")

          assert_equal "OCR result text", result[:raw_text]
        end
      end
    end

    test "falls back to original image path when preprocessing fails" do
      with_stubbed_singleton(ImagePreprocessor, :call, ->(image_path:) {
        assert_equal "sample.jpg", image_path
        raise ImagePreprocessor::Error, "libvips is not available"
      }) do
        with_stubbed_singleton(Ocr::TesseractClient, :call, ->(image_path:, **_kwargs) {
          assert_equal "sample.jpg", image_path
          "OCR result text"
        }) do
          result = AnalyzeImage.call(image_path: "sample.jpg")

          assert_equal "OCR result text", result[:raw_text]
        end
      end
    end

    test "passes original image path to OCR when preprocessing is unavailable for a missing file" do
      with_stubbed_singleton(Ocr::TesseractClient, :call, ->(image_path:, **_kwargs) {
        assert_equal "sample.jpg", image_path
        "OCR result text"
      }) do
        result = AnalyzeImage.call(image_path: "sample.jpg")

        assert_equal "OCR result text", result[:raw_text]
      end
    end

    test "applies parser fields from raw_text while leaving unparsed fields empty" do
      raw_text = <<~TEXT
        10-0816. postcoffee
        Frinsa Es Jatt
        NDONES
      TEXT

      with_stubbed_singleton(Ocr::TesseractClient, :call, raw_text) do
        result = AnalyzeImage.call(image_path: "sample.jpg")

        assert_equal raw_text, result[:raw_text]
        assert_equal "PostCoffee", result[:brand]
        assert_equal "IND-0416", result[:code]
        assert_equal "INDONESIA", result[:country]
        assert_equal "Frinsa Estate", result[:farm]
        assert_nil result[:process]
        assert_nil result[:name]
        assert_equal [], result[:flavor_notes]
        assert_equal false, result[:is_limited]
      end
    end

    test "does not insert PostCoffee sample fields for unrelated raw_text" do
      with_stubbed_singleton(Ocr::TesseractClient, :call, "another coffee package") do
        result = AnalyzeImage.call(image_path: "sample.jpg")

        assert_equal "another coffee package", result[:raw_text]
        assert_nil result[:brand]
        assert_nil result[:code]
        assert_nil result[:country]
        assert_nil result[:farm]
        assert_nil result[:process]
        assert_equal [], result[:flavor_notes]
      end
    end

    test "coffee bean json shape remains unchanged with empty extraction values" do
      with_stubbed_singleton(Ocr::TesseractClient, :call, "another coffee package") do
        result = AnalyzeImage.call(image_path: "sample.jpg")
        coffee_bean = CoffeeBean.new(result.merge(image_url: "/uploads/coffee_beans/sample.jpg"))
        json = coffee_bean.as_json_for_api

        assert_equal [
          :id,
          :image_url,
          :brand,
          :code,
          :roast_level,
          :name,
          :country,
          :name_ja,
          :description_ja,
          :flavor_notes,
          :region,
          :process,
          :variety,
          :elevation,
          :farmer,
          :farm,
          :is_limited,
          :raw_text,
          :status,
          :created_at,
          :updated_at
        ], json.keys
        assert_equal [], json[:flavor_notes]
        assert_nil json[:brand]
        assert_equal "draft", json[:status]
      end
    end

    private

    CapturingLogger = Struct.new(:warnings) do
      def initialize
        super([])
      end

      def warn(message)
        warnings << message
      end
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
