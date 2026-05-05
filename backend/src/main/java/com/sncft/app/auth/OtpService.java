package com.sncft.app.auth;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom; // cryptographically strong random number generator
import java.util.concurrent.TimeUnit;

@Service
public class OtpService {

    private final StringRedisTemplate redisTemplate;
    private static final String OTP_PREFIX = "otp:";
    private static final String USER_OTP_PREFIX = "user_otp:"; // used for checking user otp existence
    private final SecureRandom secureRandom = new SecureRandom();

    public OtpService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * Generates an 8-digit OTP. 
     * Uses a Dual-Key strategy for O(1) lookup and invalidation.
     */
    public String generateOtp(String email) {
        // instant Check if the user already has an active OTP
        String oldOtp = redisTemplate.opsForValue().get(USER_OTP_PREFIX + email);
        
        // if they do, delete the old OTP mapping
        if (oldOtp != null) {
            redisTemplate.delete(OTP_PREFIX + oldOtp);
        }

        // Generate the new OTP
        String newOtp = String.format("%08d", secureRandom.nextInt(100000000));
        
        // Store the dual mappings for 15 minutes
        redisTemplate.opsForValue().set(OTP_PREFIX + newOtp, email, 15, TimeUnit.MINUTES);
        redisTemplate.opsForValue().set(USER_OTP_PREFIX + email, newOtp, 15, TimeUnit.MINUTES);
        
        return newOtp;
    }

    /**
     * Retrieves the email associated with the provided OTP.
     */
    public String getEmailByOtp(String otp) {
        return redisTemplate.opsForValue().get(OTP_PREFIX + otp);
    }

    /**
     * Removes both mappings from Redis after successful use.
     */
    public void clearOtp(String otp) {
        String email = getEmailByOtp(otp);
        if (email != null) {
            redisTemplate.delete(OTP_PREFIX + otp);
            redisTemplate.delete(USER_OTP_PREFIX + email);
        }
    }
}
