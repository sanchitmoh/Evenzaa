package com.evenza.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;

import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

@SpringBootApplication
public class EvenzaBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(EvenzaBackendApplication.class, args);
	}

	/**
	 * Configure Jackson to handle Java 8 date/time types
	 */
	@Bean
	public Jackson2ObjectMapperBuilderCustomizer jacksonCustomizer() {
		return builder -> {
			builder.modulesToInstall(new JavaTimeModule());
		};
	}
}
