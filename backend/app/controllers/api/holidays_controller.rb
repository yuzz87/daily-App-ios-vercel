class Api::HolidaysController < ApplicationController
  def index
    holidays = Holiday.order(:date)

    if params[:year].present?
      year = params[:year].to_i
      start_date = Date.new(year, 1, 1)
      end_date = Date.new(year, 12, 31)

      holidays = holidays.where(date: start_date..end_date)
    end

    if params[:year].present? && params[:month].present?
      year = params[:year].to_i
      month = params[:month].to_i

      start_date = Date.new(year, month, 1)
      end_date = start_date.end_of_month

      holidays = holidays.where(date: start_date..end_date)
    end

    render json: holidays.map(&:as_json_for_api)
  end
end