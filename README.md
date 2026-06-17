# kaidzendao-feed

Авто-обновляемый YML-фид товаров (стулья, кресла, диваны, барные стулья) для AI-консультанта B24U.
Источник данных — страницы товаров opt.kaidzendao.ru (Tilda). Скрипт `build-feed.mjs` перечитывает
страницы и пересобирает `kaidzendao-feed.xml`. GitHub Actions делает это по расписанию (каждые 6 ч)
и публикует через GitHub Pages.

Фид для B24U: `https://stepanenkoviktor0110-boop.github.io/kaidzendao-feed/kaidzendao-feed.xml`
