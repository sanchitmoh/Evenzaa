package com.evenza.backend.security.Jwt;



import java.io.IOException;
import java.util.Collections;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.evenza.backend.services.UserDetailsServiceImpl;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class JwtAuthenticationFilter extends OncePerRequestFilter {
    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();
        // Skip this filter for auth endpoints
        return path.startsWith("/api/auth/");
    }
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String path = request.getRequestURI();
            
            // Debug the request path
            logger.debug("Processing request for path: {}", path);
            
            if (path.startsWith("/api/auth/")) {
                filterChain.doFilter(request, response);
                return;
            }
            
            String jwt = parseJwt(request);

            // Debug logging
            if (jwt != null) {
                logger.debug("JWT token found in request for path: {}", path);
                
                // Log token details without exposing the whole token
                String tokenFirstPart = jwt.length() > 10 ? jwt.substring(0, 10) + "..." : jwt;
                logger.debug("Token prefix: {}", tokenFirstPart);
            } else {
                logger.warn("No JWT token found in request: {}", request.getRequestURI());
            }

            if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
                String username = jwtUtils.getUsernameFromJwtToken(jwt);
                String role = jwtUtils.getRoleFromJwtToken(jwt);
                
                logger.debug("JWT token valid for user: {} with role: {}", username, role);

                // Special handling for admin endpoints
                if (path.startsWith("/api/admin/")) {
                    logger.debug("Admin endpoint detected, checking if user has ADMIN role");
                    
                    // For admin endpoints, check if user has ADMIN role
                    if ("ADMIN".equals(role)) {
                        logger.debug("User has ADMIN role, creating authentication with ROLE_ADMIN authority");
                        
                        // Create authentication with ROLE_ADMIN authority explicitly
                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(
                                        username,
                                        null,
                                        Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN")));
                                        
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                        logger.info("Admin authentication set for user: {}", username);
                    } else {
                        logger.warn("Access to admin endpoint denied for user: {} with role: {}", username, role);
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        return;
                    }
                } else {
                    // Regular authentication for non-admin endpoints
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    logger.debug("Authentication set in SecurityContext for user: {}", username);
                }
            }
        } catch (Exception e) {
            logger.error("Cannot set user authentication: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {
        // First try to get token from Authorization header
        String headerAuth = request.getHeader("Authorization");

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }
        
        // If not found in header, try to get from query parameter (useful for file downloads)
        String tokenParam = request.getParameter("token");
        if (StringUtils.hasText(tokenParam)) {
            logger.debug("JWT token found in query parameter for: {}", request.getRequestURI());
            return tokenParam;
        }

        return null;
    }
}
