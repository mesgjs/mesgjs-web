all: srcjs

srcjs:
	(cd src; make)

theme: default-theme

default-theme:
	(cd default-theme; make)

default-theme-bundle:
	(cd default-theme; make bundle)

clean-default-theme:
	(cd default-theme; make clean)

test: test-all

test-all:
	deno test -A test/core test/ssr-html test/csr-dom test/ssr-csr-hyd test/color-token-tool.test.js test/color-token-cli.test.js

test-core:
	deno test -A test/core

test-ssr:
	deno test -A test/ssr-html

test-csr:
	deno test -A test/csr-dom

test-hyd:
	deno test -A test/ssr-csr-hyd

test-theme:
	deno test -A test/color-token-tool.test.js test/color-token-cli.test.js

.PHONY: all srcjs theme default-theme default-theme-bundle clean-default-theme test test-all test-core test-ssr test-csr test-hyd test-theme
