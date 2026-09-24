package com.decentraid.controller;

import com.decentraid.dto.AuthorizeIssuerRequest;
import com.decentraid.entity.User;
import com.decentraid.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @PostMapping("/issuers")
    public User authorizeIssuer(@Valid @RequestBody AuthorizeIssuerRequest request) {
        return adminService.authorizeIssuer(request);
    }

    @GetMapping("/issuers")
    public List<User> listIssuers() {
        return adminService.listIssuers();
    }

    @PatchMapping("/issuers/{walletAddress}/revoke")
    public Map<String, String> revokeIssuer(@PathVariable String walletAddress) {
        adminService.revokeIssuer(walletAddress);
        return Map.of("walletAddress", walletAddress, "status", "REVOKED");
    }
}