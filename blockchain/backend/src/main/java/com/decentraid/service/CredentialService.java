package com.decentraid.service;

import com.decentraid.blockchain.BlockchainService;
import com.decentraid.dto.CredentialResponse;
import com.decentraid.dto.IssueCredentialRequest;
import com.decentraid.dto.VerificationResponse;
import com.decentraid.entity.Credential;
import com.decentraid.entity.CredentialStatus;
import com.decentraid.repository.CredentialRepository;
import com.decentraid.util.HashUtil;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CredentialService {

    private final CredentialRepository credentialRepository;
    private final BlockchainService blockchainService;

    public CredentialService(CredentialRepository credentialRepository, BlockchainService blockchainService) {
        this.credentialRepository = credentialRepository;
        this.blockchainService = blockchainService;
    }

    public CredentialResponse issueCredential(IssueCredentialRequest request) {
        if (credentialRepository.findByCredentialId(request.getCredentialId()).isPresent()) {
            throw new IllegalArgumentException("Credential already exists: " + request.getCredentialId());
        }

        boolean authorized = blockchainService.isAuthorizedIssuer(request.getIssuerWallet());
        if (!authorized) {
            throw new IllegalArgumentException("Issuer is not authorized: " + request.getIssuerWallet());
        }

        String credentialHash = HashUtil.generateCredentialHash(
                request.getCredentialId(), request.getCredentialType(), request.getHolderWallet());

        Credential credential = Credential.builder()
                .credentialId(request.getCredentialId())
                .credentialType(request.getCredentialType())
                .holderName(request.getHolderName())
                .holderWallet(request.getHolderWallet())
                .issuerWallet(request.getIssuerWallet())
                .credentialHash(credentialHash)
                .status(CredentialStatus.ISSUED)
                .build();

        String txHash = blockchainService.issueCredential(
                request.getCredentialId(), credentialHash, request.getHolderWallet(), request.getCredentialType());

        credential.setBlockchainTxHash(txHash);
        credential = credentialRepository.save(credential);

        return CredentialResponse.fromEntity(credential);
    }

    public CredentialResponse getCredential(String credentialId) {
        Credential credential = credentialRepository.findByCredentialId(credentialId)
                .orElseThrow(() -> new IllegalArgumentException("Credential not found: " + credentialId));
        return CredentialResponse.fromEntity(credential);
    }

    public VerificationResponse verifyCredential(String credentialId) {
        BlockchainService.CredentialChainData chainData = blockchainService.verifyCredential(credentialId);

        if (!chainData.exists()) {
            throw new IllegalArgumentException("Credential not found: " + credentialId);
        }

        if (chainData.revoked()) {
            return VerificationResponse.revoked(credentialId);
        }

        Credential credential = credentialRepository.findByCredentialId(credentialId).orElse(null);
        String txHash = credential != null ? credential.getBlockchainTxHash() : null;

        return VerificationResponse.valid(
                credentialId,
                chainData.issuer(),
                chainData.holder(),
                chainData.credentialType(),
                chainData.issuedAt().longValue(),
                txHash
        );
    }

    public CredentialResponse revokeCredential(String credentialId, String issuerWallet) {
        Credential credential = credentialRepository.findByCredentialId(credentialId)
                .orElseThrow(() -> new IllegalArgumentException("Credential not found: " + credentialId));

        if (credential.getStatus() == CredentialStatus.REVOKED) {
            throw new IllegalArgumentException("Credential already revoked: " + credentialId);
        }

        if (!credential.getIssuerWallet().equalsIgnoreCase(issuerWallet)) {
            throw new IllegalArgumentException("Only the issuing issuer can revoke this credential");
        }

        String revokeTxHash = blockchainService.revokeCredential(credentialId);

        credential.setStatus(CredentialStatus.REVOKED);
        credential.setRevokeTxHash(revokeTxHash);
        credential = credentialRepository.save(credential);

        return CredentialResponse.fromEntity(credential);
    }

    public List<CredentialResponse> getCredentialsByHolder(String holderWallet) {
        return credentialRepository.findByHolderWallet(holderWallet)
                .stream().map(CredentialResponse::fromEntity).collect(Collectors.toList());
    }

    public List<CredentialResponse> getCredentialsByIssuer(String issuerWallet) {
        return credentialRepository.findByIssuerWallet(issuerWallet)
                .stream().map(CredentialResponse::fromEntity).collect(Collectors.toList());
    }
}