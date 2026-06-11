require "test_helper"

class Api::TastingNotesControllerTest < ActionDispatch::IntegrationTest
  test "create requires ownership of the coffee bean" do
    user = create_user
    other_user = create_user
    coffee_bean = other_user.coffee_beans.create!(
      brand: "PostCoffee",
      flavor_notes: [],
      status: "draft"
    )

    assert_no_difference("TastingNote.count") do
      post api_coffee_bean_tasting_notes_url(coffee_bean),
        params: { tasting_note: { rating: 4, memo: "private" } },
        headers: auth_headers_for(user)
    end

    assert_response :not_found
  end

  test "update requires ownership through the coffee bean" do
    user = create_user
    other_user = create_user
    coffee_bean = other_user.coffee_beans.create!(
      brand: "PostCoffee",
      flavor_notes: [],
      status: "draft"
    )
    tasting_note = coffee_bean.tasting_notes.create!(rating: 3)

    patch api_tasting_note_url(tasting_note),
      params: { tasting_note: { rating: 5 } },
      headers: auth_headers_for(user)

    assert_response :not_found
    assert_equal 3, tasting_note.reload.rating
  end
end
