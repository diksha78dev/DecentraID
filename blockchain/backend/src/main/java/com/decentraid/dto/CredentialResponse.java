package com.decentraid.dto;

import com.decentraid.entity.Credential;

import java.time.LocalDateTime;

public class CredentialResponse {
    private String credentialId;
    private String credentialType;
    private String holderName;
    private String holderWallet;
    private String issuerWallet;
    private String credentialHash;
    private LocalDateTime issuedAt;
    private String status;
    private String blockchainTxHash;
    private String revokeTxHash;

    public static CredentialResponse fromEntity(Credential c) {
        CredentialResponse r = new CredentialResponse();
        r.credentialId = c.getCredentialId();
        r.credentialType = c.getCredentialType();
        r.holderName = c.getHolderName();
        r.holderWallet = c.getHolderWallet();
        r.issuerWallet = c.getIssuerWallet();
        r.credentialHash = c.getCredentialHash();
        r.issuedAt = c.getIssuedAt();
        r.status = c.getStatus().name();
        r.blockchainTxHash = c.getBlockchainTxHash();
        r.revokeTxHash = c.getRevokeTxHash();
        return r;
    }

    // getters/setters
    public String getCredentialId() { return credentialId; }
    public void setCredentialId(String credentialId) { this.credentialId = credentialId; }
    public String getCredentialType() { return credentialType; }
    public void setCredentialType(String credentialType) { this.credentialType = credentialType; }
    public String getHolderName() { return holderName; }
    public void setHolderName(String holderName) { this.holderName = holderName; }
    public String getHolderWallet() { return holderWallet; }
    public void setHolderWallet(String holderWallet) { this.holderWallet = holderWallet; }
    public String getIssuerWallet() { return issuerWallet; }
    public void setIssuerWallet(String issuerWallet) { this.issuerWallet = issuerWallet; }
    public String getCredentialHash() { return credentialHash; }
    public void setCredentialHash(String credentialHash) { this.credentialHash = credentialHash; }
    public LocalDateTime getIssuedAt() { return issuedAt; }
    public void setIssuedAt(LocalDateTime issuedAt) { this.issuedAt = issuedAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getBlockchainTxHash() { return blockchainTxHash; }
    public void setBlockchainTxHash(String blockchainTxHash) { this.blockchainTxHash = blockchainTxHash; }
    public String getRevokeTxHash() { return revokeTxHash; }
    public void setRevokeTxHash(String revokeTxHash) { this.revokeTxHash = revokeTxHash; }
}