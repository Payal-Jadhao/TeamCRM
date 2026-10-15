package com.teamcrm.service;

import com.teamcrm.dto.OtherDtos.*;
import com.teamcrm.entity.*;
import com.teamcrm.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class CrmService {

    private final LeadRepository leadRepository;
    private final CustomerRepository customerRepository;
    private final DealRepository dealRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;

    public CrmService(LeadRepository leadRepository,
                      CustomerRepository customerRepository,
                      DealRepository dealRepository,
                      UserRepository userRepository,
                      AuditLogRepository auditLogRepository) {
        this.leadRepository = leadRepository;
        this.customerRepository = customerRepository;
        this.dealRepository = dealRepository;
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
    }

    // LEADS
    public List<LeadResponseDto> getLeads() {
        return leadRepository.findByIsDeletedFalseOrderByCreatedAtDesc()
                .stream().map(this::mapLead).collect(Collectors.toList());
    }

    @Transactional
    public LeadResponseDto createLead(LeadRequestDto req, Long creatorId) {
        Lead lead = new Lead();
        lead.setFirstName(req.firstName());
        lead.setLastName(req.lastName());
        lead.setCompany(req.company());
        lead.setEmail(req.email());
        lead.setPhone(req.phone());
        lead.setStatus(req.status() != null ? req.status().toUpperCase() : "NEW");
        lead.setSource(req.source() != null ? req.source().toUpperCase() : "WEBSITE");
        lead.setNotes(req.notes());
        lead.setCreatedBy(creatorId);

        if (req.assignedToId() != null) {
            userRepository.findById(req.assignedToId()).ifPresent(lead::setAssignedTo);
        }

        Lead saved = leadRepository.save(lead);
        return mapLead(saved);
    }

    @Transactional
    public LeadResponseDto updateLeadStatus(Long leadId, String status, Long actorId) {
        Lead lead = leadRepository.findById(leadId).orElseThrow(() -> new RuntimeException("Lead not found"));
        lead.setStatus(status.toUpperCase());
        lead.setUpdatedAt(Instant.now());
        Lead saved = leadRepository.save(lead);
        return mapLead(saved);
    }

    // CUSTOMERS
    public List<CustomerResponseDto> getCustomers() {
        return customerRepository.findByIsDeletedFalseOrderByCompanyNameAsc()
                .stream().map(this::mapCustomer).collect(Collectors.toList());
    }

    @Transactional
    public CustomerResponseDto createCustomer(CustomerRequestDto req) {
        Customer c = new Customer();
        c.setCompanyName(req.companyName());
        c.setIndustry(req.industry());
        c.setWebsite(req.website());
        c.setPrimaryContactName(req.primaryContactName());
        c.setPrimaryContactEmail(req.primaryContactEmail());
        c.setPrimaryContactPhone(req.primaryContactPhone());
        c.setAddress(req.address());

        if (req.accountManagerId() != null) {
            userRepository.findById(req.accountManagerId()).ifPresent(c::setAccountManager);
        }

        Customer saved = customerRepository.save(c);
        return mapCustomer(saved);
    }

    // DEALS
    public List<DealResponseDto> getDeals() {
        return dealRepository.findByIsDeletedFalseOrderByCreatedAtDesc()
                .stream().map(this::mapDeal).collect(Collectors.toList());
    }

    @Transactional
    public DealResponseDto createDeal(DealRequestDto req, Long creatorId) {
        Deal deal = new Deal();
        deal.setTitle(req.title());
        deal.setStage(req.stage() != null ? req.stage().toUpperCase() : "PROSPECT");
        deal.setDealValue(req.dealValue() != null ? req.dealValue() : BigDecimal.ZERO);
        deal.setCurrency(req.currency() != null ? req.currency() : "USD");
        deal.setExpectedCloseDate(req.expectedCloseDate());
        deal.setNotes(req.notes());
        deal.setCreatedBy(creatorId);

        if (req.customerId() != null) {
            customerRepository.findById(req.customerId()).ifPresent(deal::setCustomer);
        }
        if (req.leadId() != null) {
            leadRepository.findById(req.leadId()).ifPresent(deal::setLead);
        }
        if (req.assignedToId() != null) {
            userRepository.findById(req.assignedToId()).ifPresent(deal::setAssignedTo);
        }

        Deal saved = dealRepository.save(deal);
        return mapDeal(saved);
    }

    @Transactional
    public DealResponseDto updateDealStage(Long dealId, String stage, Long actorId) {
        Deal deal = dealRepository.findById(dealId).orElseThrow(() -> new RuntimeException("Deal not found"));
        deal.setStage(stage.toUpperCase());
        deal.setUpdatedAt(Instant.now());
        Deal saved = dealRepository.save(deal);
        return mapDeal(saved);
    }

    private LeadResponseDto mapLead(Lead l) {
        return new LeadResponseDto(
                l.getId(), l.getFirstName(), l.getLastName(), l.getCompany(),
                l.getEmail(), l.getPhone(), l.getStatus(), l.getSource(), l.getNotes(),
                l.getAssignedTo() != null ? l.getAssignedTo().getId() : null,
                l.getAssignedTo() != null ? l.getAssignedTo().getFullName() : null,
                l.getCreatedAt()
        );
    }

    private CustomerResponseDto mapCustomer(Customer c) {
        return new CustomerResponseDto(
                c.getId(), c.getCompanyName(), c.getIndustry(), c.getWebsite(),
                c.getPrimaryContactName(), c.getPrimaryContactEmail(), c.getPrimaryContactPhone(),
                c.getAddress(),
                c.getAccountManager() != null ? c.getAccountManager().getId() : null,
                c.getAccountManager() != null ? c.getAccountManager().getFullName() : null,
                c.getCreatedAt()
        );
    }

    private DealResponseDto mapDeal(Deal d) {
        return new DealResponseDto(
                d.getId(), d.getTitle(),
                d.getCustomer() != null ? d.getCustomer().getId() : null,
                d.getCustomer() != null ? d.getCustomer().getCompanyName() : null,
                d.getLead() != null ? d.getLead().getId() : null,
                d.getLead() != null ? (d.getLead().getFirstName() + " " + (d.getLead().getLastName() != null ? d.getLead().getLastName() : "")) : null,
                d.getStage(), d.getDealValue(), d.getCurrency(), d.getExpectedCloseDate(),
                d.getAssignedTo() != null ? d.getAssignedTo().getId() : null,
                d.getAssignedTo() != null ? d.getAssignedTo().getFullName() : null,
                d.getNotes(), d.getCreatedAt()
        );
    }
}
