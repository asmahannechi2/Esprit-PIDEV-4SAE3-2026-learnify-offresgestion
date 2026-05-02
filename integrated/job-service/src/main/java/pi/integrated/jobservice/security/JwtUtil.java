package pi.integrated.jobservice.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Collection;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secretKey;

    private Key getKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes());
    }

    public Claims extractClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public String extractEmail(String token) {
        return extractClaims(token).getSubject();
    }

    /**
     * Claim {@code role} (string, liste, ou autre), sinon premier élément de {@code authorities}.
     */
    public String extractRole(String token) {
        Claims c = extractClaims(token);
        String asStr = c.get("role", String.class);
        if (asStr != null && !asStr.isBlank()) {
            return asStr.trim();
        }
        Object roleObj = c.get("role");
        if (roleObj instanceof Collection<?> list && !list.isEmpty()) {
            Object item = list.iterator().next();
            if (item == null) {
                return null;
            }
            String s = item.toString().trim();
            return s.isEmpty() ? null : s;
        }
        if (roleObj != null) {
            String s = roleObj.toString().trim();
            return s.isEmpty() ? null : s;
        }
        Object auths = c.get("authorities");
        if (auths instanceof Collection<?> col && !col.isEmpty()) {
            String a = col.iterator().next().toString().trim();
            if (a.startsWith("ROLE_")) {
                return a.substring(5).trim();
            }
            return a.isEmpty() ? null : a;
        }
        return null;
    }

    public Long extractUserId(String token) {
        Object id = extractClaims(token).get("userId");
        if (id == null) return null;
        if (id instanceof Integer) return ((Integer) id).longValue();
        if (id instanceof Long) return (Long) id;
        return Long.valueOf(id.toString());
    }

    public String extractName(String token) {
        Object name = extractClaims(token).get("name");
        return name != null ? name.toString() : null;
    }

    public boolean isTokenExpired(String token) {
        return extractClaims(token).getExpiration().before(new Date());
    }
}
