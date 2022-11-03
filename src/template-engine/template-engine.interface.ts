export interface ITemplateEngine {
  compile(): Promise<string>;
}
