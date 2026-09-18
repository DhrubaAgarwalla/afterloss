permit (
  principal,
  action in [AfterLoss::Action::"ViewCase", AfterLoss::Action::"EditCase", AfterLoss::Action::"ManageMembers", AfterLoss::Action::"UploadDocument", AfterLoss::Action::"UseAssistant"],
  resource
) when { resource.lead == principal };
