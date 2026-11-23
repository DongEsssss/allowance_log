import { File, Paths } from 'expo-file-system';
import { isAvailableAsync, shareAsync } from 'expo-sharing';

// 휴대폰에서는 공유 창에서 파일 앱에 저장하거나 원하는 앱으로 보낼 수 있습니다.
export async function exportFile(name: string, contents: string) {
  if (!(await isAvailableAsync())) throw new Error('CSV 파일 공유를 사용할 수 없습니다.');
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  await file.write(contents);
  await shareAsync(file.uri, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text', dialogTitle: 'CSV 내보내기' });
}
