# AI Studio Performance Fix

Фикс лагов ввода, мерцания текста и драки за скролл в **Google AI Studio** при работе с длинными чатами (200K+ токенов).

## Проблема

При накоплении большого контекста в AI Studio (200 000–500 000+ токенов) веб-интерфейс начинает катастрофически тормозить:

- **Лаг ввода** — каждая буква в поле ввода появляется с задержкой в несколько секунд
- **Мерцание текста** — блоки сообщений пропадают при скролле и появляются снова
- **Драка за скролл** — страница дёргается вниз во время генерации ответа, не давая читать текст
- **"Пластовая" подгрузка** — текст генерируется рывками по 5–10 строк, а не плавным потоком

### Почему это происходит

Google AI Studio **не использует виртуализацию списка** — весь чат рендерится целиком. При 500K токенов DOM раздувается до сотен тысяч узлов. Каждое нажатие клавиши запускает каскадную перерисовку всего этого дерева. Плюс Google активировал **Trusted Types CSP**, который блокирует userscript'ы в Tampermonkey V3.

## Решение

Комбинация из двух userscript'ов:

1. **Trusted-Types Helper** — обходит блокировку Trusted Types CSP, позволяя Tampermonkey внедрять код на AI Studio
2. **AI Studio Performance Fixer** — устраняет лаги ввода, мерцание и драку за скролл

### Что именно делает фикс

| Проблема | Механика фикса |
|---|---|
| Лаг ввода | Отключает CSS-анимации и `transition`, изолирует блоки сообщений через `contain: layout paint` |
| Мерцание текста | Обманывает `IntersectionObserver`, заставляя думать, что все блоки всегда видимы |
| Драка за скролл | Перехватывает `scrollIntoView` от AI Studio, пока пользователь сам скроллит |
| Пластовая подгрузка | Убирает `smooth-scroll`, текст идёт равномерным потоком |

## Установка

### Шаг 1: Установите Tampermonkey

[Chrome Web Store — Tampermonkey](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)

### Шаг 2: Установите Trusted-Types Helper

1. Откройте Tampermonkey Dashboard → "Создать новый скрипт"
2. Удалите шаблон (Ctrl+A → Delete)
3. Скопируйте содержимое файла [`trusted-types-helper.user.js`](trusted-types-helper.user.js)
4. Сохраните (Ctrl+S)

**Важно:** В коде Helper найдите строку `const overwrite_default = false;` и поменяйте на `true` для AI Studio.

### Шаг 3: Установите AI Studio Performance Fixer

1. Создайте ещё один новый скрипт в Tampermonkey
2. Удалите шаблон
3. Скопируйте содержимое файла [`ai-studio-fixer.user.js`](ai-studio-fixer.user.js)
4. Сохраните (Ctrl+S)

**Важно:** Этот скрипт содержит директиву `@inject-into page`, которая критична для работы в Manifest V3.

### Шаг 4: Проверьте порядок скриптов

В Tampermonkey Dashboard Trusted-Types Helper должен выполняться **до** AI Studio Fixer. Если Helper ниже в списке — удалите оба и создайте сначала Helper, потом Fixer.

### Шаг 5: Проверьте работу

1. Откройте [Google AI Studio](https://aistudio.google.com) с длинным чатом
2. Откройте консоль (F12 → Console)
3. Найдите логи:
   ```
   Trusted-Types Helper: Trusted-Type Policies: TTP: TrustedTypePolicy {name: 'default'}
   [AI Studio Fixer v1] Performance & UI CSS injected.
   [AI Studio Fixer v1] Disappearing content/flicker fix is active.
   [AI Studio Fixer v1] Direct-control scroll fix is active.
   ```
4. Попробуйте писать в поле ввода — буквы должны идти без задержки

## Устранение неполадок

### Скрипты не появляются в Tampermonkey на AI Studio

- Проверьте, что в настройках Tampermonkey включено **"Разрешить пользовательские скрипты"** (chrome://extensions → Tampermonkey → Разрешения)
- Убедитесь, что Tampermonkey имеет доступ к `aistudio.google.com`

### Trusted-Types Helper работает, но Fixer не стартует

- Проверьте, что в Fixer прописана директива `@inject-into page`
- Попробуйте включить **Developer Mode** в Chrome (`chrome://extensions` → переключатель в правом верхнем углу)

### Tampermonkey вообще не работает на Google-сайтах

Если ничего не помогает — используйте **Chrome DevTools Snippets** как fallback:
1. F12 → Sources → Snippets
2. Создайте новый сниппет, вставьте код Fixer
3. Запускайте через Ctrl+Enter при каждом заходе в AI Studio

## Требования

- **Chrome** (или Chromium-based браузер: Edge, Яндекс.Браузер)
- **Tampermonkey v5.5.0+** (Manifest V3)
- Google AI Studio с чатом 200K+ токенов (где проблема воспроизводится)

## Авторы и благодарности

- **AI Studio Performance Fixer** — адаптирован из скрипта [Diyar Baban](https://gist.github.com/DiyarD/dc51b79c8cf446aa662e79638f9aeba3)
- **Trusted-Types Helper** — [Benjamin Philipp](https://greasyfork.org/en/scripts/433051-trusted-types-helper)
- **Комбинация и адаптация под Manifest V3** — сообщество

## Дисклеймер

Это **неофициальный** фикс, не связанный с Google. Используйте на свой страх и риск. Скрипт только модифицирует клиентский рендеринг и не влияет на логику моделей или сохранение данных.

## Лицензия

MIT License — см. [LICENSE](LICENSE)
