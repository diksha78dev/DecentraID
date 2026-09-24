package com.decentraid.dto;

public class VerificationResponse {
    private String credentialId;
    private String status;
    private boolean verified;
    private String issuer;
    private String holder;
    private String credentialType;
    private Long issuedAt;
    private String blockchainTxHash;

    public static VerificationResponse valid(String credentialId, String issuer, String holder,
                                              String credentialType, Long issuedAt, String txHash) {
        VerificationResponse r = new VerificationResponse();
        r.credentialId = credentialId;
        r.status = "VALID";
        r.verified = true;
        r.issuer = issuer;
        r.holder = holder;
        r.credentialType = credentialType;
        r.issuedAt = issuedAt;
        r.blockchainTxHash = txHash;
        return r;
    }

    public static VerificationResponse revoked(String credentialId) {
        VerificationResponse r = new VerificationResponse();
        r.credentialId = credentialId;
        r.status = "REVOKED";
        r.verified = false;
        return r;
    }

    // getters/setters
    public String getCredentialId() { return credentialId; }
    public void setCredentialId(String credentialId) { this.credentialId = credentialId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public boolean isVerified() { return verified; }
    public void setVerified(boolean verified) { this.verified = verified; }
    public String getIssuer() { return issuer; }
    public void setIssuer(String issuer) { this.issuer = issuer; }
    public String getHolder() { return holder; }
    public void setHolder(String holder) { this.holder = holder; }
    public String getCredentialType() { return credentialType; }
    public void setCredentialType(String credentialType) { this.credentialType = credentialType; }
    public Long getIssuedAt() { return issuedAt; }
    public void setIssuedAt(Long issuedAt) { this.issuedAt = issuedAt; }
    public String getBlockchainTxHash() { return blockchainTxHash; }
    public void setBlockchainTxHash(String blockchainTxHash) { this.blockchainTxHash = blockchainTxHash; }
}