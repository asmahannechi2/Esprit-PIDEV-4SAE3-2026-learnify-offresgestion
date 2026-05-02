package pi.integrated.jobservice.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI jobServiceOpenAPI() {
        return new OpenAPI().info(new Info()
                .title("Job Service API")
                .description("Offres, candidatures, réunions — microservice intégré Learnify")
                .version("v1"));
    }
}
