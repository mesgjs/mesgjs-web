MSJS_FILES := $(wildcard *.msjs)
JS_FILES := $(patsubst %.msjs,js/%.esm.js,$(MSJS_FILES))

all: $(JS_FILES)

js/%.esm.js: %.msjs
	msjstrans --root=js --enable-js --inc-slid $<

.PHONY: all
