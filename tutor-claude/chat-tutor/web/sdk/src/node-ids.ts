/**
 * 노드 ↔ 번호 매핑 (15장).
 *
 * 왜 번호가 필요한가?
 *   "3번째 div 의 2번째 자식" 같은 경로로 노드를 가리키면, 앞에 노드 하나만 끼어들어도
 *   경로가 전부 어긋난다. 그래서 스냅샷 때 노드마다 번호를 붙이고, 이후 변경분은 번호로 말한다.
 *   "17번 노드의 class 가 바뀜", "5번 노드 안, 9번 노드 앞에 새 노드 추가".
 *
 * WeakMap 을 쓰는 이유: 페이지에서 지워진 노드를 우리가 붙잡고 있으면 메모리가 새기 때문.
 * (반대 방향 id → node 는 Map 이라 remove 때 직접 지워 준다)
 */
export class NodeIds {
  private next = 1;
  private readonly ids = new WeakMap<Node, number>();
  private readonly nodes = new Map<number, Node>();

  idOf(node: Node): number | undefined {
    return this.ids.get(node);
  }

  nodeOf(id: number): Node | undefined {
    return this.nodes.get(id);
  }

  has(node: Node): boolean {
    return this.ids.has(node);
  }

  assign(node: Node): number {
    const existing = this.ids.get(node);
    if (existing !== undefined) return existing;
    const id = this.next++;
    this.ids.set(node, id);
    this.nodes.set(id, node);
    return id;
  }

  /** 상담사 쪽: 받은 번호 그대로 등록 */
  set(id: number, node: Node): void {
    this.ids.set(node, id);
    this.nodes.set(id, node);
  }

  /** 노드와 그 자손 전체의 번호를 잊는다 (DOM 에서 제거됐을 때) */
  forget(node: Node): void {
    const id = this.ids.get(node);
    if (id !== undefined) {
      this.ids.delete(node);
      this.nodes.delete(id);
    }
    node.childNodes.forEach((child) => this.forget(child));
  }

  get size(): number {
    return this.nodes.size;
  }
}
