require "test_helper"

module CoffeeBeans
  module Ocr
    class TesseractClientTest < ActiveSupport::TestCase
      FakeStatus = Struct.new(:success?)

      setup do
        @original_env = ENV.to_h.slice(
          "TESSERACT_PATH",
          "TESSERACT_LANG",
          "TESSERACT_TIMEOUT"
        )

        ENV.delete("TESSERACT_PATH")
        ENV.delete("TESSERACT_LANG")
        ENV.delete("TESSERACT_TIMEOUT")
      end

      teardown do
        ENV.delete("TESSERACT_PATH")
        ENV.delete("TESSERACT_LANG")
        ENV.delete("TESSERACT_TIMEOUT")
        @original_env.each { |key, value| ENV[key] = value }
      end

      test "returns stdout from tesseract with default command and language" do
        with_stubbed_singleton(Open3, :capture3, ->(*args) {
          assert_equal [
            "tesseract",
            "C:/tmp/sample image.jpg",
            "stdout",
            "-l",
            "eng+jpn",
            "--oem",
            "1",
            "--psm",
            "6"
          ], args
          ["recognized text", "", FakeStatus.new(true)]
        }) do
          assert_equal "recognized text", TesseractClient.call(image_path: "C:/tmp/sample image.jpg")
        end
      end

      test "uses environment overrides for command language and timeout" do
        ENV["TESSERACT_PATH"] = "C:/Program Files/Tesseract-OCR/tesseract.exe"
        ENV["TESSERACT_LANG"] = "osd"
        ENV["TESSERACT_TIMEOUT"] = "3"

        with_stubbed_singleton(Timeout, :timeout, ->(seconds, &block) {
          assert_equal 3.0, seconds
          block.call
        }) do
          with_stubbed_singleton(Open3, :capture3, ->(*args) {
            assert_equal [
              "C:/Program Files/Tesseract-OCR/tesseract.exe",
              "C:/tmp/sample image.jpg",
              "stdout",
              "-l",
              "osd",
              "--oem",
              "1",
              "--psm",
              "6"
            ], args

            ["recognized text", "", FakeStatus.new(true)]
          }) do
            assert_equal "recognized text", TesseractClient.call(image_path: "C:/tmp/sample image.jpg")
          end
        end
      end

      test "uses explicit options when provided" do
        with_stubbed_singleton(Open3, :capture3, ->(*args) {
          assert_equal [
            "tesseract",
            "sample.png",
            "stdout",
            "-l",
            "eng",
            "--psm",
            "11",
            "tsv"
          ], args
          ["recognized text", "", FakeStatus.new(true)]
        }) do
          assert_equal(
            "recognized text",
            TesseractClient.call(
              image_path: "sample.png",
              lang: "eng",
              options: ["--psm", "11"],
              output_format: "tsv"
            )
          )
        end
      end

      test "raises execution failed when tesseract exits unsuccessfully" do
        with_stubbed_singleton(Open3, :capture3, ["", "cannot read input", FakeStatus.new(false)]) do
          error = assert_raises(TesseractClient::ExecutionFailed) do
            TesseractClient.call(image_path: "missing.jpg")
          end

          assert_equal "cannot read input", error.message
        end
      end

      test "raises command not found when executable is missing" do
        with_stubbed_singleton(Open3, :capture3, ->(*) { raise Errno::ENOENT, "missing tesseract" }) do
          assert_raises(TesseractClient::CommandNotFound) do
            TesseractClient.call(image_path: "sample.jpg")
          end
        end
      end

      test "raises timeout error when tesseract times out" do
        with_stubbed_singleton(Timeout, :timeout, ->(*) { raise Timeout::Error }) do
          assert_raises(TesseractClient::TimeoutError) do
            TesseractClient.call(image_path: "sample.jpg")
          end
        end
      end

      private

      def with_stubbed_singleton(object, method_name, replacement)
        singleton_class = object.singleton_class
        original = object.method(method_name)

        singleton_class.define_method(method_name) do |*args, &block|
          replacement.respond_to?(:call) ? replacement.call(*args, &block) : replacement
        end

        yield
      ensure
        singleton_class.define_method(method_name) do |*args, &block|
          original.call(*args, &block)
        end
      end
    end
  end
end
