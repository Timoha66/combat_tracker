# DM Tracker — D&D 5e

Трекер боя для Мастера игры по системе D&D 5e.

## 🚀 Деплой на GitHub Pages

### 1. Создай репозиторий на GitHub

### 2. Измени имя репозитория в `vite.config.js`
```js
base: '/ИМЯ_ТВОЕГО_РЕПОЗИТОРИЯ/',
```

### 3. Включи GitHub Pages в настройках репозитория
`Settings → Pages → Source: GitHub Actions`

### 4. Запушь код
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/ТВО_ЛОГИН/ИМЯ_РЕПО.git
git push -u origin main
```

GitHub Actions автоматически соберёт и задеплоит приложение.
Адрес: `https://ТВО_ЛОГИН.github.io/ИМЯ_РЕПО/`

---

## 💻 Локальная разработка

```bash
npm install
npm run dev
```

## 🏗 Стек

- **React 18** + Vite
- **Zustand** — управление состоянием
- **Tailwind CSS** — стили
- **@tabler/icons-react** — иконки

## 📁 Структура

```
src/
├── components/
│   ├── Header.jsx         # Шапка с навигацией по ходам
│   ├── CombatantList.jsx  # Список участников боя
│   ├── RightPanel.jsx     # Панель урона/лечения
│   ├── AddModal.jsx       # Добавление существ
│   └── modals.jsx         # Прочие модалки
├── store/
│   └── battleStore.js     # Zustand стор — вся логика боя
├── data/
│   └── constants.js       # Статусы, типы урона, состояния
└── App.jsx
```
