require "test_helper"

class Api::CoffeeBeansControllerTest < ActionDispatch::IntegrationTest
  test "analyze creates a draft coffee bean for an allowed uploaded image" do
    upload = uploaded_file(".png", "image/png")

    with_stubbed_singleton(CoffeeBeans::AnalyzeImage, :call, ->(image_path:) {
      assert_match(/\.png\z/, image_path)
      {
        brand: "PostCoffee",
        code: "IND-0416",
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
        raw_text: "OCR text",
        status: "draft"
      }
    }) do
      assert_difference("CoffeeBean.count", 1) do
        post analyze_api_coffee_beans_url, params: { image: upload }
      end
    end

    assert_response :created
    assert_equal "PostCoffee", response.parsed_body["brand"]
  ensure
    upload&.tempfile&.close!
  end

  test "analyze rejects unsupported image formats" do
    upload = uploaded_file(".svg", "image/svg+xml")

    assert_no_difference("CoffeeBean.count") do
      post analyze_api_coffee_beans_url, params: { image: upload }
    end

    assert_response :unprocessable_entity
    assert_equal ["image must be a JPEG, PNG, or WebP file"], response.parsed_body["errors"]
  ensure
    upload&.tempfile&.close!
  end

  test "destroy deletes a coffee bean" do
    coffee_bean = CoffeeBean.create!(
      brand: "PostCoffee",
      flavor_notes: [],
      status: "draft"
    )

    assert_difference("CoffeeBean.count", -1) do
      delete api_coffee_bean_url(coffee_bean)
    end

    assert_response :no_content
  end

  private

  def uploaded_file(extension, content_type)
    file = Tempfile.new(["coffee-package", extension])
    file.binmode
    file.write("test image")
    file.rewind

    Rack::Test::UploadedFile.new(file.path, content_type, original_filename: "coffee-package#{extension}")
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
