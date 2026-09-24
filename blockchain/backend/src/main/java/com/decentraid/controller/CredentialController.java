package com.decentraid.controller;

import com.decentraid.dto.CredentialResponse;
import com.decentraid.dto.IssueCredentialRequest;
import com.decentraid.dto.VerificationResponse;
import com.decentraid.service.CredentialService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/credentials")
@CrossOrigin(origins = "*")
public class CredentialController {

    private final CredentialService credentialService;

    public CredentialController(CredentialService credentialService) {
        this.credentialService = credentialService;
    }

    @PostMapping
    public CredentialResponse issueCredential(@Valid @RequestBody IssueCredentialRequest request) {
        return credentialService.issueCredential(request);
    }

    @GetMapping("/{credentialId}")
    public CredentialResponse getCredential(@PathVariable String credentialId) {
        return credentialService.getCredential(credentialId);
    }

    @GetMapping("/{credentialId}/verify")
    public VerificationResponse verifyCredential(@PathVariable String credentialId) {
        return credentialService.verifyCredential(credentialId);
    }

    @PostMapping("/{credentialId}/revoke")
    public CredentialResponse revokeCredential(@PathVariable String credentialId,
                                                @RequestBody Map<String, String> body) {
        String issuerWallet = body.get("issuerWallet");
        return credentialService.revokeCredential(credentialId, issuerWallet);
    }

    @GetMapping("/holder/{walletAddress}")
    public List<CredentialResponse> getByHolder(@PathVariable String walletAddress) {
        return credentialService.getCredentialsByHolder(walletAddress);
    }

    @GetMapping("/issuer/{walletAddress}")
    public List<CredentialResponse> getByIssuer(@PathVariable String walletAddress) {
        return credentialService.getCredentialsByIssuer(walletAddress);
    }
}