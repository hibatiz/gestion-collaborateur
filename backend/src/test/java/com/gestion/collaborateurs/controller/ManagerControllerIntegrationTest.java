package com.gestion.collaborateurs.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gestion.collaborateurs.dto.EquipeRequest;
import com.gestion.collaborateurs.dto.LoginRequest;
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
import java.util.Arrays;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = com.gestion.collaborateurs.GestionCollaborateursApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ManagerControllerIntegrationTest {

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

    @BeforeEach
    void setup() {
        competenceLogRepository.deleteAll();
        collaborateurRepository.deleteAll();
        managerRepository.deleteAll();
        userRepository.deleteAll();

        // Create Manager User
        User managerUser = new User();
        managerUser.setUsername("manager1");
        managerUser.setPassword(passwordEncoder.encode("password123"));
        managerUser.setRole(Role.MANAGER);
        managerUser.setEnabled(true);
        userRepository.save(managerUser);

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
    }

    @Test
    void getDashboard_withManagerToken_returns200() throws Exception {
        String token = getTokenForUser("manager1", "password123");

        mockMvc.perform(get("/api/manager/dashboard/enhanced")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCollaborateurs").exists());
    }

    @Test
    void getDashboard_withCollabToken_returns403() throws Exception {
        String token = getTokenForUser("collab1", "password123");

        mockMvc.perform(get("/api/manager/dashboard/enhanced")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void getCollaborateurs_withManagerToken_returnsPagedList() throws Exception {
        String token = getTokenForUser("manager1", "password123");

        mockMvc.perform(get("/api/manager/collaborateurs?page=0&size=10")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void getMatrice_withManagerToken_returns200() throws Exception {
        String token = getTokenForUser("manager1", "password123");

        mockMvc.perform(get("/api/manager/matrice")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.collaborateurs").isArray())
                .andExpect(jsonPath("$.competences").isArray());
    }

    @Test
    void exportMatricePdf_returns200AndPdfContentType() throws Exception {
        String token = getTokenForUser("manager1", "password123");

        mockMvc.perform(get("/api/manager/matrice/export?format=pdf")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"));
    }

    @Test
    void exportMatriceExcel_returns200AndXlsxContentType() throws Exception {
        String token = getTokenForUser("manager1", "password123");

        mockMvc.perform(get("/api/manager/matrice/export?format=xlsx")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
    }

    @Test
    void constituerEquipe_withValidRequest_returns200() throws Exception {
        String token = getTokenForUser("manager1", "password123");

        EquipeRequest request = new EquipeRequest();
        request.setCollaborateurIds(Arrays.asList(collabId));
        request.setCompetencesRequises(Arrays.asList("Java"));
        request.setProjetNom("Team Test");

        mockMvc.perform(post("/api/manager/equipe")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.projetNom").value("Team Test"));
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
