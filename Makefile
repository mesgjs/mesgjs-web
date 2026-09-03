all: srcjs

srcjs:
	(cd src; make)

test: test-all

test-all:
	deno test -A test/core test/ssr-html test/csr-dom test/ssr-csr-hyd

test-core:
	deno test -A test/core

test-ssr:
	deno test -A test/ssr-html

test-csr:
	deno test -A test/csr-dom

test-hyd:
	deno test -A test/ssr-csr-hyd
