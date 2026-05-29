package com.sncft.app.staff;

import com.sncft.app.user.User;
import org.springframework.stereotype.Component;

@Component
public class StaffMapper {

    public AgentResponse toAgentResponse(User user, boolean canDelete) {
        return new AgentResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                canDelete
        );
    }

    public ControllerResponse toControllerResponse(User user, String controllerLineName, boolean canDelete) {
        return new ControllerResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                controllerLineName,
                canDelete
        );
    }
}
