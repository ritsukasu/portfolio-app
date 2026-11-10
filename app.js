const db = new Dexie('PortfolioRefDB');

db.version(1).stores({
  projects: '++id, categoryId, createdAt',
  categories: '++id, &name'
});

const DEFAULT_CATEGORIES = [
  { name: 'Web', color: '#38bdf8', description: 'Websites and web apps' },
  { name: 'Systems', color: '#a78bfa', description: 'Back-end and system projects' },
  { name: 'Brand / Logo', color: '#f472b6', description: 'Identity and logo work' },
  { name: 'Automation', color: '#4ade80', description: 'Scripts and workflows' }
];


const form = document.querySelector('#project-form');
const formTitle = document.querySelector('#form-title');
const idInput = document.querySelector('#project-id');
const titleInput = document.querySelector('#title');
const categoryInput = document.querySelector('#category');
const yearInput = document.querySelector('#year');
const descriptionInput = document.querySelector('#description');
const tagsInput = document.querySelector('#tags');
const linkInput = document.querySelector('#link');
const imageInput = document.querySelector('#image');
const featuredInput = document.querySelector('#featured');
const cancelBtn = document.querySelector('#cancel-btn');
const searchInput = document.querySelector('#search');
const listEl = document.querySelector('#project-list');
const countEl = document.querySelector('#count');
const tabsEl = document.querySelector('#tabs');
const exportBtn = document.querySelector('#export-btn');
const importBtn = document.querySelector('#import-btn');
const importFile = document.querySelector('#import-file');
const clearBtn = document.querySelector('#clear-btn');

const catForm = document.querySelector('#category-form');
const catFormTitle = document.querySelector('#cat-form-title');
const catIdInput = document.querySelector('#category-id');
const catNameInput = document.querySelector('#category-name');
const catColorInput = document.querySelector('#category-color');
const catDescInput = document.querySelector('#category-description');
const catCancelBtn = document.querySelector('#cat-cancel-btn');
const catMessage = document.querySelector('#category-message');
const catListEl = document.querySelector('#category-list');

let activeCategory = 'All';


function escapeHTML(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

const isHttp = (url) => /^https?:\/\//i.test(url || '');
const isHexColor = (value) => /^#[0-9a-f]{6}$/i.test(value || '');

async function getCategoryMap() {
  const all = await db.categories.toArray();
  return new Map(all.map((c) => [c.id, c]));
}

async function seedCategories() {
  if ((await db.categories.count()) === 0) {
    await db.categories.bulkAdd(DEFAULT_CATEGORIES);
  }
}


function showCategoryMessage(text = '') {
  catMessage.textContent = text;
}

function resetCategoryForm() {
  catForm.reset();
  catIdInput.value = '';
  catColorInput.value = '#f5a524';
  catFormTitle.textContent = 'Add a category';
  catCancelBtn.hidden = true;
  showCategoryMessage('');
}

function startCategoryEdit(category) {
  catIdInput.value = category.id;
  catNameInput.value = category.name;
  catColorInput.value = isHexColor(category.color) ? category.color : '#f5a524';
  catDescInput.value = category.description || '';
  catFormTitle.textContent = 'Edit category';
  catCancelBtn.hidden = false;
  showCategoryMessage('');
  catNameInput.focus();
}

async function renderCategoryList() {
  const categories = await db.categories.toArray();
  const counts = await Promise.all(categories.map((c) =>
    db.projects.where('categoryId').equals(c.id).count()
  ));

  catListEl.innerHTML = categories.map((c, i) => `
    <li>
      <span class="swatch" style="background:${isHexColor(c.color) ? c.color : '#94a3b8'}"></span>
      <span class="info">
        <strong>${escapeHTML(c.name)}</strong> (${counts[i]})
        <small>${escapeHTML(c.description)}</small>
      </span>
      <button type="button" data-cat-action="edit" data-id="${c.id}">Edit</button>
      <button type="button" data-cat-action="delete" data-id="${c.id}" class="danger">Delete</button>
    </li>
  `).join('');
}

async function fillCategoryOptions() {
  const keep = categoryInput.value;
  const categories = await db.categories.orderBy('name').toArray();
  categoryInput.length = 1;
  categories.forEach((c) => categoryInput.add(new Option(c.name, c.id)));
  categoryInput.value = keep;
}

catForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = {
    name: catNameInput.value.trim(),
    color: catColorInput.value,
    description: catDescInput.value.trim()
  };
  if (!data.name) {
    showCategoryMessage('Please type a category name.');
    return;
  }

  const id = Number(catIdInput.value);
  try {
    if (id) {
      await db.categories.update(id, data);
    } else {
      await db.categories.add(data);
    }
  } catch (error) {
    if (error.name === 'ConstraintError') {
      showCategoryMessage(`A category named "${data.name}" already exists.`);
      return;
    }
    throw error;
  }

  resetCategoryForm();
  await refreshAll();
});

catListEl.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-cat-action]');
  if (!button) return;
  const id = Number(button.dataset.id);

  if (button.dataset.catAction === 'edit') {
    startCategoryEdit(await db.categories.get(id));
    return;
  }

  const used = await db.projects.where('categoryId').equals(id).count();
  if (used > 0) {
    showCategoryMessage(`${used} project(s) still use this category. Move or delete them first.`);
    return;
  }
  if (confirm('Delete this category?')) {
    await db.categories.delete(id);
    if (activeCategory === id) activeCategory = 'All';
    if (Number(catIdInput.value) === id) resetCategoryForm();
    showCategoryMessage('');
    await refreshAll();
  }
});

catCancelBtn.addEventListener('click', resetCategoryForm);


function readForm() {
  return {
    title: titleInput.value.trim(),
    categoryId: Number(categoryInput.value),
    year: yearInput.value ? Number(yearInput.value) : null,
    description: descriptionInput.value.trim(),
    tags: tagsInput.value.split(',').map((t) => t.trim()).filter(Boolean),
    link: linkInput.value.trim(),
    image: imageInput.value.trim(),
    featured: featuredInput.checked
  };
}

async function createProject(data) {
  return db.projects.add({ ...data, createdAt: Date.now() });
}


async function getProjects() {
  const text = searchInput.value.trim().toLowerCase();

  let list = activeCategory === 'All'
    ? await db.projects.toArray()
    : await db.projects.where('categoryId').equals(activeCategory).toArray();

  if (text) {
    list = list.filter((p) =>
      (p.title || '').toLowerCase().includes(text) ||
      (p.tags || []).some((t) => t.toLowerCase().includes(text))
    );
  }

  return list.sort((a, b) =>
    (b.year || 0) - (a.year || 0) || (b.createdAt || 0) - (a.createdAt || 0)
  );
}

async function renderTabs() {
  const categories = await db.categories.toArray();
  const total = await db.projects.count();
  const counts = await Promise.all(categories.map((c) =>
    db.projects.where('categoryId').equals(c.id).count()
  ));

  const tabs = [
    { key: 'All', label: 'All work', count: total },
    ...categories.map((c, i) => ({ key: String(c.id), label: c.name, count: counts[i] }))
  ];

  tabsEl.innerHTML = tabs.map((t) => `
    <button type="button" class="tab ${String(t.key) === String(activeCategory) ? 'active' : ''}"
      data-tab="${escapeHTML(t.key)}">${escapeHTML(t.label)} (${t.count})</button>
  `).join('');
}

tabsEl.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-tab]');
  if (!button) return;
  activeCategory = button.dataset.tab === 'All' ? 'All' : Number(button.dataset.tab);
  render();
});

async function render() {
  await renderTabs();
  const [projects, categoryMap] = await Promise.all([getProjects(), getCategoryMap()]);
  countEl.textContent = `${projects.length} project(s)`;

  if (projects.length === 0) {
    listEl.innerHTML = '<p class="empty">No projects yet.</p>';
    return;
  }

  listEl.innerHTML = projects.map((p) => {
    const category = categoryMap.get(p.categoryId);
    const color = category && isHexColor(category.color) ? category.color : '#94a3b8';

    return `
    <article class="project">
      ${isHttp(p.image)
        ? `<img class="thumb" src="${escapeHTML(p.image)}" alt="" loading="lazy" onerror="this.remove()" />`
        : ''}
      <span class="badge" style="color:${color}; border-color:${color}">${escapeHTML(category ? category.name : 'Unknown category')}</span>
      ${p.featured ? '<span class="star" title="Featured">&#9733;</span>' : ''}
      ${p.year ? `<span class="year">${escapeHTML(p.year)}</span>` : ''}
      <h3>${escapeHTML(p.title)}</h3>
      <p>${escapeHTML(p.description)}</p>
      <p class="tags">${(p.tags || []).map((t) => `<span>#${escapeHTML(t)}</span>`).join('')}</p>
      ${isHttp(p.link)
        ? `<a href="${escapeHTML(p.link)}" target="_blank" rel="noopener">View project</a>`
        : ''}
      <div class="actions">
        <button data-action="edit" data-id="${p.id}">Edit</button>
        <button data-action="delete" data-id="${p.id}" class="danger">Delete</button>
      </div>
    </article>`;
  }).join('');
}


async function updateProject(id, changes) {
  return db.projects.update(id, changes);
}

function startEdit(project) {
  idInput.value = project.id;
  titleInput.value = project.title || '';
  categoryInput.value = project.categoryId;
  yearInput.value = project.year ?? '';
  descriptionInput.value = project.description || '';
  tagsInput.value = (project.tags || []).join(', ');
  linkInput.value = project.link || '';
  imageInput.value = project.image || '';
  featuredInput.checked = Boolean(project.featured);
  formTitle.textContent = 'Edit project';
  cancelBtn.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
  form.reset();
  idInput.value = '';
  formTitle.textContent = 'Add a project';
  cancelBtn.hidden = true;
}

async function deleteProject(id) {
  return db.projects.delete(id);
}

async function clearAllProjects() {
  return db.projects.clear();
}


async function exportProjects() {
  const categoryMap = await getCategoryMap();
  const docs = (await db.projects.toArray()).map(({ categoryId, ...rest }) => ({
    ...rest,
    category: categoryMap.has(categoryId) ? categoryMap.get(categoryId).name : 'Uncategorized'
  }));

  const blob = new Blob([JSON.stringify(docs, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `portfolio-referenced-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function importProjects(data) {
  if (!Array.isArray(data)) {
    throw new Error('The file must contain a JSON array of projects.');
  }

  const items = data.filter((d) => d && typeof d.title === 'string' && d.title.trim());

  await db.transaction('rw', db.categories, db.projects, async () => {
    const names = [...new Set(items.map((d) => String(d.category || 'Uncategorized').trim()))];
    for (const name of names) {
      const exists = await db.categories.where('name').equals(name).first();
      if (!exists) await db.categories.add({ name, color: '#94a3b8', description: '' });
    }

    const idByName = new Map((await db.categories.toArray()).map((c) => [c.name, c.id]));

    await db.projects.bulkAdd(items.map(({ id, category, categoryId, ...rest }) => ({
      ...rest,
      title: rest.title.trim(),
      categoryId: idByName.get(String(category || 'Uncategorized').trim()),
      tags: Array.isArray(rest.tags) ? rest.tags : [],
      createdAt: rest.createdAt || Date.now()
    })));
  });

  return { added: items.length, skipped: data.length - items.length };
}


async function refreshAll() {
  await fillCategoryOptions();
  await renderCategoryList();
  await render();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = readForm();
  const id = Number(idInput.value);

  if (id) {
    await updateProject(id, data);
  } else {
    await createProject(data);
  }

  resetForm();
  await refreshAll();
});

listEl.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const id = Number(button.dataset.id);

  if (button.dataset.action === 'edit') {
    startEdit(await db.projects.get(id));
  }

  if (button.dataset.action === 'delete' && confirm('Delete this project?')) {
    await deleteProject(id);
    await refreshAll();
  }
});

cancelBtn.addEventListener('click', resetForm);
searchInput.addEventListener('input', render);

clearBtn.addEventListener('click', async () => {
  const total = await db.projects.count();
  if (total === 0) {
    alert('There is nothing to clear.');
    return;
  }
  if (confirm(`Delete ALL ${total} project(s)? Categories are kept.`)) {
    await clearAllProjects();
    resetForm();
    await refreshAll();
  }
});

exportBtn.addEventListener('click', exportProjects);

importBtn.addEventListener('click', () => importFile.click());
importFile.addEventListener('change', async () => {
  const file = importFile.files[0];
  if (!file) return;

  try {
    const result = await importProjects(JSON.parse(await file.text()));
    alert(`Imported ${result.added} project(s)` +
      (result.skipped ? `, skipped ${result.skipped} without a title.` : '.'));
  } catch (error) {
    alert(`Import failed: ${error.message}`);
  }

  importFile.value = '';
  await refreshAll();
});

(async () => {
  await seedCategories();
  await refreshAll();
})();
