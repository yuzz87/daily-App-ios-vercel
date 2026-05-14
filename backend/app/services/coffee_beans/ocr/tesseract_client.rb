require "open3"
require "timeout"

module CoffeeBeans
  module Ocr
    class TesseractClient
      DEFAULT_COMMAND = "tesseract"
      DEFAULT_LANG = "eng+jpn"
      DEFAULT_OPTIONS = ["--oem", "1", "--psm", "6"].freeze
      DEFAULT_TIMEOUT = 10

      class Error < StandardError; end
      class CommandNotFound < Error; end
      class ExecutionFailed < Error; end
      class TimeoutError < Error; end

      def self.call(image_path:, lang: nil, options: nil, output_format: nil)
        new(
          image_path: image_path,
          lang: lang,
          options: options,
          output_format: output_format
        ).call
      end

      def initialize(image_path:, lang: nil, options: nil, output_format: nil)
        @image_path = image_path
        @lang = lang
        @options = options.nil? ? DEFAULT_OPTIONS : Array(options)
        @output_format = output_format
      end

      def call
        stdout, stderr, status = Timeout.timeout(timeout_seconds) do
          Open3.capture3(*command_args)
        end

        raise ExecutionFailed, error_message(stderr) unless status.success?

        stdout
      rescue Errno::ENOENT => e
        raise CommandNotFound, e.message
      rescue Timeout::Error
        raise TimeoutError, "Tesseract OCR timed out after #{timeout_seconds} seconds"
      end

      private

      attr_reader :image_path, :options, :output_format

      def command
        ENV["TESSERACT_PATH"] || DEFAULT_COMMAND
      end

      def lang
        @lang || ENV["TESSERACT_LANG"] || DEFAULT_LANG
      end

      def command_args
        args = [command, image_path.to_s, "stdout", "-l", lang]
        args.concat(options)
        args << output_format if output_format.present?
        args
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
