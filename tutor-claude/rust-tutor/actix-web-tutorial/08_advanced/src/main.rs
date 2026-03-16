// =============================================================================
// 챕터 08: 고급 기능 - WebSocket & 스트리밍
// =============================================================================
//
// 이 챕터에서 배울 것:
// 1. WebSocket 연결 처리
// 2. 양방향 실시간 통신
// 3. HTTP 스트리밍 응답 (Server-Sent Events)
// 4. 파일 다운로드 스트리밍
// 5. 비동기 채널로 실시간 데이터 전송
//
// WebSocket이란?
// HTTP와 달리 연결이 유지되는 양방향 통신 프로토콜입니다.
// 클라이언트가 요청하지 않아도 서버가 데이터를 푸시할 수 있습니다.
// 채팅, 실시간 알림, 라이브 업데이트 등에 사용됩니다.
//
// =============================================================================

use actix_web::{get, web, App, HttpRequest, HttpResponse, HttpServer, Responder};
use actix_ws::Message;
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use std::time::Duration;
use tokio::time::sleep;

// =============================================================================
// WebSocket 핸들러
// =============================================================================

// WebSocket 에코 서버
// 클라이언트가 보낸 메시지를 그대로 돌려줍니다
#[get("/ws/echo")]
async fn ws_echo(
    req: HttpRequest,
    body: web::Payload,  // 업그레이드된 WebSocket 스트림
) -> Result<HttpResponse, actix_web::Error> {
    // actix_ws::handle(): HTTP 연결을 WebSocket으로 업그레이드합니다
    let (response, mut session, mut msg_stream) = actix_ws::handle(&req, body)?;

    // 별도의 비동기 태스크에서 WebSocket 메시지를 처리합니다
    // actix_web::rt::spawn: Actix 런타임에서 비동기 태스크를 실행합니다
    actix_web::rt::spawn(async move {
        println!("WebSocket 클라이언트 연결됨");

        // 연결 환영 메시지 전송
        let _ = session.text("연결 성공! 메시지를 입력하면 그대로 돌려드립니다.").await;

        // 메시지 스트림에서 메시지를 순서대로 처리합니다
        while let Some(msg) = msg_stream.next().await {
            match msg {
                Ok(Message::Text(text)) => {
                    println!("받은 텍스트 메시지: {}", text);
                    // 에코: 받은 메시지를 그대로 돌려줍니다
                    let reply = format!("에코: {}", text);
                    if session.text(reply).await.is_err() {
                        break;  // 전송 실패 시 루프 종료
                    }
                }
                Ok(Message::Binary(bin)) => {
                    println!("받은 바이너리 메시지: {} bytes", bin.len());
                    let _ = session.binary(bin).await;
                }
                Ok(Message::Ping(ping)) => {
                    // Ping에는 Pong으로 응답해야 합니다 (연결 유지)
                    let _ = session.pong(&ping).await;
                }
                Ok(Message::Close(reason)) => {
                    println!("WebSocket 연결 종료: {:?}", reason);
                    break;
                }
                _ => {}  // 다른 메시지 타입은 무시
            }
        }

        println!("WebSocket 핸들러 종료");
    });

    // WebSocket 업그레이드 응답을 즉시 반환합니다
    Ok(response)
}

// WebSocket 채팅 서버 (브로드캐스트)
// 한 클라이언트의 메시지를 모든 클라이언트에게 전송합니다
use std::sync::Arc;
use tokio::sync::broadcast;

// 채팅 메시지 타입
#[derive(Clone, Debug)]
struct ChatMessage {
    sender: String,
    content: String,
}

// 채팅 서버 상태
struct ChatState {
    // broadcast::Sender: 하나의 메시지를 여러 수신자에게 전달합니다
    tx: broadcast::Sender<ChatMessage>,
}

#[get("/ws/chat")]
async fn ws_chat(
    req: HttpRequest,
    body: web::Payload,
    state: web::Data<ChatState>,
) -> Result<HttpResponse, actix_web::Error> {
    let (response, mut session, mut msg_stream) = actix_ws::handle(&req, body)?;

    // 브로드캐스트 채널 복제
    let tx = state.tx.clone();
    let mut rx = tx.subscribe();  // 수신 구독

    // 사용자 이름 (실제로는 인증에서 가져와야 합니다)
    let username = format!("사용자{}", rand_id());

    let welcome = format!("{} 님이 입장했습니다!", username);
    let _ = tx.send(ChatMessage {
        sender: "시스템".to_string(),
        content: welcome,
    });

    // 클라이언트에게 보내는 태스크
    let mut send_session = session.clone();
    actix_web::rt::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            let text = format!("[{}] {}", msg.sender, msg.content);
            if send_session.text(text).await.is_err() {
                break;
            }
        }
    });

    // 클라이언트로부터 받는 태스크
    let username_clone = username.clone();
    actix_web::rt::spawn(async move {
        while let Some(msg) = msg_stream.next().await {
            match msg {
                Ok(Message::Text(text)) => {
                    let _ = tx.send(ChatMessage {
                        sender: username_clone.clone(),
                        content: text.to_string(),
                    });
                }
                Ok(Message::Close(_)) | Err(_) => break,
                _ => {}
            }
        }

        let goodbye = format!("{} 님이 퇴장했습니다.", username_clone);
        // 채널이 이미 닫혔을 수 있으므로 에러 무시
        // tx가 이 시점에는 move되어 있지 않으므로 별도 처리 불필요
        let _ = session.close(None).await;
    });

    Ok(response)
}

// 랜덤 ID 생성 (간단한 시뮬레이션)
fn rand_id() -> u64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .subsec_micros() as u64
}

// =============================================================================
// HTTP 스트리밍 - Server-Sent Events (SSE)
// 서버에서 클라이언트로 실시간 이벤트를 스트리밍합니다
// WebSocket과 달리 단방향(서버 -> 클라이언트)입니다
// =============================================================================

#[get("/sse/counter")]
async fn sse_counter() -> impl Responder {
    // 스트림 생성: async-stream 패턴 대신 tokio 채널 사용
    let (tx, rx) = tokio::sync::mpsc::channel::<Result<web::Bytes, actix_web::Error>>(10);

    // 별도 태스크에서 주기적으로 이벤트를 전송합니다
    actix_web::rt::spawn(async move {
        for i in 1..=10 {
            // SSE 형식: "data: <내용>\n\n"
            let event = format!("data: 카운터 {}\n\n", i);
            let bytes = web::Bytes::from(event);

            if tx.send(Ok(bytes)).await.is_err() {
                break;  // 클라이언트가 연결을 끊으면 종료
            }

            sleep(Duration::from_secs(1)).await;
        }

        // 스트림 종료 이벤트
        let _ = tx.send(Ok(web::Bytes::from("data: 완료!\n\n"))).await;
    });

    // tokio::sync::mpsc::Receiver를 스트림으로 변환
    let stream = tokio_stream::wrappers::ReceiverStream::new(rx);

    HttpResponse::Ok()
        .content_type("text/event-stream")          // SSE 필수 Content-Type
        .insert_header(("Cache-Control", "no-cache"))  // 캐시 방지
        .insert_header(("Connection", "keep-alive"))    // 연결 유지
        .streaming(stream)  // 스트리밍 응답
}

// =============================================================================
// 파일 스트리밍 (대용량 파일 다운로드)
// =============================================================================

#[get("/download/large-file")]
async fn download_large_file() -> impl Responder {
    // 실제 대용량 파일 대신 가상의 대용량 데이터를 생성합니다
    let (tx, rx) = tokio::sync::mpsc::channel::<Result<web::Bytes, actix_web::Error>>(10);

    actix_web::rt::spawn(async move {
        // 1MB씩 나눠서 전송하는 시뮬레이션
        for chunk_num in 0..5 {
            let chunk_data = format!(
                "청크 {} / 5 - 데이터 블록 (실제로는 파일 내용이 들어갑니다)\n",
                chunk_num + 1
            );
            let bytes = web::Bytes::from(chunk_data);

            if tx.send(Ok(bytes)).await.is_err() {
                break;
            }

            // 실제에서는 tokio::fs::File로 파일을 읽어 청크로 전송합니다
            sleep(Duration::from_millis(500)).await;
        }
    });

    let stream = tokio_stream::wrappers::ReceiverStream::new(rx);

    HttpResponse::Ok()
        .content_type("application/octet-stream")
        // Content-Disposition: attachment -> 브라우저에서 다운로드 창 표시
        .insert_header(("Content-Disposition", "attachment; filename=\"large-file.txt\""))
        .streaming(stream)
}

// =============================================================================
// WebSocket 테스트 HTML 페이지
// =============================================================================

#[get("/")]
async fn index() -> impl Responder {
    let html = r#"<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>Actix Web 고급 기능</title>
    <style>
        body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        #messages { border: 1px solid #ccc; height: 300px; overflow-y: scroll; padding: 10px; margin: 10px 0; }
        input, button { padding: 8px; margin: 4px; }
        .info { background: #e3f2fd; padding: 10px; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>Actix Web 고급 기능 테스트</h1>

    <div class="info">
        <h2>WebSocket 에코 테스트</h2>
        <div id="messages"></div>
        <input type="text" id="msgInput" placeholder="메시지 입력..." />
        <button onclick="sendMessage()">전송</button>
        <button onclick="connectWs()">연결</button>
        <button onclick="disconnectWs()">연결 끊기</button>
    </div>

    <div class="info">
        <h2>Server-Sent Events (SSE) 테스트</h2>
        <div id="sseOutput">SSE 시작 버튼을 클릭하세요</div>
        <button onclick="startSSE()">카운터 시작</button>
    </div>

    <script>
        let ws = null;

        function connectWs() {
            ws = new WebSocket('ws://127.0.0.1:8087/ws/echo');
            ws.onopen = () => addMessage('시스템', '연결됨');
            ws.onmessage = (e) => addMessage('서버', e.data);
            ws.onclose = () => addMessage('시스템', '연결 끊김');
            ws.onerror = (e) => addMessage('에러', e.toString());
        }

        function sendMessage() {
            const input = document.getElementById('msgInput');
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(input.value);
                addMessage('나', input.value);
                input.value = '';
            } else {
                alert('먼저 연결 버튼을 클릭하세요!');
            }
        }

        function disconnectWs() {
            if (ws) ws.close();
        }

        function addMessage(sender, text) {
            const div = document.getElementById('messages');
            div.innerHTML += `<p><strong>${sender}:</strong> ${text}</p>`;
            div.scrollTop = div.scrollHeight;
        }

        function startSSE() {
            const output = document.getElementById('sseOutput');
            output.innerHTML = '';
            const es = new EventSource('/sse/counter');
            es.onmessage = (e) => {
                output.innerHTML += e.data + '<br>';
                if (e.data.includes('완료')) es.close();
            };
        }

        // Enter 키로 메시지 전송
        document.getElementById('msgInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    </script>
</body>
</html>"#;

    HttpResponse::Ok()
        .content_type("text/html; charset=utf-8")
        .body(html)
}

// =============================================================================
// 메인 함수
// =============================================================================

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("고급 기능 서버 시작: http://127.0.0.1:8087");
    println!();
    println!("=== 엔드포인트 목록 ===");
    println!("웹 테스트 페이지: http://127.0.0.1:8087/");
    println!();
    println!("WebSocket 에코: ws://127.0.0.1:8087/ws/echo");
    println!("  (브라우저에서 테스트 페이지 열기)");
    println!();
    println!("SSE 카운터: http://127.0.0.1:8087/sse/counter");
    println!("  curl http://127.0.0.1:8087/sse/counter");
    println!();
    println!("파일 다운로드: http://127.0.0.1:8087/download/large-file");
    println!("  curl http://127.0.0.1:8087/download/large-file -o output.txt");

    // 브로드캐스트 채널 생성 (최대 100개의 메시지 버퍼)
    let (chat_tx, _) = broadcast::channel::<ChatMessage>(100);
    let chat_state = web::Data::new(ChatState { tx: chat_tx });

    HttpServer::new(move || {
        App::new()
            .app_data(chat_state.clone())
            .service(index)
            .service(ws_echo)
            .service(ws_chat)
            .service(sse_counter)
            .service(download_large_file)
    })
    .bind(("127.0.0.1", 8087))?
    .run()
    .await
}

// =============================================================================
// 학습 포인트 요약
// =============================================================================
//
// WebSocket:
//   actix_ws::handle(&req, body) = HTTP -> WebSocket 업그레이드
//   session.text("메시지")        = 텍스트 전송
//   session.binary(bytes)         = 바이너리 전송
//   msg_stream.next().await       = 메시지 수신
//   Message::Text / Binary / Ping / Close = 메시지 타입
//
// 브로드캐스트 채널:
//   broadcast::channel(capacity)  = 채널 생성
//   tx.send(msg)                   = 모든 구독자에게 전송
//   tx.subscribe()                 = 새 구독자 등록
//   rx.recv().await                = 메시지 수신
//
// HTTP 스트리밍:
//   HttpResponse::Ok().streaming(stream) = 스트림 응답
//   tokio::sync::mpsc::channel()         = 비동기 채널
//   ReceiverStream::new(rx)              = Receiver를 Stream으로 변환
//
// SSE (Server-Sent Events):
//   Content-Type: text/event-stream
//   형식: "data: 내용\n\n"
//   클라이언트: new EventSource('/sse/endpoint')
//
// 비동기 태스크:
//   actix_web::rt::spawn(async move { ... }) = 백그라운드 태스크
//   tokio::time::sleep(Duration)             = 비동기 대기
//
// 축하합니다! 8개의 챕터를 모두 완료했습니다!
// 이제 실제 Actix Web 프로젝트를 시작할 준비가 되었습니다.
// =============================================================================
