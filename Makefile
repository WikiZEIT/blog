.PHONY: build dev watch lint spellcheck spellcheck-ignore install index validate-jsonld validate-svg

build:
	npm run build

dev:
	npm run dev

watch:
	npm run watch

lint:
	npm run lint
	vendor/bin/phpstan analyse

spellcheck:
	npm run spell

spellcheck-ignore:
	./scripts/spellcheck-ignore.sh

install:
	npm install

index:
	node scripts/build-search-index.mjs

validate-jsonld:
	node scripts/validate-jsonld.mjs

validate-svg:
	node scripts/validate-social-card.mjs
