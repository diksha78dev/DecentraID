package com.decentraid.dto;

import jakarta.validation.constraints.NotBlank;

public class IssueCredentialRequest {

    @NotBlank(message = "credentialId is required")
    private String credentialId;

    @NotBlank(message = "holderName is required")
    private String holderName;

    @NotBlank(message = "holderWallet is required")
    private String holderWallet;

    @NotBlank(message = "issuerWallet is required")
    private String issuerWallet;

    @NotBlank(message = "credentialType is required")
    private String credentialType;

    public String getCredentialId() { return credentialId; }
    public void setCredentialId(String credentialId) { this.credentialId = credentialId; }

    public String getHolderName() { return holderName; }
    public void setHolderName(String holderName) { this.holderName = holderName; }

    public String getHolderWallet() { return holderWallet; }
    public void setHolderWallet(String holderWallet) { this.holderWallet = holderWallet; }

    public String getIssuerWallet() { return issuerWallet; }
    public void setIssuerWallet(String issuerWallet) { this.issuerWallet = issuerWallet; }

    public String getCredentialType() { return credentialType; }
    public void setCredentialType(String credentialType) { this.credentialType = credentialType; }
}