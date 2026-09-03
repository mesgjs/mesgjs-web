all: js/mwi-aggr-comp.esm.js \
	js/mwi-core-comp.esm.js \
	js/mwi-doc-node.esm.js \
	js/mwi-document.esm.js \
	js/mwi-form-comp.esm.js \
	js/mwi-html-comp.esm.js \
	js/mwi-registry.esm.js \
	js/mwi-res-nav.esm.js

js/%.esm.js: %.msjs
	msjstrans --root=js --enable-js --inc-slid $<
