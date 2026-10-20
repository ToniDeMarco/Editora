(function () {
  const view = document.getElementById("view");
  const login = document.getElementById("login-screen");
  const shell = document.getElementById("admin-shell");

  function show(id) {
    document.querySelectorAll(".linkish").forEach((b) => b.classList.toggle("is-on", b.dataset.view === id));
    const map = { dash: dash, books: books, contests: contests, settings: settings };
    (map[id] || dash)();
  }

  function dash() {
    const data = CGC.get();
    view.innerHTML = `
      <h1>Redação</h1>
      <div class="stats">
        <div class="stat"><b>${data.books.length}</b>livros no acervo</div>
        <div class="stat"><b>${data.contests.length}</b>editais publicados</div>
        <div class="stat"><b>${data.contests.filter((c) => c.status !== "encerrado").length}</b>chamadas ativas</div>
      </div>
      <p>Esta área alimenta o site público. Os livros apontam para o Google Drive da editora. Os concursos publicam o regulamento integral.</p>
      <p class="warn">Os dados ficam neste navegador (e podem ser exportados em JSON). Troque o WhatsApp, Instagram e YouTube em Configurações.</p>
    `;
  }

  function books() {
    const rows = CGC.books()
      .map(
        (b) => `<tr>
        <td>${CGCUI.escapeHtml(b.title)}</td>
        <td>${CGCUI.escapeHtml(b.author)}</td>
        <td>${CGCUI.escapeHtml(b.genre)}</td>
        <td>${b.year}</td>
        <td class="row-actions">
          <button class="btn btn-ghost light" data-edit="${b.id}">Editar</button>
          <button class="btn btn-ghost light" data-del="${b.id}">Apagar</button>
        </td>
      </tr>`
      )
      .join("");
    view.innerHTML = `
      <h1>Biblioteca</h1>
      <p><button class="btn btn-solid" id="new-book">Novo livro</button></p>
      <div style="overflow:auto"><table class="table"><thead><tr>
        <th>Título</th><th>Autora</th><th>Gênero</th><th>Ano</th><th></th>
      </tr></thead><tbody>${rows}</tbody></table></div>
      <div id="form"></div>
    `;
    view.querySelector("#new-book").onclick = () => bookForm(null);
    view.querySelectorAll("[data-edit]").forEach((b) => (b.onclick = () => bookForm(CGC.book(b.dataset.edit))));
    view.querySelectorAll("[data-del]").forEach((b) => (b.onclick = () => {
      if (confirm("Apagar este título do acervo?")) {
        CGC.deleteBook(b.dataset.del);
        books();
      }
    }));
  }

  function bookForm(book) {
    const b = book || {
      title: "", author: "", year: new Date().getFullYear(), genre: "Poesia",
      territory: "Quilombo", pages: 120, isbn: "", driveUrl: "", synopsis: "",
    };
    const form = document.getElementById("form");
    form.innerHTML = `
      <h2 style="font-family:var(--display)">${book ? "Editar título" : "Novo título"}</h2>
      <div class="field"><span>Título</span><input id="t" value="${CGCUI.escapeHtml(b.title)}" /></div>
      <div class="field"><span>Autora</span><input id="a" value="${CGCUI.escapeHtml(b.author)}" /></div>
      <div class="field"><span>Ano</span><input id="y" type="number" value="${b.year}" /></div>
      <div class="field"><span>Gênero</span>
        <select id="g">${["Poesia","Romance","Ensaio","Contos","Memória","Infantojuvenil","Antologia","Teatro"].map((x) => `<option ${x===b.genre?"selected":""}>${x}</option>`).join("")}</select>
      </div>
      <div class="field"><span>Linha editorial</span>
        <select id="tr">${["Quilombo","Diáspora","Terreiro","Favela"].map((x) => `<option ${x===b.territory?"selected":""}>${x}</option>`).join("")}</select>
      </div>
      <div class="field"><span>Páginas</span><input id="p" type="number" value="${b.pages}" /></div>
      <div class="field"><span>ISBN</span><input id="i" value="${CGCUI.escapeHtml(b.isbn || "")}" /></div>
      <div class="field"><span>Link do Google Drive</span><input id="d" value="${CGCUI.escapeHtml(b.driveUrl || "")}" placeholder="https://drive.google.com/..." /></div>
      <div class="field"><span>Sinopse</span><textarea id="s">${CGCUI.escapeHtml(b.synopsis)}</textarea></div>
      <button class="btn btn-solid" id="save">Publicar no acervo</button>
    `;
    form.querySelector("#save").onclick = () => {
      CGC.upsertBook({
        ...b,
        title: document.getElementById("t").value.trim(),
        author: document.getElementById("a").value.trim(),
        year: Number(document.getElementById("y").value),
        genre: document.getElementById("g").value,
        territory: document.getElementById("tr").value,
        pages: Number(document.getElementById("p").value),
        isbn: document.getElementById("i").value.trim(),
        driveUrl: document.getElementById("d").value.trim(),
        synopsis: document.getElementById("s").value.trim(),
      });
      books();
    };
    form.scrollIntoView({ behavior: "smooth" });
  }

  function contests() {
    const rows = CGC.contests()
      .map(
        (c) => `<tr>
        <td>${CGCUI.escapeHtml(c.title)}</td>
        <td>${CGCUI.statusLabel(c.status)}</td>
        <td>${CGCUI.formatDate(c.deadline)}</td>
        <td class="row-actions">
          <button class="btn btn-ghost light" data-edit="${c.id}">Editar</button>
          <button class="btn btn-ghost light" data-del="${c.id}">Apagar</button>
        </td>
      </tr>`
      )
      .join("");
    view.innerHTML = `
      <h1>Concursos</h1>
      <p><button class="btn btn-solid" id="new-c">Novo regulamento</button></p>
      <div style="overflow:auto"><table class="table"><thead><tr>
        <th>Edital</th><th>Status</th><th>Prazo</th><th></th>
      </tr></thead><tbody>${rows}</tbody></table></div>
      <div id="form"></div>
    `;
    view.querySelector("#new-c").onclick = () => contestForm(null);
    view.querySelectorAll("[data-edit]").forEach((b) => (b.onclick = () => contestForm(CGC.contest(b.dataset.edit))));
    view.querySelectorAll("[data-del]").forEach((b) => (b.onclick = () => {
      if (confirm("Apagar este edital?")) {
        CGC.deleteContest(b.dataset.del);
        contests();
      }
    }));
  }

  function contestForm(item) {
    const c = item || {
      title: "", status: "aberto", category: "Poesia", deadline: "", excerpt: "", regulation: "<h2>1. Do objeto</h2><p></p>",
    };
    const form = document.getElementById("form");
    form.innerHTML = `
      <h2 style="font-family:var(--display)">${item ? "Editar edital" : "Novo edital"}</h2>
      <div class="field"><span>Título</span><input id="t" value="${CGCUI.escapeHtml(c.title)}" /></div>
      <div class="field"><span>Categoria</span><input id="cat" value="${CGCUI.escapeHtml(c.category)}" /></div>
      <div class="field"><span>Status</span>
        <select id="st">
          <option value="aberto" ${c.status==="aberto"?"selected":""}>Inscrições abertas</option>
          <option value="continuo" ${c.status==="continuo"?"selected":""}>Chamada contínua</option>
          <option value="encerrado" ${c.status==="encerrado"?"selected":""}>Encerrado</option>
        </select>
      </div>
      <div class="field"><span>Prazo (AAAA-MM-DD) — vazio se contínuo</span><input id="dl" value="${CGCUI.escapeHtml(c.deadline || "")}" /></div>
      <div class="field"><span>Resumo na vitrine</span><textarea id="ex">${CGCUI.escapeHtml(c.excerpt)}</textarea></div>
      <div class="field"><span>Regulamento (HTML simples: h2, p, ul, li, strong, em)</span><textarea id="rg" style="min-height:220px">${CGCUI.escapeHtml(c.regulation)}</textarea></div>
      <button class="btn btn-solid" id="save">Publicar regulamento</button>
    `;
    form.querySelector("#save").onclick = () => {
      CGC.upsertContest({
        ...c,
        title: document.getElementById("t").value.trim(),
        category: document.getElementById("cat").value.trim(),
        status: document.getElementById("st").value,
        deadline: document.getElementById("dl").value.trim() || null,
        excerpt: document.getElementById("ex").value.trim(),
        regulation: document.getElementById("rg").value,
      });
      contests();
    };
    form.scrollIntoView({ behavior: "smooth" });
  }

  function settings() {
    const s = CGC.settings();
    const a = CGC.get().admin;
    view.innerHTML = `
      <h1>Configurações</h1>
      <div class="field"><span>Instagram (URL)</span><input id="ig" value="${CGCUI.escapeHtml(s.instagram)}" /></div>
      <div class="field"><span>Handle</span><input id="igh" value="${CGCUI.escapeHtml(s.instagramHandle)}" /></div>
      <div class="field"><span>YouTube</span><input id="yt" value="${CGCUI.escapeHtml(s.youtube)}" /></div>
      <div class="field"><span>WhatsApp (DDI+DDD+número, só dígitos)</span><input id="wa" value="${CGCUI.escapeHtml(s.whatsapp)}" /></div>
      <div class="field"><span>E-mail</span><input id="em" value="${CGCUI.escapeHtml(s.email)}" /></div>
      <button class="btn btn-solid" id="save-s">Salvar canais</button>
      <h2 style="font-family:var(--display);margin-top:40px">Acesso da redação</h2>
      <div class="field"><span>Usuário</span><input id="u" value="${CGCUI.escapeHtml(a.user)}" /></div>
      <div class="field"><span>Nova senha</span><input id="pw" type="password" placeholder="Deixe em branco para manter" /></div>
      <button class="btn btn-ghost light" id="save-a">Atualizar acesso</button>
      <h2 style="font-family:var(--display);margin-top:40px">Backup do acervo</h2>
      <p><button class="btn btn-ghost light" id="exp">Exportar JSON</button>
         <label class="btn btn-ghost light">Importar JSON<input type="file" id="imp" accept="application/json" hidden /></label>
         <button class="btn btn-ghost light" id="rst">Restaurar catálogo inicial</button></p>
    `;
    document.getElementById("save-s").onclick = () => {
      CGC.updateSettings({
        instagram: document.getElementById("ig").value.trim(),
        instagramHandle: document.getElementById("igh").value.trim(),
        youtube: document.getElementById("yt").value.trim(),
        whatsapp: document.getElementById("wa").value.trim(),
        email: document.getElementById("em").value.trim(),
      });
      alert("Canais atualizados.");
    };
    document.getElementById("save-a").onclick = () => {
      const patch = { user: document.getElementById("u").value.trim() };
      const pw = document.getElementById("pw").value;
      if (pw) patch.password = pw;
      CGC.updateAdmin(patch);
      alert("Acesso atualizado.");
    };
    document.getElementById("exp").onclick = () => {
      const blob = new Blob([CGC.exportJSON()], { type: "application/json" });
      const ael = document.createElement("a");
      ael.href = URL.createObjectURL(blob);
      ael.download = "cria-gueto-cria-acervo.json";
      ael.click();
    };
    document.getElementById("imp").onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          CGC.importJSON(reader.result);
          alert("Acervo importado.");
          dash();
        } catch (err) {
          alert(err.message);
        }
      };
      reader.readAsText(file);
    };
    document.getElementById("rst").onclick = () => {
      if (confirm("Isso apaga postagens locais e volta ao catálogo de demonstração.")) {
        CGC.reset();
        dash();
      }
    };
  }

  function enter() {
    login.hidden = true;
    shell.hidden = false;
    show("dash");
  }

  document.getElementById("do-login").onclick = () => {
    const u = document.getElementById("user").value;
    const p = document.getElementById("pass").value;
    if (CGC.login(u, p)) enter();
    else document.getElementById("err").textContent = "Usuário ou senha inválidos.";
  };
  document.getElementById("pass").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("do-login").click();
  });
  document.querySelectorAll(".linkish").forEach((b) => {
    b.onclick = () => {
      if (b.dataset.view === "out") {
        CGC.logout();
        location.href = "index.html";
        return;
      }
      show(b.dataset.view);
    };
  });

  if (CGC.isAdmin()) enter();
})();
