class Api::EventsController < ApplicationController
  before_action :set_event, only: [:show, :update, :destroy]

  def index
    events = Event.order(:start_at)

    if params[:year].present? && params[:month].present?
      year = params[:year].to_i
      month = params[:month].to_i

      start_date = Time.zone.local(year, month, 1).beginning_of_day
      end_date = start_date.end_of_month.end_of_day

      events = events.where(
        "start_at <= ? AND end_at >= ?",
        end_date,
        start_date
      )
    end

    render json: events.map(&:as_json_for_api)
  end

  def show
    render json: @event.as_json_for_api
  end

  def create
    event = Event.new(event_params)

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
    @event = Event.find(params[:id])
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
end
