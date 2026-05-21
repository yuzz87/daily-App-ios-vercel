class Api::CoffeeBeansController < ApplicationController
  UPLOAD_VALIDATION = MediaUploadService::ValidationOptions.new(
    allowed_extensions: %w[.jpg .jpeg .png .webp],
    allowed_content_types: %w[image/jpeg image/png image/webp],
    max_size: 10.megabytes,
    invalid_type_message: "image must be a JPEG, PNG, or WebP file",
    oversize_message: "image must be 10MB or smaller"
  ).freeze

  before_action :set_coffee_bean, only: [:show, :update, :destroy]

  def index
    coffee_beans = CoffeeBean.order(created_at: :desc)

    render json: coffee_beans.map(&:as_json_for_api)
  end

  def show
    render json: @coffee_bean.as_json_for_api(include_tasting_notes: true)
  end

  def create
    coffee_bean = CoffeeBean.new(coffee_bean_params)
    image = params[:image]

    if image.present?
      unless image.respond_to?(:original_filename) && image.respond_to?(:read)
        render json: { errors: ["image must be a file"] }, status: :unprocessable_entity
        return
      end

      validation_errors = MediaUploadService.validate(image, options: UPLOAD_VALIDATION)
      if validation_errors.present?
        render json: { errors: validation_errors }, status: :unprocessable_entity
        return
      end

      coffee_bean.image_url = save_uploaded_image(image)[:url]
    end

    if coffee_bean.save
      render json: coffee_bean.as_json_for_api, status: :created
    else
      render json: { errors: coffee_bean.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def analyze
    image = params[:image]

    unless image.respond_to?(:original_filename) && image.respond_to?(:read)
      render json: { errors: ["image is required"] }, status: :unprocessable_entity
      return
    end

    validation_errors = MediaUploadService.validate(image, options: UPLOAD_VALIDATION)
    if validation_errors.present?
      render json: { errors: validation_errors }, status: :unprocessable_entity
      return
    end

    saved_image = save_uploaded_image(image)
    extraction_data = ::CoffeeBeans::AnalyzeImage.call(image_path: saved_image[:path])
    coffee_bean = CoffeeBean.new(extraction_data.merge(image_url: saved_image[:url]))

    if coffee_bean.save
      render json: coffee_bean.as_json_for_api, status: :created
    else
      render json: { errors: coffee_bean.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @coffee_bean.update(coffee_bean_params)
      render json: @coffee_bean.as_json_for_api(include_tasting_notes: true)
    else
      render json: { errors: @coffee_bean.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @coffee_bean.destroy
    head :no_content
  end

  private

  def set_coffee_bean
    @coffee_bean = CoffeeBean.find(params[:id])
  end

  def coffee_bean_params
    params.require(:coffee_bean).permit(
      :image_url,
      :brand,
      :code,
      :roast_level,
      :name,
      :country,
      :name_ja,
      :description_ja,
      :region,
      :process,
      :variety,
      :elevation,
      :farmer,
      :farm,
      :is_limited,
      :raw_text,
      :status,
      flavor_notes: []
    )
  end

  def save_uploaded_image(image)
    saved = MediaUploadService.save(
      image,
      directory: Rails.root.join("public", "uploads", "coffee_beans")
    )

    # Cloudinary credentials が設定されている場合は永続ストレージにアップロード
    if ENV["CLOUDINARY_CLOUD_NAME"].present?
      result = Cloudinary::Uploader.upload(
        saved[:path],
        folder: "coffee_beans",
        resource_type: "image"
      )
      { path: saved[:path], url: result["secure_url"] }
    else
      { path: saved[:path], url: "/uploads/coffee_beans/#{saved[:filename]}" }
    end
  end
end
