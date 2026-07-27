FROM php:8.5.8-fpm-trixie

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        libicu-dev \
        libzip-dev \
        unzip \
    && docker-php-ext-install -j1 \
        bcmath \
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
