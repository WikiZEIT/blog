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

# Copy the built site
COPY _site/ /var/www/html/wikizeit/

# Ensure writable for SQLite database
RUN chown -R www-data:www-data /var/www/html/wikizeit/api/

EXPOSE 80

# When using volume mounts, fix permissions at startup
CMD ["sh", "-c", "chown -R www-data:www-data /var/www/html/wikizeit/api/ && apache2-foreground"]
