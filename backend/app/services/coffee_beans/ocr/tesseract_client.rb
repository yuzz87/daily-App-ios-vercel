require "open3"
require "timeout"

module CoffeeBeans
  module Ocr
    class TesseractClient
      DEFAULT_COMMAND = "tesseract"
      DEFAULT_LANG = "eng"
      DEFAULT_TIMEOUT = 10

      class Error < StandardError; end
      class CommandNotFound < Error; end
      class ExecutionFailed < Error; end
      class TimeoutError < Error; end

      def self.call(image_path:)
        new(image_path: image_path).call
      end

      def initialize(image_path:)
        @image_path = image_path
      end

      def call
        stdout, stderr, status = Timeout.timeout(timeout_seconds) do
          Open3.capture3(command, image_path.to_s, "stdout", "-l", lang)
        end

        raise ExecutionFailed, error_message(stderr) unless status.success?

        stdout
      rescue Errno::ENOENT => e
        raise CommandNotFound, e.message
      rescue Timeout::Error
        raise TimeoutError, "Tesseract OCR timed out after #{timeout_seconds} seconds"
      end

      private

      attr_reader :image_path

      def command
        ENV["TESSERACT_PATH"] || DEFAULT_COMMAND
      end

      def lang
        ENV["TESSERACT_LANG"] || DEFAULT_LANG
      end

      def timeout_seconds
        (ENV["TESSERACT_TIMEOUT"] || DEFAULT_TIMEOUT).to_f
      end

      def error_message(stderr)
        message = stderr.to_s.strip
        return "Tesseract OCR failed" if message.empty?

        message
      end
    end
  end
end
