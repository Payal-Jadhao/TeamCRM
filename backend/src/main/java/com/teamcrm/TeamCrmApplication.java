package com.teamcrm;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TeamCrmApplication {
    public static void main(String[] args) {
        SpringApplication.run(TeamCrmApplication.class, args);
    }
}
