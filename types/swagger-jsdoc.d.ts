declare module 'swagger-jsdoc' {
  export interface Options {
    definition: {
      openapi: string;
      info: {
        title: string;
        version: string;
        description?: string;
      };
      servers?: Array<{
        url: string;
        description?: string;
      }>;
    };
    apis: string[];
  }

  function swaggerJsdoc(options: Options): any;
  export = swaggerJsdoc;
}
