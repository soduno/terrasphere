FROM php:8.5.8-fpm-trixie

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        libicu-dev \
        libjpeg62-turbo-dev \
        libpng-dev \
        libwebp-dev \
        libzip-dev \
        unzip \
    && docker-php-ext-configure gd --with-jpeg --with-webp \
    && docker-php-ext-install -j1 \
        bcmath \
        gd \
        intl \
        pdo_mysql \
        zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
COPY docker/uploads.ini /usr/local/etc/php/conf.d/terrasphere-uploads.ini
COPY docker/entrypoint.sh /usr/local/bin/terrasphere-entrypoint

RUN chmod +x /usr/local/bin/terrasphere-entrypoint

WORKDIR /var/www/html

ENTRYPOINT ["terrasphere-entrypoint"]
CMD ["php-fpm"]
