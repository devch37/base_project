# Service Mesh

## 왜 Service Mesh가 필요한가?

```
마이크로서비스 문제:
  서비스 A → 서비스 B 호출 시 필요한 것들:
    - 재시도 (Retry)
    - 타임아웃
    - 서킷 브레이커
    - 로드 밸런싱
    - mTLS 암호화
    - 분산 추적 (Tracing)
    - 메트릭 수집

각 서비스가 직접 구현? → 언어마다 구현, 유지보수 지옥

해결: 이 기능을 네트워크 레이어로 분리
→ Service Mesh
```

---

## Sidecar 패턴

```
각 Pod에 Proxy 컨테이너(Sidecar)를 주입:

Pod:
  ┌──────────────────────────────────┐
  │  [App Container]  [Envoy Proxy]  │
  │        │                │        │
  │   localhost:8080    :15001       │
  └──────────────────────────────────┘

모든 인바운드/아웃바운드 트래픽이 Envoy를 경유
→ App은 네트워킹 신경 안 씀
→ Envoy가 mTLS, 재시도, 메트릭 처리

iptables로 트래픽 가로채기:
  ISTIO_REDIRECT chain:
    아웃바운드 모든 TCP → :15001 (Envoy outbound)
    인바운드 모든 TCP  → :15006 (Envoy inbound)
```

---

## Istio 아키텍처

```
Control Plane (istiod):
  Pilot:  트래픽 관리 설정 배포 (VirtualService, DestinationRule)
  Citadel: 인증서 관리, mTLS
  Galley: 설정 검증

Data Plane (Envoy sidecars):
  실제 트래픽 처리
  xDS API로 Control Plane에서 설정 수신
```

### 트래픽 관리 예시

```yaml
# 카나리 배포: 10% 트래픽을 v2로
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
spec:
  hosts: [reviews]
  http:
  - route:
    - destination:
        host: reviews
        subset: v1
      weight: 90
    - destination:
        host: reviews
        subset: v2
      weight: 10
---
# 재시도 설정
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
spec:
  http:
  - retries:
      attempts: 3
      perTryTimeout: 2s
      retryOn: 5xx,reset,connect-failure
```

---

## eBPF 기반 Service Mesh (Cilium)

```
기존 Sidecar 방식 문제:
  컨테이너마다 Envoy 프로세스 → 메모리 사용 증가
  데이터 경로: App → iptables → Envoy → iptables → 목적지
  → L4/L7 처리 두 번

Cilium Sidecarless:
  eBPF 프로그램이 커널 레벨에서 직접 처리
  Sidecar 컨테이너 불필요
  데이터 경로 단순화 → 지연 감소
  Ambient Mesh (Istio 새 모드)도 유사 방향
```

---

## 면접 단골 질문

**Q. Service Mesh와 API Gateway의 차이는?**
> API Gateway: 외부 트래픽 진입점 (North-South), L7 라우팅, 인증, rate limiting. Service Mesh: 서비스 간 내부 통신 관리 (East-West), mTLS, 분산 추적, 서킷 브레이커.

**Q. Istio의 mTLS는 어떻게 자동화되나요?**
> istiod가 각 서비스에 SVID(SPIFFE Verifiable Identity Document) 인증서 자동 발급. Envoy 사이드카가 인증서를 사용해 자동으로 mTLS 연결. 앱은 인증서를 전혀 신경 쓰지 않음.
