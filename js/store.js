(function (global) {
  const KEY = "cgc.store.v1";
  const SESSION = "cgc.session.v1";

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.books && parsed.contests && parsed.settings) return parsed;
      }
    } catch (e) {}
    const seed = clone(global.CGC_SEED);
    save(seed);
    return seed;
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function uid(prefix) {
    return prefix + "-" + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
  }

  const api = {
    get() {
      return load();
    },
    set(data) {
      save(data);
      return data;
    },
    reset() {
      localStorage.removeItem(KEY);
      return load();
    },
    settings() {
      return load().settings;
    },
    updateSettings(patch) {
      const data = load();
      data.settings = { ...data.settings, ...patch };
      save(data);
      return data.settings;
    },
    books() {
      return load().books;
    },
    book(id) {
      return load().books.find((b) => b.id === id) || null;
    },
    upsertBook(book) {
      const data = load();
      if (!book.id) book.id = uid("b");
      const i = data.books.findIndex((b) => b.id === book.id);
      if (i >= 0) data.books[i] = { ...data.books[i], ...book };
      else data.books.unshift(book);
      save(data);
      return book;
    },
    deleteBook(id) {
      const data = load();
      data.books = data.books.filter((b) => b.id !== id);
      save(data);
    },
    contests() {
      return load().contests;
    },
    contest(id) {
      return load().contests.find((c) => c.id === id) || null;
    },
    upsertContest(item) {
      const data = load();
      if (!item.id) item.id = uid("c");
      if (!item.publishedAt) item.publishedAt = new Date().toISOString().slice(0, 10);
      const i = data.contests.findIndex((c) => c.id === item.id);
      if (i >= 0) data.contests[i] = { ...data.contests[i], ...item };
      else data.contests.unshift(item);
      save(data);
      return item;
    },
    deleteContest(id) {
      const data = load();
      data.contests = data.contests.filter((c) => c.id !== id);
      save(data);
    },
    login(user, password) {
      const { admin } = load();
      if (user.trim() === admin.user && password === admin.password) {
        sessionStorage.setItem(SESSION, JSON.stringify({ user, at: Date.now() }));
        return true;
      }
      return false;
    },
    logout() {
      sessionStorage.removeItem(SESSION);
    },
    isAdmin() {
      try {
        return Boolean(JSON.parse(sessionStorage.getItem(SESSION) || "null"));
      } catch (e) {
        return false;
      }
    },
    updateAdmin(patch) {
      const data = load();
      data.admin = { ...data.admin, ...patch };
      save(data);
    },
    exportJSON() {
      return JSON.stringify(load(), null, 2);
    },
    importJSON(text) {
      const parsed = JSON.parse(text);
      if (!parsed.books || !parsed.contests || !parsed.settings) {
        throw new Error("Arquivo inválido.");
      }
      save(parsed);
      return parsed;
    },
    drivePreview(url) {
      if (!url) return "";
      const file = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (file) return "https://drive.google.com/file/d/" + file[1] + "/preview";
      const open = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (open) return "https://drive.google.com/file/d/" + open[1] + "/preview";
      return url;
    },
  };

  global.CGC = api;
})(window);
