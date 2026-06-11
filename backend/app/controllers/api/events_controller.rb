class Api::EventsController < ApplicationController
  before_action :set_event, only: [:show, :update, :destroy]

  def index
    events = current_user.events.order(:start_at)

    if params[:year].present? && params[:month].present?
      month_range = requested_month_range
      if month_range.nil?
        render json: { error: "year and month are invalid." }, status: :bad_request
        return
      end

      events = events.where(
        "start_at <= ? AND end_at >= ?",
        month_range.end,
        month_range.begin
      )
    end

    render json: events.map(&:as_json_for_api)
  end

  def show
    render json: @event.as_json_for_api
  end

  def create
    event = current_user.events.build(event_params)

    if event.save
      render json: event.as_json_for_api, status: :created
    else
      render json: { errors: event.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @event.update(event_params)
      render json: @event.as_json_for_api
    else
      render json: { errors: @event.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @event.destroy
    head :no_content
  end

  private

  def set_event
    @event = current_user.events.find(params[:id])
  end

  def event_params
    params.require(:event).permit(
      :title,
      :description,
      :start_at,
      :end_at,
      :all_day,
      :color
    )
  end

  def requested_month_range
    year = Integer(params[:year], exception: false)
    month = Integer(params[:month], exception: false)

    return nil unless year&.between?(1900, 2100)
    return nil unless month&.between?(1, 12)

    start_date = Time.zone.local(year, month, 1).beginning_of_day
    start_date..start_date.end_of_month.end_of_day
  end
end
