module CoffeeBeans
  class AnalyzeImage
    def self.call(image_path:)
      new(image_path: image_path).call
    end

    def initialize(image_path:)
      @image_path = image_path
    end

    def call
      layout = PostCoffeeLayoutExtractor.call(image_path: image_path)
      extraction_data = {
        brand: nil,
        code: nil,
        roast_level: nil,
        name: nil,
        country: nil,
        name_ja: nil,
        description_ja: nil,
        flavor_notes: [],
        region: nil,
        process: nil,
        variety: nil,
        elevation: nil,
        farmer: nil,
        farm: nil,
        is_limited: false,
        raw_text: layout[:raw_text],
        status: "draft"
      }

      ExtractionValidator.call(extraction_data.merge(parsed_fields(layout[:region_texts])))
    end

    private

    attr_reader :image_path

    def parsed_fields(region_texts)
      return {} if region_texts.blank?

      CoffeeBeans::PostCoffeeTextParser.call(region_texts: region_texts).compact
    end
  end
end
