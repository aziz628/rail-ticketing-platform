package com.sncft.app.psp;

import com.sncft.app.ticket.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.UUID;

import static com.sncft.app.shared.config.AppConstants.BOOKING_CONTEXT_KEY_PREFIX;
import static com.sncft.app.shared.config.AppConstants.SHADOW_SESSION_KEY_PREFIX;

/* 
This class is a MessageListener that subscribes to Redis key expiration events
and rely on redis's to run its expiration handler
*/

@Component
@RequiredArgsConstructor
@Slf4j
public class PspTimeoutListener implements MessageListener {

    private final TicketService ticketService;
    private final StringRedisTemplate redisTemplate;

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String expiredKey = message.toString();
        
        // check if the expired key is a booking session key
        if (expiredKey.startsWith(BOOKING_CONTEXT_KEY_PREFIX)) {
            // get the psp session id from the expired key
            String sessionIdStr = expiredKey.replace(BOOKING_CONTEXT_KEY_PREFIX, "");
            UUID pspSessionId = UUID.fromString(sessionIdStr);
            
            log.info("Payment session {} timed out. Handling failure...", pspSessionId);
            
            // Use shadow key to recover context since the main key is gone
            String shadowKey = SHADOW_SESSION_KEY_PREFIX + pspSessionId;
            String shadowContext = redisTemplate.opsForValue().get(shadowKey);
            
            if (shadowContext != null) {
                ticketService.handlePaymentFailure(pspSessionId);
            }
        }
    }
}
