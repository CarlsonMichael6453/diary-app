import { Platform } from 'react-native';

import { entriesToHtml, type BackupEntry } from '../logic/backup';

export async function saveTextFile(filename: string, contents: string, mime = 'application/json'): Promise<string> {
  if (Platform.OS === 'web') {
    const blob = new Blob([contents], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    return `Downloaded ${filename}.`;
  }
  const FileSystem = await import('expo-file-system/legacy');
  const Sharing = await import('expo-sharing');
  const path = `${FileSystem.cacheDirectory ?? ''}${filename}`;
  await FileSystem.writeAsStringAsync(path, contents);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, { mimeType: mime, dialogTitle: filename });
    return 'Share sheet opened. You can save it to iCloud Drive, Google Drive, or Files.';
  }
  return `Saved a copy at ${path}.`;
}

export async function pickTextFile(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,.csv,.txt,.zip,application/json,text/plain,text/csv';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        file.text().then(resolve);
      };
      input.click();
    });
  }
  const DocumentPicker = await import('expo-document-picker');
  const FileSystem = await import('expo-file-system/legacy');
  const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
  if (result.canceled || !result.assets?.[0]) return null;
  return FileSystem.readAsStringAsync(result.assets[0].uri);
}

export async function exportPdf(bookTitle: string, entries: BackupEntry[]): Promise<string> {
  const html = entriesToHtml(bookTitle, entries);
  if (Platform.OS === 'web') {
    const Print = await import('expo-print');
    await Print.printAsync({ html });
    return 'The print dialog can save a PDF. Diary text is not uploaded.';
  }
  const Print = await import('expo-print');
  const Sharing = await import('expo-sharing');
  const file = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  return 'PDF is ready to save in Files, iCloud Drive, or Google Drive.';
}
