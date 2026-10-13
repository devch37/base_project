package tutor.stomp.step2_stomp;

/** 브라우저가 SEND /app/rooms/{roomId}/send 로 보내는 JSON: {"sender":"철수","text":"안녕"} */
public record SendRequest(String sender, String text) {}
