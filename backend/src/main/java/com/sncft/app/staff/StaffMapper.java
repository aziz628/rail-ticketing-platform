package com.sncft.app.staff;

import com.sncft.app.user.User;
import org.springframework.stereotype.Component;

@Component
public class StaffMapper {

    public AgentResponse toAgentResponse(User user) {
        return new AgentResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                true // canDelete mocked as true for now (deferred to Schedules sprint)
        );
    }

    public ControllerResponse toControllerResponse(User user, String controllerLineName) {
        return new ControllerResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                controllerLineName,
                true // canDelete mocked as true for now (deferred to Schedules sprint)
        );
    }
}
