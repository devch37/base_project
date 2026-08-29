package com.example.postgrestutorial.message;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageRepository messageRepository;

    public MessageController(MessageRepository messageRepository) {
        this.messageRepository = messageRepository;
    }

    @GetMapping
    public List<Message> findAll() {
        return messageRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<Message> create(@RequestBody CreateMessageRequest request) {
        Message saved = messageRepository.save(request);
        return ResponseEntity.created(URI.create("/api/messages/" + saved.id())).body(saved);
    }
}
