package com.teamcrm.controller;

import com.teamcrm.dto.OtherDtos.AiPromptRequest;
import com.teamcrm.dto.OtherDtos.AiResponseDto;
import com.teamcrm.service.AiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/generate")
    public ResponseEntity<AiResponseDto> generate(@RequestBody AiPromptRequest request) {
        return ResponseEntity.ok(aiService.generateAiAssistance(request));
    }
}
