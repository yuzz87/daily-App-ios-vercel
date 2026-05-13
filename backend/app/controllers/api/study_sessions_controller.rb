class Api::StudySessionsController < ApplicationController
  def index
    study_sessions = StudySession.order(recorded_at: :desc)

    render json: study_sessions.map(&:as_json_for_api)
  end

  def create
    study_session = StudySession.new(study_session_params)

    if study_session.save
      render json: study_session.as_json_for_api, status: :created
    else
      render json: { errors: study_session.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def study_session_params
    params.require(:study_session).permit(
      :category,
      :duration_seconds,
      :recorded_at,
      :memo
    )
  end
end
