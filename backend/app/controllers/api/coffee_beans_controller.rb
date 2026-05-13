require "fileutils"
require "securerandom"

class Api::CoffeeBeansController < ApplicationController
  before_action :set_coffee_bean, only: [:show, :update, :destroy]

  def index
    coffee_beans = CoffeeBean.order(created_at: :desc)

    render json: coffee_beans.map(&:as_json_for_api)
  end

  def show
    render json: @coffee_bean.as_json_for_api(include_tasting_notes: true)
  end

  def analyze
    image = params[:image]

    unless image.respond_to?(:original_filename) && image.respond_to?(:read)
      render json: { errors: ["image is required"] }, status: :unprocessable_entity
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
    upload_dir = Rails.root.join("public", "uploads", "coffee_beans")
    FileUtils.mkdir_p(upload_dir)

    extension = File.extname(image.original_filename.to_s).downcase
    extension = ".jpg" if extension.blank?
    filename = "#{SecureRandom.uuid}#{extension}"
    path = upload_dir.join(filename)

    File.binwrite(path, image.read)

    {
      path: path.to_s,
      url: "/uploads/coffee_beans/#{filename}"
    }
  end

end
