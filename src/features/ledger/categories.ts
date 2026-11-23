export type CategoryKind = 'expense' | 'income';
export type Category = { id: string; kind: CategoryKind; name: string; hidden: boolean; deleted?: boolean };

// 삭제된 카테고리는 과거 거래와 CSV에서 이름을 찾을 때만 사용합니다.
export const defaultCategories: Category[] = [
  ...['식비', '교통', '쇼핑', '주거', '여가'].map((name, i) => ({ id: 'expense-' + i, kind: 'expense' as const, name, hidden: false })),
  ...['월급', '용돈', '기타 수입'].map((name, i) => ({ id: 'income-' + i, kind: 'income' as const, name, hidden: false })),
];

export function categoryLabel(entry: { kind: string; categoryId?: string }, categories: Category[]) {
  if (entry.kind !== 'expense' && entry.kind !== 'income') return '';
  return categories.find((item) => item.id === entry.categoryId && item.kind === entry.kind)?.name ?? '미분류';
}

export function nameCategory(items: Category[], kind: CategoryKind, value: string, id?: string) {
  const name = value.trim();
  if (!name || name === '미분류') throw new Error('미분류 이외의 이름을 입력해 주세요.');
  if (items.some((item) => !item.deleted && item.kind === kind && item.name === name && item.id !== id)) {
    throw new Error('같은 이름의 카테고리가 있어요.');
  }
  if (id) return items.map((item) => item.id === id ? { ...item, name } : item);
  let number = items.length + 1;
  while (items.some((item) => item.id === 'custom-' + number)) number++;
  return [...items, { id: 'custom-' + number, kind, name, hidden: false }];
}

export function moveCategory(items: Category[], category: Category, step: number) {
  const peers = items.filter((item) => !item.deleted && item.kind === category.kind);
  const index = peers.findIndex((item) => item.id === category.id);
  if (index < 0) return items;
  const other = peers[index + step];
  if (!other) return items;
  const result = [...items];
  const a = result.findIndex((item) => item.id === category.id);
  const b = result.indexOf(other);
  const [moved] = result.splice(a, 1);
  result.splice(b, 0, moved);
  return result;
}