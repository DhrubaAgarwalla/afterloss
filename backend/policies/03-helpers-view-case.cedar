permit (
  principal,
  action in [AfterLoss::Action::"ViewCase", AfterLoss::Action::"UseAssistant"],
  resource
) when { resource.helpers.contains(principal) };
