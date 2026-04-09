package com.gestion.collaborateurs.service;

import com.gestion.collaborateurs.dto.LoginRequest;
import com.gestion.collaborateurs.dto.LoginResponse;
import com.gestion.collaborateurs.entity.User;
import com.gestion.collaborateurs.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    @Value("${jwt.expiration}")
    private long jwtExpirationDate;

    public LoginResponse login(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        User user = (User) authentication.getPrincipal();
        String jwt = tokenProvider.generateToken(user);

        return LoginResponse.builder()
                .token(jwt)
                .role(user.getRole().name())
                .username(user.getUsername())
                .expiresIn(jwtExpirationDate)
                .build();
    }
}
