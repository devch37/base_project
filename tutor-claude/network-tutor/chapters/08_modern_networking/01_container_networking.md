# 컨테이너 네트워킹

## Docker 네트워킹

### veth pair (Virtual Ethernet)

컨테이너와 호스트를 연결하는 핵심 메커니즘:

```
Host Network Namespace
┌──────────────────────────────────────────────┐
│                                              │
│  [docker0 bridge: 172.17.0.1]               │
│       │              │                       │
│  [veth0a]        [veth1a]                   │
│     │                │                       │
└─────┼────────────────┼───────────────────────┘
      │ (veth pair)     │ (veth pair)
┌─────┼──────────┐  ┌───┼──────────────┐
│  [eth0]       │  │  [eth0]          │
│ 172.17.0.2    │  │  172.17.0.3      │
│ Container A   │  │  Container B     │
└───────────────┘  └──────────────────┘

veth pair: 가상 이더넷 케이블의 양 끝
  한쪽에 들어온 패킷이 다른 쪽으로 그대로 나옴
  컨테이너 namespace에 eth0, 호스트에 vethXXX
```

### Docker 네트워크 모드

```
bridge (기본):
  docker0 브리지에 연결
  컨테이너 간 통신 O, 호스트 포트 노출 필요
  -p 8080:80 → iptables DNAT 규칙 추가

host:
  호스트 네트워크 namespace 공유
  성능 최고 (NAT 없음), 포트 격리 없음
  --network host

none:
  네트워크 인터페이스 없음 (격리)
  --network none

container:<name>:
  다른 컨테이너의 네트워크 namespace 공유
  사이드카 패턴 (Istio Envoy가 이 방식)
  --network container:app_container
```

### Docker 포트 포워딩 iptables 규칙

```
docker run -p 8080:80 nginx

생성되는 iptables 규칙:
  DOCKER chain (nat table):
    -A DOCKER -p tcp --dport 8080 -j DNAT --to-destination 172.17.0.2:80

  FORWARD chain (filter table):
    -A DOCKER-USER → -j RETURN (사용자 규칙 삽입 포인트)
    -A FORWARD -d 172.17.0.2 -p tcp --dport 80 -j ACCEPT
```

---

## Kubernetes 네트워킹

### Pod 네트워크 모델

```
K8s 네트워킹 4가지 요구사항:
  1. 모든 Pod는 NAT 없이 서로 통신 가능
  2. 모든 Node는 NAT 없이 모든 Pod와 통신 가능
  3. Pod의 자신 IP = 외부에서 보이는 IP (no NAT)
  4. Node와 Pod가 서로 통신 가능

Pod 내부:
  하나의 네트워크 namespace 공유
  pause 컨테이너: 네트워크 namespace 생성·유지
  컨테이너들: pause의 namespace 공유
  → localhost로 컨테이너 간 통신
```

### CNI (Container Network Interface)

```
K8s가 네트워크 플러그인에게 요청:
  "Pod 생성됐어. 네트워크 연결해줘"
  "Pod 삭제됐어. 네트워크 해제해줘"

주요 CNI 플러그인:

Flannel:
  구조: VXLAN 오버레이
  장점: 단순, 설정 쉬움
  단점: 추가 캡슐화 오버헤드, 기능 제한

Calico:
  구조: BGP (오버레이 없이 순수 L3)
  장점: 성능 우수, 네트워크 정책 강력, mTLS 지원
  단점: BGP 이해 필요

Cilium:
  구조: eBPF 기반
  장점: 최고 성능, 관찰가능성, L7 네트워크 정책
  단점: 커널 4.9+ 필요, 복잡
  주목: Datadog, AWS EKS 기본 CNI로 채택 증가
```

### Kubernetes Service 동작

```
ClusterIP Service 생성:
  kubectl expose deployment nginx --port=80

iptables 규칙 (kube-proxy):
  -A KUBE-SERVICES -d 10.96.1.100/32 -p tcp --dport 80 -j KUBE-SVC-xxx

  KUBE-SVC-xxx chain (DNAT + 로드밸런싱):
    -A KUBE-SVC-xxx -m statistic --mode random --probability 0.33 -j KUBE-SEP-A  (Pod A)
    -A KUBE-SVC-xxx -m statistic --mode random --probability 0.50 -j KUBE-SEP-B  (Pod B)
    -A KUBE-SVC-xxx -j KUBE-SEP-C  (Pod C)

  KUBE-SEP-A (DNAT to Pod A):
    -A KUBE-SEP-A -p tcp -j DNAT --to-destination 10.0.1.5:80

→ 모든 것이 iptables 규칙!
→ Cilium: iptables 대신 eBPF Map 사용 (성능 향상)
```

---

## 실습 과제

```bash
# 1. Docker 네트워크 구조 확인
docker network ls
docker network inspect bridge
# Subnet, Gateway, 연결된 컨테이너 확인

# 2. 컨테이너 veth pair 확인
docker run -d --name test nginx
# 컨테이너 내부 인터페이스
docker exec test ip link show
# 호스트에서 veth 확인
ip link show | grep veth

# 3. Docker iptables 규칙 확인
docker run -d -p 8080:80 nginx
sudo iptables -t nat -L DOCKER -n -v

# 4. K8s 서비스 iptables 확인
kubectl get service nginx-service
sudo iptables -t nat -L KUBE-SERVICES -n | grep ClusterIP

# 5. Pod 네트워크 namespace 확인
# Pod의 PID 찾기
kubectl get pod nginx-xxx -o jsonpath='{.status.podIP}'
# 해당 네트워크 ns 진입 (루트 필요)
```

## 면접 단골 질문

**Q. Kubernetes에서 Service IP(ClusterIP)는 어떻게 구현되나요?**
> kube-proxy가 각 노드에서 iptables/IPVS 규칙을 관리. ClusterIP:Port로 들어온 패킷을 DNAT으로 실제 Pod IP:Port로 변환. Pod 변경 시 iptables 규칙 업데이트.

**Q. eBPF가 iptables보다 빠른 이유는?**
> iptables: 선형 규칙 목록, 규칙 수 증가 시 O(n) 처리. eBPF: 커널에서 직접 실행되는 프로그램, 해시맵으로 O(1) 조회. 수천 개 서비스에서 iptables는 성능 저하 심각.
