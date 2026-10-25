package com.teamcrm.controller;

import com.teamcrm.dto.OtherDtos.*;
import com.teamcrm.security.UserDetailsImpl;
import com.teamcrm.service.CrmService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/crm")
public class CrmController {

    private final CrmService crmService;

    public CrmController(CrmService crmService) {
        this.crmService = crmService;
    }

    // Leads
    @GetMapping("/leads")
    public ResponseEntity<List<LeadResponseDto>> getLeads() {
        return ResponseEntity.ok(crmService.getLeads());
    }

    @PostMapping("/leads")
    public ResponseEntity<LeadResponseDto> createLead(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestBody LeadRequestDto request) {
        return ResponseEntity.ok(crmService.createLead(request, currentUser != null ? currentUser.getId() : 1L));
    }

    @PatchMapping("/leads/{id}/status")
    public ResponseEntity<LeadResponseDto> updateLeadStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(crmService.updateLeadStatus(id, status, currentUser != null ? currentUser.getId() : 1L));
    }

    @PutMapping("/leads/{id}")
    public ResponseEntity<LeadResponseDto> updateLead(
            @PathVariable Long id,
            @RequestBody LeadRequestDto request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(crmService.updateLead(id, request, currentUser != null ? currentUser.getId() : 1L));
    }

    @DeleteMapping("/leads/{id}")
    public ResponseEntity<Void> deleteLead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        crmService.deleteLead(id, currentUser != null ? currentUser.getId() : 1L);
        return ResponseEntity.ok().build();
    }

    // Customers
    @GetMapping("/customers")
    public ResponseEntity<List<CustomerResponseDto>> getCustomers() {
        return ResponseEntity.ok(crmService.getCustomers());
    }

    @PostMapping("/customers")
    public ResponseEntity<CustomerResponseDto> createCustomer(@RequestBody CustomerRequestDto request) {
        return ResponseEntity.ok(crmService.createCustomer(request));
    }

    @PutMapping("/customers/{id}")
    public ResponseEntity<CustomerResponseDto> updateCustomer(
            @PathVariable Long id,
            @RequestBody CustomerRequestDto request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(crmService.updateCustomer(id, request, currentUser != null ? currentUser.getId() : 1L));
    }

    @DeleteMapping("/customers/{id}")
    public ResponseEntity<Void> deleteCustomer(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        crmService.deleteCustomer(id, currentUser != null ? currentUser.getId() : 1L);
        return ResponseEntity.ok().build();
    }

    // Deals
    @GetMapping("/deals")
    public ResponseEntity<List<DealResponseDto>> getDeals() {
        return ResponseEntity.ok(crmService.getDeals());
    }

    @PostMapping("/deals")
    public ResponseEntity<DealResponseDto> createDeal(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestBody DealRequestDto request) {
        return ResponseEntity.ok(crmService.createDeal(request, currentUser != null ? currentUser.getId() : 1L));
    }

    @PutMapping("/deals/{id}")
    public ResponseEntity<DealResponseDto> updateDeal(
            @PathVariable Long id,
            @RequestBody DealRequestDto request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(crmService.updateDeal(id, request, currentUser != null ? currentUser.getId() : 1L));
    }

    @DeleteMapping("/deals/{id}")
    public ResponseEntity<Void> deleteDeal(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        crmService.deleteDeal(id, currentUser != null ? currentUser.getId() : 1L);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/deals/{id}/stage")
    public ResponseEntity<DealResponseDto> updateDealStage(
            @PathVariable Long id,
            @RequestParam String stage,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(crmService.updateDealStage(id, stage, currentUser != null ? currentUser.getId() : 1L));
    }
}
