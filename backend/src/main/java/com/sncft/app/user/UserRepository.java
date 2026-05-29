package com.sncft.app.user;

import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;


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

    List<User> findByRole(UserRole role);

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("SELECT u.id FROM User u WHERE u.id IN :userIds AND " +
           "EXISTS (SELECT ts FROM TripSchedule ts WHERE ts.controller = u AND (ts.deactivationDate IS NULL OR ts.deactivationDate > CURRENT_DATE))")
    List<UUID> findControllersWithActiveSchedules(@Param("userIds") List<UUID> userIds);

    long countByRoleAndIsDeletedFalse(UserRole role);

    List<User> findByRoleAndIsDeletedFalse(UserRole role);
}
