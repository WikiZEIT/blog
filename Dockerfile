FROM php:8.3-apache

# Enable required Apache modules
RUN a2enmod rewrite

# Install SQLite3 PHP extension
RUN apt-get update && apt-get install -y libsqlite3-dev \
    && docker-php-ext-install pdo_sqlite \
    && rm -rf /var/lib/apt/lists/*

# The site lives at /wikizeit/ subdirectory
RUN mkdir -p /var/www/html/wikizeit

# Configure Apache to allow .htaccess overrides
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# Let Apache run on port 80 as non-root
RUN sed -i 's/Listen 80/Listen 8080/' /etc/apache2/ports.conf \
    && sed -i 's/:80/:8080/' /etc/apache2/sites-enabled/000-default.conf

# Make Apache log dirs writable by anyone (needed for non-root)
RUN chmod -R 777 /var/log/apache2 /var/run/apache2 /var/lock/apache2 2>/dev/null || true

# Copy the built site
COPY _site/ /var/www/html/wikizeit/

EXPOSE 8080
CMD ["apache2-foreground"]
