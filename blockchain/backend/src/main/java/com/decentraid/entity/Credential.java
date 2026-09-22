package com.decentraid.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "credentials")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Credential {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "credential_id", nullable = false, unique = true)
    private String credentialId;

    @Column(name = "credential_type", nullable = false)
    private String credentialType;

    @Column(name = "holder_name")
    private String holderName;

    @Column(name = "holder_wallet", nullable = false)
    private String holderWallet;

    @Column(name = "issuer_wallet", nullable = false)
    private String issuerWallet;

    @Column(name = "credential_hash", nullable = false)
    private String credentialHash;

    @Column(name = "issued_at")
    private LocalDateTime issuedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CredentialStatus status;

    @Column(name = "blockchain_tx_hash")
    private String blockchainTxHash;

    @Column(name = "revoke_tx_hash")
    private String revokeTxHash;

    @PrePersist
    public void prePersist() {
        if (this.issuedAt == null) this.issuedAt = LocalDateTime.now();
        if (this.status == null) this.status = CredentialStatus.ISSUED;
    }
}
