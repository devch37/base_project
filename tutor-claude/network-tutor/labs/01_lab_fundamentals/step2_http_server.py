#!/usr/bin/env python3
"""
Lab 01 - Step 2: 간단한 HTTP 서버
OSI 7계층을 패킷으로 관찰하기 위한 실습용 서버

실행:
    python3 step2_http_server.py

다른 터미널에서 요청:
    curl http://localhost:8888/
    curl http://localhost:8888/api/users
"""

import http.server
import json
import time
from datetime import datetime

PORT = 8888

class LabHTTPHandler(http.server.BaseHTTPRequestHandler):

    def do_GET(self):
        print(f"\n{'='*50}")
        print(f"[{datetime.now().strftime('%H:%M:%S')}] 요청 수신!")
        print(f"  클라이언트: {self.client_address[0]}:{self.client_address[1]}")
        print(f"  메서드: {self.command}")
        print(f"  경로: {self.path}")
        print(f"  HTTP 버전: {self.request_version}")
        print(f"\n  [수신된 헤더들]")
        for header, value in self.headers.items():
            print(f"    {header}: {value}")

        # 경로별 응답
        if self.path == '/':
            body = json.dumps({
                "message": "OSI 계층 실습 서버",
                "layer7": "HTTP (Application)",
                "layer4": "TCP (Transport)",
                "layer3": "IP (Network)",
                "layer2": "Ethernet (Data Link)",
                "timestamp": time.time()
            }, indent=2, ensure_ascii=False)
            self._respond(200, body)

        elif self.path == '/api/users':
            body = json.dumps([
                {"id": 1, "name": "Alice"},
                {"id": 2, "name": "Bob"},
            ], indent=2)
            self._respond(200, body)

        elif self.path == '/slow':
            # 느린 응답 - 타임아웃 실습용
            print("  [느린 응답 시뮬레이션: 3초 대기]")
            time.sleep(3)
            self._respond(200, '{"message": "느린 응답"}')

        elif self.path == '/error':
            self._respond(500, '{"error": "내부 서버 오류 시뮬레이션"}')

        else:
            self._respond(404, f'{{"error": "경로를 찾을 수 없음: {self.path}"}}')

    def _respond(self, code, body):
        body_bytes = body.encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', len(body_bytes))
        self.send_header('X-Lab-Header', 'network-tutor-lab01')
        self.end_headers()
        self.wfile.write(body_bytes)
        print(f"\n  [응답 전송]")
        print(f"    상태 코드: {code}")
        print(f"    본문 크기: {len(body_bytes)} bytes")

    def log_message(self, format, *args):
        pass  # 기본 로그 끄기 (커스텀 출력 사용)


if __name__ == '__main__':
    print(f"""
╔══════════════════════════════════════════════╗
║      Lab 01 — OSI 계층 관찰용 HTTP 서버      ║
╠══════════════════════════════════════════════╣
║  포트: {PORT}                                  ║
║                                              ║
║  테스트 URL:                                  ║
║    http://localhost:{PORT}/              (200) ║
║    http://localhost:{PORT}/api/users     (200) ║
║    http://localhost:{PORT}/slow          (3초) ║
║    http://localhost:{PORT}/error         (500) ║
║                                              ║
║  종료: Ctrl+C                                ║
╚══════════════════════════════════════════════╝
""")

    server = http.server.HTTPServer(('localhost', PORT), LabHTTPHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\n서버 종료.")
