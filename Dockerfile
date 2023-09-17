# Используем образ с Node.js, который уже содержит cypress
FROM cypress/base:10.18.0

# Установка libnss3
RUN apt-get install -y libnss3

# Печать версии libnss3
RUN apt-cache show libnss3 | grep Version

# Установка рабочей директории
WORKDIR /app

# Копирование приложения
COPY . /app

# Установка зависимостей
RUN npm install

# Проверка установки Cypress
RUN $(npm bin)/cypress verify

# Запуск тестов
CMD ["npm", "run", "cy:open_qa"]