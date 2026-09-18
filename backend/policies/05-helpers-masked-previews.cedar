permit (
  principal,
  action == AfterLoss::Action::"ViewDocumentPreview",
  resource
) when { resource.case.helpers.contains(principal) };
