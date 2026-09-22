package com.decentraid.repository;

import com.decentraid.entity.Credential;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CredentialRepository extends JpaRepository<Credential, Long> {
    Optional<Credential> findByCredentialId(String credentialId);
    List<Credential> findByHolderWallet(String holderWallet);
    List<Credential> findByIssuerWallet(String issuerWallet);
}
