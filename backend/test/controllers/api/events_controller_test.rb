require "test_helper"

class Api::EventsControllerTest < ActionDispatch::IntegrationTest
  test "index includes only current user events that overlap the requested month" do
    Event.delete_all
    user = create_user
    other_user = create_user

    overlapping_event = user.events.create!(
      title: "Overlapping event",
      start_at: Time.zone.local(2026, 4, 30, 10, 0, 0),
      end_at: Time.zone.local(2026, 5, 2, 18, 0, 0),
      all_day: false,
      color: "#3b82f6"
    )

    non_overlapping_event = user.events.create!(
      title: "Previous month event",
      start_at: Time.zone.local(2026, 4, 1, 10, 0, 0),
      end_at: Time.zone.local(2026, 4, 2, 18, 0, 0),
      all_day: false,
      color: "#3b82f6"
    )

    other_user_event = other_user.events.create!(
      title: "Other user event",
      start_at: Time.zone.local(2026, 5, 1, 10, 0, 0),
      end_at: Time.zone.local(2026, 5, 1, 11, 0, 0),
      all_day: false,
      color: "#3b82f6"
    )

    get api_events_url,
      params: { year: 2026, month: 5 },
      headers: auth_headers_for(user)

    assert_response :success
    event_ids = JSON.parse(response.body).map { |event| event["id"] }

    assert_includes event_ids, overlapping_event.id
    assert_not_includes event_ids, non_overlapping_event.id
    assert_not_includes event_ids, other_user_event.id
  end

  test "show does not expose another user's event" do
    user = create_user
    other_user = create_user
    event = other_user.events.create!(
      title: "Private event",
      start_at: Time.zone.local(2026, 5, 1, 10, 0, 0),
      end_at: Time.zone.local(2026, 5, 1, 11, 0, 0),
      all_day: false,
      color: "#3b82f6"
    )

    get api_event_url(event), headers: auth_headers_for(user)

    assert_response :not_found
  end
end
