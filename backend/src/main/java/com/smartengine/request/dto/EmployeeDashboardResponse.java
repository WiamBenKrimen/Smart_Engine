package com.smartengine.request.dto;

public record EmployeeDashboardResponse(
    long totalDemandes,
    long enCours,
    long terminees,
    long refusees
) {}
