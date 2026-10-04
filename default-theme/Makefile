DIST_DIR := ../dist/default-theme
CLI_TOOL := ../util/color-token-cli.esm.js

JSON_FILES := $(wildcard *.json)
CSS_FILES := $(patsubst %.json,$(DIST_DIR)/%.css,$(JSON_FILES))
STATE_CSS := $(DIST_DIR)/state.css
BUNDLE_CSS := $(DIST_DIR)/bundle.css

all: $(STATE_CSS) $(CSS_FILES)

bundle: all $(BUNDLE_CSS)

$(DIST_DIR):
	mkdir -p $(DIST_DIR)

$(STATE_CSS): $(CLI_TOOL) | $(DIST_DIR)
	deno run --allow-read $(CLI_TOOL) --state-config > $@

$(DIST_DIR)/%.css: %.json $(CLI_TOOL) | $(DIST_DIR)
	deno run --allow-read $(CLI_TOOL) $< > $@

$(BUNDLE_CSS): all
	cat $(STATE_CSS) $(CSS_FILES) > $@

clean:
	rm -rf $(DIST_DIR)

.PHONY: all bundle clean
