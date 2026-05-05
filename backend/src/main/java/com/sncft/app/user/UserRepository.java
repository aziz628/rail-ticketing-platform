package com.sncft.app.user;

import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import org.springframework.data.domain.Pageable;
import java.util.Optional;
import java.util.UUID;


public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByNationalIdNumber(String nationalIdNumber);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByNationalIdNumber(String nationalIdNumber);
    
    Page<User> findByRoleInAndIsDeletedFalse(List<UserRole> roles, Pageable pageable);

    Optional<User> findByIdAndIsDeletedFalse(UUID id);

    long countByRoleIn(List<UserRole> roles);
}
