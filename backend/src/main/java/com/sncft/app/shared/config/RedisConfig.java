package com.sncft.app.shared.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.adapter.MessageListenerAdapter;
import com.sncft.app.psp.PspTimeoutListener;
import org.springframework.context.annotation.Profile;

/*
This class is a Redis Configuration class that sets up the Redis MessageListenerContainer
*/

@Configuration
@Profile("!test")
public class RedisConfig {

    @Bean
    RedisMessageListenerContainer container(RedisConnectionFactory connectionFactory,
         PspTimeoutListener timeoutListener) {
        
        // create a message listener container (needed for handling expired keys events)
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);

        // add psp timeout listener to listen for keyspace events for expired keys
        container.addMessageListener(new MessageListenerAdapter(timeoutListener), new PatternTopic("__keyevent@*__:expired"));
        return container;
    }
}
