package pi.integrated.jobservice.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Stateless JWT filter — no DB lookup. Parses the token directly from the Authorization header.
 * Sets a Spring Security Authentication with the email as principal and role as authority.
 * Also stores userId, email, name, and role as request attributes for controller access.
 */
@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null) {
            String trimmed = authHeader.trim();
            if (!trimmed.regionMatches(true, 0, "Bearer ", 0, 7)) {
                filterChain.doFilter(request, response);
                return;
            }
            String token = trimmed.substring(7).trim();
            if (token.isEmpty()) {
                filterChain.doFilter(request, response);
                return;
            }
            try {
                if (!jwtUtil.isTokenExpired(token)) {
                    String email = jwtUtil.extractEmail(token);
                    String role = jwtUtil.extractRole(token);
                    Long userId = jwtUtil.extractUserId(token);
                    String name = jwtUtil.extractName(token);

                    if (email != null && role != null && !role.isBlank()) {
                        /*
                         * Toujours poser l’auth JWT quand le token est valide.
                         * Avant : on exigeait getAuthentication() == null — Spring met souvent une
                         * AnonymousAuthenticationToken, donc le JWT n’était jamais appliqué → 403 sur hasRole.
                         */
                        String normalized = role.trim();
                        if (normalized.toUpperCase().startsWith("ROLE_")) {
                            normalized = normalized.substring(5);
                        }
                        normalized = normalized.toUpperCase();
                        UsernamePasswordAuthenticationToken auth =
                                new UsernamePasswordAuthenticationToken(
                                        email,
                                        null,
                                        List.of(new SimpleGrantedAuthority("ROLE_" + normalized))
                                );
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    }

                    // Store as request attributes for controller convenience
                    request.setAttribute("userId", userId);
                    request.setAttribute("userEmail", email);
                    request.setAttribute("userRole", role);
                    request.setAttribute("userName", name);
                }
            } catch (Exception e) {
                // Invalid token — proceed unauthenticated
            }
        }

        filterChain.doFilter(request, response);
    }
}
