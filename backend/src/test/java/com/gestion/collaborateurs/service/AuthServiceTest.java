package com.gestion.collaborateurs.service;

import com.gestion.collaborateurs.dto.LoginRequest;
import com.gestion.collaborateurs.dto.LoginResponse;
import com.gestion.collaborateurs.entity.Role;
import com.gestion.collaborateurs.entity.User;
import com.gestion.collaborateurs.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private AuthService authService;

    @Test
    void login_withValidCredentials_returnsLoginResponse() {
        // Arrange
        LoginRequest request = new LoginRequest("collab1", "password123");
        User user = new User();
        user.setUsername("collab1");
        user.setRole(Role.COLLABORATEUR);

        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(user);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
        when(jwtTokenProvider.generateToken(user)).thenReturn("test.jwt.token");
        
        ReflectionTestUtils.setField(authService, "jwtExpirationDate", 86400000L);

        // Act
        LoginResponse response = authService.login(request);

        // Assert
        assertNotNull(response);
        assertEquals("test.jwt.token", response.getToken());
        assertEquals("COLLABORATEUR", response.getRole());
        assertEquals("collab1", response.getUsername());
    }

    @Test
    void login_withInvalidCredentials_throwsBadCredentialsException() {
        // Arrange
        LoginRequest request = new LoginRequest("wrong", "password");
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Invalid credentials"));

        // Act & Assert
        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }

    @Test
    void generateToken_containsExpectedClaims() {
        // This is more of a JwtTokenProvider test, but we can test it using a real instance for demonstration
        JwtTokenProvider realProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(realProvider, "jwtSecret", "dGVzdFNlY3JldEtleUZvclRlc3RpbmdQdXJwb3Nlc09ubHkxMjM=");
        ReflectionTestUtils.setField(realProvider, "jwtExpirationDate", 3600000L);

        User user = new User();
        user.setUsername("collab1");
        user.setRole(Role.COLLABORATEUR);

        String token = realProvider.generateToken(user);
        
        assertNotNull(token);
        assertEquals("collab1", realProvider.extractUsername(token));
        assertTrue(realProvider.validateToken(token));
    }

    @Test
    void validateToken_withExpiredToken_returnsFalse() throws InterruptedException {
        JwtTokenProvider shortLivedProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(shortLivedProvider, "jwtSecret", "dGVzdFNlY3JldEtleUZvclRlc3RpbmdQdXJwb3Nlc09ubHkxMjM=");
        ReflectionTestUtils.setField(shortLivedProvider, "jwtExpirationDate", 1L); // 1ms

        User user = new User();
        user.setUsername("collab1");
        user.setRole(Role.COLLABORATEUR);

        String token = shortLivedProvider.generateToken(user);
        Thread.sleep(10); // Wait for expiration

        assertFalse(shortLivedProvider.validateToken(token));
    }
}
