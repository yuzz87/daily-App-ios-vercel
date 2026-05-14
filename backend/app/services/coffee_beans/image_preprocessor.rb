require "fileutils"
require "securerandom"

module CoffeeBeans
  class ImagePreprocessor
    class Error < StandardError; end

    TARGET_WIDTH = 1_800
    LABEL_TARGET_WIDTH = 1_400
    LABEL_REGION = [0.31, 0.33, 0.69, 0.67].freeze
    OUTPUT_FORMAT = ".png"

    def self.call(image_path:)
      new(image_path: image_path).call
    end

    def initialize(image_path:)
      @image_path = Pathname(image_path)
    end

    def call
      require "vips"

      FileUtils.mkdir_p(output_dir)

      image = Vips::Image.new_from_file(image_path.to_s, access: :sequential)
      image = image.autorot if image.respond_to?(:autorot)
      image = label_crop(image)
      image = resize(image)
      image = image.colourspace("b-w")
      image = image.linear(1.15, -8)
      image = image.cast("uchar")
      image.write_to_file(output_path.to_s)

      output_path.to_s
    rescue LoadError, StandardError => e
      raise Error, e.message
    end

    private

    attr_reader :image_path

    def resize(image)
      return image if image.width >= TARGET_WIDTH

      image.resize(TARGET_WIDTH.to_f / image.width)
    end

    def label_crop(image)
      min_x, min_y, max_x, max_y = LABEL_REGION
      left = (image.width * min_x).round
      top = (image.height * min_y).round
      width = [(image.width * (max_x - min_x)).round, 1].max
      height = [(image.height * (max_y - min_y)).round, 1].max
      crop = image.crop(left, top, [width, image.width - left].min, [height, image.height - top].min)
      return image if crop.width < image.width * 0.2 || crop.height < image.height * 0.2

      crop.resize(LABEL_TARGET_WIDTH.to_f / crop.width)
    rescue Vips::Error
      image
    end

    def output_dir
      Rails.root.join("public", "uploads", "coffee_beans", "preprocessed")
    end

    def output_path
      @output_path ||= output_dir.join("#{image_path.basename(".*")}-#{SecureRandom.hex(4)}#{OUTPUT_FORMAT}")
    end
  end
end
