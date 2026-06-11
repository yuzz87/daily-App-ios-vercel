class Api::HolidaysController < ApplicationController
  skip_before_action :authenticate_user!, only: :index

  def index
    holidays = Holiday.order(:date)

    if params[:year].present?
      year_range = requested_year_range
      if year_range.nil?
        render json: { error: "year is invalid." }, status: :bad_request
        return
      end

      holidays = holidays.where(date: year_range)
    end

    if params[:year].present? && params[:month].present?
      month_range = requested_month_range
      if month_range.nil?
        render json: { error: "year and month are invalid." }, status: :bad_request
        return
      end

      holidays = holidays.where(date: month_range)
    end

    render json: holidays.map(&:as_json_for_api)
  end

  private

  def requested_year_range
    year = Integer(params[:year], exception: false)
    return nil unless year&.between?(1900, 2100)

    Date.new(year, 1, 1)..Date.new(year, 12, 31)
  end

  def requested_month_range
    year = Integer(params[:year], exception: false)
    month = Integer(params[:month], exception: false)

    return nil unless year&.between?(1900, 2100)
    return nil unless month&.between?(1, 12)

    start_date = Date.new(year, month, 1)
    start_date..start_date.end_of_month
  end
end
