package com.sncft.app.user;

import com.sncft.app.shared.dto.MessageResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public UserResponse getMe(Authentication authentication) {
        return userService.getMe(authentication);
    }

    @PatchMapping("/me")
    public MessageResponse updatePassword(Authentication authentication, @Valid @RequestBody UpdatePasswordRequest request) {
        userService.updatePassword(authentication, request);
        return new MessageResponse("Password updated successfully");
    }
}
