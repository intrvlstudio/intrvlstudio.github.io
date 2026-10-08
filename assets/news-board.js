/* Shared by the public bulletin and the admin's isolated device previews. */
window.INTRVLNews = {
  renderPost(post, doc = document) {
    const article = doc.createElement('article'); article.className = 'news-card';
    if (/^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(post.image || '')) {
      const img = doc.createElement('img'); img.src = post.image; img.alt = post.title || ''; img.loading = 'lazy'; article.append(img);
    }
    const date = doc.createElement('time'); date.textContent = post.date || ''; date.dateTime = post.date || '';
    const title = doc.createElement('h4'); title.textContent = post.title || '';
    const body = doc.createElement('p'); body.textContent = post.body || '';
    article.append(date, title, body);
    if (/^https:\/\/www\.instagram\.com\/(p|reel)\/[A-Za-z0-9_-]+\/$/.test(post.url || '')) {
      const link = doc.createElement('a'); link.href = post.url; link.textContent = 'Instagram ↗'; link.target = '_blank'; link.rel = 'noopener noreferrer'; article.append(link);
    }
    return article;
  }
};
