package com.gestion.collaborateurs.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gestion.collaborateurs.dto.CompetenceRequest;
import com.gestion.collaborateurs.dto.LoginRequest;
import com.gestion.collaborateurs.dto.UpdateProfileRequest;
import com.gestion.collaborateurs.entity.Collaborateur;
import com.gestion.collaborateurs.entity.Role;
import com.gestion.collaborateurs.entity.User;
import com.gestion.collaborateurs.repository.CollaborateurRepository;
import com.gestion.collaborateurs.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.ArrayList;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = com.gestion.collaborateurs.GestionCollaborateursApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CollaborateurControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CollaborateurRepository collaborateurRepository;

    @Autowired
    private com.gestion.collaborateurs.repository.ManagerRepository managerRepository;

    @Autowired
    private com.gestion.collaborateurs.repository.CompetenceLogRepository competenceLogRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Long collabId;
    private Long managerId;

    @BeforeEach
    void setup() {
        competenceLogRepository.deleteAll();
        collaborateurRepository.deleteAll();
        managerRepository.deleteAll();
        userRepository.deleteAll();

        // Create Collab User
        User user1 = new User();
        user1.setUsername("collab1");
        user1.setPassword(passwordEncoder.encode("password123"));
        user1.setRole(Role.COLLABORATEUR);
        user1.setEnabled(true);
        user1 = userRepository.save(user1);

        Collaborateur c1 = new Collaborateur();
        c1.setNom("Martin");
        c1.setPrenom("Sophie");
        c1.setUser(user1);
        c1 = collaborateurRepository.save(c1);
        collabId = c1.getId();

        // Create Manager User
        User managerUser = new User();
        managerUser.setUsername("manager1");
        managerUser.setPassword(passwordEncoder.encode("password123"));
        managerUser.setRole(Role.MANAGER);
        managerUser.setEnabled(true);
        userRepository.save(managerUser);
        
        // Create another Collab for 403 test
        User user2 = new User();
        user2.setUsername("collab2");
        user2.setPassword(passwordEncoder.encode("password123"));
        user2.setRole(Role.COLLABORATEUR);
        user2.setEnabled(true);
        userRepository.save(user2);
    }

    @Test
    void getProfile_withManagerToken_returns200() throws Exception {
        String token = getTokenForUser("manager1", "password123");

        mockMvc.perform(get("/api/collaborateur/" + collabId)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nom").value("Martin"));
    }

    @Test
    void updateProfile_withOwnerToken_returns200() throws Exception {
        String token = getTokenForUser("collab1", "password123");

        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setNom("Martin-Updated");
        request.setPrenom("Sophie");
        request.setPoste("Senior Dev");

        mockMvc.perform(put("/api/collaborateur/" + collabId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.poste").value("Senior Dev"));
    }

    @Test
    void updateProfile_withDifferentCollabToken_returns403() throws Exception {
        String token = getTokenForUser("collab2", "password123");

        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setNom("Attacker");

        mockMvc.perform(put("/api/collaborateur/" + collabId)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void addCompetence_withCollabToken_returns200() throws Exception {
        String token = getTokenForUser("collab1", "password123");

        CompetenceRequest request = new CompetenceRequest();
        request.setNom("Java 21");
        request.setCategorie("TECHNIQUE");
        request.setNiveau("AVANCE");

        mockMvc.perform(post("/api/collaborateur/" + collabId + "/competences")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nom").value("Java 21"));
    }

    private String getTokenForUser(String username, String password) throws Exception {
        LoginRequest loginRequest = new LoginRequest(username, password);
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }
}
