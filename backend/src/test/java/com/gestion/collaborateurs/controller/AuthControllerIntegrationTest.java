package com.gestion.collaborateurs.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gestion.collaborateurs.dto.LoginRequest;
import com.gestion.collaborateurs.entity.Role;
import com.gestion.collaborateurs.entity.User;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = com.gestion.collaborateurs.GestionCollaborateursApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.gestion.collaborateurs.repository.CollaborateurRepository collaborateurRepository;

    @Autowired
    private com.gestion.collaborateurs.repository.ManagerRepository managerRepository;

    @Autowired
    private com.gestion.collaborateurs.repository.CompetenceLogRepository competenceLogRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setup() {
        competenceLogRepository.deleteAll();
        collaborateurRepository.deleteAll();
        managerRepository.deleteAll();
        userRepository.deleteAll();
        User user = new User();
        user.setUsername("testcollab");
        user.setPassword(passwordEncoder.encode("password123"));
        user.setRole(Role.COLLABORATEUR);
        user.setEnabled(true);
        userRepository.save(user);
    }

    @Test
    void login_POST_withValidCredentials_returns200AndToken() throws Exception {
        LoginRequest loginRequest = new LoginRequest("testcollab", "password123");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("COLLABORATEUR"))
                .andExpect(jsonPath("$.username").value("testcollab"));
    }

    @Test
    void login_POST_withInvalidPassword_returns401() throws Exception {
        LoginRequest loginRequest = new LoginRequest("testcollab", "wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void login_POST_withMissingUsername_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"password\":\"password123\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void protectedEndpoint_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/collaborateur/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpoint_withValidToken_returns200OrNotFound() throws Exception {
        String token = getTokenForUser("testcollab", "password123");

        mockMvc.perform(get("/api/collaborateur/1")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound()); // 404 because collab 1 doesn't exist, but it's not 401
    }

    private String getTokenForUser(String username, String password) throws Exception {
        LoginRequest loginRequest = new LoginRequest(username, password);
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andReturn();
        
        String response = result.getResponse().getContentAsString();
        return objectMapper.readTree(response).get("token").asText();
    }
}
