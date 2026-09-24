package com.decentraid.service;

import com.decentraid.blockchain.BlockchainService;
import com.decentraid.dto.AuthorizeIssuerRequest;
import com.decentraid.entity.Role;
import com.decentraid.entity.User;
import com.decentraid.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final BlockchainService blockchainService;

    public AdminService(UserRepository userRepository, BlockchainService blockchainService) {
        this.userRepository = userRepository;
        this.blockchainService = blockchainService;
    }

    public User authorizeIssuer(AuthorizeIssuerRequest request) {
        if (!blockchainService.isAuthorizedIssuer(request.getWalletAddress())) {
            blockchainService.authorizeIssuer(request.getWalletAddress());
        }

        User user = userRepository.findByWalletAddress(request.getWalletAddress())
                .orElseGet(() -> User.builder()
                        .walletAddress(request.getWalletAddress())
                        .name(request.getName() != null ? request.getName() : "Issuer")
                        .email(request.getWalletAddress().toLowerCase() + "@decentraid.demo")
                        .role(Role.ISSUER)
                        .build());

        user.setRole(Role.ISSUER);
        userRepository.save(user);

        // txHash isn't persisted on User entity in this minimal schema;
        // it's logged/returned to the caller for demo visibility.
        return user;
    }

    public void revokeIssuer(String walletAddress) {
        blockchainService.revokeIssuer(walletAddress);
        // Issuer's DB role is left as-is; on-chain authorization is the source of truth
        // for whether they can actually issue/revoke credentials.
    }

    public List<User> listIssuers() {
        return userRepository.findByRole(Role.ISSUER);
    }

    public boolean isAuthorizedOnChain(String walletAddress) {
        return blockchainService.isAuthorizedIssuer(walletAddress);
    }
}