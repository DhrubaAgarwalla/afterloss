permit (
  principal,
  action in [AfterLoss::Action::"ViewDocumentPreview", AfterLoss::Action::"DownloadOriginal"],
  resource
) when { resource.case.lead == principal || resource.case.heirs.contains(principal) };
