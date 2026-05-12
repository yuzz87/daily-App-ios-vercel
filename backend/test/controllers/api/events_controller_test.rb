require "test_helper"

class Api::EventsControllerTest < ActionDispatch::IntegrationTest
  test "index includes events that overlap the requested month" do
    Event.delete_all

    overlapping_event = Event.create!(
      title: "月またぎ予定",
      start_at: Time.zone.local(2026, 4, 30, 10, 0, 0),
      end_at: Time.zone.local(2026, 5, 2, 18, 0, 0),
      all_day: false,
      color: "#3b82f6"
    )

    non_overlapping_event = Event.create!(
      title: "前月で終了",
      start_at: Time.zone.local(2026, 4, 1, 10, 0, 0),
      end_at: Time.zone.local(2026, 4, 2, 18, 0, 0),
      all_day: false,
      color: "#3b82f6"
    )

    get api_events_url, params: { year: 2026, month: 5 }

    assert_response :success
    event_ids = JSON.parse(response.body).map { |event| event["id"] }

    assert_includes event_ids, overlapping_event.id
    assert_not_includes event_ids, non_overlapping_event.id
  end
end
