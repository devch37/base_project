package com.example.hacktutor.api;

import com.example.hacktutor.model.CreateUserRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserController {
  @PostMapping("/users")
  public ResponseEntity<Void> create(@Valid @RequestBody CreateUserRequest req) {
    return ResponseEntity.ok().build();
  }
}
