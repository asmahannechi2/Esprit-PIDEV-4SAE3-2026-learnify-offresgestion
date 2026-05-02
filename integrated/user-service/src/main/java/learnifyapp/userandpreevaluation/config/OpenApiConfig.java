package learnifyapp.userandpreevaluation.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI userServiceOpenAPI() {
        return new OpenAPI().info(new Info()
                .title("User Service API")
                .description("Authentification, profils, appareils — microservice intégré Learnify")
                .version("v1"));
    }
}
