require "test_helper"

class Api::StudySessionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    StudySession.delete_all
  end

  test "index returns study sessions ordered by recorded_at desc" do
    older = StudySession.create!(
      category: "sleep",
      duration_seconds: 3600,
      recorded_at: Time.zone.local(2026, 5, 12, 23, 0, 0)
    )
    newer = StudySession.create!(
      category: "programming",
      duration_seconds: 1800,
      recorded_at: Time.zone.local(2026, 5, 13, 9, 0, 0)
    )

    get api_study_sessions_url

    assert_response :success
    ids = JSON.parse(response.body).map { |session| session["id"] }
    assert_equal [newer.id, older.id], ids
  end

  test "create saves a study session" do
    assert_difference("StudySession.count", 1) do
      post api_study_sessions_url, params: {
        study_session: {
          category: "programming",
          duration_seconds: 1500,
          recorded_at: "2026-05-13T10:00:00+09:00",
          memo: "timer save"
        }
      }
    end

    assert_response :created
    data = JSON.parse(response.body)
    assert_equal "programming", data["category"]
    assert_equal 1500, data["duration_seconds"]
    assert_equal "timer save", data["memo"]
  end

  test "create rejects non-positive duration" do
    assert_no_difference("StudySession.count") do
      post api_study_sessions_url, params: {
        study_session: {
          category: "programming",
          duration_seconds: 0
        }
      }
    end

    assert_response :unprocessable_entity
  end
end
