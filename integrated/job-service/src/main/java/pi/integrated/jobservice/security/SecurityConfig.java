package pi.integrated.jobservice.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Démo Feign sync (job → preevaluation) + doc
                .requestMatchers(HttpMethod.GET, "/api/jobs/public/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                // Public: browse jobs (incl. /api/jobs sans segment — Ant /** ne couvre pas toujours la racine)
                .requestMatchers(HttpMethod.GET, "/api/jobs", "/api/jobs/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/job-notifications/**").authenticated()
                // Saved jobs — any authenticated user
                .requestMatchers("/api/saved-jobs/**").authenticated()
                // CV profile — TUTOR, CANDIDATE or ADMIN
                .requestMatchers("/api/cv-profiles/**", "/api/cv-profile/**").authenticated()
                // Applications — TUTOR or CANDIDATE applies, ADMIN manages
                .requestMatchers(HttpMethod.POST, "/api/applications/**").hasAnyRole("TUTOR", "CANDIDATE")
                // PUT/PATCH : seuls statut + futurs endpoints ; contrôle ADMIN.
                .requestMatchers(HttpMethod.PUT, "/api/applications/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/applications/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/applications/**").authenticated()
                // Meetings — lecture « perso » / par application : tout utilisateur connecté ; liste admin : ADMIN uniquement
                .requestMatchers(HttpMethod.GET, "/api/meetings/room/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/meetings/application/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/meetings/my", "/api/meetings/next").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/meetings").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/meetings/**").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/meetings/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/meetings/**").authenticated()
                // Ratings — STUDENT rates; admins/tutors read
                .requestMatchers(HttpMethod.POST, "/api/ratings/**").hasRole("STUDENT")
                .requestMatchers(HttpMethod.GET, "/api/ratings/**").authenticated()
                // Admin job management
                .requestMatchers(HttpMethod.POST, "/api/jobs/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/jobs/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/jobs/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
