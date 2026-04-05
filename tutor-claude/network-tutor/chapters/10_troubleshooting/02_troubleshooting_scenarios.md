# 장애 시나리오별 분석 방법

## 장애 분석 기본 원칙

```
1. 증상을 정확히 파악 (오류 메시지, 재현 조건)
2. 계층 순서로 확인 (물리 → L2 → L3 → L4 → L7)
3. 변경사항 추적 (배포, 설정 변경이 없었나?)
4. 가설 세우고 검증 (하나씩 확인)
5. 영향 범위 파악 (특정 사용자? 특정 리전?)
```

---

## 시나리오 1: "서버가 응답 안 해요"

### 단계별 확인

```bash
# L3 확인: IP 통신 가능?
ping 서버IP -c 3
# 성공 → L3 정상
# 실패 → 라우팅/방화벽 문제

# L4 확인: 포트 열려있나?
nc -zv 서버IP 8080        # macOS/Linux
telnet 서버IP 8080

# 결과 해석:
# "Connection refused" → 포트 닫힘 (서비스 다운, 잘못된 포트)
# "Connection timed out" → 방화벽이 DROP (REJECT면 refused)
# 연결 성공 → L4 정상, L7 문제

# L7 확인: HTTP 응답?
curl -v http://서버IP:8080/health
curl -v --connect-timeout 5 --max-time 10 http://서버IP:8080/

# 서버에서 확인
ss -tlnp | grep 8080    # 포트 리슨 중?
ps aux | grep java       # 프로세스 살아있나?
sudo journalctl -u myapp -n 50  # 최근 로그
```

---

## 시나리오 2: "갑자기 느려졌어요"

```bash
# 1. 패킷 손실 확인
ping -c 100 서버IP | tail -5
# packet loss % 확인 → 손실 있으면 네트워크 경로 문제

# 2. 지연 측정 (각 단계별)
curl -w "DNS: %{time_namelookup}\nTCP: %{time_connect}\nTLS: %{time_appconnect}\nTTFB: %{time_starttransfer}\nTotal: %{time_total}\n" \
  -o /dev/null -s https://api.example.com/health

# TTFB(첫 바이트 시간)가 높으면 → 서버 처리 느림
# time_connect가 높으면 → 네트워크 지연 또는 TCP 연결 대기

# 3. traceroute로 병목 홉 찾기
traceroute -n api.example.com
# 특정 홉에서 RTT 급증 → 그 홉이 병목

# 4. 서버 리소스 확인
top              # CPU/메모리
iostat -x 1      # 디스크 I/O
netstat -s | grep -E 'retransmit|failed'  # TCP 재전송
cat /proc/net/softnet_stat  # 네트워크 큐 드롭

# 5. 연결 상태 확인
ss -s
# timewait가 많으면: 포트 고갈 위험
# close_wait가 증가 중이면: 코드 버그 (close() 미호출)
```

---

## 시나리오 3: "502 Bad Gateway"

```bash
# 502 = LB → 업스트림 연결 실패

# 1. 업스트림 서버 상태 확인
# LB에서 직접 확인:
curl http://업스트림서버:포트/health

# 2. 업스트림 로그 확인
sudo journalctl -u nginx -n 100
sudo tail -f /var/log/nginx/error.log

# 3. 연결 거부 원인
ss -tlnp | grep 포트    # 포트 리슨 중?
systemctl status 서비스명

# 4. upstream timed out (nginx)
# 업스트림이 느려서 nginx 타임아웃 초과
# → 504로 바뀔 수도 있음
# 확인: proxy_read_timeout 값 vs 실제 응답 시간

# 5. 방화벽
iptables -L -n | grep REJECT  # REJECT 규칙
sudo iptables -t nat -L       # NAT 규칙 확인
```

---

## 시나리오 4: "CLOSE_WAIT 소켓 쌓임"

```bash
# 증상: ss -an | grep CLOSE_WAIT | wc -l 가 계속 증가

# 원인: 상대방이 FIN 보냈는데 내 앱이 close() 안 함

# 확인: 어떤 프로세스?
ss -anp | grep CLOSE_WAIT

# Java 스레드 덤프 (소켓을 잡고 있는 스레드 찾기)
jstack PID | grep -A 3 "BLOCKED\|WAITING"
kill -3 PID  # SIGQUIT로 스레드 덤프

# 원인 패턴:
# - DB 연결 close() 누락 (try-with-resources 미사용)
# - HTTP 클라이언트가 응답 다 읽기 전에 종료
# - 예외 발생 시 finally에서 close() 안 됨

# 임시 해결 (재시작 외):
# 커널이 일정 시간 후 자동으로 정리
# tcp_keepalive 설정으로 감지 가능

# 근본 해결: 코드에서 close() 보장
```

---

## 시나리오 5: "간헐적 Connection Timeout"

```bash
# 특정 시간에만, 혹은 특정 서버에서만 발생

# 1. DNS 문제 확인
time dig api.example.com  # DNS 응답 시간
dig +trace api.example.com  # 재귀 과정

# 2. 연결 설정 추적
sudo tcpdump -i any -n 'tcp and host api.example.com'
# SYN만 있고 SYN+ACK 없으면 → 방화벽 DROP
# RST+ACK 오면 → 포트 닫힘

# 3. 네트워크 인터페이스 오류
netstat -i
# RX-ERR, TX-ERR 증가 → 물리 네트워크 문제
# RX-OVR → 수신 버퍼 오버런 (NIC 처리 못 따라감)

# 4. Connection Tracking 테이블 고갈 (서버)
sysctl net.netfilter.nf_conntrack_count
sysctl net.netfilter.nf_conntrack_max
# count ≈ max → 새 연결 거부
# 로그: "nf_conntrack: table full, dropping packet"

# 해결:
sysctl -w net.netfilter.nf_conntrack_max=262144
```

---

## 시나리오 6: "TLS Handshake Failed"

```bash
# 1. 인증서 확인
openssl s_client -connect api.example.com:443
# Verify return code: 0 (ok) → 정상
# "certificate has expired" → 인증서 만료
# "unable to get local issuer certificate" → Chain 불완전

# 2. 만료일 확인
echo | openssl s_client -connect api.example.com:443 2>/dev/null | \
  openssl x509 -noout -dates

# 3. 도메인 불일치
echo | openssl s_client -connect api.example.com:443 2>/dev/null | \
  openssl x509 -noout -text | grep -A 1 "Subject Alternative"

# 4. TLS 버전/암호 스위트 미지원
openssl s_client -tls1_2 -connect api.example.com:443
openssl s_client -tls1_3 -connect api.example.com:443

# 5. 클라이언트 인증서 필요 (mTLS)
openssl s_client -cert client.pem -key client.key -connect api.example.com:443

# 6. curl로 상세 오류 확인
curl -v https://api.example.com/ 2>&1 | grep -E "TLS|SSL|error|certificate"
```

---

## 체계적 장애 대응 체크리스트

```
네트워크 장애 시 순서:

[ ] 1. 증상 재현 및 범위 확인
        - 특정 사용자? 전체?
        - 특정 리전? 전체?
        - 언제부터? 변경사항?

[ ] 2. L3 확인 (IP 통신)
        ping, traceroute

[ ] 3. L4 확인 (포트 통신)
        nc -zv, telnet

[ ] 4. DNS 확인
        dig +trace, dig @8.8.8.8

[ ] 5. L7 확인 (HTTP 응답)
        curl -v

[ ] 6. 서버 리소스
        CPU, 메모리, 디스크 I/O
        연결 수, 스레드 수

[ ] 7. 애플리케이션 로그
        오류 로그, 예외 스택트레이스

[ ] 8. 패킷 캡처
        tcpdump, Wireshark

[ ] 9. 메트릭/대시보드
        Prometheus, Grafana, CloudWatch
```

---

## 유용한 원라이너 모음

```bash
# 가장 많이 연결된 IP Top 10
ss -an | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn | head 10

# 포트별 연결 수
ss -an | awk '{print $5}' | grep -oP ':\K[0-9]+$' | sort | uniq -c | sort -rn | head 20

# TIME_WAIT 많은 서버 확인
ss -an state time-wait | wc -l

# 초당 새 TCP 연결 수
watch -n 1 'ss -s | grep TCP'

# HTTP 응답 시간 연속 측정
while true; do
  curl -o /dev/null -s -w "%{http_code} %{time_total}\n" https://api.example.com/health
  sleep 1
done

# 특정 프로세스의 네트워크 트래픽
sudo strace -p PID -e trace=network 2>&1 | head -50

# 네트워크 인터페이스 에러 실시간 감시
watch -n 1 'netstat -i'
```
