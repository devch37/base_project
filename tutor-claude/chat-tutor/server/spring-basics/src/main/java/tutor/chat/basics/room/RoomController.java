package tutor.chat.basics.room;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller: "HTTP 요청 1개 → 응답 1개" 를 처리한다.
 *
 * <p>08장에서 만날 STOMP 메시지 Controller(@MessageMapping)와 비교해 보자.
 * <ul>
 *   <li>REST: 클라이언트가 묻고 → 서버가 그 사람에게만 답한다. 끝나면 연결과 무관.</li>
 *   <li>STOMP: 열려 있는 연결로 메시지가 오고 → 서버는 "구독자 전원"에게 보낼 수 있다.</li>
 * </ul>
 *
 * <p>Controller 는 얇게: HTTP ↔ DTO 변환과 상태 코드만 책임지고, 판단은 Service 에 맡긴다.
 */
@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    /**
     * POST /api/rooms → 201 Created + Location 헤더.
     * 왜 200 이 아니라 201? "새 자원이 생겼다"는 의미를 상태 코드로 전달하는 것이 REST 의 약속이다.
     */
    @PostMapping
    public ResponseEntity<RoomResponse> create(@Valid @RequestBody CreateRoomRequest request) {
        Room room = roomService.open(request);
        return ResponseEntity
                .created(URI.create("/api/rooms/" + room.id()))
                .body(RoomResponse.from(room));
    }

    /** GET 은 "읽기만" 한다. 몇 번을 호출해도 서버 상태가 변하지 않아야 한다(안전·멱등). */
    @GetMapping("/{roomId}")
    public RoomResponse get(@PathVariable String roomId) {
        return RoomResponse.from(roomService.get(roomId));
    }

    @GetMapping
    public List<RoomResponse> list() {
        return roomService.list().stream().map(RoomResponse::from).toList();
    }
}
