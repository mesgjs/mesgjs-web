class MWIPageContextService {
    #title = ''
    #htmlAttrs = new Map()
    #bodyAttrs = new Map()
    #head_content = []
    #body_content = []

    setTitle(str) {
        this.#title = str
    }

    setHtmlAttr(key, value) {
        this.#htmlAttrs.set(key, value)
    }

    setBodyAttr(key, value) {
        this.#bodyAttrs.set(key, value)
    }

    addHeadContent(vnode) {
        this.#head_content.push(vnode)
    }

    addBodyContent(vnode) {
        this.#body_content.push(vnode)
    }

    getTitle() {
        return this.#title
    }

    getHtmlAttrs() {
        return this.#htmlAttrs
    }

    getBodyAttrs() {
        return this.#bodyAttrs
    }

    getHeadContent() {
        return this.#head_content
    }

    getBodyContent() {
        return this.#body_content
    }
}

export { MWIPageContextService }