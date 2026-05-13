class Api::ActiveTimersController < ApplicationController
  def show
    render json: active_timer.as_json_for_api
  end

  def update
    if active_timer.update(active_timer_params)
      render json: active_timer.as_json_for_api
    else
      render json: { errors: active_timer.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    active_timer.update!(
      elapsed_seconds: 0,
      is_running: false,
      started_at: nil,
      laps: []
    )

    render json: active_timer.as_json_for_api
  end

  private

  def active_timer
    @active_timer ||= ActiveTimer.current
  end

  def active_timer_params
    params.require(:active_timer).permit(
      :category,
      :elapsed_seconds,
      :is_running,
      :started_at,
      laps: []
    )
  end
end
