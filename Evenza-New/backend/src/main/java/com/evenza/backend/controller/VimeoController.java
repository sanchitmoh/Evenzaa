package com.evenza.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;

@RestController
@RequestMapping("/api/vimeo")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"})
public class VimeoController {

    private final RestTemplate restTemplate = new RestTemplate();

    @GetMapping("/oembed")
    public ResponseEntity<String> proxyVimeoRequest(@RequestParam String url, @RequestParam(required = false) String autoplay,
                                                    @RequestParam(required = false) String muted, @RequestParam(required = false) String loop,
                                                    @RequestParam(required = false) String playsinline, @RequestParam(required = false) String controls,
                                                    @RequestParam(required = false) String autopause, @RequestParam(required = false) String byline,
                                                    @RequestParam(required = false) String portrait, @RequestParam(required = false) String title,
                                                    @RequestParam(required = false) String background, @RequestParam(required = false) String responsive) {
        String vimeoUrl = "https://vimeo.com/api/oembed.json?url=" + url +
                "&autoplay=" + autoplay +
                "&muted=" + muted +
                "&loop=" + loop +
                "&playsinline=" + playsinline +
                "&controls=" + controls +
                "&autopause=" + autopause +
                "&byline=" + byline +
                "&portrait=" + portrait +
                "&title=" + title +
                "&background=" + background +
                "&responsive=" + responsive;

        String response = restTemplate.getForObject(vimeoUrl, String.class);
        return ResponseEntity.ok(response);
    }
}

