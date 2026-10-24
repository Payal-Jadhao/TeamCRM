package com.teamcrm.controller;

import com.teamcrm.dto.OtherDtos.AdminDashboardDto;
import com.teamcrm.dto.OtherDtos.EmployeeDashboardDto;
import com.teamcrm.dto.OtherDtos.ManagerDashboardDto;
import com.teamcrm.security.UserDetailsImpl;
import com.teamcrm.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminDashboardDto> getAdminDashboard() {
        return ResponseEntity.ok(dashboardService.getAdminDashboard());
    }

    @GetMapping("/manager")
    @PreAuthorize("hasAuthority('REPORT_VIEW') or hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<ManagerDashboardDto> getManagerDashboard() {
        return ResponseEntity.ok(dashboardService.getManagerDashboard());
    }

    @GetMapping("/employee")
    public ResponseEntity<EmployeeDashboardDto> getEmployeeDashboard(
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(dashboardService.getEmployeeDashboard(currentUser.getId()));
    }
}
