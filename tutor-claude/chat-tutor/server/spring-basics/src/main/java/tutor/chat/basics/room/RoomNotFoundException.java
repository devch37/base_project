package tutor.chat.basics.room;

/** 없는 방을 찾을 때. GlobalExceptionHandler 가 404 로 바꿔 준다. */
public class RoomNotFoundException extends RuntimeException {
    public RoomNotFoundException(String roomId) {
        super("방을 찾을 수 없습니다: " + roomId);
    }
}
