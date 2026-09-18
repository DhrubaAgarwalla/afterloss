forbid (
  principal,
  action == AfterLoss::Action::"ManageMembers",
  resource
) unless { resource.lead == principal };
