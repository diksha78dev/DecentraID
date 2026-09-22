package com.decentraid.repository;

import com.decentraid.entity.Role;
import com.decentraid.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByWalletAddress(String walletAddress);
    List<User> findByRole(Role role);
}
