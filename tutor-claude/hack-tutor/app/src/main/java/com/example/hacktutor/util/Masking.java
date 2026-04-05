package com.example.hacktutor.util;

public final class Masking {
  private Masking() {}

  public static String maskToken(String token) {
    if (token == null || token.length() < 8) return "****";
    return token.substring(0, 3) + "****" + token.substring(token.length() - 3);
  }
}
