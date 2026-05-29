package com.sncft.app.auth;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
// jackson have ObjectMapper and readValue for deserializing JSON data from the input stream

import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import com.sncft.app.shared.exception.GovIdentityNotFoundException;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/* mock of tunisian government service for identity verification */
@Service
public class GovValidationService {

    private final ObjectMapper objectMapper;
    private final Map<String, GovIdentity> identitiesByKey = new HashMap<>();

    public GovValidationService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    // load mock identities from json at service initialization 
    @PostConstruct
    public void loadMockData() throws IOException {
        try (InputStream inputStream = new ClassPathResource("mock-data/gov-identities.json").getInputStream()) {
            // converts JSON content from input stream into  List of GovIdentity objects.  
            List<GovIdentity> identities = objectMapper.readValue(inputStream, new TypeReference<List<GovIdentity>>() {});
            
            // build a map for quick lookup of identities using key and type
            for (GovIdentity identity : identities) {
                identitiesByKey.put(buildKey(identity.type(), identity.idNumber()), identity);
            }
        }
    }

    // verify the identity existence and retreive it.
    public GovIdentity validateIdentity(String type, String idNumber) {
        // make key for check existence in the map
        GovIdentity identity = identitiesByKey.get(buildKey(type, idNumber));
        if (identity == null) {
            throw new GovIdentityNotFoundException("Government identity not found");
        }
        return identity;
    }

    // helper method to build a consistent key for the identity map
    private String buildKey(String type, String idNumber) {
        return type.trim().toUpperCase() + "::" + idNumber.trim();
    }

    // record for holding government identity information 
    public record GovIdentity(String idNumber, String type, String fullName) {
    }
}
