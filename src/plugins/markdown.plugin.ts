import { marked } from "marked";

export default class GWFVisPluginMarkdown extends HTMLElement {
  header?: string;
  markdownUrl?: string;

  obtainHeaderCallback = () => this.header ?? `Markdown`;

  hostFirstLoadedCallback() {
    this.renderUI();
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  async renderUI() {
    let markdown = "";
    if (this.markdownUrl) {
      markdown = await fetch(this.markdownUrl).then((response) =>
        response.text()
      );
    }
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = marked.parse(markdown);
    }
  }
}
