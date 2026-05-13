require "test_helper"

class Api::ActiveTimerControllerTest < ActionDispatch::IntegrationTest
  test "should show current active timer" do
    get api_active_timer_url

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal "Programming", body["category"]
    assert_equal 0, body["elapsed_seconds"]
    assert_equal false, body["is_running"]
    assert_equal [], body["laps"]
  end

  test "should update current active timer" do
    patch api_active_timer_url, params: {
      active_timer: {
        category: "English",
        elapsed_seconds: 120,
        is_running: false,
        started_at: nil,
        laps: [30, 45]
      }
    }

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal "English", body["category"]
    assert_equal 120, body["elapsed_seconds"]
    assert_equal false, body["is_running"]
    assert_equal [30, 45], body["laps"]
  end

  test "should reset current active timer" do
    ActiveTimer.current.update!(
      category: "Math",
      elapsed_seconds: 60,
      is_running: true,
      started_at: Time.current,
      laps: [10]
    )

    delete api_active_timer_url

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 0, body["elapsed_seconds"]
    assert_equal false, body["is_running"]
    assert_nil body["started_at"]
    assert_equal [], body["laps"]
  end
end
