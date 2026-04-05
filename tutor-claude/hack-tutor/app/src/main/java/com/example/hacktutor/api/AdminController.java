package com.example.hacktutor.api;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AdminController {
  @PreAuthorize("hasRole('ADMIN')")
  @GetMapping("/admin/health")
  public String adminHealth() {
    return "ok";
  }
}
