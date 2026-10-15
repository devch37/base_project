package tutor.chat.secure.demo;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tutor.chat.secure.auth.ChatPrincipal;
import tutor.chat.secure.auth.InvalidTokenException;
import tutor.chat.secure.auth.JwtService;

/**
 * 10장 실습: 같은 "내가 누구지?" 를 두 방식으로 구현해 비교한다. curl 로 직접 해 보자 (10장 README).
 *
 * <p>쿠키·세션: 서버가 기억한다(상태 있음). 브라우저는 세션 ID 쿠키만 들고 다닌다.
 *   → 서버를 2대로 늘리면 "1번 서버에서 로그인했는데 2번 서버는 모름" 문제가 생긴다 (23장).
 *
 * <p>토큰: 서버는 기억하지 않는다(상태 없음). 토큰 자체에 정보 + 서명이 들어 있다.
 *   → 어느 서버든 비밀키만 있으면 검증 가능. 대신 발급한 토큰을 "중간에 무효화"하기 어렵다.
 */
@RestController
@RequestMapping("/demo")
public class AuthStyleDemoController {

    private final JwtService jwt;

    public AuthStyleDemoController(JwtService jwt) {
        this.jwt = jwt;
    }

    /** 세션 로그인: 응답에 Set-Cookie: JSESSIONID=... 가 붙는다 */
    @PostMapping("/session/login")
    public Map<String, String> sessionLogin(@RequestParam String userId, HttpServletRequest request) {
        HttpSession session = request.getSession(true); // 서버 메모리에 세션 생성
        session.setAttribute("userId", userId);
        return Map.of("message", "로그인됨. 이제 쿠키만 보내면 됩니다", "sessionId(서버만 의미를 앎)", session.getId());
    }

    @GetMapping("/session/me")
    public ResponseEntity<Map<String, Object>> sessionMe(HttpServletRequest request) {
        HttpSession session = request.getSession(false); // 없으면 만들지 않는다
        if (session == null || session.getAttribute("userId") == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "세션 없음"));
        }
        return ResponseEntity.ok(Map.of("userId", session.getAttribute("userId"), "how", "서버 메모리의 세션에서 찾음"));
    }

    @PostMapping("/session/logout")
    public Map<String, String> sessionLogout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) session.invalidate(); // 서버가 즉시 무효화 가능 — 세션 방식의 장점
        return Map.of("message", "로그아웃됨");
    }

    /** 토큰 방식: Authorization: Bearer <JWT> 헤더를 읽어 "검증만" 한다. 서버 저장소 조회 없음. */
    @GetMapping("/token/me")
    public ResponseEntity<Map<String, Object>> tokenMe(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .header("WWW-Authenticate", "Bearer") // 401 일 때 "어떤 방식으로 인증하라"를 알려 주는 표준 헤더
                    .body(Map.of("error", "토큰 없음"));
        }
        try {
            ChatPrincipal p = jwt.verify(auth.substring(7));
            return ResponseEntity.ok(Map.of("userId", p.userId(), "tenant", p.tenant(), "role", p.role(),
                    "expiresAt", p.expiresAt().toString(), "how", "토큰 서명만 검증 (서버 저장소 조회 없음)"));
        } catch (InvalidTokenException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
    }
}
