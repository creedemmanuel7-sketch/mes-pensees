import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

export const exportToPDF = async (notes, accent = '#f0a090') => {
  const sortedNotes = [...notes].sort((a, b) => new Date(b.date) - new Date(a.date));

  const formatDate = (iso) => {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const notesHTML = sortedNotes.map((note, i) => `
    <div class="note">
      <div class="note-header">
        <div class="note-number">${String(i + 1).padStart(2, '0')}</div>
        <div class="note-meta">
          <div class="note-title">${note.titre || 'Sans titre'}</div>
          <div class="note-date">${formatDate(note.date)} · ${note.mood || '😌'}</div>
        </div>
      </div>
      <div class="note-content">${(note.contenu || '').replace(/\n/g, '<br/>')}</div>
      ${note.media && note.media.some(m => m.type === 'image') ? `
        <div class="note-media">
          ${note.media.filter(m => m.type === 'image').map(img => `
            <img src="${img.uri}" class="export-img" />
          `).join('')}
        </div>
      ` : ''}
      ${note.capsule ? `<div class="capsule-tag">⏳ Capsule temporelle</div>` : ''}
    </div>
  `).join('');

  const totalWords = notes.reduce((sum, n) => sum + (n.wordCount || 0), 0);
  const dateNow = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;1,300;1,400&family=DM+Sans:wght@300;400&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; background: #0a0a0b; color: #e8e8ea; padding: 0; }
        .cover { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #0a0a0b 0%, #1a1015 100%); page-break-after: always; padding: 60px; text-align: center; }
        .cover-title { font-family: 'Cormorant Garamond', serif; font-size: 64px; font-style: italic; font-weight: 300; color: ${accent}; margin-bottom: 16px; letter-spacing: -1px; }
        .cover-sub { font-size: 11px; letter-spacing: 4px; color: #5a5a60; margin-bottom: 60px; }
        .cover-lock { font-size: 80px; margin-bottom: 40px; }
        .cover-stats { display: flex; gap: 48px; margin-bottom: 48px; }
        .cover-stat { text-align: center; }
        .cover-stat-value { font-family: 'Cormorant Garamond', serif; font-size: 36px; font-style: italic; color: ${accent}; display: block; margin-bottom: 4px; }
        .cover-stat-label { font-size: 9px; letter-spacing: 3px; color: #5a5a60; }
        .cover-date { font-size: 12px; color: #5a5a60; letter-spacing: 2px; }
        .cover-footer { position: absolute; bottom: 40px; font-size: 9px; letter-spacing: 3px; color: #3a3a40; }
        .notes-container { padding: 48px; background: #0a0a0b; }
        .section-title { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-style: italic; color: ${accent}; margin-bottom: 40px; padding-bottom: 16px; border-bottom: 1px solid #2a2a2f; }
        .note { margin-bottom: 48px; padding-bottom: 48px; border-bottom: 1px solid #1e1e21; page-break-inside: avoid; }
        .note:last-child { border-bottom: none; }
        .note-header { display: flex; align-items: flex-start; gap: 20px; margin-bottom: 20px; }
        .note-number { font-family: 'Cormorant Garamond', serif; font-size: 36px; font-style: italic; color: #2a2a2f; min-width: 48px; line-height: 1; }
        .note-title { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-style: italic; font-weight: 300; color: ${accent}; margin-bottom: 6px; line-height: 1.3; }
        .note-date { font-size: 10px; letter-spacing: 1.5px; color: #5a5a60; }
        .note-content { font-size: 14px; line-height: 1.9; color: #9a9a9e; padding-left: 68px; }
        .note-media { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; padding-left: 68px; }
        .export-img { width: 150px; height: 150px; object-fit: cover; border-radius: 12px; border: 1px solid #1e1e21; }
        .capsule-tag { margin-top: 14px; padding-left: 68px; font-size: 10px; letter-spacing: 1.5px; color: #3ecf8e; }
        .empty-state { text-align: center; padding: 80px 40px; color: #5a5a60; font-style: italic; font-family: 'Cormorant Garamond', serif; font-size: 20px; }
      </style>
    </head>
    <body>
      <div class="cover">
        <div class="cover-lock">🔐</div>
        <div class="cover-title">Mes Pensées</div>
        <div class="cover-sub">JOURNAL INTIME CHIFFRÉ · ZÉRO NUAGE</div>
        <div class="cover-stats">
          <div class="cover-stat">
            <span class="cover-stat-value">${notes.length}</span>
            <span class="cover-stat-label">PENSÉES</span>
          </div>
          <div class="cover-stat">
            <span class="cover-stat-value">${totalWords}</span>
            <span class="cover-stat-label">MOTS</span>
          </div>
          <div class="cover-stat">
            <span class="cover-stat-value">${new Date().getFullYear()}</span>
            <span class="cover-stat-label">ANNÉE</span>
          </div>
        </div>
        <div class="cover-date">EXPORTÉ LE ${dateNow.toUpperCase()}</div>
        <div class="cover-footer">🛡️ &nbsp; DONNÉES PERSONNELLES · USAGE PRIVÉ UNIQUEMENT</div>
      </div>
      <div class="notes-container">
        <div class="section-title">Toutes mes pensées</div>
        ${notes.length === 0 ? '<div class="empty-state">Aucune pensée à exporter.</div>' : notesHTML}
      </div>
    </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Exporter Mes Pensées',
        UTI: 'com.adobe.pdf',
      });
    }
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: e };
  }
};

export const exportToTXT = async (notes) => {
  const sortedNotes = [...notes].sort((a, b) => new Date(b.date) - new Date(a.date));

  const formatDate = (iso) => new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const content = sortedNotes.map((note, i) => `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[${String(i + 1).padStart(2, '0')}] ${note.titre || 'Sans titre'} ${note.mood || ''}
${formatDate(note.date)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${note.contenu || ''}

`).join('\n');

  const header = `MES PENSÉES — JOURNAL INTIME
Exporté le ${new Date().toLocaleDateString('fr-FR')}
${notes.length} pensées · ${notes.reduce((s, n) => s + (n.wordCount || 0), 0)} mots
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

  const fullContent = header + content;

  try {
    const fileUri = `${FileSystem.documentDirectory}mes-pensees-${Date.now()}.txt`;
    await FileSystem.writeAsStringAsync(fileUri, fullContent, {
      encoding: FileSystem.EncodingType.UTF8
    });
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/plain',
        dialogTitle: 'Exporter Mes Pensées',
      });
    }
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: e };
  }
};