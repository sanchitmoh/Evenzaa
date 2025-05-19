package com.evenza.backend.security.filter;

import com.evenza.backend.security.Tokens.FirebaseAuthenticationToken;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class FirebaseTokenFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String idToken = header.substring(7);  // Remove "Bearer " part
            try {

                FirebaseToken firebaseToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
                // Store the authentication info in the SecurityContext
                FirebaseAuthenticationToken authentication = new FirebaseAuthenticationToken(firebaseToken,idToken);
                SecurityContextHolder.getContext().setAuthentication(authentication);
                System.out.println("Authorization header: " + header);
                System.out.println("Decoded Firebase UID: " + firebaseToken.getUid());

            } catch (Exception e) {
                // Log the exception and send a 403 error if token is invalid
                response.sendError(403, "Unauthorized");
                return;
            }
        }

        filterChain.doFilter(request, response); // Continue with the next filter
    }
}
