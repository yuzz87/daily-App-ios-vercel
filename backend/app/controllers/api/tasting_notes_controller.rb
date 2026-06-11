class Api::TastingNotesController < ApplicationController
  before_action :set_coffee_bean, only: [:create]
  before_action :set_tasting_note, only: [:update, :destroy]

  def create
    tasting_note = @coffee_bean.tasting_notes.build(tasting_note_params)

    if tasting_note.save
      render json: tasting_note.as_json_for_api, status: :created
    else
      render json: { errors: tasting_note.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @tasting_note.update(tasting_note_params)
      render json: @tasting_note.as_json_for_api
    else
      render json: { errors: @tasting_note.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @tasting_note.destroy
    head :no_content
  end

  private

  def set_coffee_bean
    @coffee_bean = current_user.coffee_beans.find(params[:coffee_bean_id])
  end

  def set_tasting_note
    @tasting_note = TastingNote.joins(:coffee_bean)
      .merge(current_user.coffee_beans)
      .find(params[:id])
  end

  def tasting_note_params
    params.require(:tasting_note).permit(
      :rating,
      :acidity,
      :bitterness,
      :sweetness,
      :aroma,
      :body,
      :memo,
      :brew_method,
      :grind_size,
      :water_temp,
      :coffee_grams,
      :water_grams,
      :brew_time
    )
  end
end
