# DICE website Gatsby template

This is a basic website template that uses Gatsby and our custom RDF plugin to generate a static website.

## Developing locally

1. To start developing, simply cd into current folder and start Gatsby in dev mode:

```sh
cd my-default-starter/
gatsby develop
```

2. Then open the source code and start editing!

   Your site is now running at `http://localhost:8000`!

   _Note: You'll also see a second link: _`http://localhost:8000/___graphql`_. This is a tool you can use to experiment with querying your data. Learn more about using this tool in the [Gatsby tutorial](https://www.gatsbyjs.org/tutorial/part-five/#introducing-graphiql)._

## What's inside?

A quick look at the top-level files and directories you'll see in a Gatsby project.

    .
    ├── node_modules
    ├── papers-to-ttl
    ├── plugins/gatsby-transformer-rdf
    ├── src/components
    ├── src/pages
    ├── src/templates
    ├── gatsby-config.js
    ├── gatsby-node.js
    └── Dockerfile

1.  **`/node_modules`**: This directory contains all of the modules of code that your project depends on (npm packages) are automatically installed.

2.  **`/papers-to-ttl`**: This directory contains supplementary Node.js scripts that convert papers from Bibsonomy API to set of local RDF files.

3.  **`/plugins/gatsby-transformer-rdf`**: This directory contains our custom Gatsby plugin that transforms RDF to internal Gatsby resources that can be queried using GraphQL.

4.  **`/src/components`**: This directory contains all of the components used within website, as well as styles and embedded svgs.

5.  **`/src/pages`**: This directory contains all the base pages markup used in the website.

6.  **`/src/templates`**: This directory contains all the page templates used to generate pages from data.

7.  **`gatsby-config.js`**: This is the main configuration file for a Gatsby site. This is where you can specify information about your site (metadata) like the site title and description, which Gatsby plugins you’d like to include, etc. (Check out the [config docs](https://www.gatsbyjs.org/docs/gatsby-config/) for more detail).

8.  **`gatsby-node.js`**: This file is where Gatsby expects to find any usage of the [Gatsby Node APIs](https://www.gatsbyjs.org/docs/node-apis/) (if any). These allow customization/extension of default Gatsby settings affecting pieces of the site build process.

9.  **`Dockerfile`**: This file is describes the build process for Docker.

### Styling

We use [Tailwindcss](https://tailwindcss.com/) for styling all components.  
Component use their own custom classes when they get complex enough (more than 2-3 tailwind helper classes).  
Styles for those components are pre-defined using tailwind macro in `./src/components/styles/main.css`.

## Learning Gatsby

Looking for more guidance? Full documentation for Gatsby lives [on the website](https://www.gatsbyjs.org/). Here are some places to start:

- **For most developers, we recommend starting with our [in-depth tutorial for creating a site with Gatsby](https://www.gatsbyjs.org/tutorial/).** It starts with zero assumptions about your level of ability and walks through every step of the process.

- **To dive straight into code samples, head [to our documentation](https://www.gatsbyjs.org/docs/).** In particular, check out the _Guides_, _API Reference_, and _Advanced Tutorials_ sections in the sidebar.

## Deployment

The website is deployed using Docker container.  
To deploy it locally run the following commands:

```sh
yarn build
docker build -t dice-website .
docker run --name dice-website-instance -p 80:80 dice-website
```

## Automated deployment

The website is being automatically deployed to `dice-website.cs.upb.de` VM.  
Deployment is carried out using [Github Actions](https://github.com/dice-group/dice-website/actions) and [Exoframe](https://github.com/exoframejs/exoframe).
