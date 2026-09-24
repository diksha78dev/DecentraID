package com.decentraid.dto;

import jakarta.validation.constraints.NotBlank;

public class AuthorizeIssuerRequest {

    @NotBlank(message = "walletAddress is required")
    private String walletAddress;

    private String name;

    public String getWalletAddress() { return walletAddress; }
    public void setWalletAddress(String walletAddress) { this.walletAddress = walletAddress; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}