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

        if (req.assignedUserIds() != null && !req.assignedUserIds().isEmpty()) {
            java.util.Set<User> members = new java.util.HashSet<>();
            for (Long uid : req.assignedUserIds()) {
                userRepository.findById(uid).ifPresent(members::add);
            }
            c.setAssignedUsers(members);
            if (!members.isEmpty()) {
                c.setAccountManager(members.iterator().next());
            }
        } else if (req.accountManagerId() != null) {
            userRepository.findById(req.accountManagerId()).ifPresent(u -> {
                c.setAccountManager(u);
                c.getAssignedUsers().add(u);
            });
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
        if (req.assignedUserIds() != null && !req.assignedUserIds().isEmpty()) {
            java.util.Set<User> members = new java.util.HashSet<>();
            for (Long uid : req.assignedUserIds()) {
                userRepository.findById(uid).ifPresent(members::add);
            }
            deal.setAssignedUsers(members);
            if (!members.isEmpty()) {
                deal.setAssignedTo(members.iterator().next());
            }
        } else if (req.assignedToId() != null) {
            userRepository.findById(req.assignedToId()).ifPresent(u -> {
                deal.setAssignedTo(u);
                deal.getAssignedUsers().add(u);
            });
        }

        Deal saved = dealRepository.save(deal);
        return mapDeal(saved);
    }

    @Transactional
    public LeadResponseDto updateLead(Long leadId, LeadRequestDto req, Long actorId) {
        Lead lead = leadRepository.findById(leadId).orElseThrow(() -> new RuntimeException("Lead not found"));
        if (req.firstName() != null) lead.setFirstName(req.firstName());
        if (req.lastName() != null) lead.setLastName(req.lastName());
        if (req.company() != null) lead.setCompany(req.company());
        if (req.email() != null) lead.setEmail(req.email());
        if (req.phone() != null) lead.setPhone(req.phone());
        if (req.status() != null) lead.setStatus(req.status().toUpperCase());
        if (req.source() != null) lead.setSource(req.source().toUpperCase());
        if (req.notes() != null) lead.setNotes(req.notes());
        if (req.assignedToId() != null) {
            userRepository.findById(req.assignedToId()).ifPresent(lead::setAssignedTo);
        }
        lead.setUpdatedAt(Instant.now());
        return mapLead(leadRepository.save(lead));
    }

    @Transactional
    public void deleteLead(Long leadId, Long actorId) {
        Lead lead = leadRepository.findById(leadId).orElseThrow(() -> new RuntimeException("Lead not found"));
        lead.setIsDeleted(true);
        lead.setUpdatedAt(Instant.now());
        leadRepository.save(lead);
    }

    @Transactional
    public CustomerResponseDto updateCustomer(Long customerId, CustomerRequestDto req, Long actorId) {
        Customer c = customerRepository.findById(customerId).orElseThrow(() -> new RuntimeException("Customer not found"));
        if (req.companyName() != null) c.setCompanyName(req.companyName());
        if (req.industry() != null) c.setIndustry(req.industry());
        if (req.website() != null) c.setWebsite(req.website());
        if (req.primaryContactName() != null) c.setPrimaryContactName(req.primaryContactName());
        if (req.primaryContactEmail() != null) c.setPrimaryContactEmail(req.primaryContactEmail());
        if (req.primaryContactPhone() != null) c.setPrimaryContactPhone(req.primaryContactPhone());
        if (req.address() != null) c.setAddress(req.address());
        if (req.assignedUserIds() != null) {
            java.util.Set<User> members = new java.util.HashSet<>();
            for (Long uid : req.assignedUserIds()) {
                userRepository.findById(uid).ifPresent(members::add);
            }
            c.setAssignedUsers(members);
            if (!members.isEmpty()) {
                c.setAccountManager(members.iterator().next());
            } else {
                c.setAccountManager(null);
            }
        } else if (req.accountManagerId() != null) {
            userRepository.findById(req.accountManagerId()).ifPresent(u -> {
                c.setAccountManager(u);
                c.getAssignedUsers().add(u);
            });
        }
        c.setUpdatedAt(Instant.now());
        return mapCustomer(customerRepository.save(c));
    }

    @Transactional
    public void deleteCustomer(Long customerId, Long actorId) {
        Customer c = customerRepository.findById(customerId).orElseThrow(() -> new RuntimeException("Customer not found"));
        c.setIsDeleted(true);
        c.setUpdatedAt(Instant.now());
        customerRepository.save(c);
    }

    @Transactional
    public DealResponseDto updateDeal(Long dealId, DealRequestDto req, Long actorId) {
        Deal deal = dealRepository.findById(dealId).orElseThrow(() -> new RuntimeException("Deal not found"));
        if (req.title() != null) deal.setTitle(req.title());
        if (req.stage() != null) deal.setStage(req.stage().toUpperCase());
        if (req.dealValue() != null) deal.setDealValue(req.dealValue());
        if (req.expectedCloseDate() != null) deal.setExpectedCloseDate(req.expectedCloseDate());
        if (req.notes() != null) deal.setNotes(req.notes());
        if (req.customerId() != null) customerRepository.findById(req.customerId()).ifPresent(deal::setCustomer);
        if (req.leadId() != null) leadRepository.findById(req.leadId()).ifPresent(deal::setLead);
        if (req.assignedUserIds() != null) {
            java.util.Set<User> members = new java.util.HashSet<>();
            for (Long uid : req.assignedUserIds()) {
                userRepository.findById(uid).ifPresent(members::add);
            }
            deal.setAssignedUsers(members);
            if (!members.isEmpty()) {
                deal.setAssignedTo(members.iterator().next());
            } else {
                deal.setAssignedTo(null);
            }
        } else if (req.assignedToId() != null) {
            userRepository.findById(req.assignedToId()).ifPresent(u -> {
                deal.setAssignedTo(u);
                deal.getAssignedUsers().add(u);
            });
        }
        deal.setUpdatedAt(Instant.now());
        return mapDeal(dealRepository.save(deal));
    }

    @Transactional
    public void deleteDeal(Long dealId, Long actorId) {
        Deal deal = dealRepository.findById(dealId).orElseThrow(() -> new RuntimeException("Deal not found"));
        deal.setIsDeleted(true);
        deal.setUpdatedAt(Instant.now());
        dealRepository.save(deal);
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
        List<Long> assignedIds = new java.util.ArrayList<>();
        List<String> assignedNames = new java.util.ArrayList<>();
        if (c.getAssignedUsers() != null && !c.getAssignedUsers().isEmpty()) {
            for (User u : c.getAssignedUsers()) {
                assignedIds.add(u.getId());
                assignedNames.add(u.getFullName());
            }
        } else if (c.getAccountManager() != null) {
            assignedIds.add(c.getAccountManager().getId());
            assignedNames.add(c.getAccountManager().getFullName());
        }
        String mgrName = !assignedNames.isEmpty() ? String.join(", ", assignedNames) : null;
        Long mgrId = !assignedIds.isEmpty() ? assignedIds.get(0) : null;

        return new CustomerResponseDto(
                c.getId(), c.getCompanyName(), c.getIndustry(), c.getWebsite(),
                c.getPrimaryContactName(), c.getPrimaryContactEmail(), c.getPrimaryContactPhone(),
                c.getAddress(),
                mgrId,
                mgrName,
                assignedIds,
                assignedNames,
                c.getCreatedAt()
        );
    }

    private DealResponseDto mapDeal(Deal d) {
        List<Long> dealUserIds = new java.util.ArrayList<>();
        List<String> dealUserNames = new java.util.ArrayList<>();
        if (d.getAssignedUsers() != null && !d.getAssignedUsers().isEmpty()) {
            for (User u : d.getAssignedUsers()) {
                dealUserIds.add(u.getId());
                dealUserNames.add(u.getFullName());
            }
        } else if (d.getAssignedTo() != null) {
            dealUserIds.add(d.getAssignedTo().getId());
            dealUserNames.add(d.getAssignedTo().getFullName());
        }
        String assigneeName = !dealUserNames.isEmpty() ? String.join(", ", dealUserNames) : null;
        Long assigneeId = !dealUserIds.isEmpty() ? dealUserIds.get(0) : null;

        return new DealResponseDto(
                d.getId(), d.getTitle(),
                d.getCustomer() != null ? d.getCustomer().getId() : null,
                d.getCustomer() != null ? d.getCustomer().getCompanyName() : null,
                d.getLead() != null ? d.getLead().getId() : null,
                d.getLead() != null ? (d.getLead().getFirstName() + " " + (d.getLead().getLastName() != null ? d.getLead().getLastName() : "")) : null,
                d.getStage(), d.getDealValue(), d.getCurrency(), d.getExpectedCloseDate(),
                assigneeId,
                assigneeName,
                dealUserIds,
                dealUserNames,
                d.getNotes(), d.getCreatedAt()
        );
    }
}
