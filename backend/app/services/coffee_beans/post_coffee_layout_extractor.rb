require "csv"
require "fileutils"
require "securerandom"

module CoffeeBeans
  class PostCoffeeLayoutExtractor
    REGIONS = {
      code: [0.00, 0.00, 0.32, 0.17],
      brand: [0.25, 0.00, 0.75, 0.17],
      roast_level: [0.60, 0.00, 1.00, 0.19],
      name: [0.03, 0.10, 0.97, 0.35],
      country: [0.04, 0.27, 0.96, 0.48],
      description: [0.04, 0.44, 0.96, 0.62],
      flavors: [0.04, 0.58, 0.96, 0.74],
      specs: [0.04, 0.70, 0.96, 1.00]
    }.freeze
    NAME_REGIONS = [
      [0.02, 0.09, 0.98, 0.36],
      [0.32, 0.35, 0.68, 0.48]
    ].freeze
    MIN_REGION_OVERLAP = 0.15

    OCR_OPTIONS = ["--oem", "3", "--psm", "6", "-c", "preserve_interword_spaces=1"].freeze
    NAME_OCR_OPTIONS = [
      ["--oem", "3", "--psm", "7", "-c", "preserve_interword_spaces=1"],
      ["--oem", "3", "--psm", "11", "-c", "preserve_interword_spaces=1"]
    ].freeze
    NAME_VARIANTS = %i[normal high_contrast].freeze

    def self.call(image_path:)
      new(image_path: image_path).call
    end

    def initialize(image_path:)
      @image_path = image_path
    end

    def call
      tsv = tesseract_tsv(lang: "eng")
      words = parse_words(tsv)

      if words.empty?
        text = tsv.to_s.strip.empty? ? nil : tsv.to_s
        return {
          region_texts: text ? { all: text } : {},
          raw_text: text
        }
      end

      region_texts = group_words_by_region(words)
      region_texts[:name] = best_name_text(region_texts[:name])
      region_texts = region_texts.merge(japanese_region_texts)

      {
        region_texts: region_texts,
        raw_text: raw_text(region_texts)
      }
    rescue Ocr::TesseractClient::Error => e
      Rails.logger.warn("Tesseract OCR failed: #{e.class}: #{e.message}")

      {
        region_texts: {},
        raw_text: nil
      }
    end

    private

    attr_reader :image_path

    def tesseract_tsv(lang:)
      Ocr::TesseractClient.call(
        image_path: image_path,
        lang: lang,
        options: OCR_OPTIONS,
        output_format: "tsv"
      )
    rescue ArgumentError => e
      raise unless e.message.include?("unknown keyword")

      Ocr::TesseractClient.call(image_path: image_path)
    end

    def japanese_region_texts
      tsv = tesseract_tsv(lang: "jpn+eng")
      words = parse_words(tsv)
      return {} if words.empty?

      grouped = group_words_by_region(words)
      {
        description_ja: grouped[:description],
        all_ja: grouped[:all]
      }.compact
    rescue Ocr::TesseractClient::Error => e
      Rails.logger.warn("Tesseract Japanese OCR failed: #{e.class}: #{e.message}")
      {}
    end

    def best_name_text(layout_name)
      candidates = ([layout_name] + dedicated_name_candidates).compact
      candidates
        .map { |candidate| clean_name_candidate(candidate) }
        .reject(&:blank?)
        .reject { |candidate| noisy_name_candidate?(candidate) }
        .max_by { |candidate| name_candidate_score(candidate) }
    end

    def dedicated_name_candidates
      return [] unless File.exist?(image_path.to_s)

      NAME_REGIONS.flat_map do |region|
        NAME_VARIANTS.flat_map do |variant|
          cropped_path = write_name_crop(region: region, variant: variant)

          NAME_OCR_OPTIONS.filter_map do |options|
            Ocr::TesseractClient.call(
              image_path: cropped_path,
              lang: "eng",
              options: options
            ).presence
          rescue Ocr::TesseractClient::Error => e
            Rails.logger.warn("Tesseract name OCR failed: #{e.class}: #{e.message}")
            nil
          end
        ensure
          File.delete(cropped_path) if cropped_path && File.exist?(cropped_path)
        end
      end
    rescue LoadError, StandardError => e
      Rails.logger.warn("Coffee name crop OCR failed: #{e.class}: #{e.message}")
      []
    end

    def write_name_crop(region:, variant:)
      require "vips"

      FileUtils.mkdir_p(name_crop_dir)

      image = Vips::Image.new_from_file(image_path.to_s, access: :sequential)
      image = image.autorot if image.respond_to?(:autorot)
      min_x, min_y, max_x, max_y = region
      left = (image.width * min_x).round
      top = (image.height * min_y).round
      width = [(image.width * (max_x - min_x)).round, 1].max
      height = [(image.height * (max_y - min_y)).round, 1].max
      crop = image.crop(left, top, [width, image.width - left].min, [height, image.height - top].min)
      crop = crop.resize(1_600.0 / crop.width) if crop.width < 1_600
      crop = crop.colourspace("b-w")
      crop = crop.linear(1.35, -12) if variant == :high_contrast
      crop = crop.cast("uchar")

      path = name_crop_dir.join("name-#{SecureRandom.hex(8)}.png")
      crop.write_to_file(path.to_s)
      path.to_s
    end

    def parse_words(tsv)
      rows = parse_tsv_rows(tsv)
      return [] unless rows.headers&.include?("level")

      page = rows.find { |row| row["level"].to_i == 1 }
      page_width = positive_integer(page&.[]("width")) || 1
      page_height = positive_integer(page&.[]("height")) || 1

      rows.filter_map do |row|
        next unless row["level"].to_i == 5

        text = row["text"].to_s.strip
        next if text.blank?

        confidence = row["conf"].to_f
        next if confidence.negative?

        left = positive_integer(row["left"]) || 0
        top = positive_integer(row["top"]) || 0
        width = positive_integer(row["width"]) || 0
        height = positive_integer(row["height"]) || 0

        {
          text: text,
          left: left,
          top: top,
          width: width,
          height: height,
          x1: left.to_f / page_width,
          y1: top.to_f / page_height,
          x2: (left + width).to_f / page_width,
          y2: (top + height).to_f / page_height,
          center_x: (left + (width / 2.0)) / page_width,
          center_y: (top + (height / 2.0)) / page_height,
          confidence: confidence
        }
      end
    end

    def parse_tsv_rows(tsv)
      CSV.parse(tsv.to_s, headers: true, col_sep: "\t")
    rescue CSV::MalformedCSVError => e
      Rails.logger.warn("Tesseract TSV parse failed: #{e.class}: #{e.message}")

      parse_tsv_rows_without_csv_quotes(tsv)
    end

    def parse_tsv_rows_without_csv_quotes(tsv)
      lines = tsv.to_s.lines
      headers = lines.first.to_s.chomp.split("\t")
      return CSV::Table.new([]) if headers.empty?

      rows = lines.drop(1).filter_map do |line|
        values = line.chomp.split("\t", headers.length)
        next unless values.length == headers.length

        CSV::Row.new(headers, values)
      end

      CSV::Table.new(rows)
    end

    def group_words_by_region(words)
      region_words = Hash.new { |hash, key| hash[key] = [] }
      region_words[:all] = words

      words.each do |word|
        region = best_region_for(word)

        region_words[region] << word if region
      end

      (REGIONS.keys + [:all]).index_with do |region|
        words_to_text(region_words[region])
      end
    end

    def best_region_for(word)
      scored_regions = REGIONS.filter_map do |region, bounds|
        score = overlap_score(word, bounds)
        [region, score] if score >= MIN_REGION_OVERLAP
      end

      return scored_regions.max_by(&:last)&.first if scored_regions.present?

      fallback_region_for(word)
    end

    def overlap_score(word, bounds)
      min_x, min_y, max_x, max_y = bounds
      overlap_width = [word[:x2], max_x].min - [word[:x1], min_x].max
      overlap_height = [word[:y2], max_y].min - [word[:y1], min_y].max
      return 0 if overlap_width <= 0 || overlap_height <= 0

      word_area = (word[:x2] - word[:x1]) * (word[:y2] - word[:y1])
      return 0 if word_area <= 0

      (overlap_width * overlap_height) / word_area
    end

    def fallback_region_for(word)
      return :flavors if word[:center_y].between?(0.56, 0.75)
      return :specs if word[:center_y] >= 0.68

      nil
    end

    def words_to_text(words)
      return nil if words.blank?

      lines = words
        .sort_by { |word| [word[:top], word[:left]] }
        .chunk_while { |current, next_word| same_line?(current, next_word) }
        .map do |line_words|
          line_words
            .sort_by { |word| word[:left] }
            .map { |word| word[:text] }
            .join(" ")
            .squish
        end

      lines.join("\n").presence
    end

    def same_line?(current, next_word)
      current_midpoint = current[:top] + (current[:height] / 2.0)
      next_midpoint = next_word[:top] + (next_word[:height] / 2.0)
      tolerance = [current[:height], next_word[:height], 12].max

      (current_midpoint - next_midpoint).abs <= tolerance
    end

    def raw_text(region_texts)
      (REGIONS.keys + [:description_ja, :all, :all_ja]).filter_map do |region|
        text = region_texts[region]
        next if text.blank?

        "[#{region}]\n#{text}"
      end.join("\n\n")
    end

    def positive_integer(value)
      integer = value.to_i
      integer.positive? ? integer : nil
    end

    def name_crop_dir
      Rails.root.join("tmp", "coffee_ocr")
    end

    def clean_name_candidate(candidate)
      candidate
        .to_s
        .lines
        .map(&:squish)
        .reject(&:blank?)
        .reject { |line| line.match?(/\b(?:Post\s*Coffee|LIGHT\s*ROAST|MEDIUM\s*ROAST|DARK\s*ROAST)\b/i) }
        .reject { |line| line.match?(/\b[A-Z]{2,4}[-\s]?\d{3,5}\b/i) }
        .max_by { |line| name_candidate_score(line) }
        .to_s
        .gsub(/[|_\[\]{}]/, " ")
        .gsub(/\s+/, " ")
        .squish
    end

    def noisy_name_candidate?(candidate)
      return true if candidate.length < 4
      return true if candidate.length > 80
      return true if candidate.scan(/[A-Za-z]/).length < 3
      return true if candidate.match?(/\b(?:Region|Process|Variety|Elevation|Farmer|Farm|Roast|Date)\b/i)
      return true if candidate.match?(/\b(?:Coffee|Brewed|Books|Music|Movies|Memories|Beloved|Cup)\b/i)

      words = candidate.scan(/[A-Za-z][A-Za-z'\-]*/)
      return true if words.none? { |word| word.length >= 5 }
      return true if words.length >= 3 && words.count { |word| word.length <= 2 } > words.length / 2.0

      symbol_count = candidate.scan(/[^A-Za-z0-9\s'\-]/).length
      symbol_count > candidate.length / 4.0
    end

    def name_candidate_score(candidate)
      letters = candidate.scan(/[A-Za-z]/).length
      words = candidate.scan(/[A-Za-z][A-Za-z'\-]*/).length
      symbols = candidate.scan(/[^A-Za-z0-9\s'\-]/).length

      letters + (words * 3) - (symbols * 5) - (candidate.length > 50 ? 20 : 0)
    end
  end
end
