# 네트워크 진단 도구 완전 가이드

## tcpdump — 패킷 캡처의 기본

```bash
# 기본 사용법
sudo tcpdump -i en0          # 인터페이스 지정
sudo tcpdump -i any          # 모든 인터페이스
sudo tcpdump -n              # DNS 조회 없이 IP로 표시
sudo tcpdump -nn             # IP + 포트 숫자로
sudo tcpdump -v              # 상세 출력
sudo tcpdump -vv             # 더 상세
sudo tcpdump -X              # hex + ASCII 출력

# 저장 및 읽기
sudo tcpdump -w capture.pcap     # 파일로 저장 (Wireshark에서 열기 가능)
tcpdump -r capture.pcap          # 저장된 파일 읽기

# 필터 (BPF - Berkeley Packet Filter)

# 호스트 필터
tcpdump host 192.168.1.1
tcpdump src host 192.168.1.1    # 출발지
tcpdump dst host 192.168.1.1    # 목적지

# 포트 필터
tcpdump port 80
tcpdump port 80 or port 443
tcpdump portrange 8000-9000

# 프로토콜 필터
tcpdump tcp
tcpdump udp
tcpdump icmp
tcpdump arp

# 복합 필터
tcpdump 'tcp port 443 and host google.com'
tcpdump 'not port 22'                        # SSH 제외
tcpdump '(tcp[tcpflags] & tcp-syn) != 0'    # SYN 패킷만

# TCP 플래그 필터
tcpdump 'tcp[13] & 2 != 0'    # SYN
tcpdump 'tcp[13] & 1 != 0'    # FIN
tcpdump 'tcp[13] & 4 != 0'    # RST
tcpdump 'tcp[13] = 24'         # PSH+ACK

# 실용 예시
sudo tcpdump -i en0 -n -X 'tcp port 8080 and host 10.0.0.5'
sudo tcpdump -i any -n 'icmp'               # ping 패킷
sudo tcpdump -i any -n 'udp port 53'        # DNS
sudo tcpdump -i any -n -w /tmp/debug.pcap 'tcp port 443' -c 1000  # 1000개 캡처
```

---

## Wireshark 핵심 필터

```
기본 필터:
  ip.addr == 192.168.1.1        # IP 주소
  ip.src == 10.0.0.1            # 출발지
  tcp.port == 443               # 포트
  http                          # HTTP 프로토콜
  dns                           # DNS
  tls                           # TLS

고급 필터:
  tcp.flags.syn == 1            # SYN 패킷
  tcp.flags.reset == 1          # RST 패킷
  http.response.code == 500     # HTTP 500 응답
  dns.qry.name == "example.com" # DNS 쿼리
  frame.time_delta > 1          # 이전 패킷과 1초 이상 차이

유용한 분석:
  Statistics → Conversations     # 연결별 통계
  Statistics → Protocol Hierarchy # 프로토콜 분포
  Statistics → IO Graph          # 시간별 트래픽 그래프
  Analyze → Expert Information   # 자동 이상 감지
  Follow → TCP Stream            # 특정 연결의 전체 대화 보기
```

---

## curl — HTTP 심층 분석

```bash
# 기본
curl https://api.example.com/users
curl -X POST -H "Content-Type: application/json" \
  -d '{"name":"Alice"}' https://api.example.com/users

# 응답 상세
curl -v https://example.com      # 요청+응답 헤더 포함
curl -I https://example.com      # 헤더만 (HEAD 요청)
curl -D - -o /dev/null https://example.com  # 헤더를 stdout으로

# 성능 측정
curl -w "%{time_namelookup} DNS\n\
%{time_connect} TCP\n\
%{time_appconnect} TLS\n\
%{time_pretransfer} Pre-transfer\n\
%{time_redirect} Redirect\n\
%{time_starttransfer} TTFB\n\
%{time_total} Total\n" \
-o /dev/null -s https://example.com

# 타임아웃 설정
curl --connect-timeout 5 --max-time 30 https://api.example.com/slow

# 인증서 관련
curl -k https://self-signed.example.com  # 인증서 검증 무시
curl --cacert /path/to/ca.pem https://example.com  # 커스텀 CA

# HTTP 버전
curl --http1.1 https://example.com
curl --http2 https://example.com
curl --http3 https://example.com

# 프록시
curl -x http://proxy:8080 https://example.com
curl --socks5 localhost:1080 https://example.com

# 리다이렉트 따라가기
curl -L https://example.com  # 최대 30번
curl -L --max-redirs 5 https://example.com

# 쿠키
curl -c cookies.txt https://example.com/login  # 쿠키 저장
curl -b cookies.txt https://example.com/profile  # 쿠키 전송
```

---

## netstat & ss — 소켓 상태 확인

```bash
# ss (netstat의 현대적 대체)
ss -tlnp     # TCP, Listen, Numeric, Process
ss -tunap    # TCP+UDP, All, Numeric, Process
ss -s        # 요약 통계

# 특정 포트 사용 프로세스
ss -tlnp | grep :8080
lsof -i :8080

# 연결 상태 필터
ss -an | grep ESTABLISHED | wc -l   # 현재 연결 수
ss -an | grep TIME-WAIT | wc -l     # TIME_WAIT 수
ss -an | grep CLOSE_WAIT | wc -l    # CLOSE_WAIT 수 (버그 의심)

# 원격 서버 기준 필터
ss -an 'dst 10.0.0.1'     # 특정 서버로 가는 연결
ss -an 'dport = :443'     # 443 포트로 가는 연결

# netstat (구 방식)
netstat -tlnp   # Listen 중인 TCP
netstat -an     # 모든 연결
netstat -s      # 프로토콜 통계 (재전송, 오류 등)
netstat -rn     # 라우팅 테이블
```

---

## dig & nslookup — DNS 분석

```bash
# 기본 DNS 조회
dig example.com           # A 레코드
dig example.com MX        # MX 레코드
dig example.com NS        # NS 레코드
dig example.com TXT       # TXT 레코드
dig -x 8.8.8.8            # 역방향 DNS (PTR)

# 특정 DNS 서버 지정
dig @8.8.8.8 example.com
dig @1.1.1.1 example.com
dig @ns1.example.com example.com  # 권한 NS 직접 쿼리

# 상세 정보
dig +short example.com    # IP만 출력
dig +trace example.com    # 재귀 과정 추적
dig +nocmd +noall +answer example.com  # 답변만
dig +stats example.com    # 쿼리 통계 (응답 시간)

# TCP로 DNS 쿼리 (기본 UDP)
dig +tcp example.com

# 모든 레코드
dig example.com ANY
```

---

## ping & traceroute

```bash
# ping
ping -c 5 google.com       # 5번 전송
ping -i 0.1 google.com     # 0.1초 간격
ping -s 1400 google.com    # 패킷 크기 1400 (MTU 테스트)
ping -M do -s 1472 google.com  # MTU Discovery (Do not Fragment)

# MTU 찾기
ping -M do -s 1472 google.com  # 실패
ping -M do -s 1400 google.com  # 성공
# → MTU는 1400+28(IP+ICMP 헤더) = 1428 이하

# traceroute
traceroute google.com          # 기본 (UDP)
traceroute -T google.com       # TCP (방화벽 통과)
traceroute -I google.com       # ICMP
traceroute -n google.com       # DNS 없이
traceroute -m 30 google.com    # 최대 30홉

# mtr (traceroute + ping 결합)
mtr google.com
mtr --report google.com        # 리포트 모드
```

---

## nmap — 포트 스캔

```bash
# 기본 스캔 (자신의 서버만!)
nmap localhost
nmap -p 1-1000 localhost       # 포트 범위
nmap -p 80,443,8080 localhost  # 특정 포트

# 스캔 타입
nmap -sS localhost  # SYN 스캔 (Half-Open)
nmap -sT localhost  # TCP Connect 스캔
nmap -sU localhost  # UDP 스캔

# 서비스 감지
nmap -sV localhost  # 버전 감지
nmap -O localhost   # OS 감지

# 빠른 스캔
nmap -F localhost   # 자주 쓰는 포트만 (100개)

# 결과 저장
nmap -oN output.txt localhost
```

---

## iftop & nethogs — 실시간 트래픽

```bash
# iftop: 인터페이스별 실시간 트래픽
sudo iftop -i en0
sudo iftop -n -i en0    # DNS 없이

# nethogs: 프로세스별 트래픽
sudo nethogs
sudo nethogs en0

# bmon: 대역폭 모니터링
bmon

# vnstat: 장기 트래픽 통계
vnstat -i en0
vnstat -h   # 시간별
vnstat -d   # 일별
```

---

## 실습 과제

```bash
# 종합 실습: 요청 하나가 어떻게 흐르는지 추적

# 1. 터미널 1: DNS 쿼리 캡처
sudo tcpdump -i en0 -n 'udp port 53'

# 2. 터미널 2: TCP 연결 캡처
sudo tcpdump -i en0 -n 'tcp port 443 and host google.com'

# 3. 터미널 3: 실제 요청
curl -v https://google.com

# 확인할 것:
# - DNS 쿼리 (UDP 53)
# - TCP 3-way handshake (SYN, SYN+ACK, ACK)
# - TLS 핸드셰이크
# - HTTP/2 데이터
# - TCP FIN/ACK (연결 종료)

# 4. 성능 측정
curl -w "DNS: %{time_namelookup}s\nTCP: %{time_connect}s\nTLS: %{time_appconnect}s\nTotal: %{time_total}s\n" \
  -o /dev/null -s https://google.com
```
