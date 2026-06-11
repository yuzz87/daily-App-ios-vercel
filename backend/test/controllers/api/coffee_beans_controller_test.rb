require "test_helper"

class Api::CoffeeBeansControllerTest < ActionDispatch::IntegrationTest
  test "destroy deletes only the current user's coffee bean" do
    user = create_user
    coffee_bean = user.coffee_beans.create!(
      brand: "PostCoffee",
      flavor_notes: [],
      status: "draft"
    )

    assert_difference("CoffeeBean.count", -1) do
      delete api_coffee_bean_url(coffee_bean), headers: auth_headers_for(user)
    end

    assert_response :no_content
  end

  test "show does not expose another user's coffee bean" do
    user = create_user
    other_user = create_user
    coffee_bean = other_user.coffee_beans.create!(
      brand: "PostCoffee",
      flavor_notes: [],
      status: "draft"
    )

    get api_coffee_bean_url(coffee_bean), headers: auth_headers_for(user)

    assert_response :not_found
  end
end
